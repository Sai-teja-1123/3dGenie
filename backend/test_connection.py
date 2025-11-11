"""Simple script to test ComfyUI connection and workflow loading"""
import os
import sys
from pathlib import Path

# Fix Windows encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from app.services.comfyui import ComfyUIClient
from app.services.workflow import WorkflowManager

# Load environment variables
load_dotenv()


def test_comfyui_connection():
    """Test if ComfyUI is reachable"""
    print("=" * 50)
    print("Testing ComfyUI Connection")
    print("=" * 50)
    
    comfyui_url = os.getenv("COMFYUI_URL", "http://localhost:8188")
    api_key = os.getenv("COMFYUI_API_KEY")
    
    print(f"ComfyUI URL: {comfyui_url}")
    print(f"API Key: {'Set' if api_key else 'Not set'}")
    print()
    
    try:
        client = ComfyUIClient(comfyui_url, api_key)
        
        if client.health_check():
            print("[OK] ComfyUI is reachable!")
            
            # Test queue endpoint
            try:
                queue = client.get_queue()
                print(f"[OK] Queue endpoint working. Current queue length: {len(queue.get('queue_pending', []))}")
            except Exception as e:
                print(f"[WARN] Queue endpoint issue: {e}")
            
            return True
        else:
            print("[FAIL] ComfyUI is not responding to health check")
            return False
            
    except Exception as e:
        print(f"[FAIL] Failed to connect to ComfyUI: {e}")
        print(f"   Make sure ComfyUI is running at {comfyui_url}")
        return False


def test_workflow_loading():
    """Test if workflows can be loaded"""
    print("\n" + "=" * 50)
    print("Testing Workflow Loading")
    print("=" * 50)
    
    workflow_manager = WorkflowManager()
    
    workflows_to_test = [
        "flux-image-model.json",
        "3DModel-Flow.json"
    ]
    
    all_ok = True
    
    for workflow_name in workflows_to_test:
        try:
            workflow = workflow_manager.load_workflow(workflow_name)
            
            # Count nodes
            nodes = workflow.get("nodes", [])
            if isinstance(nodes, dict):
                node_count = len(nodes)
            else:
                node_count = len(nodes)
            
            print(f"[OK] {workflow_name}: Loaded successfully ({node_count} nodes)")
            
            # Check for key nodes
            if "flux" in workflow_name.lower():
                # Check for image workflow nodes
                nodes_dict = nodes if isinstance(nodes, dict) else {n["id"]: n for n in nodes}
                has_load_image = any(n.get("type") == "LoadImage" for n in nodes_dict.values())
                has_ksampler = any(n.get("type") == "KSampler" for n in nodes_dict.values())
                
                print(f"   - LoadImage node: {'[OK]' if has_load_image else '[FAIL]'}")
                print(f"   - KSampler node: {'[OK]' if has_ksampler else '[FAIL]'}")
            
            elif "3d" in workflow_name.lower():
                # Check for 3D workflow nodes
                nodes_dict = nodes if isinstance(nodes, dict) else {n["id"]: n for n in nodes}
                has_load_image = any(n.get("type") == "LoadImage" for n in nodes_dict.values())
                has_hy3d = any("Hy3D" in n.get("type", "") for n in nodes_dict.values())
                
                print(f"   - LoadImage node: {'[OK]' if has_load_image else '[FAIL]'}")
                print(f"   - Hy3D nodes: {'[OK]' if has_hy3d else '[FAIL]'}")
            
        except FileNotFoundError as e:
            print(f"[FAIL] {workflow_name}: Not found - {e}")
            all_ok = False
        except Exception as e:
            print(f"[FAIL] {workflow_name}: Error loading - {e}")
            all_ok = False
    
    return all_ok


def test_workflow_injection():
    """Test workflow parameter injection"""
    print("\n" + "=" * 50)
    print("Testing Workflow Parameter Injection")
    print("=" * 50)
    
    workflow_manager = WorkflowManager()
    
    try:
        # Test image workflow injection
        workflow = workflow_manager.load_workflow("flux-image-model.json")
        
        # Create a dummy workflow for testing
        test_workflow = workflow_manager.inject_image_params(
            workflow.copy(),
            "test_image.jpg",
            "test prompt",
            "test negative prompt",
            steps=25,
            guidance=4.0,
            seed=12345
        )
        
        print("[OK] Image workflow injection test passed")
        
        # Test 3D workflow injection
        workflow_3d = workflow_manager.load_workflow("3DModel-Flow.json")
        
        test_workflow_3d = workflow_manager.inject_3d_params(
            workflow_3d.copy(),
            "test_image.jpg",
            steps=60,
            seed=67890
        )
        
        print("[OK] 3D workflow injection test passed")
        
        return True
        
    except Exception as e:
        print(f"[FAIL] Workflow injection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 50)
    print("AI Forge Backend - Connection & Workflow Tests")
    print("=" * 50)
    print()
    
    results = {
        "ComfyUI Connection": test_comfyui_connection(),
        "Workflow Loading": test_workflow_loading(),
        "Workflow Injection": test_workflow_injection(),
    }
    
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    
    for test_name, result in results.items():
        status = "[PASSED]" if result else "[FAILED]"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 50)
    if all_passed:
        print("[SUCCESS] All tests passed! Ready to use the API.")
    else:
        print("[WARNING] Some tests failed. Please check the errors above.")
    print("=" * 50)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

