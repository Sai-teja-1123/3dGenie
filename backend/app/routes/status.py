"""Status and result endpoints"""
from typing import Dict
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app.models.schemas import JobStatusResponse, JobResultResponse, JobStatus
from app.services.comfyui import ComfyUIClient
from app.routes.generate import job_store, get_comfyui_client, get_storage_path


router = APIRouter(prefix="/api", tags=["status"])


def update_job_status(job_id: str, comfyui: ComfyUIClient) -> Dict:
    """Update job status by checking ComfyUI history"""
    if job_id not in job_store:
        return None
    
    job = job_store[job_id]
    prompt_id = job.get("prompt_id")
    
    if not prompt_id:
        return job
    
    try:
        history = comfyui.get_history(prompt_id)
        
        if history and len(history.get("outputs", {})) > 0:
            # Workflow completed
            job["status"] = JobStatus.COMPLETED
            job["history"] = history
            
            # Get output files
            output_files = comfyui.get_output_files(prompt_id)
            job["output_files"] = output_files
            
        elif history is None:
            # Check if still in queue
            queue = comfyui.get_queue()
            in_queue = any(
                item.get("prompt_id") == prompt_id 
                for item in queue.get("queue_running", []) + queue.get("queue_pending", [])
            )
            
            if in_queue:
                job["status"] = JobStatus.PROCESSING
            else:
                # Not found in queue or history - might be processing
                job["status"] = JobStatus.PROCESSING
        
    except Exception as e:
        # If we can't check status, assume it's processing
        job["status"] = JobStatus.PROCESSING
        job["error"] = str(e) if "error" not in job else job["error"]
    
    return job


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get the status of a generation job
    
    - **job_id**: Job identifier from generation endpoint
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    comfyui = get_comfyui_client()
    job = update_job_status(job_id, comfyui)
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    
    status = job.get("status", JobStatus.PENDING)
    error = job.get("error")
    
    # Calculate progress (rough estimate based on status)
    progress = None
    if status == JobStatus.PENDING:
        progress = 0.0
    elif status == JobStatus.PROCESSING:
        progress = 50.0  # Rough estimate
    elif status == JobStatus.COMPLETED:
        progress = 100.0
    
    return JobStatusResponse(
        job_id=job_id,
        status=status,
        progress=progress,
        message=f"Job is {status.value}",
        error=error
    )


@router.get("/result/{job_id}", response_model=JobResultResponse)
async def get_job_result(job_id: str):
    """
    Get the result of a completed generation job
    
    - **job_id**: Job identifier from generation endpoint
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    comfyui = get_comfyui_client()
    job = update_job_status(job_id, comfyui)
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    
    status = job.get("status")
    
    if status == JobStatus.FAILED:
        return JobResultResponse(
            job_id=job_id,
            status=status,
            message="Job failed",
            error=job.get("error", "Unknown error")
        )
    
    if status != JobStatus.COMPLETED:
        return JobResultResponse(
            job_id=job_id,
            status=status,
            message=f"Job is still {status.value}, please wait"
        )
    
    # Get output files
    output_files = job.get("output_files", [])
    
    if not output_files:
        return JobResultResponse(
            job_id=job_id,
            status=status,
            message="No output files found"
        )
    
    # For now, return file paths relative to ComfyUI
    # In production, you'd upload these to S3/Cloudflare R2 and return URLs
    result_files = output_files
    
    return JobResultResponse(
        job_id=job_id,
        status=status,
        result_files=result_files,
        message="Generation completed successfully"
    )


@router.get("/result/{job_id}/download/{filename:path}")
async def download_result(job_id: str, filename: str):
    """
    Download a specific result file
    
    - **job_id**: Job identifier
    - **filename**: Output filename (path relative to ComfyUI output folder)
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_store[job_id]
    
    if job.get("status") != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    comfyui = get_comfyui_client()
    storage_path = get_storage_path()
    
    try:
        # Download from ComfyUI
        save_path = storage_path / "results" / filename
        downloaded_path = comfyui.download_file(filename, str(save_path))
        
        return FileResponse(
            downloaded_path,
            media_type="application/octet-stream",
            filename=Path(filename).name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

