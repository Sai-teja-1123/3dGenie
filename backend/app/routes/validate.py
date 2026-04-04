"""Validation endpoints to test backend setup."""
import os
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/api/validate", tags=["validation"])


@router.get("/providers")
async def validate_providers():
    """Validate external provider configuration (without making API calls)."""
    return {
        "providers": {
            "google_image": bool(os.getenv("GOOGLE_API_KEY")),
            "byteplus_image": bool(os.getenv("BYTEPLUS_API_KEY")),
            "tripo_3d": bool(os.getenv("TRIPO_API_KEY")),
        },
        "storage_path": os.getenv("STORAGE_PATH", "storage/uploads"),
    }


@router.post("/sanity")
async def test_runtime_sanity():
    """Basic runtime sanity checks that do not call external providers."""
    storage_path = Path(os.getenv("STORAGE_PATH", "storage/uploads"))
    return {
        "status": "success",
        "checks": {
            "storage_path_exists_or_creatable": storage_path.exists() or storage_path.parent.exists(),
            "backend_root_exists": Path(".").exists(),
        },
    }


@router.get("/endpoints")
async def list_endpoints():
    """List all available API endpoints and their purposes."""
    return {
        "generation": {
            "POST /api/generate-image": "Generate 2D image with configured provider",
            "POST /api/generate-3d": "Generate 3D model using Tripo",
        },
        "status": {
            "GET /api/status/{job_id}": "Get job status and progress",
            "GET /api/result/{job_id}": "Get job result URLs",
            "GET /api/result/{job_id}/download/{filename}": "Download result file",
        },
        "validation": {
            "GET /api/validate/providers": "Check provider configuration flags",
            "POST /api/validate/sanity": "Run basic local sanity checks",
            "GET /api/validate/endpoints": "List all endpoints",
        },
        "health": {
            "GET /health": "Check service health",
        },
    }


@router.get("/structure")
async def validate_structure():
    """Validate backend structure and core dependencies."""
    storage_path = Path(os.getenv("STORAGE_PATH", "storage/uploads"))

    checks = {
        "storage_directory": {
            "exists": storage_path.exists(),
            "path": str(storage_path.absolute()),
        },
        "environment": {
            "tripo_configured": bool(os.getenv("TRIPO_API_KEY")),
            "storage_path": os.getenv("STORAGE_PATH", "storage/uploads"),
        },
    }

    return {
        "structure_valid": checks["storage_directory"]["exists"],
        "checks": checks,
    }

