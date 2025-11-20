# How to Get RunPod GPU - Step by Step

Visual guide to getting your RunPod A40 GPU in 5 minutes.

## 🎯 Goal
Get a RunPod A40 GPU pod running ComfyUI, ready to connect to your backend.

## ⏱️ Time: 5-10 minutes

---

## Step 1: Sign Up (2 minutes)

1. **Go to RunPod:**
   - Visit: https://www.runpod.io
   - Click "Sign Up" (top right)

2. **Create Account:**
   - Email + Password
   - Or use Google/GitHub login
   - Verify email if required

3. **Add Payment:**
   - Go to: https://www.runpod.io/console/user/billing
   - Add credit card or crypto wallet
   - Minimum: $5-10 for testing

---

## Step 2: Deploy Pod (3 minutes)

### 2.1 Navigate to Pods
1. Go to: https://www.runpod.io/console/pods
2. Click **"Deploy"** or **"Rent"** button

### 2.2 Select GPU
- **Recommended:** **A40** (48GB VRAM, $0.20/hr)
- **Alternative:** RTX 4090 (24GB VRAM, $0.50/hr) for testing
- Click on the GPU card

### 2.3 Choose Template
1. In template search, type: **"ComfyUI"**
2. Select a template:
   - **"ComfyUI Official"** (recommended)
   - Or any ComfyUI template with good ratings
3. Click **"Continue"** or **"Select"**

### 2.4 Configure Pod Settings

**Container Disk:**
- Set to **20-50 GB** (enough for ComfyUI and models)
- Default is usually fine

**Volume Disk (Optional):**
- Skip for 1-hour test
- Use for persistent storage later

**Network Volume (Optional):**
- Skip for now

**Ports:**
- Port **8188** should be auto-configured
- If not, add it manually
- This is ComfyUI's API port

**Environment Variables (Optional):**
- Usually not needed
- Template handles it

### 2.5 Deploy
1. Review settings
2. Click **"Deploy"** or **"Rent"**
3. Wait 2-5 minutes for pod to start

---

## Step 3: Get Endpoint URL (1 minute)

### 3.1 Find Your Pod
1. Go back to: https://www.runpod.io/console/pods
2. Find your running pod in the list
3. Click on it to open details

### 3.2 Get Connection URL
Look for one of these sections:
- **"Connect"** tab
- **"Endpoints"** section
- **"Network"** section

You'll see URLs like:
```
https://abc123xyz-8188.proxy.runpod.net
```
or
```
http://abc123xyz-8188.direct.runpod.net
```

### 3.3 Test the URL
1. Copy the URL
2. Open in browser
3. You should see:
   - ComfyUI web interface, OR
   - API response (JSON), OR
   - "Connection successful" message

**If you see an error:**
- Wait 1-2 more minutes (ComfyUI might still be starting)
- Check pod status (should be "Running")
- Try the alternative URL format

### 3.4 Save the URL
- Copy the full URL (including `https://` or `http://`)
- This is your `COMFYUI_URL`
- You'll need it in the next step

---

## Step 4: Configure Backend (2 minutes)

### 4.1 Update .env File
```bash
cd backend
cp env.example .env
```

### 4.2 Edit .env
Open `.env` and update:
```env
COMFYUI_URL=https://your-actual-runpod-url-here
TEST_MODE=false
```

**Example:**
```env
COMFYUI_URL=https://abc123xyz-8188.proxy.runpod.net
COMFYUI_API_KEY=
TEST_MODE=false
```

### 4.3 Test Connection
```bash
python test_runpod_connection.py
```

**Expected output:**
```
✓ ALL CONNECTION TESTS PASSED!
```

**If it fails:**
- Double-check the URL
- Make sure pod is "Running" (not "Stopped")
- Wait 1-2 minutes if pod just started

---

## ✅ You're Ready!

Your RunPod GPU is now connected and ready to use!

### Next Steps:
1. **Start backend:**
   ```bash
   python -m app.main
   ```

2. **Test health:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

4. **Test generation:**
   - Go to `/magic-maker`
   - Upload image and generate!

---

## 💰 Cost Reminder

- **A40:** $0.20/hour (~$0.003/minute)
- **1-hour test:** ~$0.20
- **Stop pod immediately** after testing to save money!

### How to Stop Pod:
1. Go to RunPod dashboard
2. Find your pod
3. Click **"Stop"** or **"Terminate"**
4. Confirm

---

## 🆘 Troubleshooting

### "Pod not starting"
- Check payment method is valid
- Verify account is verified
- Contact RunPod support

### "Can't find ComfyUI template"
- Search for "comfy" or "comfyui" (case insensitive)
- Try different templates
- Or use custom Docker image

### "Connection refused"
- Pod might still be starting (wait 2-3 minutes)
- Check pod status in dashboard
- Verify port 8188 is exposed

### "Health check failed"
- ComfyUI might not be fully started
- Check pod logs in RunPod dashboard
- Try accessing URL directly in browser

---

## 📚 More Help

- **Detailed Setup:** See `RUNPOD_SETUP.md`
- **Quick Start:** See `QUICK_START_RUNPOD.md`
- **RunPod Docs:** https://docs.runpod.io
- **RunPod Support:** Discord or email

---

**Ready to test?** Follow the steps above and you'll be generating in 10 minutes! 🚀

