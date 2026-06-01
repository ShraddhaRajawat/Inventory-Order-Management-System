from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, condecimal, conint

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., gt=0)
    quantity_in_stock: int = Field(..., ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[Decimal] = Field(None, gt=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone_number: str = Field(..., min_length=1, max_length=50)

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# --- ORDER ITEM SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_order: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_items=1)

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# --- DASHBOARD STATS SCHEMAS ---
class DashboardStatsResponse(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    low_stock_products: List[ProductResponse]
