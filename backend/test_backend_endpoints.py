"""Test script to validate all backend endpoints without ComfyUI"""
import requests
import json
import time
from pathlib import Path


BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("=" * 50)
    print("Testing Health Endpoint")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        response.raise_for_status()
        data = response.json()
        
        print(f"[OK] Health check passed")
        print(f"   Status: {data.get('status')}")
        print(f"   ComfyUI Connected: {data.get('comfyui_connected')}")
        print(f"   Message: {data.get('message')}")
        return True
    except Exception as e:
        print(f"[FAIL] Health check failed: {e}")
        return False


def test_validate_workflows():
    """Test workflow validation endpoint"""
    print("\n" + "=" * 50)
    print("Testing Workflow Validation")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/validate/workflows", timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print(f"[OK] Workflow validation completed")
        print(f"   All Valid: {data.get('all_valid')}")
        
        for workflow_name, result in data.get("workflows", {}).items():
            status = result.get("status")
            if status == "valid":
                validation = result.get("validation", {})
                print(f"\n   {workflow_name}:")
                print(f"     - Node Count: {validation.get('node_count')}")
                print(f"     - Has LoadImage: {validation.get('has_load_image')}")
                print(f"     - Has Output: {validation.get('has_output')}")
            else:
                print(f"\n   {workflow_name}: [ERROR] {result.get('error')}")
        
        return data.get("all_valid", False)
    except Exception as e:
        print(f"[FAIL] Workflow validation failed: {e}")
        return False


def test_workflow_injection():
    """Test parameter injection"""
    print("\n" + "=" * 50)
    print("Testing Parameter Injection")
    print("=" * 50)
    
    try:
        response = requests.post(f"{BASE_URL}/api/validate/workflow-injection", timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print(f"[OK] Injection test completed")
        print(f"   Status: {data.get('status')}")
        
        results = data.get("results", {})
        for workflow_type, result in results.items():
            status = result.get("status")
            symbol = "[OK]" if status == "success" else "[FAIL]"
            print(f"   {symbol} {workflow_type}: {status}")
        
        return data.get("status") == "success"
    except Exception as e:
        print(f"[FAIL] Injection test failed: {e}")
        return False


def test_structure():
    """Test backend structure validation"""
    print("\n" + "=" * 50)
    print("Testing Backend Structure")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/validate/structure", timeout=5)
        response.raise_for_status()
        data = response.json()
        
        print(f"[OK] Structure validation completed")
        print(f"   Structure Valid: {data.get('structure_valid')}")
        
        checks = data.get("checks", {})
        
        print(f"\n   Workflows Directory:")
        print(f"     - Exists: {checks.get('workflows_directory', {}).get('exists')}")
        
        print(f"\n   Workflow Files:")
        files = checks.get("workflow_files", {})
        print(f"     - flux-image-model.json: {files.get('flux_image')}")
        print(f"     - 3DModel-Flow.json: {files.get('3d_model')}")
        
        return data.get("structure_valid", False)
    except Exception as e:
        print(f"[FAIL] Structure validation failed: {e}")
        return False


def test_endpoints_list():
    """Test endpoints listing"""
    print("\n" + "=" * 50)
    print("Testing Endpoints List")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/validate/endpoints", timeout=5)
        response.raise_for_status()
        data = response.json()
        
        print(f"[OK] Endpoints list retrieved")
        
        for category, endpoints in data.items():
            print(f"\n   {category.upper()}:")
            for endpoint, description in endpoints.items():
                print(f"     - {endpoint}")
                print(f"       {description}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Endpoints list failed: {e}")
        return False


def test_generate_endpoint_structure():
    """Test that generation endpoints are accessible (without actually generating)"""
    print("\n" + "=" * 50)
    print("Testing Generation Endpoint Structure")
    print("=" * 50)
    
    # Check if endpoints exist by checking API docs
    try:
        response = requests.get(f"{BASE_URL}/openapi.json", timeout=5)
        response.raise_for_status()
        openapi = response.json()
        
        paths = openapi.get("paths", {})
        
        has_image = "/api/generate-image" in paths
        has_3d = "/api/generate-3d" in paths
        has_status = "/api/status/{job_id}" in paths
        has_result = "/api/result/{job_id}" in paths
        
        print(f"[OK] API structure validated")
        print(f"   POST /api/generate-image: {'[OK]' if has_image else '[MISSING]'}")
        print(f"   POST /api/generate-3d: {'[OK]' if has_3d else '[MISSING]'}")
        print(f"   GET /api/status/{{job_id}}: {'[OK]' if has_status else '[MISSING]'}")
        print(f"   GET /api/result/{{job_id}}: {'[OK]' if has_result else '[MISSING]'}")
        
        return has_image and has_3d and has_status and has_result
    except Exception as e:
        print(f"[FAIL] API structure check failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 50)
    print("Backend API Endpoint Validation Tests")
    print("(Testing without ComfyUI)")
    print("=" * 50)
    print("\nMake sure the backend server is running:")
    print("  cd backend")
    print("  python -m app.main")
    print("\nWaiting 3 seconds...")
    time.sleep(3)
    
    results = {
        "Health Check": test_health(),
        "Structure Validation": test_structure(),
        "Workflow Validation": test_validate_workflows(),
        "Parameter Injection": test_workflow_injection(),
        "Endpoints List": test_endpoints_list(),
        "API Structure": test_generate_endpoint_structure(),
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
        print("[SUCCESS] All endpoint tests passed!")
        print("Backend API structure is correct and ready.")
    else:
        print("[WARNING] Some tests failed.")
        print("Check the errors above.")
    print("=" * 50)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    import sys
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

