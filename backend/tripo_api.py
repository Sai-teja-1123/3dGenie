import requests
import time
from pathlib import Path
from PIL import Image
import io

api_key = "tsk_J2vgzFYGmKzetChU9LeTXGTkKKODAoDmSCMWIKm-KeM"

# Create output directory if it doesn't exist
output_dir = Path("3d_models")
output_dir.mkdir(exist_ok=True)

# Image file path (relative to project root)
image_path = "../ComfyUI_00005_.png"

def resize_image_if_needed(image_path, max_size_mb=10, max_dimension=2048):
    """Resize image if it's too large"""
    img = Image.open(image_path)
    original_size = Path(image_path).stat().st_size / (1024 * 1024)  # Size in MB
    
    # Check if resize is needed
    needs_resize = False
    if original_size > max_size_mb:
        print(f"Image size ({original_size:.2f} MB) exceeds {max_size_mb} MB, resizing...")
        needs_resize = True
    elif max(img.size) > max_dimension:
        print(f"Image dimension ({max(img.size)}) exceeds {max_dimension}, resizing...")
        needs_resize = True
    
    if needs_resize:
        # Calculate new dimensions maintaining aspect ratio
        ratio = min(max_dimension / img.width, max_dimension / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        print(f"Resized to: {new_size}")
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    # Save as JPEG to reduce size
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')
    img.save(img_bytes, format='JPEG', quality=85, optimize=True)
    img_bytes.seek(0)
    return img_bytes

# Step 1: Upload image
upload_url = "https://api.tripo3d.ai/v2/openapi/upload"
upload_headers = {
    "Authorization": f"Bearer {api_key}"
}

print(f"Processing image: {image_path}")
image_file = resize_image_if_needed(image_path)

print("Uploading image to Tripo API...")
files = {
    "file": ("image.jpg", image_file, "image/jpeg")
}
upload_response = requests.post(upload_url, headers=upload_headers, files=files)
print(f"Upload Status Code: {upload_response.status_code}")

if upload_response.status_code != 200:
    print(f"Upload Response Text: {upload_response.text[:500]}")
    print("Upload failed. Please check the image size and API key.")
    exit(1)

try:
    upload_result = upload_response.json()
    print("Upload Response:", upload_result)
except Exception as e:
    print(f"Error parsing JSON: {e}")
    print(f"Response text: {upload_response.text}")
    upload_result = {}

if upload_result.get("code") == 0:
    image_token = upload_result["data"]["image_token"]

    # Step 2: Create 3D Task
    task_url = "https://api.tripo3d.ai/v2/openapi/task"
    task_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    data = {
        "type": "image_to_model",
        "file": {
            "type": "jpg",
            "file_token": image_token
        }
    }

    task_response = requests.post(task_url, headers=task_headers, json=data)
    task_result = task_response.json()
    print("Task Creation Response:", task_result)

    if task_result.get("code") == 0:
        task_id = task_result["data"]["task_id"]

        # Step 3: Poll for task status
        status_url = f"https://api.tripo3d.ai/v2/openapi/task/{task_id}"
        status_headers = {
            "Authorization": f"Bearer {api_key}"
        }

        print("Waiting for model generation...")
        while True:
            status_response = requests.get(status_url, headers=status_headers)
            status_data = status_response.json()

            if status_data.get("data", {}).get("status") == "success":
                print("Model generation successful!")
                result = status_data["data"]["result"]
                
                # Extract the GLB model URL from the result
                if isinstance(result, dict) and "pbr_model" in result:
                    model_url = result["pbr_model"]["url"]
                    print(f"Model URL: {model_url[:100]}...")
                elif isinstance(result, str):
                    model_url = result
                else:
                    print(f"Unexpected result format: {result}")
                    break

                # Step 4: Download the .glb file
                print("Downloading 3D model...")
                model_response = requests.get(model_url)
                model_response.raise_for_status()
                
                output_filename = output_dir / f"ComfyUI_00005_3d_model.glb"
                with open(output_filename, "wb") as f:
                    f.write(model_response.content)
                print(f"Model downloaded and saved as {output_filename}")
                print(f"Full path: {output_filename.absolute()}")
                break

            elif status_data.get("data", {}).get("status") == "failed":
                print("Model generation failed.")
                break
            else:
                print("Still processing... Retrying in 5 seconds.")
                time.sleep(5)

    else:
        print("Task creation failed:", task_result.get("message"))
else:
    print("Image upload failed. Reason:", upload_result.get("message"))

