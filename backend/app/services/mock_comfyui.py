"""Mock ComfyUI client for testing without actual ComfyUI instance"""
import time
import uuid
from typing import Optional, Dict, Any


class MockComfyUIClient:
    """Mock ComfyUI client that simulates responses without needing real ComfyUI"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.mock_jobs: Dict[str, Dict] = {}
    
    def upload_image(self, image_path: str, filename: Optional[str] = None) -> str:
        """Mock image upload - just returns a filename"""
        if filename is None:
            filename = f"uploaded_{uuid.uuid4().hex[:8]}.jpg"
        return filename
    
    def queue_prompt(self, workflow: Dict[str, Any], client_id: Optional[str] = None) -> str:
        """Mock prompt queue - returns a fake prompt_id"""
        prompt_id = str(uuid.uuid4())
        self.mock_jobs[prompt_id] = {
            "workflow": workflow,
            "status": "queued",
            "created_at": time.time()
        }
        return prompt_id
    
    def get_history(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Mock history - returns None (not completed) to simulate processing"""
        if prompt_id in self.mock_jobs:
            job = self.mock_jobs[prompt_id]
            elapsed = time.time() - job["created_at"]
            
            # Simulate completion after 2 seconds
            if elapsed > 2.0 and job["status"] == "queued":
                job["status"] = "completed"
                return {
                    prompt_id: {
                        "outputs": {
                            "9": {  # SaveImage node ID
                                "images": [
                                    {
                                        "filename": "ComfyUI_00001_.png",
                                        "subfolder": "",
                                        "type": "output"
                                    }
                                ]
                            }
                        }
                    }
                }
        
        return None
    
    def get_queue(self) -> list:
        """Mock queue"""
        return {
            "queue_running": [],
            "queue_pending": []
        }
    
    def wait_for_completion(self, prompt_id: str, timeout: int = 600, poll_interval: float = 2.0) -> Dict[str, Any]:
        """Mock wait - simulates waiting"""
        time.sleep(1)  # Simulate processing time
        history = self.get_history(prompt_id)
        if history:
            return history.get(prompt_id, {})
        
        # Return mock completion
        return {
            prompt_id: {
                "outputs": {
                    "9": {
                        "images": [
                            {
                                "filename": "ComfyUI_00001_.png",
                                "subfolder": "",
                                "type": "output"
                            }
                        ]
                    }
                }
            }
        }
    
    def get_output_files(self, prompt_id: str) -> list[str]:
        """Mock output files"""
        history = self.get_history(prompt_id)
        if history:
            outputs = history.get(prompt_id, {}).get("outputs", {})
            files = []
            for node_id, node_output in outputs.items():
                images = node_output.get("images", [])
                for image in images:
                    filename = image.get("filename")
                    subfolder = image.get("subfolder", "")
                    file_type = image.get("type", "output")
                    
                    if subfolder:
                        file_path = f"{file_type}/{subfolder}/{filename}"
                    else:
                        file_path = f"{file_type}/{filename}"
                    
                    files.append(file_path)
            return files
        return ["output/ComfyUI_00001_.png"]  # Mock file
    
    def download_file(self, file_path: str, save_path: str) -> str:
        """Mock download - creates a placeholder file"""
        import os
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Create a small placeholder file
        with open(save_path, 'w') as f:
            f.write("# Mock file - ComfyUI not running\n")
        
        return save_path
    
    def health_check(self) -> bool:
        """Mock health check - always returns True in test mode"""
        return True

