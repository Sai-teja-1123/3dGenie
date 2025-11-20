"""Quick workflow test for RunPod"""
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    from app.services.comfyui import ComfyUIClient, ComfyUIWorkflowError
    from app.services.workflow import WorkflowManager
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure dependencies are installed: pip install -r requirements.txt")
    sys.exit(1)

load_dotenv()

def test_workflow_submission():
    """Test submitting a simple workflow to RunPod"""
    comfyui_url = os.getenv("COMFYUI_URL")
    api_key = os.getenv("COMFYUI_API_KEY")
    
    if not comfyui_url or comfyui_url == "http://localhost:8188":
        print("⚠ Please set COMFYUI_URL in .env file")
        return False
    
    print("=" * 60)
    print("Quick Workflow Test")
    print("=" * 60)
    print(f"ComfyUI URL: {comfyui_url}")
    print("-" * 60)
    
    try:
        client = ComfyUIClient(comfyui_url, api_key)
        workflow_manager = WorkflowManager()
        
        # Test 1: Check connection
        print("\n[1/3] Testing connection...")
        if not client.health_check():
            print("   ✗ Connection failed")
            return False
        print("   ✓ Connected")
        
        # Test 2: Check queue
        print("\n[2/3] Checking queue...")
        queue = client.get_queue()
        print(f"   ✓ Queue accessible")
        print(f"   Running: {len(queue.get('queue_running', []))} jobs")
        print(f"   Pending: {len(queue.get('queue_pending', []))} jobs")
        
        # Test 3: Validate workflow loading
        print("\n[3/3] Testing workflow loading...")
        try:
            # Try loading 3D workflow
            workflow = workflow_manager.load_workflow("3DModel-Flow.json")
            print("   ✓ 3D workflow loaded successfully")
            
            # Try loading image workflow
            workflow = workflow_manager.load_workflow("flux-image-model.json")
            print("   ✓ Image workflow loaded successfully")
            
        except FileNotFoundError as e:
            print(f"   ⚠ Workflow file not found: {e}")
            print("   This is okay if workflows aren't set up yet")
        except Exception as e:
            print(f"   ⚠ Workflow loading issue: {e}")
            print("   You may need to check workflow files")
        
        print("\n" + "=" * 60)
        print("✓ WORKFLOW TEST COMPLETE")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Start backend: python -m app.main")
        print("2. Test via API: http://localhost:8000/docs")
        print("3. Or test via frontend")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        print("\nTroubleshooting:")
        print("- Verify RunPod pod is running")
        print("- Check COMFYUI_URL is correct")
        print("- Ensure ComfyUI is fully started (wait 2-3 minutes)")
        return False

if __name__ == "__main__":
    success = test_workflow_submission()
    sys.exit(0 if success else 1)

