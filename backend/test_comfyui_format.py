"""Test script to understand ComfyUI API workflow format requirements"""
import requests
import json

COMFYUI_URL = "http://127.0.0.1:8188"

def test_minimal_workflow():
    """Test with a minimal workflow to understand the format"""
    print("=" * 70)
    print("Testing ComfyUI API Workflow Format")
    print("=" * 70)
    
    # Create a minimal workflow - just LoadImage and SaveImage
    minimal_workflow = {
        "1": {
            "inputs": {
                "image": "test_upload.jpg"
            },
            "class_type": "LoadImage",
            "_meta": {
                "title": "Load Image"
            }
        },
        "2": {
            "inputs": {
                "images": ["1", 0],
                "filename_prefix": "ComfyUI"
            },
            "class_type": "SaveImage",
            "_meta": {
                "title": "Save Image"
            }
        }
    }
    
    print("\nTesting minimal workflow format...")
    print(f"Workflow structure: {json.dumps(minimal_workflow, indent=2)}")
    
    try:
        response = requests.post(
            f"{COMFYUI_URL}/prompt",
            json={"prompt": minimal_workflow, "client_id": "test"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n[SUCCESS] Workflow accepted!")
            print(f"Prompt ID: {result.get('prompt_id')}")
            return True
        else:
            print(f"\n[FAIL] Workflow rejected")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] {e}")
        return False


def test_get_workflow_format():
    """Get an example workflow from ComfyUI to see the format"""
    print("\n" + "=" * 70)
    print("Getting Example Workflow Format from ComfyUI")
    print("=" * 70)
    
    try:
        # Try to get object info to understand node structure
        response = requests.get(f"{COMFYUI_URL}/object_info", timeout=10)
        if response.status_code == 200:
            obj_info = response.json()
            print("\n[OK] Got object info")
            print(f"Available node types (first 10): {list(obj_info.keys())[:10]}")
            
            # Check LoadImage structure
            if "LoadImage" in obj_info:
                print(f"\nLoadImage node info:")
                print(json.dumps(obj_info["LoadImage"], indent=2)[:500])
        
        # Try to get a simple prompt example
        print("\n" + "-" * 70)
        print("Testing with actual workflow from file...")
        
        # Load our workflow and check its structure
        from pathlib import Path
        workflow_path = Path(__file__).parent / "workflows" / "flux-image-model.json"
        
        if workflow_path.exists():
            with open(workflow_path, 'r') as f:
                workflow = json.load(f)
            
            # Check first node structure
            nodes = workflow.get("nodes", [])
            if nodes:
                first_node = nodes[0] if isinstance(nodes, list) else list(nodes.values())[0]
                print(f"\nFirst node from our workflow:")
                print(json.dumps(first_node, indent=2)[:800])
                
                # Check what properties it has
                print(f"\nNode properties: {list(first_node.keys())}")
                print(f"Has 'type': {'type' in first_node}")
                print(f"Has 'class_type': {'class_type' in first_node}")
                
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()


def test_convert_workflow_format():
    """Test converting our workflow format to API format"""
    print("\n" + "=" * 70)
    print("Testing Workflow Format Conversion")
    print("=" * 70)
    
    from pathlib import Path
    from app.services.workflow import WorkflowManager
    
    workflow_manager = WorkflowManager()
    
    try:
        workflow = workflow_manager.load_workflow("flux-image-model.json")
        
        # Check nodes structure
        nodes = workflow.get("nodes", [])
        print(f"\nOriginal workflow has {len(nodes)} nodes")
        print(f"Nodes type: {type(nodes)}")
        
        # Check if nodes need to be converted to dict format for API
        if isinstance(nodes, list):
            print("\nConverting nodes from list to dict format...")
            nodes_dict = {}
            for node in nodes:
                node_id = str(node.get("id"))
                # Ensure class_type exists
                if "class_type" not in node and "type" in node:
                    node["class_type"] = node["type"]
                nodes_dict[node_id] = node
            
            # Create API format workflow
            api_workflow = {}
            for node_id, node in nodes_dict.items():
                api_node = {
                    "class_type": node.get("class_type", node.get("type")),
                    "inputs": {}
                }
                
                # Convert inputs from links
                # This is complex - need to understand link structure
                # For now, just copy widgets_values as inputs
                if "widgets_values" in node:
                    widgets = node.get("widgets_values", [])
                    if widgets:
                        # LoadImage uses first widget as image name
                        if node.get("class_type") == "LoadImage":
                            api_node["inputs"]["image"] = widgets[0] if widgets else ""
                
                api_workflow[node_id] = api_node
            
            print(f"\nConverted workflow has {len(api_workflow)} nodes")
            print(f"Sample converted node:")
            print(json.dumps(list(api_workflow.values())[0], indent=2))
            
            # Test submission
            print("\n" + "-" * 70)
            print("Testing converted workflow submission...")
            response = requests.post(
                f"{COMFYUI_URL}/prompt",
                json={"prompt": api_workflow, "client_id": "test"},
                timeout=10
            )
            
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error: {response.text}")
            else:
                result = response.json()
                print(f"[SUCCESS] Converted workflow accepted! Prompt ID: {result.get('prompt_id')}")
                
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()


def main():
    """Run all format tests"""
    print("\n" + "=" * 70)
    print("ComfyUI API Format Investigation")
    print("=" * 70)
    
    # Test 1: Get example format
    test_get_workflow_format()
    
    # Test 2: Minimal workflow
    print("\n")
    test_minimal_workflow()
    
    # Test 3: Convert our workflow
    print("\n")
    test_convert_workflow_format()
    
    print("\n" + "=" * 70)
    print("Investigation Complete")
    print("=" * 70)


if __name__ == "__main__":
    main()

