# Local ComfyUI Setup & Testing Guide

## Step 1: Install ComfyUI Locally

### Option A: Using Git (Recommended)
```bash
# Navigate to where you want ComfyUI
cd C:\  # or any directory

# Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

### Option B: Using Conda/Miniconda
```bash
# Create conda environment
conda create -n comfyui python=3.10
conda activate comfyui

# Install PyTorch with CUDA (if you have GPU)
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia

# Clone and install ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt
```

## Step 2: Install Required Custom Nodes

Your workflows need these custom nodes:

### For Image Workflow (flux-image-model.json):
1. **ComfyUI-Manager** (to easily install other nodes):
   ```bash
   cd ComfyUI/custom_nodes
   git clone https://github.com/ltdrdata/ComfyUI-Manager.git
   ```

2. **PULID** (for face consistency):
   ```bash
   cd ComfyUI/custom_nodes
   git clone https://github.com/cubiq/ComfyUI_PULID.git
   ```

### For 3D Workflow (3DModel-Flow.json):
1. **ComfyUI-Hunyuan3DWrapper**:
   ```bash
   cd ComfyUI/custom_nodes
   git clone https://github.com/kijai/ComfyUI-Hunyuan3DWrapper.git
   cd ComfyUI-Hunyuan3DWrapper
   pip install -r requirements.txt
   ```

2. **ComfyUI_essentials**:
   ```bash
   cd ComfyUI/custom_nodes
   git clone https://github.com/cubiq/ComfyUI_essentials.git
   ```

## Step 3: Start ComfyUI

```bash
# Navigate to ComfyUI directory
cd ComfyUI

# Start ComfyUI with API enabled
python main.py --port 8188
```

You should see:
```
Starting server
To see the server go to: http://127.0.0.1:8188
```

## Step 4: Configure Backend

1. **Update `.env` file:**
   ```env
   COMFYUI_URL=http://localhost:8188
   COMFYUI_API_KEY=
   PORT=8000
   DEBUG=true
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   STORAGE_PATH=storage/uploads
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Start backend:**
   ```bash
   python -m app.main
   ```

## Step 5: Test Connection

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "comfyui_connected": true,
  "message": "Service is running"
}
```

### Test 2: Check ComfyUI Directly
Visit: http://localhost:8188

You should see the ComfyUI interface.

## Step 6: Test API Endpoints

Use the interactive docs: http://localhost:8000/docs

Or use curl:

```bash
# Health check
curl http://localhost:8000/health

# Generate image (you'll need to use the /docs interface to upload a file)
```

## Troubleshooting

### ComfyUI not starting?
- Check Python version (needs 3.10+)
- Make sure port 8188 is not in use
- Check for missing dependencies

### Backend can't connect to ComfyUI?
- Verify ComfyUI is running on http://localhost:8188
- Check firewall settings
- Try accessing http://localhost:8188 in browser

### Workflow errors?
- Make sure all custom nodes are installed
- Check that required models are downloaded
- Look at ComfyUI terminal for error messages

## Next Steps

Once local testing works:
1. Test image generation workflow
2. Test 3D model generation workflow
3. Verify results are returned correctly
4. Then move to deployment (Phase 4)

