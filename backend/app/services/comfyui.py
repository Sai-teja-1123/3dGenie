"""ComfyUI API client service"""
import os
import json
import time
import uuid
import requests
from typing import Optional, Dict, Any
from pathlib import Path


class ComfyUIClient:
    """Client for interacting with ComfyUI API"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        """
        Initialize ComfyUI client
        
        Args:
            base_url: Base URL of ComfyUI instance (e.g., http://localhost:8188)
            api_key: Optional API key for authentication
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({"Authorization": f"Bearer {api_key}"})
    
    def upload_image(self, image_path: str, filename: Optional[str] = None) -> str:
        """
        Upload image to ComfyUI
        
        Args:
            image_path: Local path to image file
            filename: Optional filename for ComfyUI (default: original filename)
            
        Returns:
            Relative path in ComfyUI input folder (e.g., "input/image.jpg")
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        if filename is None:
            filename = os.path.basename(image_path)
        
        url = f"{self.base_url}/upload/image"
        
        with open(image_path, 'rb') as f:
            files = {'image': (filename, f, 'image/jpeg')}
            data = {'overwrite': 'true'}
            
            response = self.session.post(url, files=files, data=data)
            response.raise_for_status()
            
            result = response.json()
            return result.get('name', filename)
    
    def queue_prompt(self, workflow: Dict[str, Any], client_id: Optional[str] = None) -> str:
        """
        Submit workflow to ComfyUI queue
        
        Args:
            workflow: ComfyUI workflow JSON
            client_id: Optional client ID (default: auto-generated UUID)
            
        Returns:
            Prompt ID for tracking
        """
        if client_id is None:
            client_id = str(uuid.uuid4())
        
        url = f"{self.base_url}/prompt"
        
        payload = {
            "prompt": workflow,
            "client_id": client_id
        }
        
        response = self.session.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        prompt_id = result.get('prompt_id')
        
        if not prompt_id:
            raise ValueError("No prompt_id returned from ComfyUI")
        
        return prompt_id
    
    def get_history(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """
        Get execution history for a prompt
        
        Args:
            prompt_id: Prompt ID from queue_prompt
            
        Returns:
            History entry if found, None otherwise
        """
        url = f"{self.base_url}/history/{prompt_id}"
        
        response = self.session.get(url)
        response.raise_for_status()
        
        history = response.json()
        return history.get(prompt_id)
    
    def get_queue(self) -> list:
        """
        Get current queue status
        
        Returns:
            List of queued items
        """
        url = f"{self.base_url}/queue"
        
        response = self.session.get(url)
        response.raise_for_status()
        
        return response.json()
    
    def wait_for_completion(
        self, 
        prompt_id: str, 
        timeout: int = 600, 
        poll_interval: float = 2.0
    ) -> Dict[str, Any]:
        """
        Wait for workflow completion
        
        Args:
            prompt_id: Prompt ID to wait for
            timeout: Maximum wait time in seconds
            poll_interval: Seconds between status checks
            
        Returns:
            Completed history entry
            
        Raises:
            TimeoutError: If workflow doesn't complete within timeout
        """
        start_time = time.time()
        
        while True:
            history = self.get_history(prompt_id)
            
            if history and len(history.get('outputs', {})) > 0:
                return history
            
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Workflow {prompt_id} did not complete within {timeout}s")
            
            time.sleep(poll_interval)
    
    def get_output_files(self, prompt_id: str) -> list[str]:
        """
        Get output files from completed workflow
        
        Args:
            prompt_id: Prompt ID
            
        Returns:
            List of output file paths
        """
        history = self.get_history(prompt_id)
        
        if not history:
            return []
        
        output_files = []
        outputs = history.get('outputs', {})
        
        for node_id, node_output in outputs.items():
            images = node_output.get('images', [])
            for image in images:
                filename = image.get('filename')
                subfolder = image.get('subfolder', '')
                file_type = image.get('type', 'output')
                
                # Construct relative path
                if subfolder:
                    file_path = f"{file_type}/{subfolder}/{filename}"
                else:
                    file_path = f"{file_type}/{filename}"
                
                output_files.append(file_path)
        
        return output_files
    
    def download_file(self, file_path: str, save_path: str) -> str:
        """
        Download file from ComfyUI output
        
        Args:
            file_path: Relative path in ComfyUI (e.g., "output/image.png")
            save_path: Local path to save file
            
        Returns:
            Path to downloaded file
        """
        url = f"{self.base_url}/view"
        params = {"filename": file_path}
        
        response = self.session.get(url, params=params, stream=True)
        response.raise_for_status()
        
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return save_path
    
    def health_check(self) -> bool:
        """
        Check if ComfyUI is accessible
        
        Returns:
            True if accessible, False otherwise
        """
        try:
            url = f"{self.base_url}/system_stats"
            response = self.session.get(url, timeout=5)
            return response.status_code == 200
        except Exception:
            return False

