# 3DGENI Backend API

FastAPI backend for integrating ComfyUI workflows with the frontend application.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your ComfyUI URL and settings
   ```

3. **Run the server:**
   ```bash
   python -m app.main
   # Or with uvicorn directly:
   uvicorn app.main:app --reload --port 8000
   ```

## API Endpoints

### Health Check
- `GET /health` - Check service and ComfyUI connection status

### Image Generation
- `POST /api/generate-image` - Generate image using Flux workflow
  - Body: multipart/form-data
    - `image`: Image file
    - `prompt`: Text prompt (optional)
    - `negative_prompt`: Negative prompt (optional)
    - `steps`: Inference steps (optional, default: 20)
    - `guidance`: Guidance scale (optional, default: 3.5)
    - `seed`: Random seed (optional)

### 3D Model Generation
- `POST /api/generate-3d` - Generate 3D model from image
  - Body: multipart/form-data
    - `image`: Image file
    - `style`: Style selection (optional)
    - `steps`: Inference steps (optional, default: 50)
    - `seed`: Random seed (optional)

If `TRIPO_API_KEY` is configured, the endpoint uses Tripo image-to-model workflow and
auto-resizes/compresses input images to fit Tripo constraints. If not configured, it
falls back to the existing ComfyUI 3D workflow.

### Job Status
- `GET /api/status/{job_id}` - Get job status and progress
- `GET /api/result/{job_id}` - Get job result URLs
- `GET /api/result/{job_id}/download/{filename}` - Download result file

## Environment Variables

- `COMFYUI_URL` - ComfyUI instance URL (default: http://localhost:8188)
- `COMFYUI_API_KEY` - Optional API key for ComfyUI
- `PORT` - Server port (default: 8000)
- `DEBUG` - Enable debug mode (default: false)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `STORAGE_PATH` - Path for storing uploaded files (default: storage/uploads)
- `TRIPO_API_KEY` - Tripo image-to-3D API key (enables Tripo provider for `/generate-3d`)
- `TRIPO_BASE_URL` - Tripo OpenAPI base URL
- `TRIPO_MAX_IMAGE_MB` - Input image target size before Tripo upload (default: 10)
- `TRIPO_MAX_DIMENSION` - Maximum input image dimension before Tripo upload (default: 2048)

## API Documentation

When the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

### Test Mode (Without ComfyUI)

To test backend endpoints without requiring ComfyUI:

1. **Set test mode in `.env`:**
   ```env
   TEST_MODE=true
   ```

2. **Run validation tests:**
   ```bash
   # Start backend server first
   python -m app.main
   
   # In another terminal, run endpoint tests
   python test_backend_endpoints.py
   ```

3. **Or test via API:**
   - Visit http://localhost:8000/docs
   - Use `/api/validate/*` endpoints to test workflows

### Quick Connection Test (Requires ComfyUI)
```bash
python test_connection.py
```

### Manual Testing

1. Set `TEST_MODE=false` in `.env` if using real ComfyUI
2. Make sure ComfyUI is running and accessible at `COMFYUI_URL`
3. Test health endpoint: `curl http://localhost:8000/health`
4. Use the interactive docs at `/docs` to test endpoints

## RunPod GPU Setup (Recommended)

For cloud GPU deployment on RunPod:

1. **Quick Start:** See [QUICK_START_RUNPOD.md](QUICK_START_RUNPOD.md) for 1-hour test guide
2. **Detailed Guide:** See [RUNPOD_SETUP.md](RUNPOD_SETUP.md) for complete setup instructions

### Quick RunPod Steps:
1. Sign up at https://www.runpod.io
2. Deploy A40 GPU pod with ComfyUI template
3. Get endpoint URL from pod details
4. Update `COMFYUI_URL` in `.env` file
5. Test connection: `python test_runpod_connection.py`
6. Start backend and test!

## Local Setup Guide

For detailed local ComfyUI setup instructions, see [SETUP_LOCAL.md](SETUP_LOCAL.md)

