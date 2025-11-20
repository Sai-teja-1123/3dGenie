# RunPod Cost Optimization Guide

This document explains how the automatic cost optimization system works and how to configure it.

## Overview

The backend includes an automatic pod management system that:
- **Automatically starts** RunPod pods when needed
- **Tracks pod activity** based on active jobs
- **Automatically stops** pods after idle timeout to save costs
- **Prevents premature shutdown** when jobs are still running

## How It Works

### 1. Automatic Pod Startup

When a generation request is received:
1. System checks if pod is running
2. If not running, automatically starts the pod
3. Waits for pod to be ready (up to 5 minutes)
4. Registers the job to track activity

### 2. Activity Tracking

The system tracks:
- **Active jobs**: Jobs that are pending or processing
- **Last activity time**: When the last job was started
- **Pod uptime**: How long the pod has been running

### 3. Automatic Pod Shutdown

A background monitor runs every minute to:
1. Check if pod is idle (no activity for `RUNPOD_IDLE_TIMEOUT` seconds)
2. Verify no active jobs are running
3. Ensure minimum uptime has passed
4. Stop the pod to save costs

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Required for cost optimization
RUNPOD_API_KEY=your-api-key-here
RUNPOD_POD_ID=your-pod-id-here

# Optional: Customize behavior
RUNPOD_IDLE_TIMEOUT=300    # Stop after 5 minutes of inactivity (default: 300)
RUNPOD_CHECK_INTERVAL=60    # Check every 60 seconds (default: 60)
RUNPOD_MIN_UPTIME=60       # Minimum 60 seconds before auto-stop (default: 60)
```

### Getting Your RunPod API Key

1. Go to: https://www.runpod.io/console/user/settings
2. Navigate to "API Keys" section
3. Click "Generate New API Key"
4. Copy the key and add to `.env`

### Getting Your Pod ID

1. Go to: https://www.runpod.io/console/pods
2. Click on your pod
3. In the pod details, find the "Pod ID" or look in the URL
4. Copy the ID and add to `.env`

## Cost Savings

### Example Scenarios

**Without Auto-Stop:**
- Pod runs 24/7: $0.20/hr × 24hrs × 30 days = **$144/month**

**With Auto-Stop (2 hours/day usage):**
- Pod runs only when needed: $0.20/hr × 2hrs × 30 days = **$12/month**
- **Savings: $132/month (92% reduction)**

**With Auto-Stop (10 minutes/day usage):**
- Pod runs only when needed: $0.20/hr × 0.17hrs × 30 days = **$1/month**
- **Savings: $143/month (99% reduction)**

### Real-World Example

If you generate 10 models per day, each taking 5 minutes:
- Total usage: 10 × 5 min = 50 minutes/day
- Daily cost: $0.20 × (50/60) = **$0.17/day**
- Monthly cost: **~$5/month**

Without auto-stop, same usage would cost **$144/month**.

## Configuration Options

### `RUNPOD_IDLE_TIMEOUT`

How long to wait (in seconds) before stopping an idle pod.

- **Lower value** (e.g., 180s = 3 min): More aggressive cost savings, but pod may restart more often
- **Higher value** (e.g., 600s = 10 min): Less frequent restarts, but higher costs

**Recommended:** 300 seconds (5 minutes) - good balance

### `RUNPOD_CHECK_INTERVAL`

How often the system checks pod status (in seconds).

- **Lower value** (e.g., 30s): More responsive, but more API calls
- **Higher value** (e.g., 120s): Fewer API calls, but less responsive

**Recommended:** 60 seconds (1 minute) - good balance

### `RUNPOD_MIN_UPTIME`

Minimum time pod must run before auto-stop (in seconds).

Prevents rapid start/stop cycles if multiple requests come in quickly.

**Recommended:** 60 seconds (1 minute) - prevents thrashing

## Monitoring

### Check Pod Status

The system logs pod management activities. Check your logs for:
- `"Starting RunPod pod..."` - Pod is being started
- `"Pod idle for Xs, stopping..."` - Pod is being stopped
- `"Pod has X active jobs, not stopping"` - Pod kept running due to active jobs

### API Endpoint (Future Enhancement)

You can add a status endpoint to check pod manager status:

```python
@router.get("/pod-status")
async def get_pod_status():
    if pod_manager:
        return pod_manager.get_status()
    return {"enabled": False}
```

## Best Practices

1. **Set appropriate idle timeout**: Balance between cost savings and user experience
   - For development: 180-300 seconds (3-5 minutes)
   - For production: 300-600 seconds (5-10 minutes)

2. **Monitor your usage**: Check RunPod dashboard regularly to understand patterns

3. **Adjust based on traffic**: 
   - High traffic: Increase idle timeout
   - Low traffic: Decrease idle timeout

4. **Test thoroughly**: Make sure pod starts reliably before relying on auto-start

5. **Set billing alerts**: Configure RunPod billing alerts to monitor costs

## Troubleshooting

### Pod Not Starting

**Symptoms:** Generation requests fail with connection errors

**Solutions:**
1. Check `RUNPOD_API_KEY` is correct
2. Check `RUNPOD_POD_ID` is correct
3. Verify pod exists in RunPod dashboard
4. Check logs for error messages
5. Manually start pod in RunPod dashboard to test

### Pod Stopping Too Quickly

**Symptoms:** Pod stops while jobs are still running

**Solutions:**
1. Increase `RUNPOD_IDLE_TIMEOUT`
2. Check that jobs are being registered correctly
3. Verify job status updates are working

### Pod Not Stopping

**Symptoms:** Pod stays running even when idle

**Solutions:**
1. Check that monitoring is enabled (check logs)
2. Verify `RUNPOD_IDLE_TIMEOUT` is set correctly
3. Check for active jobs that might be preventing shutdown
4. Manually verify pod status in RunPod dashboard

## Disabling Cost Optimization

To disable automatic pod management:

1. Remove or comment out RunPod environment variables:
   ```env
   # RUNPOD_API_KEY=
   # RUNPOD_POD_ID=
   ```

2. Restart the backend server

The system will continue to work normally, but pods must be started/stopped manually.

## Technical Details

### Architecture

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Generate Route │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────┐
│  Pod Manager    │────▶│  RunPod API  │
│  - ensure_running│     │  - start_pod │
│  - register_job │     │  - stop_pod   │
└─────────────────┘     └──────────────┘
       │
       ▼
┌─────────────────┐
│ Background Loop │
│  - monitor_loop  │
│  - stop_if_idle │
└─────────────────┘
```

### Job Lifecycle

1. **Job Created**: `pod_manager.register_job(job_id)` called
2. **Job Processing**: Job tracked in `active_job_ids` set
3. **Job Completed**: `pod_manager.unregister_job(job_id)` called
4. **Idle Check**: Background monitor checks if pod should stop

### Safety Features

- **Minimum uptime**: Prevents rapid start/stop cycles
- **Active job check**: Never stops pod if jobs are running
- **Graceful shutdown**: Properly cleans up on app shutdown
- **Error handling**: Continues working even if RunPod API fails

## Support

For issues or questions:
1. Check RunPod API documentation: https://docs.runpod.io
2. Review backend logs for error messages
3. Test RunPod API key manually using their GraphQL playground
4. Check RunPod dashboard for pod status

