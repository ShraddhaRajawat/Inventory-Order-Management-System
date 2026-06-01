from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from decimal import Decimal
from . import models, schemas

# --- PRODUCTS CRUD ---

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Check duplicate SKU
    db_product = get_product_by_sku(db, product.sku)
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    
    update_data = product.model_dump(exclude_unset=True)
    
    # Check SKU unique constraint if changing SKU
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        exists = get_product_by_sku(db, update_data["sku"])
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists."
            )
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    try:
        db.delete(db_product)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it is referenced by existing orders."
        )
    return db_product


# --- CUSTOMERS CRUD ---

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = get_customer_by_email(db, customer.email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
    new_customer = models.Customer(**customer.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- ORDERS CRUD ---

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate):
    # Verify customer exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} not found."
        )

    # We will process in a transaction
    total_amount = Decimal("0.00")
    order_items_to_create = []

    # Map to track stock changes temporarily and prevent duplicate product items in request causing stock issues
    product_qty_map = {}
    for item in order_in.items:
        product_qty_map[item.product_id] = product_qty_map.get(item.product_id, 0) + item.quantity

    # Fetch and validate all products and quantities
    for product_id, quantity in product_qty_map.items():
        product = get_product(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found."
            )
        if product.quantity_in_stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product '{product.name}'. Available: {product.quantity_in_stock}, Requested: {quantity}."
            )
        
        # Deduct stock
        product.quantity_in_stock -= quantity
        
        # Calculate line item price
        item_total = product.price * Decimal(quantity)
        total_amount += item_total

        order_item = models.OrderItem(
            product_id=product_id,
            quantity=quantity,
            price_at_order=product.price
        )
        order_items_to_create.append(order_item)

    # Create Order object
    new_order = models.Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount
    )
    db.add(new_order)
    db.flush()  # Obtain ID of new_order

    # Link order items to order
    for item in order_items_to_create:
        item.order_id = new_order.id
        db.add(item)

    db.commit()
    db.refresh(new_order)
    return new_order

def delete_order(db: Session, order_id: int):
    # Cancel/Delete order and restore stock
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )

    # Capture order details before deleting
    order_data = schemas.OrderResponse.model_validate(db_order)

    # Restore stock for each item
    for item in db_order.items:
        product = get_product(db, item.product_id)
        if product:
            product.quantity_in_stock += item.quantity
            
    db.delete(db_order)
    db.commit()
    return order_data


# --- DASHBOARD STATS ---

def get_dashboard_stats(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Calculate total revenue
    total_revenue_query = db.query(func.sum(models.Order.total_amount)).scalar()
    total_revenue = Decimal(str(total_revenue_query or "0.00"))
    
    # Low stock items: quantity < 10
    low_stock_products = db.query(models.Product).filter(models.Product.quantity_in_stock < 10).all()
    
    return schemas.DashboardStatsResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        low_stock_products=[schemas.ProductResponse.model_validate(p) for p in low_stock_products]
    )
