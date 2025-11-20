"""Test RunPod ComfyUI connection"""
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    from app.services.comfyui import ComfyUIClient
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure you're in the backend directory and dependencies are installed:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

# Load environment variables
load_dotenv()

def test_runpod_connection():
    """Test connection to RunPod ComfyUI instance"""
    comfyui_url = os.getenv("COMFYUI_URL", "http://localhost:8188")
    api_key = os.getenv("COMFYUI_API_KEY")
    
    print("=" * 60)
    print("RunPod ComfyUI Connection Test")
    print("=" * 60)
    print(f"Testing connection to: {comfyui_url}")
    print("-" * 60)
    
    if not comfyui_url or comfyui_url == "http://localhost:8188":
        print("⚠ WARNING: COMFYUI_URL not set or using default localhost")
        print("Please set COMFYUI_URL in your .env file with your RunPod endpoint")
        print("\nExample:")
        print("  COMFYUI_URL=https://abc123xyz-8188.proxy.runpod.net")
        return False
    
    try:
        client = ComfyUIClient(comfyui_url, api_key)
        
        # Test health check
        print("\n[1/3] Testing health check...")
        is_healthy = client.health_check()
        if is_healthy:
            print("   ✓ ComfyUI is accessible!")
        else:
            print("   ✗ ComfyUI health check failed")
            print("   This might mean ComfyUI is not running or not accessible")
            return False
        
        # Test system stats
        print("\n[2/3] Testing system stats...")
        stats = client.get_system_stats()
        if stats:
            print("   ✓ System stats retrieved")
            devices = stats.get('devices', [])
            if devices:
                device_info = devices[0]
                print(f"   GPU: {device_info.get('name', 'Unknown')}")
                print(f"   VRAM: {device_info.get('vram_total', 'Unknown')} MB")
            else:
                print("   ⚠ No GPU device info available")
        else:
            print("   ⚠ System stats unavailable (this is okay for some setups)")
        
        # Test queue status
        print("\n[3/3] Testing queue status...")
        queue = client.get_queue()
        print("   ✓ Queue accessible")
        running = len(queue.get('queue_running', []))
        pending = len(queue.get('queue_pending', []))
        print(f"   Running jobs: {running}")
        print(f"   Pending jobs: {pending}")
        
        print("\n" + "=" * 60)
        print("✓ ALL CONNECTION TESTS PASSED!")
        print("=" * 60)
        print("\nYour RunPod ComfyUI instance is ready to use!")
        print("You can now test workflows or start the backend server.")
        return True
        
    except Exception as e:
        print(f"\n✗ Connection test failed: {e}")
        print("\n" + "=" * 60)
        print("TROUBLESHOOTING:")
        print("=" * 60)
        print("1. Check if RunPod pod is running and active")
        print("2. Verify COMFYUI_URL in .env file matches your RunPod endpoint")
        print("3. Check if port 8188 is exposed in RunPod pod settings")
        print("4. Verify network connectivity (try accessing URL in browser)")
        print("5. Check RunPod pod logs for any ComfyUI errors")
        print("\nCommon RunPod URL formats:")
        print("  - https://abc123xyz-8188.proxy.runpod.net")
        print("  - https://your-pod-id.runpod.net:8188")
        print("  - http://your-pod-id-8188.direct.runpod.net")
        return False

if __name__ == "__main__":
    success = test_runpod_connection()
    sys.exit(0 if success else 1)

