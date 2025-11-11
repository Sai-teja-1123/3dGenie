"""Workflow loader and parameter injection service"""
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import random


class WorkflowManager:
    """Manages ComfyUI workflow loading and parameter injection"""
    
    def __init__(self, workflows_dir: str = "workflows"):
        """
        Initialize workflow manager
        
        Args:
            workflows_dir: Directory containing workflow JSON files
        """
        self.workflows_dir = Path(workflows_dir)
        if not self.workflows_dir.exists():
            # Try relative to backend directory
            self.workflows_dir = Path(__file__).parent.parent.parent / workflows_dir
    
    def load_workflow(self, workflow_name: str) -> Dict[str, Any]:
        """
        Load workflow from JSON file
        
        Args:
            workflow_name: Name of workflow file (e.g., "flux-image-model.json")
            
        Returns:
            Workflow dictionary
        """
        workflow_path = self.workflows_dir / workflow_name
        
        if not workflow_path.exists():
            raise FileNotFoundError(f"Workflow not found: {workflow_path}")
        
        with open(workflow_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def inject_image_params(
        self, 
        workflow: Dict[str, Any], 
        image_path: str,
        prompt: str,
        negative_prompt: Optional[str] = None,
        steps: int = 20,
        guidance: float = 3.5,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Inject parameters into image generation workflow (flux-image-model.json)
        
        Args:
            workflow: Workflow dictionary
            image_path: Path to input image (relative to ComfyUI input folder)
            prompt: Positive prompt
            negative_prompt: Negative prompt
            steps: Number of inference steps
            guidance: Guidance scale
            seed: Random seed (None for random)
            
        Returns:
            Modified workflow
        """
        nodes = workflow.get("nodes", [])
        
        # Convert nodes list to dict if it's a list
        if isinstance(nodes, list):
            nodes_dict = {node["id"]: node for node in nodes}
            workflow["nodes"] = nodes_dict
        else:
            nodes_dict = nodes
        
        # Find and update LoadImage node (node 18 in flux-image-model.json)
        load_image_node = None
        for node_id, node in nodes_dict.items():
            if node.get("type") == "LoadImage":
                load_image_node = node
                if isinstance(node_id, str):
                    load_image_node["id"] = int(node_id)
                break
        
        if load_image_node:
            # Update image path (widget_values[0] is the image filename)
            if len(load_image_node.get("widgets_values", [])) > 0:
                load_image_node["widgets_values"][0] = image_path
        
        # Find and update CLIPTextEncode nodes
        # Node 6: Positive prompt
        # Node 24: Negative prompt
        for node_id, node in nodes_dict.items():
            if node.get("type") == "CLIPTextEncode":
                node_int_id = int(node_id) if isinstance(node_id, str) else node_id
                
                # Node 6 is positive prompt (based on workflow structure)
                if node_int_id == 6:
                    if len(node.get("widgets_values", [])) > 0:
                        node["widgets_values"][0] = prompt
                
                # Node 24 is negative prompt
                elif node_int_id == 24:
                    if len(node.get("widgets_values", [])) > 0:
                        node["widgets_values"][0] = negative_prompt or "watermark,text"
        
        # Find and update KSampler node (node 22)
        for node_id, node in nodes_dict.items():
            if node.get("type") == "KSampler":
                widgets = node.get("widgets_values", [])
                if len(widgets) >= 6:
                    # widgets: [seed, seed_control, steps, cfg, sampler, scheduler, denoise]
                    widgets[0] = seed if seed is not None else random.randint(1, 2**31)
                    widgets[2] = steps
        
        # Find and update FluxGuidance node (node 23)
        for node_id, node in nodes_dict.items():
            if node.get("type") == "FluxGuidance":
                widgets = node.get("widgets_values", [])
                if len(widgets) > 0:
                    widgets[0] = guidance
        
        return workflow
    
    def inject_3d_params(
        self,
        workflow: Dict[str, Any],
        image_path: str,
        steps: int = 50,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Inject parameters into 3D model generation workflow (3DModel-Flow.json)
        
        Args:
            workflow: Workflow dictionary
            image_path: Path to input image (relative to ComfyUI input folder)
            steps: Number of inference steps
            seed: Random seed (None for random)
            
        Returns:
            Modified workflow
        """
        nodes = workflow.get("nodes", [])
        
        # Convert nodes list to dict if it's a list
        if isinstance(nodes, list):
            nodes_dict = {node["id"]: node for node in nodes}
            workflow["nodes"] = nodes_dict
        else:
            nodes_dict = nodes
        
        # Find LoadImage node (node 13 in 3DModel-Flow.json)
        for node_id, node in nodes_dict.items():
            if node.get("type") == "LoadImage":
                # Update image path
                if len(node.get("widgets_values", [])) > 0:
                    node["widgets_values"][0] = image_path
                break
        
        # Find Hy3DGenerateMesh node and update steps/seed
        for node_id, node in nodes_dict.items():
            if node.get("type") == "Hy3DGenerateMesh":
                widgets = node.get("widgets_values", [])
                if len(widgets) >= 4:
                    # widgets: [guidance_scale, steps, seed, scheduler, force_offload]
                    widgets[1] = steps  # steps
                    if seed is not None:
                        widgets[2] = seed  # seed
                    else:
                        widgets[2] = random.randint(1, 2**31)
        
        # Find Hy3DDelightImage node and update steps
        for node_id, node in nodes_dict.items():
            if node.get("type") == "Hy3DDelightImage":
                widgets = node.get("widgets_values", [])
                if len(widgets) >= 3:
                    widgets[0] = steps  # steps
        
        return workflow
    
    def get_output_nodes(self, workflow: Dict[str, Any]) -> list[Dict[str, Any]]:
        """
        Get output nodes (SaveImage, ExportMesh, etc.) from workflow
        
        Args:
            workflow: Workflow dictionary
            
        Returns:
            List of output nodes
        """
        nodes = workflow.get("nodes", [])
        nodes_dict = nodes if isinstance(nodes, dict) else {n["id"]: n for n in nodes}
        
        output_nodes = []
        output_types = ["SaveImage", "Hy3DExportMesh", "PreviewImage"]
        
        for node_id, node in nodes_dict.items():
            if node.get("type") in output_types:
                output_nodes.append(node)
        
        return output_nodes

