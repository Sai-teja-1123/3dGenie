"""Generation endpoints for image and 3D model creation"""
import os
import uuid
from pathlib import Path
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.models.schemas import (
    JobResponse,
    JobStatus
)
from app.services.google_image import GoogleImageService, GoogleImageGenerationError
from app.services.byteplus_image import BytePlusImageService, BytePlusImageGenerationError
from app.services.tripo3d import Tripo3DService, Tripo3DError


router = APIRouter(prefix="/api", tags=["generation"])

# In-memory job store (replace with Redis/database in production)
job_store: Dict[str, Dict] = {}


def get_storage_path() -> Path:
    """Get storage path for uploaded files"""
    storage = os.getenv("STORAGE_PATH", "storage/uploads")
    path = Path(storage)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _is_google_quota_or_rate_error(error: GoogleImageGenerationError) -> bool:
    """Detect Google quota/rate errors that should trigger BytePlus fallback."""
    if not error:
        return False
    if getattr(error, "status_code", None) in (429, 503):
        return True
    message = str(error).lower()
    return any(token in message for token in [
        "resource_exhausted",
        "quota",
        "rate limit",
        "too many requests",
        "limit"
    ])


@router.post("/generate-image", response_model=JobResponse)
async def generate_image(
    image: UploadFile = File(..., description="Input image file"),
    prompt: str = Form(default="Create a stylized action figure version of the child in the uploaded image, keeping the facial features and hairstyle exactly the same."),
    negative_prompt: str = Form(default="watermark,text"),
    steps: int = Form(default=20),
    guidance: float = Form(default=3.5),
    seed: int = Form(default=None)
):
    """
    Generate an image using the Flux workflow
    
    - **image**: Input image file (JPEG, PNG)
    - **prompt**: Generation prompt
    - **negative_prompt**: Negative prompt
    - **steps**: Number of inference steps (1-100)
    - **guidance**: Guidance scale (1.0-20.0)
    - **seed**: Random seed (optional)
    """
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Save uploaded image
        storage_path = get_storage_path()
        file_extension = Path(image.filename).suffix
        local_filename = f"{job_id}{file_extension}"
        local_path = storage_path / local_filename
        
        with open(local_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        with open(local_path, "rb") as infile:
            input_bytes = infile.read()
        input_mime = image.content_type or "image/jpeg"

        google_api_key = os.getenv("GOOGLE_API_KEY")
        byteplus_api_key = os.getenv("BYTEPLUS_API_KEY")

        if not google_api_key and not byteplus_api_key:
            raise HTTPException(
                status_code=500,
                detail="No image provider configured. Set GOOGLE_API_KEY or BYTEPLUS_API_KEY in backend environment."
            )

        output_bytes = None
        output_mime = None
        provider_used = None
        google_error: Optional[GoogleImageGenerationError] = None

        # Primary provider: Google
        if google_api_key:
            try:
                google_service = GoogleImageService(google_api_key)
                output_bytes, output_mime = google_service.generate_image_from_image(
                    image_bytes=input_bytes,
                    mime_type=input_mime,
                    prompt=prompt,
                    negative_prompt=negative_prompt
                )
                provider_used = "google"
            except GoogleImageGenerationError as e:
                google_error = e

        # Fallback provider: BytePlus (only for quota/rate issues or when Google key missing)
        should_try_byteplus = (
            byteplus_api_key and
            (
                not google_api_key or
                (google_error is not None and _is_google_quota_or_rate_error(google_error))
            )
        )

        if output_bytes is None and should_try_byteplus:
            try:
                byteplus_service = BytePlusImageService(byteplus_api_key)
                output_bytes, output_mime = byteplus_service.generate_image_from_image(
                    image_bytes=input_bytes,
                    mime_type=input_mime,
                    prompt=prompt,
                    negative_prompt=negative_prompt
                )
                provider_used = "byteplus"
            except BytePlusImageGenerationError as e:
                if google_error:
                    raise HTTPException(
                        status_code=500,
                        detail=(
                            f"Google image generation failed: {str(google_error)}. "
                            f"BytePlus fallback failed: {str(e)}"
                        )
                    )
                raise HTTPException(status_code=500, detail=f"BytePlus image generation failed: {str(e)}")

        if output_bytes is None:
            if google_error:
                raise HTTPException(status_code=500, detail=f"Google image generation failed: {str(google_error)}")
            raise HTTPException(status_code=500, detail="Image generation failed without output")

        # Save generated output as a local result file for existing status/result APIs
        results_dir = get_storage_path() / "results" / job_id
        results_dir.mkdir(parents=True, exist_ok=True)

        extension = ".png"
        if output_mime == "image/jpeg":
            extension = ".jpg"
        elif output_mime == "image/webp":
            extension = ".webp"

        output_filename = f"generated_preview{extension}"
        output_path = results_dir / output_filename
        with open(output_path, "wb") as outfile:
            outfile.write(output_bytes)

        # Store as completed job (frontend can keep polling unchanged)
        job_store[job_id] = {
            "status": JobStatus.COMPLETED,
            "workflow_type": "image_google",
            "local_image_path": str(local_path),
            "output_files": [output_filename],
            "local_result_files": {
                output_filename: str(output_path)
            }
        }

        return JobResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=f"Image generation completed with {provider_used or 'configured provider'}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/generate-3d", response_model=JobResponse)
async def generate_3d(
    image: UploadFile = File(..., description="Input image file"),
    style: str = Form(default="default"),
    steps: int = Form(default=50),
    seed: int = Form(default=None)
):
    """
    Generate a 3D model from an image.
    
    - **image**: Input image file (JPEG, PNG)
    - **style**: 3D style/model selection
    - **steps**: Number of inference steps (1-200)
    - **seed**: Random seed (optional)
    """
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Save uploaded image
        storage_path = get_storage_path()
        file_extension = Path(image.filename).suffix
        local_filename = f"{job_id}{file_extension}"
        local_path = storage_path / local_filename
        
        with open(local_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        tripo_api_key = os.getenv("TRIPO_API_KEY")
        if not tripo_api_key:
            raise HTTPException(
                status_code=500,
                detail="TRIPO_API_KEY is not configured. 3D generation is unavailable."
            )

        try:
            tripo = Tripo3DService(tripo_api_key)
            tripo_task_id = tripo.create_task_from_image(content, image.content_type)
        except Tripo3DError as e:
            raise HTTPException(status_code=500, detail=f"Tripo 3D generation failed: {str(e)}")

        job_store[job_id] = {
            "status": JobStatus.PENDING,
            "workflow_type": "tripo_3d",
            "tripo_task_id": tripo_task_id,
            "local_image_path": str(local_path),
            "provider": "tripo",
            "style": style,
            "steps": steps,
            "seed": seed,
        }

        return JobResponse(
            job_id=job_id,
            status=JobStatus.PENDING,
            message=f"Tripo 3D job created. Task ID: {tripo_task_id}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

