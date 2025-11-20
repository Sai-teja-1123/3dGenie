"""Test script to get detailed error message from ComfyUI"""
import requests
import json
import os
from pathlib import Path

COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8188")

def test_workflow_submission():
    """Test submitting a workflow to see the exact error"""
    print("=" * 70)
    print("Testing ComfyUI Workflow Submission")
    print("=" * 70)
    
    # Load the 3D workflow
    workflow_path = Path(__file__).parent / "workflows" / "3DModel-Flow.json"
    
    if not workflow_path.exists():
        print(f"ERROR: Workflow file not found: {workflow_path}")
        return
    
    with open(workflow_path, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    print(f"\nLoaded workflow: {workflow_path}")
    print(f"Workflow has {len(workflow.get('nodes', []))} nodes")
    
    # Convert to API format (simplified - just use the workflow as-is for now)
    # The backend should handle conversion, but let's see what ComfyUI says
    
    # Try to submit
    print(f"\nSubmitting workflow to {COMFYUI_URL}/prompt...")
    
    try:
        response = requests.post(
            f"{COMFYUI_URL}/prompt",
            json={
                "prompt": workflow,  # Send UI format directly to see error
                "client_id": "test-error-check"
            },
            timeout=30
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n[SUCCESS] Workflow accepted!")
            print(f"Result: {json.dumps(result, indent=2)}")
        else:
            print(f"\n[ERROR] Workflow rejected with status {response.status_code}")
            print(f"Response Text: {response.text}")
            
            # Try to parse as JSON
            try:
                error_data = response.json()
                print(f"\nError JSON: {json.dumps(error_data, indent=2)}")
                
                # Extract detailed error message
                if 'error' in error_data:
                    error = error_data['error']
                    if isinstance(error, dict):
                        print(f"\nError Type: {error.get('type', 'unknown')}")
                        print(f"Error Message: {error.get('message', 'No message')}")
                        print(f"Error Details: {error.get('details', 'No details')}")
                        if 'node_errors' in error:
                            print(f"\nNode Errors: {json.dumps(error['node_errors'], indent=2)}")
                    else:
                        print(f"Error: {error}")
            except:
                print("Could not parse error as JSON")
                
    except requests.exceptions.ConnectionError:
        print(f"\n[ERROR] Could not connect to ComfyUI at {COMFYUI_URL}")
        print("Make sure ComfyUI is running!")
    except Exception as e:
        print(f"\n[EXCEPTION] {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_workflow_submission()

