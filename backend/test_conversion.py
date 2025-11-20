"""Test workflow conversion and submission"""
import json
import requests
from pathlib import Path
from app.services.workflow_converter import WorkflowConverter

COMFYUI_URL = "http://localhost:8188"

# Load workflow
workflow_path = Path("workflows/3DModel-Flow.json")
with open(workflow_path, 'r', encoding='utf-8') as f:
    workflow = json.load(f)

print("Original workflow format:")
print(f"  Has 'nodes' as list: {isinstance(workflow.get('nodes'), list)}")
print(f"  Number of nodes: {len(workflow.get('nodes', []))}")

# Convert to API format
print("\nConverting to API format...")
api_workflow = WorkflowConverter.convert_to_api_format(workflow)

print(f"Converted workflow:")
print(f"  Type: {type(api_workflow)}")
print(f"  Number of nodes: {len(api_workflow)}")
print(f"  Sample node keys: {list(api_workflow.keys())[:5]}")

# Check a sample node
sample_node_id = list(api_workflow.keys())[0]
sample_node = api_workflow[sample_node_id]
print(f"\nSample node ({sample_node_id}):")
print(f"  class_type: {sample_node.get('class_type')}")
print(f"  has inputs: {'inputs' in sample_node}")

# Test submission
print("\n\nSubmitting converted workflow to ComfyUI...")
try:
    response = requests.post(
        f"{COMFYUI_URL}/prompt",
        json={
            "prompt": api_workflow,
            "client_id": "test-conversion"
        },
        timeout=30
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("SUCCESS! Workflow accepted.")
        print(f"Response: {response.json()}")
    else:
        print(f"ERROR: {response.text}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            pass
except Exception as e:
    print(f"Exception: {e}")

