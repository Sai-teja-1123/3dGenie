/**
 * API client for backend integration
 * Handles communication with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface JobResponse {
  job_id: string;
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  progress: number | null;
  message: string;
  error?: string;
}

export interface JobResultResponse {
  job_id: string;
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  result_url?: string;
  result_files?: string[];
  message: string;
  error?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Upload image and generate 3D model
 */
export async function generate3DModel(
  imageFile: File,
  steps: number = 50,
  seed?: number
): Promise<JobResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("steps", steps.toString());
  if (seed !== undefined) {
    formData.append("seed", seed.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/generate-3d`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * Upload image and generate 2D image
 */
export async function generateImage(
  imageFile: File,
  prompt: string,
  negativePrompt: string = "watermark,text",
  steps: number = 20,
  guidance: number = 3.5,
  seed?: number
): Promise<JobResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("prompt", prompt);
  formData.append("negative_prompt", negativePrompt);
  formData.append("steps", steps.toString());
  formData.append("guidance", guidance.toString());
  if (seed !== undefined) {
    formData.append("seed", seed.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/generate-image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * Get job result
 */
export async function getJobResult(jobId: string): Promise<JobResultResponse> {
  const response = await fetch(`${API_BASE_URL}/api/result/${jobId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * Download result file
 */
export async function downloadResultFile(
  jobId: string,
  filename: string
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/api/result/${jobId}/download/${filename}`
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new ApiError(
      `Failed to download file: ${errorData}`,
      response.status
    );
  }

  return response.blob();
}

/**
 * Poll job status until completion
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (progress: number, status: string) => void,
  pollInterval: number = 2000,
  timeout: number = 600000 // 10 minutes
): Promise<JobResultResponse> {
  const startTime = Date.now();

  while (true) {
    const status = await getJobStatus(jobId);

    // Call progress callback
    if (onProgress) {
      onProgress(status.progress || 0, status.status);
    }

    // Check if completed or failed
    if (status.status === "completed") {
      return getJobResult(jobId);
    }

    if (status.status === "failed") {
      throw new ApiError(
        status.error || "Job failed",
        500,
        status
      );
    }

    // Check timeout
    if (Date.now() - startTime > timeout) {
      throw new ApiError("Job polling timeout", 408);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }
}

/**
 * Cancel a running job
 */
export async function cancelJob(jobId: string): Promise<{ message: string; cancelled: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/cancel/${jobId}`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * Get result file URL for display
 */
export function getResultFileUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/api/result/${jobId}/download/${filename}`;
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{
  status: string;
  comfyui_connected: boolean;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new ApiError("Health check failed", response.status);
  }

  return response.json();
}

export { ApiError };

