import time
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from .database import engine, Base
from .routers import products, customers, orders

# Retrying DB connection on startup (useful when PostgreSQL container is warming up)
db_connected = False
for i in range(10):
    try:
        # Create database tables if they don't exist
        Base.metadata.create_all(bind=engine)
        db_connected = True
        break
    except OperationalError:
        print(f"Database connection failed. Retrying in 3 seconds... ({i+1}/10)")
        time.sleep(3)

if not db_connected:
    print("Could not connect to the database. Exiting.")

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Backend API for managing products, customers, and orders.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domain names
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create an API router prefixing all routes with /api
api_router = APIRouter(prefix="/api")
api_router.include_router(products.router)
api_router.include_router(customers.router)
api_router.include_router(orders.router)

app.include_router(api_router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Inventory & Order Management System API!",
        "docs": "/docs"
    }
