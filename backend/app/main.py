"""FastAPI application main file."""
import logging
import os
from dotenv import load_dotenv
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.models.schemas import HealthResponse
from app.routes import auth, generate, status

# Load environment variables from .env file at startup
load_dotenv()


app = FastAPI(
    title="3DGENI API",
    description="Backend API for image and 3D generation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generate.router)
app.include_router(status.router)
app.include_router(auth.router)

# Validation router (for local sanity checks)
from app.routes import validate
app.include_router(validate.router)

# Payments router (Razorpay)
from app.routes import payments
app.include_router(payments.router)


@app.get("/", response_class=JSONResponse)
async def root():
    """Root endpoint"""
    return {
        "message": "3DGENI API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns service status and provider readiness.
    """
    tripo_configured = bool(os.getenv("TRIPO_API_KEY"))
    return HealthResponse(
        status="healthy",
        # Keep this field for frontend compatibility.
        comfyui_connected=False,
        message="Service is running" if tripo_configured else "Service is running (TRIPO_API_KEY not configured)"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )

