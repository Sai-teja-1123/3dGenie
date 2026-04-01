"""Pydantic models for request/response validation"""
from typing import Optional, Literal
from pydantic import BaseModel, Field
from enum import Enum


class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerateImageRequest(BaseModel):
    """Request model for image generation"""
    image_file: str = Field(..., description="Path or URL to the input image")
    prompt: Optional[str] = Field(
        default="Create a stylized action figure version of the child in the uploaded image, keeping the facial features and hairstyle exactly the same.",
        description="Generation prompt"
    )
    negative_prompt: Optional[str] = Field(
        default="watermark,text",
        description="Negative prompt"
    )
    steps: Optional[int] = Field(default=20, ge=1, le=100, description="Number of inference steps")
    guidance: Optional[float] = Field(default=3.5, ge=1.0, le=20.0, description="Guidance scale")
    seed: Optional[int] = Field(default=None, description="Random seed (None for random)")


class Generate3DRequest(BaseModel):
    """Request model for 3D model generation"""
    image_file: str = Field(..., description="Path or URL to the input image")
    style: Optional[str] = Field(default="default", description="3D style/model selection")
    steps: Optional[int] = Field(default=50, ge=1, le=200, description="Number of inference steps")
    seed: Optional[int] = Field(default=None, description="Random seed (None for random)")


class JobResponse(BaseModel):
    """Response model for job creation"""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    message: str = Field(..., description="Status message")


class JobStatusResponse(BaseModel):
    """Response model for job status check"""
    job_id: str = Field(..., description="Job identifier")
    status: JobStatus = Field(..., description="Current job status")
    progress: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Progress percentage")
    message: str = Field(..., description="Status message")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class JobResultResponse(BaseModel):
    """Response model for job result"""
    job_id: str = Field(..., description="Job identifier")
    status: JobStatus = Field(..., description="Job status")
    result_url: Optional[str] = Field(default=None, description="URL to generated result")
    result_files: Optional[list[str]] = Field(default=None, description="List of generated file URLs")
    message: str = Field(..., description="Status message")


class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy"] = Field(..., description="Service health status")
    comfyui_connected: bool = Field(..., description="Legacy compatibility field")
    message: str = Field(..., description="Health message")

