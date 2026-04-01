"""Status and result endpoints"""
from __future__ import annotations

from typing import Dict, Optional
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app.models.schemas import JobStatusResponse, JobResultResponse, JobStatus
from app.services.tripo3d import Tripo3DService, Tripo3DError
from app.routes.generate import job_store, get_storage_path
import os


router = APIRouter(prefix="/api", tags=["status"])


def _update_tripo_job_status(job_id: str) -> Optional[Dict]:
    """Update Tripo-backed job status by polling Tripo task API."""
    if job_id not in job_store:
        return None

    job = job_store[job_id]
    task_id = job.get("tripo_task_id")
    if not task_id:
        return job

    status = job.get("status")
    if status in (JobStatus.COMPLETED, JobStatus.FAILED) and job.get("output_files"):
        return job

    tripo_key = os.getenv("TRIPO_API_KEY")
    if not tripo_key:
        job["status"] = JobStatus.FAILED
        job["error"] = "TRIPO_API_KEY is not configured"
        return job

    try:
        tripo = Tripo3DService(tripo_key)
        task_data = tripo.get_task(task_id)
    except Tripo3DError as e:
        job["status"] = JobStatus.PROCESSING
        job["error"] = str(e)
        return job

    raw_status = (task_data.get("status") or "").lower()
    job["tripo_task_status"] = raw_status
    job["progress"] = task_data.get("progress")

    if raw_status in {"success", "completed", "done"}:
        model_url = tripo.extract_model_url(task_data)
        if not model_url:
            job["status"] = JobStatus.FAILED
            job["error"] = "Tripo task succeeded but no model URL was returned"
            return job

        try:
            model_bytes, ext = tripo.download_model(model_url)
        except Tripo3DError as e:
            job["status"] = JobStatus.FAILED
            job["error"] = f"Tripo model download failed: {str(e)}"
            return job

        results_dir = get_storage_path() / "results" / job_id
        results_dir.mkdir(parents=True, exist_ok=True)
        output_filename = f"tripo_model{ext}"
        output_path = results_dir / output_filename
        with open(output_path, "wb") as f:
            f.write(model_bytes)

        job["status"] = JobStatus.COMPLETED
        job["output_files"] = [output_filename]
        job["local_result_files"] = {output_filename: str(output_path)}
        job["tripo_result_url"] = model_url
        return job

    if raw_status in {"failed", "error", "canceled", "cancelled"}:
        job["status"] = JobStatus.FAILED
        job["error"] = task_data.get("message") or "Tripo task failed"
        return job

    # Queue/running/in progress statuses
    job["status"] = JobStatus.PROCESSING
    return job


def update_job_status(job_id: str) -> Optional[Dict]:
    """Dispatch status updates by provider/workflow type."""
    if job_id not in job_store:
        return None

    job = job_store[job_id]
    workflow_type = job.get("workflow_type")

    if workflow_type == "tripo_3d":
        return _update_tripo_job_status(job_id)
    return job


@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get the status of a generation job
    
    - **job_id**: Job identifier from generation endpoint
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = update_job_status(job_id)
    
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    
    status = job.get("status", JobStatus.PENDING)
    error = job.get("error")
    
    # Calculate progress (rough estimate based on status)
    progress = None
    if status == JobStatus.PENDING:
        progress = 0.0
    elif status == JobStatus.PROCESSING:
        # Prefer provider-reported progress when available.
        provider_progress = job.get("progress")
        if provider_progress is not None:
            try:
                progress = float(provider_progress)
            except (TypeError, ValueError):
                progress = 50.0
        else:
            progress = 50.0
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
    
    job = update_job_status(job_id)
    
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
    
    # For now, return filenames stored on local backend storage.
    # In production, you'd upload to object storage and return URLs.
    result_files = output_files
    
    return JobResultResponse(
        job_id=job_id,
        status=status,
        result_files=result_files,
        message="Generation completed successfully"
    )


@router.post("/cancel/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel a running or queued generation job
    
    - **job_id**: Job identifier to cancel
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_store[job_id]
    status = job.get("status")
    if status in (JobStatus.COMPLETED, JobStatus.FAILED):
        return JSONResponse(
            content={"message": "Job is already finished", "cancelled": False}
        )
    # Tripo cancel endpoint is not integrated in this backend.
    return JSONResponse(
        content={"message": "Cancel is not supported for current provider", "cancelled": False}
    )


@router.get("/result/{job_id}/download/{filename:path}")
async def download_result(job_id: str, filename: str):
    """
    Download a specific result file
    
    - **job_id**: Job identifier
    - **filename**: Output filename
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_store[job_id]
    
    if job.get("status") != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    local_result_files = job.get("local_result_files", {})
    local_path = local_result_files.get(filename)

    if not local_path:
        # Fallback to expected per-job result location if mapping is missing.
        candidate_path = get_storage_path() / "results" / job_id / filename
        if candidate_path.exists():
            local_path = str(candidate_path)

    if not local_path:
        raise HTTPException(status_code=404, detail="Result file not found on server")

    if not Path(local_path).exists():
        raise HTTPException(status_code=404, detail="Result file not found on server")

    return FileResponse(
        local_path,
        media_type="application/octet-stream",
        filename=Path(local_path).name
    )

