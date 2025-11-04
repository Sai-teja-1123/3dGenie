# Required Models - Quick Reference

## ⚠️ Place ALL models in your ComfyUI folder, NOT in the project folder

---

## Image Workflow (flux-image-model.json)

Based on your workflow, you need these **exact** model names:

### 1. Flux Model
- **File**: `flux1-dev.safetensors`
- **Location**: `ComfyUI/models/checkpoints/`
- **Download**: HuggingFace `black-forest-labs/FLUX.1-dev` (23GB)

### 2. Flux VAE
- **File**: `ae.safetensors`
- **Location**: `ComfyUI/models/vae/`
- **Download**: Included with Flux or from HuggingFace

### 3. CLIP Models
- **File 1**: `clip-vit-large-patch14.bin`
  - **Location**: `ComfyUI/models/clip/`
  
- **File 2**: `t5xxl_fp16.safetensors`
  - **Location**: `ComfyUI/models/t5xxl/`

### 4. PULID Model
- **File**: `pulid_flux_v0.9.1.safetensors`
- **Location**: Usually `ComfyUI/custom_nodes/ComfyUI_PULID/models/` or `ComfyUI/models/controlnet/`
- **Note**: Check the PULID custom node installation for exact location

### 5. Upscale Model
- **File**: `4x-UltraSharp.pth`
- **Location**: `ComfyUI/models/upscale_models/`
- **Alternative**: You can use other upscale models and update the workflow

---

## 3D Workflow (3DModel-Flow.json)

### 1. Hunyuan3D Models
The workflow uses these model names (check Hunyuan3DWrapper documentation for exact locations):
- Hunyuan3D main model
- `hunyuan3d-delight-v2-0` (delight model)
- `hunyuan3d-paint-v2-0` (paint model)

**Location**: Check `ComfyUI/custom_nodes/ComfyUI-Hunyuan3DWrapper/` README

### 2. Upscale Model
- **File**: `4x_foolhardy_Remacri.pth`
- **Location**: `ComfyUI/models/upscale_models/`

---

## Quick Setup Commands

```bash
# Navigate to your ComfyUI directory
cd C:\path\to\ComfyUI

# Create model directories (if they don't exist)
mkdir models\checkpoints
mkdir models\vae
mkdir models\clip
mkdir models\t5xxl
mkdir models\upscale_models

# Then download models using ComfyUI Model Manager or manually
```

---

## Recommended: Use ComfyUI Model Manager

The easiest way to get all models:

1. Start ComfyUI
2. Install **ComfyUI-Manager** (if not already installed)
3. Open Model Manager from ComfyUI interface
4. Search for:
   - "FLUX.1-dev"
   - "Flux VAE"
   - "clip vit large"
   - "t5xxl"
   - "PULID"
   - "4x UltraSharp"
5. Click download - models will be placed automatically in correct locations

---

## Verify Models are Installed

After placing models:

1. **Restart ComfyUI** (important!)
2. Load your workflow in ComfyUI
3. Check model dropdowns - they should show your models
4. If models are missing, check:
   - File names match exactly (case-sensitive)
   - Files are in correct directories
   - Files are not corrupted (check file sizes)

---

## File Size Reference

Approximate sizes (to verify downloads are complete):
- Flux model: ~23 GB
- Flux VAE: ~500 MB
- CLIP models: ~200-500 MB each
- PULID: ~2-5 GB
- Upscale models: ~50-200 MB
- Hunyuan3D models: ~10-20 GB total

