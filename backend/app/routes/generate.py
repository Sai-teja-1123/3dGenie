"""Generation endpoints for image and 3D model creation"""
import os
import uuid
from pathlib import Path
from typing import Dict
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.models.schemas import (
    GenerateImageRequest,
    Generate3DRequest,
    JobResponse,
    JobStatus
)
from app.services.comfyui import ComfyUIClient
from app.services.workflow import WorkflowManager


router = APIRouter(prefix="/api", tags=["generation"])

# In-memory job store (replace with Redis/database in production)
job_store: Dict[str, Dict] = {}


def get_comfyui_client():
    """Get ComfyUI client instance (real or mock based on TEST_MODE)"""
    from app.services.comfyui import ComfyUIClient
    
    test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
    
    if test_mode:
        from app.services.mock_comfyui import MockComfyUIClient
        comfyui_url = os.getenv("COMFYUI_URL", "http://localhost:8188")
        api_key = os.getenv("COMFYUI_API_KEY")
        return MockComfyUIClient(comfyui_url, api_key)
    else:
        comfyui_url = os.getenv("COMFYUI_URL", "http://localhost:8188")
        api_key = os.getenv("COMFYUI_API_KEY")
        return ComfyUIClient(comfyui_url, api_key)


def get_storage_path() -> Path:
    """Get storage path for uploaded files"""
    storage = os.getenv("STORAGE_PATH", "storage/uploads")
    path = Path(storage)
    path.mkdir(parents=True, exist_ok=True)
    return path


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
        
        # Initialize services
        comfyui = get_comfyui_client()
        workflow_manager = WorkflowManager()
        
        # Upload image to ComfyUI
        try:
            comfyui_image_path = comfyui.upload_image(str(local_path))
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to upload image to ComfyUI: {str(e)}"
            )
        
        # Load and modify workflow
        try:
            workflow = workflow_manager.load_workflow("flux-image-model.json")
            workflow = workflow_manager.inject_image_params(
                workflow,
                comfyui_image_path,
                prompt,
                negative_prompt,
                steps,
                guidance,
                seed
            )
        except FileNotFoundError as e:
            raise HTTPException(status_code=500, detail=f"Workflow not found: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Workflow error: {str(e)}")
        
        # Queue workflow
        try:
            prompt_id = comfyui.queue_prompt(workflow)
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to queue workflow in ComfyUI: {str(e)}"
            )
        
        # Store job info
        job_store[job_id] = {
            "status": JobStatus.PENDING,
            "prompt_id": prompt_id,
            "workflow_type": "image",
            "local_image_path": str(local_path),
            "comfyui_image_path": comfyui_image_path
        }
        
        return JobResponse(
            job_id=job_id,
            status=JobStatus.PENDING,
            message=f"Image generation job created. Prompt ID: {prompt_id}"
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
    Generate a 3D model using the Hunyuan3D workflow
    
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
        
        # Initialize services
        comfyui = get_comfyui_client()
        workflow_manager = WorkflowManager()
        
        # Upload image to ComfyUI
        try:
            comfyui_image_path = comfyui.upload_image(str(local_path))
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to upload image to ComfyUI: {str(e)}"
            )
        
        # Load and modify workflow
        try:
            workflow = workflow_manager.load_workflow("3DModel-Flow.json")
            workflow = workflow_manager.inject_3d_params(
                workflow,
                comfyui_image_path,
                steps,
                seed
            )
        except FileNotFoundError as e:
            raise HTTPException(status_code=500, detail=f"Workflow not found: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Workflow error: {str(e)}")
        
        # Queue workflow
        try:
            prompt_id = comfyui.queue_prompt(workflow)
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to queue workflow in ComfyUI: {str(e)}"
            )
        
        # Store job info
        job_store[job_id] = {
            "status": JobStatus.PENDING,
            "prompt_id": prompt_id,
            "workflow_type": "3d",
            "local_image_path": str(local_path),
            "comfyui_image_path": comfyui_image_path
        }
        
        return JobResponse(
            job_id=job_id,
            status=JobStatus.PENDING,
            message=f"3D model generation job created. Prompt ID: {prompt_id}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

