# RunPod GPU Setup Guide

Complete guide to setting up RunPod A40 GPU for ComfyUI and integrating with your backend.

## Step 1: Create RunPod Account

1. Go to [RunPod.io](https://www.runpod.io)
2. Sign up for an account
3. Add payment method (credit card or crypto)
4. Verify your account

## Step 2: Deploy ComfyUI Pod

### Option A: Use RunPod ComfyUI Template (Recommended)

1. **Navigate to Pods:**
   - Go to RunPod dashboard → "Pods" → "Deploy"

2. **Select GPU:**
   - Choose **A40** (48GB VRAM, $0.20/hr)
   - Or select **RTX 4090** (24GB VRAM, $0.50/hr) for testing

3. **Choose Template:**
   - Search for "ComfyUI" in templates
   - Select a ComfyUI template (e.g., "ComfyUI Official" or "ComfyUI with Custom Nodes")
   - Or use a community template

4. **Configure Pod:**
   - **Container Disk:** 20-50GB (for models and custom nodes)
   - **Volume Disk:** Optional (for persistent storage)
   - **Network Volume:** Optional (for sharing models)
   - **Ports:** Ensure port **8188** is exposed (usually auto-configured)

5. **Advanced Settings:**
   - **Container Image:** Leave default or use custom
   - **Docker Command:** Usually auto-filled
   - **Environment Variables:** Add if needed:
     ```
     COMFYUI_PORT=8188
     ```

6. **Deploy:**
   - Click "Deploy" or "Rent"
   - Wait 2-5 minutes for pod to start

### Option B: Custom Docker Setup

If you need custom ComfyUI configuration:

1. **Select GPU:** A40 or RTX 4090
2. **Container Image:** Use a custom ComfyUI Docker image
3. **Docker Command:**
   ```bash
   python main.py --listen 0.0.0.0 --port 8188
   ```
4. **Expose Port:** 8188

## Step 3: Get Your RunPod Endpoint URL

Once the pod is running:

1. **Find Endpoint URL:**
   - Go to your pod details
   - Look for "Connect" or "Endpoint" section
   - You'll see URLs like:
     - `https://abc123xyz-8188.proxy.runpod.net` (HTTPS proxy - recommended)
     - `http://abc123xyz-8188.direct.runpod.net` (Direct HTTP)
     - `https://your-pod-id.runpod.net:8188` (Alternative format)

2. **Test Connection:**
   - Open the URL in your browser
   - You should see ComfyUI interface or API response
   - Try: `https://your-endpoint/health` or `/system_stats`

3. **Note the URL:**
   - Copy the full URL (including protocol)
   - This is your `COMFYUI_URL`

## Step 4: Configure Backend

1. **Update `.env` file:**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edit `.env`:**
   ```env
   # RunPod ComfyUI URL (replace with your actual endpoint)
   COMFYUI_URL=https://abc123xyz-8188.proxy.runpod.net
   
   # API Key (usually not needed for RunPod, leave empty)
   COMFYUI_API_KEY=
   
   # Test Mode (set to false for real RunPod)
   TEST_MODE=false
   
   # Other settings...
   PORT=8000
   DEBUG=true
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   STORAGE_PATH=storage/uploads
   ```

3. **Test Connection:**
   ```bash
   python test_runpod_connection.py
   ```

## Step 5: Install Required Models (If Needed)

Your ComfyUI pod may need models installed. Check `backend/MODELS_SETUP.md` for required models.

1. **Access ComfyUI Web UI:**
   - Open your RunPod endpoint URL in browser
   - Navigate to ComfyUI interface

2. **Install Models:**
   - Use ComfyUI Manager or manually download models
   - Place in appropriate folders:
     - `models/checkpoints/` - Main models
     - `models/vae/` - VAE models
     - `models/loras/` - LoRA models
     - etc.

3. **Install Custom Nodes:**
   - If your workflow requires custom nodes (Hunyuan3D, PULID, etc.)
   - Install via ComfyUI Manager or git clone

## Step 6: Test Integration

1. **Start Backend:**
   ```bash
   cd backend
   python -m app.main
   ```

2. **Test Health Endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status": "healthy", "comfyui_connected": true}`

3. **Test via API Docs:**
   - Open: http://localhost:8000/docs
   - Test `/api/generate-3d` endpoint with a test image

4. **Test Frontend:**
   ```bash
   npm run dev
   ```
   - Navigate to `/magic-maker`
   - Upload image and generate 3D model

## Step 7: Monitor and Optimize

### Monitor RunPod Dashboard:
- **GPU Usage:** Check GPU utilization
- **Memory:** Monitor VRAM usage
- **Cost:** Track hourly costs
- **Logs:** Check pod logs for errors

### Cost Optimization:
- **Stop Pod When Not Using:** Saves money immediately
- **Use Spot Instances:** If available, cheaper
- **Monitor Usage:** Set up billing alerts

## Troubleshooting

### Connection Issues:

1. **"Connection refused" or timeout:**
   - Check if pod is running (not stopped/paused)
   - Verify port 8188 is exposed
   - Try different endpoint URL format

2. **"Health check failed":**
   - ComfyUI might not be fully started (wait 1-2 minutes)
   - Check pod logs for ComfyUI errors
   - Verify ComfyUI is listening on 0.0.0.0:8188

3. **"Workflow error" or "Model not found":**
   - Install required models (see MODELS_SETUP.md)
   - Check workflow JSON files
   - Verify custom nodes are installed

4. **CORS errors:**
   - Update CORS_ORIGINS in backend .env
   - Add your frontend URL

### Performance Issues:

1. **Slow generation:**
   - Check GPU utilization in RunPod dashboard
   - Verify you're using GPU (not CPU)
   - Reduce workflow complexity for testing

2. **Out of memory:**
   - A40 has 48GB VRAM, should be enough
   - Check if other processes using GPU
   - Reduce batch size or image resolution

## Quick Reference

### RunPod URLs:
- **Dashboard:** https://www.runpod.io/console
- **Pods:** https://www.runpod.io/console/pods
- **Billing:** https://www.runpod.io/console/user/billing

### Important URLs:
- **ComfyUI API:** `https://your-endpoint/prompt`
- **Health Check:** `https://your-endpoint/system_stats`
- **Queue:** `https://your-endpoint/queue`

### Cost Estimates:
- **A40:** $0.20/hour = ~$144/month (24/7)
- **RTX 4090:** $0.50/hour = ~$360/month (24/7)
- **1-hour test:** $0.20-$0.50

## Next Steps

After successful setup:
1. Test with a simple image
2. Monitor generation time
3. Optimize workflow settings
4. Set up automatic pod start/stop (optional)
5. Consider persistent storage for models

## Support

- **RunPod Docs:** https://docs.runpod.io
- **RunPod Discord:** Community support
- **ComfyUI Docs:** https://github.com/comfyanonymous/ComfyUI

