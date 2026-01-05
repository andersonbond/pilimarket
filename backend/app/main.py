"""
FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import engine, Base
from app.api.v1 import auth, markets, forecasts, purchases, users, leaderboard, admin
from app.middleware import RateLimitMiddleware

# Import models to register them with SQLAlchemy
from app.models import User  # noqa

# Note: Use Alembic migrations instead of create_all in production
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pilimarket API",
    description="Philippine Prediction Market API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(markets.router, prefix="/api/v1/markets", tags=["markets"])
app.include_router(forecasts.router, prefix="/api/v1", tags=["forecasts"])
app.include_router(purchases.router, prefix="/api/v1/purchases", tags=["purchases"])
app.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["leaderboard"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

# Serve uploaded files
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Pilimarket API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Pilimarket-api"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "errors": [{"message": "Internal server error"}],
        },
    )

