from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

@router.get("/stats", response_model=schemas.DashboardStatsResponse)
def read_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db=db, order_in=order)

@router.get("/", response_model=List[schemas.OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db, skip=skip, limit=limit)

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order

@router.delete("/{order_id}", response_model=schemas.OrderResponse)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    return crud.delete_order(db=db, order_id=order_id)
