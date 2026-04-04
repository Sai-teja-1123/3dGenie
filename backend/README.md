# 3DGENI Backend API

FastAPI backend for auth, payments, image generation, and Tripo-based 3D generation.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment:
   ```bash
   cp env.example .env
   ```
3. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Core Endpoints

- `GET /health` - Service health check
- `POST /api/generate-image` - Generate styled image (Google/BytePlus)
- `POST /api/generate-3d` - Generate 3D model (Tripo)
- `GET /api/status/{job_id}` - Job status
- `GET /api/result/{job_id}` - Job result metadata
- `GET /api/result/{job_id}/download/{filename}` - Download result file
- `GET /api/auth/google/config` - Google client config for frontend

## Validation Endpoints

- `GET /api/validate/providers` - Provider config availability
- `POST /api/validate/sanity` - Basic runtime sanity checks
- `GET /api/validate/endpoints` - Endpoint map
- `GET /api/validate/structure` - Storage/env structure check

## Environment

See `env.example` for required variables:

- server/cors/storage
- Google + BytePlus image providers
- Tripo 3D provider
- Google OAuth + JWT
- Razorpay payment keys

## API Docs

When running locally:

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

