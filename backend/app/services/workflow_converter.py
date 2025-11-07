"""Convert ComfyUI workflow format (UI format) to API format"""
from typing import Dict, Any, List


class WorkflowConverter:
    """Converts ComfyUI UI workflow format to API format"""
    
    @staticmethod
    def convert_to_api_format(workflow: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Convert workflow from UI format (list of nodes) to API format (dict of nodes)
        
        Args:
            workflow: Workflow in UI format (has "nodes" as list and "links" as list)
            
        Returns:
            Workflow in API format (dict where keys are node IDs as strings)
        """
        nodes = workflow.get("nodes", [])
        links = workflow.get("links", [])
        
        if not nodes:
            raise ValueError("Workflow has no nodes")
        
        # Convert nodes list to dict for easier lookup
        nodes_dict = {}
        for node in nodes:
            node_id = str(node.get("id"))
            nodes_dict[node_id] = node
        
        # Build link map: (source_node, source_output) -> [(target_node, target_input), ...]
        link_map = {}
        for link in links:
            source_node = str(link[1])  # link[1] is source node ID
            source_output = link[2]     # link[2] is source output index
            target_node = str(link[3])  # link[3] is target node ID
            target_input = link[4]      # link[4] is target input name
            
            key = (source_node, source_output)
            if key not in link_map:
                link_map[key] = []
            link_map[key].append((target_node, target_input))
        
        # Convert each node to API format
        api_workflow = {}
        
        for node_id, node in nodes_dict.items():
            api_node = {
                "class_type": node.get("class_type") or node.get("type"),
            }
            
            # Build inputs dict
            inputs = {}
            
            # Process widget values (direct inputs)
            widgets_values = node.get("widgets_values", [])
            node_inputs = node.get("inputs", [])
            
            # Map widgets to inputs based on input definitions
            widget_index = 0
            for input_def in node_inputs:
                input_name = input_def.get("name")
                input_type = input_def.get("type")
                link = input_def.get("link")
                
                if link is not None:
                    # This input is connected from another node
                    # Find the link
                    source_node_id = None
                    source_output_index = None
                    
                    for link_item in links:
                        if link_item[3] == int(node_id) and link_item[4] == input_name:
                            source_node_id = str(link_item[1])
                            source_output_index = link_item[2]
                            break
                    
                    if source_node_id is not None:
                        # Connect from another node
                        inputs[input_name] = [source_node_id, source_output_index]
                else:
                    # This is a widget input - use widget value
                    if widget_index < len(widgets_values):
                        widget_value = widgets_values[widget_index]
                        
                        # Handle special cases
                        if input_type == "INT" and isinstance(widget_value, str):
                            # Try to parse as int
                            try:
                                widget_value = int(widget_value)
                            except:
                                pass
                        elif input_type == "FLOAT" and isinstance(widget_value, str):
                            try:
                                widget_value = float(widget_value)
                            except:
                                pass
                        elif input_type == "BOOLEAN":
                            widget_value = bool(widget_value)
                        
                        inputs[input_name] = widget_value
                        widget_index += 1
            
            # Handle nodes that use widgets_values directly (like LoadImage)
            # Some nodes don't have proper input definitions but use widgets_values
            if not inputs and widgets_values:
                class_type = api_node["class_type"]
                
                if class_type == "LoadImage":
                    # LoadImage uses first widget as image name
                    inputs["image"] = widgets_values[0] if widgets_values else ""
                elif class_type == "CLIPTextEncode":
                    # CLIPTextEncode uses first widget as text
                    inputs["text"] = widgets_values[0] if widgets_values else ""
                elif class_type == "KSampler":
                    # KSampler: [seed, seed_control, steps, cfg, sampler, scheduler, denoise]
                    if len(widgets_values) >= 7:
                        inputs["seed"] = widgets_values[0]
                        inputs["steps"] = widgets_values[2]
                        inputs["cfg"] = widgets_values[3]
                        inputs["sampler_name"] = widgets_values[4]
                        inputs["scheduler"] = widgets_values[5]
                        inputs["denoise"] = widgets_values[6]
                elif class_type == "FluxGuidance":
                    # FluxGuidance: [guidance]
                    if len(widgets_values) >= 1:
                        inputs["guidance"] = widgets_values[0]
                elif class_type == "VAELoader":
                    # VAELoader: [vae_name]
                    if len(widgets_values) >= 1:
                        inputs["vae_name"] = widgets_values[0]
                elif class_type == "DualCLIPLoader":
                    # DualCLIPLoader: [clip_name1, clip_name2, type, device]
                    if len(widgets_values) >= 4:
                        inputs["clip_name1"] = widgets_values[0]
                        inputs["clip_name2"] = widgets_values[1]
                        inputs["type"] = widgets_values[2]
                        inputs["device"] = widgets_values[3]
                elif class_type == "UNETLoader":
                    # UNETLoader: [unet_name, weight_dtype]
                    if len(widgets_values) >= 2:
                        inputs["unet_name"] = widgets_values[0]
                        inputs["weight_dtype"] = widgets_values[1]
                elif class_type == "UpscaleModelLoader":
                    # UpscaleModelLoader: [model_name]
                    if len(widgets_values) >= 1:
                        inputs["model_name"] = widgets_values[0]
                elif class_type == "SaveImage":
                    # SaveImage: [filename_prefix]
                    if len(widgets_values) >= 1:
                        inputs["filename_prefix"] = widgets_values[0]
            
            api_node["inputs"] = inputs
            api_workflow[node_id] = api_node
        
        return api_workflow

