"""Validation endpoints to test backend without ComfyUI"""
from fastapi import APIRouter, HTTPException
from pathlib import Path

from app.services.workflow import WorkflowManager
from app.models.schemas import HealthResponse


router = APIRouter(prefix="/api/validate", tags=["validation"])


@router.get("/workflows")
async def validate_workflows():
    """
    Validate that workflow files can be loaded and parsed correctly
    
    This endpoint tests:
    - Workflow files exist
    - JSON is valid
    - Required nodes are present
    """
    workflow_manager = WorkflowManager()
    workflows_to_test = [
        "flux-image-model.json",
        "3DModel-Flow.json"
    ]
    
    results = {}
    all_valid = True
    
    for workflow_name in workflows_to_test:
        try:
            workflow = workflow_manager.load_workflow(workflow_name)
            
            # Count nodes
            nodes = workflow.get("nodes", [])
            if isinstance(nodes, dict):
                node_count = len(nodes)
            else:
                node_count = len(nodes)
            
            # Check for key node types
            nodes_dict = nodes if isinstance(nodes, dict) else {n["id"]: n for n in nodes}
            
            validation = {
                "exists": True,
                "valid_json": True,
                "node_count": node_count,
                "has_load_image": any(n.get("type") == "LoadImage" for n in nodes_dict.values()),
                "has_output": any(n.get("type") in ["SaveImage", "Hy3DExportMesh"] for n in nodes_dict.values())
            }
            
            if "flux" in workflow_name.lower():
                validation["has_ksampler"] = any(n.get("type") == "KSampler" for n in nodes_dict.values())
                validation["has_vae"] = any(n.get("type") in ["VAELoader", "VAEDecode"] for n in nodes_dict.values())
            
            if "3d" in workflow_name.lower():
                validation["has_hy3d"] = any("Hy3D" in n.get("type", "") for n in nodes_dict.values())
            
            results[workflow_name] = {
                "status": "valid",
                "validation": validation
            }
            
        except FileNotFoundError as e:
            results[workflow_name] = {
                "status": "error",
                "error": f"File not found: {str(e)}"
            }
            all_valid = False
        except Exception as e:
            results[workflow_name] = {
                "status": "error",
                "error": str(e)
            }
            all_valid = False
    
    return {
        "all_valid": all_valid,
        "workflows": results
    }


@router.post("/workflow-injection")
async def test_workflow_injection():
    """
    Test that workflow parameter injection works correctly
    
    Tests parameter modification without needing ComfyUI
    """
    workflow_manager = WorkflowManager()
    
    test_results = {}
    
    try:
        # Test image workflow injection
        workflow = workflow_manager.load_workflow("flux-image-model.json")
        
        test_workflow = workflow_manager.inject_image_params(
            workflow.copy(),
            "test_image.jpg",
            "test prompt",
            "test negative prompt",
            steps=25,
            guidance=4.0,
            seed=12345
        )
        
        # Verify injection worked
        nodes = test_workflow.get("nodes", [])
        nodes_dict = nodes if isinstance(nodes, dict) else {n["id"]: n for n in nodes}
        
        injection_valid = False
        for node_id, node in nodes_dict.items():
            if node.get("type") == "LoadImage":
                if len(node.get("widgets_values", [])) > 0:
                    if node["widgets_values"][0] == "test_image.jpg":
                        injection_valid = True
                        break
        
        test_results["image_workflow"] = {
            "status": "success" if injection_valid else "failed",
            "message": "Parameter injection tested"
        }
        
        # Test 3D workflow injection
        workflow_3d = workflow_manager.load_workflow("3DModel-Flow.json")
        
        test_workflow_3d = workflow_manager.inject_3d_params(
            workflow_3d.copy(),
            "test_image.jpg",
            steps=60,
            seed=67890
        )
        
        nodes_3d = test_workflow_3d.get("nodes", [])
        nodes_dict_3d = nodes_3d if isinstance(nodes_3d, dict) else {n["id"]: n for n in nodes_3d}
        
        injection_valid_3d = False
        for node_id, node in nodes_dict_3d.items():
            if node.get("type") == "LoadImage":
                if len(node.get("widgets_values", [])) > 0:
                    if node["widgets_values"][0] == "test_image.jpg":
                        injection_valid_3d = True
                        break
        
        test_results["3d_workflow"] = {
            "status": "success" if injection_valid_3d else "failed",
            "message": "Parameter injection tested"
        }
        
        all_success = injection_valid and injection_valid_3d
        
        return {
            "status": "success" if all_success else "partial",
            "results": test_results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/endpoints")
async def list_endpoints():
    """
    List all available API endpoints and their purposes
    """
    return {
        "generation": {
            "POST /api/generate-image": "Generate image using Flux workflow",
            "POST /api/generate-3d": "Generate 3D model using Hunyuan3D workflow"
        },
        "status": {
            "GET /api/status/{job_id}": "Get job status and progress",
            "GET /api/result/{job_id}": "Get job result URLs",
            "GET /api/result/{job_id}/download/{filename}": "Download result file"
        },
        "validation": {
            "GET /api/validate/workflows": "Validate workflow files",
            "POST /api/validate/workflow-injection": "Test parameter injection",
            "GET /api/validate/endpoints": "List all endpoints"
        },
        "health": {
            "GET /health": "Check service health"
        }
    }


@router.get("/structure")
async def validate_structure():
    """
    Validate backend structure and dependencies
    """
    import os
    from pathlib import Path
    
    checks = {
        "workflows_directory": {
            "exists": Path("workflows").exists(),
            "path": str(Path("workflows").absolute())
        },
        "workflow_files": {
            "flux_image": Path("workflows/flux-image-model.json").exists(),
            "3d_model": Path("workflows/3DModel-Flow.json").exists()
        },
        "environment": {
            "comfyui_url": os.getenv("COMFYUI_URL", "not set"),
            "test_mode": os.getenv("TEST_MODE", "false"),
            "storage_path": os.getenv("STORAGE_PATH", "storage/uploads")
        }
    }
    
    all_ok = (
        checks["workflows_directory"]["exists"] and
        checks["workflow_files"]["flux_image"] and
        checks["workflow_files"]["3d_model"]
    )
    
    return {
        "structure_valid": all_ok,
        "checks": checks
    }

