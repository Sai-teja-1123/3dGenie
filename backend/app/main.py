"""FastAPI application main file"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import generate, status
from app.models.schemas import HealthResponse
from app.services.comfyui import ComfyUIClient
import os


app = FastAPI(
    title="AI Forge API",
    description="Backend API for ComfyUI workflow integration",
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

# Validation router (for testing without ComfyUI)
from app.routes import validate
app.include_router(validate.router)


@app.get("/", response_class=JSONResponse)
async def root():
    """Root endpoint"""
    return {
        "message": "AI Forge API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns service health and ComfyUI connection status
    """
    try:
        comfyui_url = os.getenv("COMFYUI_URL", "http://localhost:8188")
        api_key = os.getenv("COMFYUI_API_KEY")
        comfyui = ComfyUIClient(comfyui_url, api_key)
        comfyui_connected = comfyui.health_check()
        
        return HealthResponse(
            status="healthy" if comfyui_connected else "unhealthy",
            comfyui_connected=comfyui_connected,
            message="Service is running" if comfyui_connected else "Service running but ComfyUI is unreachable"
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            comfyui_connected=False,
            message=f"Health check failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )

