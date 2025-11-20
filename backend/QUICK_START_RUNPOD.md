# Quick Start: RunPod Integration (1 Hour Test)

Fast guide to get your RunPod GPU running and test your project in under 1 hour.

## ⚡ Quick Steps (15 minutes setup + 45 minutes testing)

### 1. Get RunPod GPU (5 minutes)

1. **Sign up:** https://www.runpod.io
2. **Add payment:** Credit card or crypto
3. **Deploy Pod:**
   - Go to "Pods" → "Deploy"
   - Select **A40** GPU ($0.20/hr)
   - Choose "ComfyUI" template
   - Click "Deploy"
   - Wait 2-3 minutes

4. **Get Endpoint URL:**
   - In pod details, find "Connect" section
   - Copy URL like: `https://abc123-8188.proxy.runpod.net`
   - Test in browser (should show ComfyUI or API response)

### 2. Configure Backend (2 minutes)

```bash
cd backend

# Copy and edit .env
cp env.example .env
# Edit .env and set:
# COMFYUI_URL=https://your-runpod-endpoint-url
# TEST_MODE=false
```

Edit `.env`:
```env
COMFYUI_URL=https://your-actual-runpod-url-here
COMFYUI_API_KEY=
TEST_MODE=false
```

### 3. Test Connection (1 minute)

```bash
python test_runpod_connection.py
```

Expected output:
```
✓ ALL CONNECTION TESTS PASSED!
```

### 4. Start Backend (1 minute)

```bash
python -m app.main
```

In another terminal, test:
```bash
curl http://localhost:8000/health
```

Should return: `{"status": "healthy", "comfyui_connected": true}`

### 5. Test Frontend (5 minutes)

```bash
# In project root
npm run dev
```

1. Open http://localhost:5173
2. Go to `/magic-maker`
3. Upload a test image
4. Select a model
5. Click "Create 3D Model"
6. Monitor progress

### 6. Monitor & Verify (30 minutes)

- **Watch generation progress** in frontend
- **Check RunPod dashboard** for GPU usage
- **Monitor backend logs** for any errors
- **Verify results** download correctly

### 7. Stop Pod (1 minute)

**IMPORTANT:** Stop the pod immediately after testing to save costs!

1. Go to RunPod dashboard
2. Find your pod
3. Click "Stop" or "Terminate"
4. Confirm

**Cost:** ~$0.20 for 1 hour test

## 🎯 Testing Checklist

- [ ] RunPod pod deployed and running
- [ ] Backend connects to RunPod (test script passes)
- [ ] Health endpoint returns healthy
- [ ] Frontend can upload images
- [ ] Generation job starts successfully
- [ ] Progress updates work
- [ ] Results download correctly
- [ ] Pod stopped after testing

## ⚠️ Common Issues & Quick Fixes

### "Connection refused"
- Pod might still be starting (wait 2-3 minutes)
- Check pod status in RunPod dashboard
- Verify URL is correct

### "Health check failed"
- ComfyUI might not be ready yet
- Check pod logs in RunPod dashboard
- Try accessing URL directly in browser

### "Model not found" error
- Some models might need to be installed
- Check `backend/MODELS_SETUP.md`
- For quick test, use simpler workflows

### Frontend can't connect
- Check CORS_ORIGINS in backend .env
- Verify backend is running on port 8000
- Check browser console for errors

## 💰 Cost Tracking

- **A40:** $0.20/hour
- **1-hour test:** ~$0.20
- **Monitor in RunPod dashboard** → Billing

## 📝 Notes

- Pods charge per second, so stop immediately when done
- First generation might be slower (model loading)
- Keep RunPod dashboard open to monitor costs
- Take screenshots of any errors for debugging

## 🚀 After Successful Test

1. Document generation times
2. Note any issues encountered
3. Optimize workflow settings
4. Plan for production deployment
5. Consider persistent storage for models

## 📞 Need Help?

- Check `backend/RUNPOD_SETUP.md` for detailed guide
- RunPod docs: https://docs.runpod.io
- Check backend logs for detailed error messages

---

**Ready?** Start with Step 1 and you'll be testing in 15 minutes! 🎉

