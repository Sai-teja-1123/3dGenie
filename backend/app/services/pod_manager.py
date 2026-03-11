"""Pod manager service for automatic cost optimization"""
import asyncio
import os
import time
import logging
from typing import Optional, Set
from app.services.runpod import RunPodClient, PodStatus

logger = logging.getLogger(__name__)


class PodManager:
    """
    Manages RunPod pod lifecycle automatically to optimize costs.
    
    Features:
    - Automatically starts pod when needed
    - Monitors pod activity
    - Stops pod after idle timeout
    - Tracks active jobs to prevent premature shutdown
    """
    
    def __init__(
        self,
        runpod_client: RunPodClient,
        pod_id: str,
        idle_timeout: int = 300,
        check_interval: int = 60,
        min_uptime: int = 60
    ):
        """
        Initialize pod manager
        
        Args:
            runpod_client: RunPod API client instance
            pod_id: Pod ID to manage
            idle_timeout: Seconds of inactivity before stopping pod (default: 5 minutes)
            check_interval: How often to check pod status in seconds (default: 1 minute)
            min_uptime: Minimum seconds pod must run before auto-stop (default: 1 minute)
        """
        self.runpod = runpod_client
        self.pod_id = pod_id
        self.idle_timeout = idle_timeout
        self.check_interval = check_interval
        self.min_uptime = min_uptime
        
        # Activity tracking
        self.last_activity: Optional[float] = None
        self.pod_start_time: Optional[float] = None
        self.active_job_ids: Set[str] = set()
        self.is_monitoring = False
        self._monitor_task: Optional[asyncio.Task] = None
        
        logger.info(
            f"PodManager initialized for pod {pod_id} "
            f"(idle_timeout={idle_timeout}s, check_interval={check_interval}s)"
        )
    
    def mark_activity(self):
        """Mark that pod is being used (call this when starting a job)"""
        self.last_activity = time.time()
        logger.debug(f"Pod activity marked at {time.strftime('%H:%M:%S', time.localtime(self.last_activity))}")
    
    def register_job(self, job_id: str):
        """Register an active job"""
        self.active_job_ids.add(job_id)
        self.mark_activity()
        logger.debug(f"Job {job_id} registered. Active jobs: {len(self.active_job_ids)}")
    
    def unregister_job(self, job_id: str):
        """Unregister a completed job"""
        if job_id in self.active_job_ids:
            self.active_job_ids.remove(job_id)
            logger.debug(f"Job {job_id} unregistered. Active jobs: {len(self.active_job_ids)}")
    
    def has_active_jobs(self) -> bool:
        """Check if there are any active jobs"""
        return len(self.active_job_ids) > 0
    
    async def ensure_running(self) -> bool:
        """
        Ensure pod is running, start if needed
        
        Returns:
            True if pod is running, False if failed to start
        """
        try:
            if self.runpod.is_pod_running(self.pod_id):
                logger.debug(f"Pod {self.pod_id} is already running")
                self.mark_activity()
                return True
            
            logger.info(f"Pod {self.pod_id} is not running, starting...")
            success = self.runpod.start_pod(self.pod_id, max_wait=300)
            
            if success:
                self.pod_start_time = time.time()
                self.mark_activity()
                logger.info(f"Pod {self.pod_id} started successfully")
            else:
                logger.error(f"Failed to start pod {self.pod_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error ensuring pod is running: {e}")
            return False
    
    async def stop_if_idle(self) -> bool:
        """
        Stop pod if it's idle (no activity for idle_timeout seconds)
        
        Returns:
            True if pod was stopped, False otherwise
        """
        try:
            # Don't stop if there are active jobs
            if self.has_active_jobs():
                logger.debug(f"Pod has {len(self.active_job_ids)} active jobs, not stopping")
                return False
            
            # Don't stop if pod is not running
            if not self.runpod.is_pod_running(self.pod_id):
                return False
            
            # Check minimum uptime
            if self.pod_start_time:
                uptime = time.time() - self.pod_start_time
                if uptime < self.min_uptime:
                    logger.debug(f"Pod uptime ({uptime:.0f}s) less than minimum ({self.min_uptime}s), not stopping")
                    return False
            
            # Check idle timeout
            # If last_activity is None, it means pod was just started by us
            # and we haven't had any activity yet. In this case, don't stop.
            # However, if pod was already running when monitoring started,
            # start_monitoring() should have initialized last_activity.
            if self.last_activity is None:
                # This should only happen if pod was just started by ensure_running()
                # and no jobs have been registered yet. Give it a grace period.
                logger.debug("No activity recorded yet, not stopping (pod may have just started)")
                return False
            
            idle_time = time.time() - self.last_activity
            
            if idle_time >= self.idle_timeout:
                logger.info(
                    f"Pod idle for {idle_time:.0f}s (timeout: {self.idle_timeout}s), stopping to save costs..."
                )
                success = self.runpod.stop_pod(self.pod_id)
                
                if success:
                    self.pod_start_time = None
                    logger.info(f"Pod {self.pod_id} stopped successfully")
                
                return success
            else:
                logger.debug(f"Pod active, {idle_time:.0f}s since last activity (timeout: {self.idle_timeout}s)")
                return False
                
        except Exception as e:
            logger.error(f"Error checking if pod should be stopped: {e}")
            return False
    
    async def monitor_loop(self):
        """
        Background loop to monitor pod status and stop when idle
        
        This runs continuously in the background, checking pod status
        and stopping it when idle to optimize costs.
        """
        logger.info(f"Starting pod monitor for {self.pod_id}")
        
        while self.is_monitoring:
            try:
                await asyncio.sleep(self.check_interval)
                
                # Check and stop if idle
                await self.stop_if_idle()
                
            except asyncio.CancelledError:
                logger.info("Pod monitor loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in pod monitor loop: {e}")
                # Continue monitoring even if there's an error
                await asyncio.sleep(self.check_interval)
        
        logger.info(f"Pod monitor for {self.pod_id} stopped")
    
    def start_monitoring(self):
        """Start the background monitoring task"""
        if not self.is_monitoring:
            self.is_monitoring = True
            
            # Initialize state if pod is already running
            # This handles the case where pod was running before backend started
            try:
                if self.runpod.is_pod_running(self.pod_id):
                    logger.info(f"Pod {self.pod_id} is already running. Initializing monitoring state...")
                    
                    # If no activity recorded yet, set it to allow immediate stop check
                    # (after respecting min_uptime)
                    if self.last_activity is None:
                        # Set last_activity to past time so idle check can trigger
                        # We subtract idle_timeout + 1 to ensure it's past the threshold
                        self.last_activity = time.time() - self.idle_timeout - 1
                        logger.info(
                            f"Pod was already running. Set last_activity to allow idle check "
                            f"(will stop after {self.min_uptime}s minimum uptime if no jobs)"
                        )
                    
                    # If pod_start_time not set, set it to allow min_uptime check
                    # We set it to a time in the past to respect min_uptime immediately
                    if self.pod_start_time is None:
                        self.pod_start_time = time.time() - self.min_uptime - 1
                        logger.info("Set pod_start_time to allow immediate idle check")
            except Exception as e:
                logger.warning(f"Error checking pod status during monitoring start: {e}")
            
            if self._monitor_task is None or self._monitor_task.done():
                self._monitor_task = asyncio.create_task(self.monitor_loop())
                logger.info("Pod monitoring started")
    
    def stop_monitoring(self):
        """Stop the background monitoring task"""
        if self.is_monitoring:
            self.is_monitoring = False
            if self._monitor_task and not self._monitor_task.done():
                self._monitor_task.cancel()
                logger.info("Pod monitoring stopped")
    
    async def shutdown(self):
        """Graceful shutdown - stop monitoring but don't stop pod (let user decide)"""
        self.stop_monitoring()
        logger.info("PodManager shutdown complete")
    
    def get_status(self) -> dict:
        """
        Get current pod manager status
        
        Returns:
            Dictionary with current status information
        """
        pod_status = self.runpod.get_pod_status(self.pod_id)
        idle_time = None
        if self.last_activity:
            idle_time = time.time() - self.last_activity
        
        uptime = None
        if self.pod_start_time:
            uptime = time.time() - self.pod_start_time
        
        return {
            "pod_id": self.pod_id,
            "pod_status": pod_status.value if pod_status else "UNKNOWN",
            "is_monitoring": self.is_monitoring,
            "active_jobs": len(self.active_job_ids),
            "idle_time_seconds": idle_time,
            "uptime_seconds": uptime,
            "last_activity": self.last_activity,
            "idle_timeout": self.idle_timeout
        }

