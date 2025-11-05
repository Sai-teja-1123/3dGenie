# ComfyUI Models Setup Guide

## Important: Models go in ComfyUI folder, NOT project folder

All models must be placed in your ComfyUI installation directory, not in the `ai-forge-demo` folder.

## ComfyUI Model Directory Structure

Your ComfyUI folder should have this structure:

```
ComfyUI/
├── models/
│   ├── checkpoints/          # Main model weights (e.g., Flux, SDXL)
│   ├── vae/                   # VAE models
│   ├── clip/                  # CLIP text encoders
│   ├── clip_l/                # CLIP-L text encoders
│   ├── t5xxl/                 # T5-XXL text encoders (for Flux)
│   ├── upscale_models/        # Upscaling models (Real-ESRGAN, etc.)
│   ├── loras/                 # LoRA models
│   ├── custom_nodes/           # Custom node installations
│   └── ...                     # Other model types
```

## Models Required for Your Workflows

### For Image Workflow (flux-image-model.json)

#### 1. Flux Model Files
**Location**: `ComfyUI/models/checkpoints/`

Required files:
- `flux1-dev.safetensors` - Main Flux model

**Download from**: HuggingFace or ComfyUI Model Manager

#### 2. Flux VAE
**Location**: `ComfyUI/models/vae/`

Required files:
- `ae.safetensors` - Flux VAE

#### 3. Flux CLIP Models
**Location**: `ComfyUI/models/clip/` and `ComfyUI/models/t5xxl/`

Required files:
- `clip-vit-large-patch14.bin` - In `models/clip/`
- `t5xxl_fp16.safetensors` - In `models/t5xxl/`

#### 4. PULID Model (Face Consistency)
**Location**: `ComfyUI/models/controlnet/` or `ComfyUI/custom_nodes/ComfyUI_PULID/`

Required files:
- `pulid_flux_v0.9.1.safetensors` - PULID model for Flux

**Note**: After installing the PULID custom node, check its README for exact model location.

#### 5. Upscale Model
**Location**: `ComfyUI/models/upscale_models/`

Required files:
- `4x-UltraSharp.pth` - Used in your workflow (or another upscale model)

**Alternative**: `4x_foolhardy_Remacri.pth` (if your workflow uses this)

### For 3D Workflow (3DModel-Flow.json)

#### 1. Hunyuan3D Models
**Location**: `ComfyUI/models/checkpoints/` or `ComfyUI/custom_nodes/ComfyUI-Hunyuan3DWrapper/`

Required files:
- `hunyuan3d-dit-v2-0-fp16.safetensors` - Main Hunyuan3D model
- `hunyuan3d-delight-v2-0` - Delight model (name format may vary)
- `hunyuan3d-paint-v2-0` - Paint model (name format may vary)

**Download**: Check the ComfyUI-Hunyuan3DWrapper repository for download links

#### 2. Upscale Model (if used)
**Location**: `ComfyUI/models/upscale_models/`

- `4x_foolhardy_Remacri.pth` - Used in your 3D workflow

## How to Download Models

### Option 1: Using ComfyUI Model Manager (Easiest)

1. Open ComfyUI in your browser
2. Install ComfyUI-Manager if not already installed
3. Use the Model Manager to search and download models directly

### Option 2: Manual Download

1. **Check workflow JSON for model names**:
   - Open `backend/workflows/flux-image-model.json`
   - Look for model file names in `widgets_values`

2. **Download from HuggingFace**:
   - Search for the model on HuggingFace
   - Download the `.safetensors` or `.pth` files
   - Place in the correct directory

3. **Download from custom node repositories**:
   - Check the custom node's GitHub/GitLab page
   - Follow their model download instructions

### Option 3: Using Command Line (HuggingFace)

```bash
# Install huggingface-hub if needed
pip install huggingface-hub

# Download to ComfyUI models folder
# Example for Flux:
huggingface-cli download black-forest-labs/FLUX.1-dev \
  --local-dir ComfyUI/models/checkpoints/flux1-dev
```

## Verifying Models are Installed

### Check via ComfyUI UI:
1. Open ComfyUI
2. Load a workflow
3. Check model dropdowns - if models are missing, they'll show as empty or error

### Check via File System:
```bash
# Navigate to ComfyUI directory
cd ComfyUI

# Check checkpoints
ls models/checkpoints/

# Check VAE
ls models/vae/

# Check other folders
ls models/
```

## Quick Setup Checklist

### Image Workflow:
- [ ] `flux1-dev.safetensors` in `models/checkpoints/`
- [ ] `ae.safetensors` in `models/vae/`
- [ ] `clip-vit-large-patch14.bin` in `models/clip/`
- [ ] `t5xxl_fp16.safetensors` in `models/t5xxl/`
- [ ] PULID model installed (check PULID node installation)
- [ ] `4x-UltraSharp.pth` or alternative in `models/upscale_models/`

### 3D Workflow:
- [ ] Hunyuan3D models installed (check Hunyuan3DWrapper node)
- [ ] `4x_foolhardy_Remacri.pth` in `models/upscale_models/`

## Troubleshooting

### "Model not found" errors:
1. Check file name matches exactly (case-sensitive)
2. Verify file is in the correct directory
3. Restart ComfyUI after adding models

### "Custom node missing" errors:
1. Install the custom node in `ComfyUI/custom_nodes/`
2. Restart ComfyUI
3. Some nodes need models in their own subdirectories

### Large file downloads:
- Models can be several GB each
- Use a download manager for large files
- Consider using `git-lfs` if models are in Git repositories

## Example: Setting up Flux Image Workflow

```bash
# Navigate to your ComfyUI folder
cd C:\path\to\ComfyUI

# Create directories if they don't exist
mkdir -p models/checkpoints
mkdir -p models/vae
mkdir -p models/clip
mkdir -p models/t5xxl
mkdir -p models/upscale_models

# Download Flux model (example - adjust URL)
# Use HuggingFace or ComfyUI Model Manager to download:
# - models/checkpoints/flux1-dev.safetensors
# - models/vae/ae.safetensors
# - models/clip/clip-vit-large-patch14.bin
# - models/t5xxl/t5xxl_fp16.safetensors
```

## Important Notes

1. **Don't put models in the project folder** (`ai-forge-demo/backend/`) - ComfyUI won't find them
2. **Model names must match exactly** what's in your workflow JSON
3. **Restart ComfyUI** after adding new models
4. **Check file sizes** - incomplete downloads will cause errors
5. **Some custom nodes** install models automatically when you first use them

