"""RunPod API client for pod management and cost optimization"""
import os
import time
import logging
import requests
from typing import Optional, Dict, Any, List
from enum import Enum
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class PodStatus(Enum):
    """Pod status enumeration"""
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
    TERMINATED = "TERMINATED"
    STARTING = "STARTING"
    STOPPING = "STOPPING"
    UNKNOWN = "UNKNOWN"


class RunPodError(Exception):
    """Base exception for RunPod errors"""
    pass


class RunPodClient:
    """Client for managing RunPod pods via GraphQL API"""
    
    def __init__(self, api_key: str, timeout: int = 30):
        """
        Initialize RunPod client
        
        Args:
            api_key: RunPod API key (get from https://www.runpod.io/console/user/settings)
            timeout: Request timeout in seconds
        """
        if not api_key:
            raise ValueError("RunPod API key is required")
        
        self.api_key = api_key
        self.base_url = "https://api.runpod.io/graphql"
        self.timeout = timeout
        
        # Create session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        logger.info("RunPod client initialized")
    
    def _execute_query(self, query: str, variables: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Execute a GraphQL query
        
        Args:
            query: GraphQL query string
            variables: Query variables
            
        Returns:
            Response data or None if error
        """
        try:
            response = self.session.post(
                self.base_url,
                json={"query": query, "variables": variables},
                headers=self.headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            
            if "errors" in data:
                error_messages = [err.get("message", str(err)) for err in data["errors"]]
                logger.error(f"RunPod API errors: {error_messages}")
                raise RunPodError(f"API errors: {', '.join(error_messages)}")
            
            return data.get("data")
        except requests.exceptions.RequestException as e:
            logger.error(f"RunPod API request failed: {e}")
            raise RunPodError(f"Request failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in RunPod API call: {e}")
            raise RunPodError(f"Unexpected error: {str(e)}")
    
    def get_pod(self, pod_id: str) -> Optional[Dict[str, Any]]:
        """
        Get pod details and status
        
        Args:
            pod_id: Pod ID to query
            
        Returns:
            Pod information dict or None if not found
        """
        query = """
        query Pod($input: PodQueryInput!) {
            pod(input: $input) {
                id
                name
                desiredStatus
                lastStatus
                runtimeInSeconds
                costPerHr
                machineId
                containerDiskInGb
                volumeInGb
                volumeId
                ports
            }
        }
        """
        
        variables = {"input": {"id": pod_id}}
        
        try:
            data = self._execute_query(query, variables)
            if data:
                return data.get("pod")
            return None
        except RunPodError:
            return None
    
    def get_pod_status(self, pod_id: str) -> PodStatus:
        """
        Get current pod status
        
        Args:
            pod_id: Pod ID to check
            
        Returns:
            PodStatus enum value
        """
        pod = self.get_pod(pod_id)
        if not pod:
            return PodStatus.UNKNOWN
        
        status = pod.get("lastStatus", "").upper()
        try:
            return PodStatus[status]
        except KeyError:
            return PodStatus.UNKNOWN
    
    def is_pod_running(self, pod_id: str) -> bool:
        """
        Check if pod is currently running
        
        Args:
            pod_id: Pod ID to check
            
        Returns:
            True if pod is running, False otherwise
        """
        return self.get_pod_status(pod_id) == PodStatus.RUNNING
    
    def start_pod(self, pod_id: str, max_wait: int = 300) -> bool:
        """
        Start a pod and wait until it's running
        
        Args:
            pod_id: Pod ID to start
            max_wait: Maximum seconds to wait for pod to start
            
        Returns:
            True if pod started successfully, False otherwise
        """
        mutation = """
        mutation PodResume($input: PodResumeInput!) {
            podResume(input: $input) {
                id
                desiredStatus
            }
        }
        """
        
        variables = {"input": {"podId": pod_id}}
        
        try:
            # Start pod
            logger.info(f"Starting RunPod pod {pod_id}...")
            data = self._execute_query(mutation, variables)
            
            if not data or not data.get("podResume"):
                logger.error(f"Failed to start pod {pod_id}: No response data")
                return False
            
            # Wait for pod to be running
            logger.info(f"Waiting for pod {pod_id} to start (max {max_wait}s)...")
            start_time = time.time()
            check_interval = 5  # Check every 5 seconds
            
            while time.time() - start_time < max_wait:
                status = self.get_pod_status(pod_id)
                
                if status == PodStatus.RUNNING:
                    elapsed = time.time() - start_time
                    logger.info(f"Pod {pod_id} is now running (started in {elapsed:.1f}s)")
                    return True
                elif status == PodStatus.TERMINATED:
                    logger.error(f"Pod {pod_id} was terminated")
                    return False
                
                time.sleep(check_interval)
            
            logger.warning(f"Pod {pod_id} did not start within {max_wait}s")
            return False
            
        except RunPodError as e:
            logger.error(f"Failed to start pod {pod_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error starting pod {pod_id}: {e}")
            return False
    
    def stop_pod(self, pod_id: str) -> bool:
        """
        Stop a pod
        
        Args:
            pod_id: Pod ID to stop
            
        Returns:
            True if stop command was successful, False otherwise
        """
        mutation = """
        mutation PodStop($input: PodStopInput!) {
            podStop(input: $input) {
                id
                desiredStatus
            }
        }
        """
        
        variables = {"input": {"podId": pod_id}}
        
        try:
            logger.info(f"Stopping RunPod pod {pod_id}...")
            data = self._execute_query(mutation, variables)
            
            if data and data.get("podStop"):
                logger.info(f"Pod {pod_id} stop command sent successfully")
                return True
            else:
                logger.error(f"Failed to stop pod {pod_id}: No response data")
                return False
                
        except RunPodError as e:
            logger.error(f"Failed to stop pod {pod_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error stopping pod {pod_id}: {e}")
            return False
    
    def get_pod_cost(self, pod_id: str) -> Optional[float]:
        """
        Get current hourly cost of a pod
        
        Args:
            pod_id: Pod ID to check
            
        Returns:
            Hourly cost in USD or None if unavailable
        """
        pod = self.get_pod(pod_id)
        if pod:
            return pod.get("costPerHr")
        return None
    
    def get_pod_volume(self, pod_id: str) -> Optional[Dict[str, Any]]:
        """
        Get volume information from a pod
        
        Args:
            pod_id: Pod ID to check
            
        Returns:
            Dictionary with volume information (id, sizeGb) or None if no volume
        """
        pod = self.get_pod(pod_id)
        if not pod:
            return None
        
        volume_id = pod.get("volumeId")
        volume_size = pod.get("volumeInGb")
        
        if volume_id:
            return {
                "id": volume_id,
                "sizeGb": volume_size,
                "podId": pod_id
            }
        return None
    
    def get_volume(self, volume_id: str) -> Optional[Dict[str, Any]]:
        """
        Get details about a specific volume
        
        Args:
            volume_id: Volume ID to query
            
        Returns:
            Volume information dict or None if not found
        """
        query = """
        query Volume($input: VolumeQueryInput!) {
            volume(input: $input) {
                id
                name
                sizeGb
                type
                podIds
                createdAt
            }
        }
        """
        
        variables = {"input": {"id": volume_id}}
        
        try:
            data = self._execute_query(query, variables)
            if data:
                return data.get("volume")
            return None
        except RunPodError:
            return None
    
    def list_volumes(self) -> List[Dict[str, Any]]:
        """
        List all volumes in your account
        
        Returns:
            List of volume dictionaries, empty list if error or no volumes
        """
        query = """
        query Volumes {
            myself {
                volumes {
                    id
                    name
                    sizeGb
                    type
                    podIds
                    createdAt
                }
            }
        }
        """
        
        try:
            data = self._execute_query(query, {})
            if data and data.get("myself"):
                volumes = data["myself"].get("volumes", [])
                return volumes if volumes else []
            return []
        except RunPodError as e:
            logger.warning(f"Failed to list volumes: {e}")
            return []

