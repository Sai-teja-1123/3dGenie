"""BytePlus Seedream image generation service (I2I)."""
import base64
import os
from typing import Optional, Tuple

import requests


class BytePlusImageGenerationError(Exception):
    """Raised when BytePlus image generation fails."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class BytePlusImageService:
    """Wrapper for BytePlus Seedream image-to-image generation."""

    def __init__(self, api_key: str, model: Optional[str] = None):
        if not api_key:
            raise ValueError("BYTEPLUS_API_KEY is required")

        self.api_key = api_key
        self.model = model or os.getenv("BYTEPLUS_MODEL", "seedream-4-0")
        # Doc sample host uses ark.ap-southeast.bytepluses.com
        self.base_url = os.getenv("BYTEPLUS_BASE_URL", "https://ark.ap-southeast.bytepluses.com")
        self.width = int(os.getenv("BYTEPLUS_IMAGE_WIDTH", "2560"))
        self.height = int(os.getenv("BYTEPLUS_IMAGE_HEIGHT", "1440"))
        self.use_watermark = os.getenv("BYTEPLUS_WATERMARK", "true").lower() == "true"
        raw_candidates = os.getenv(
            "BYTEPLUS_MODEL_CANDIDATES",
            "seedream-4-5,seedream-4-0,seedream-3-0-t2i"
        )
        candidates = [m.strip() for m in raw_candidates.split(",") if m.strip()]
        self.model_candidates = [self.model] + [m for m in candidates if m != self.model]

    def generate_image_from_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str,
        negative_prompt: Optional[str] = None
    ) -> Tuple[bytes, str]:
        """
        Generate image from image + text prompt using BytePlus Seedream I2I.

        Returns:
            Tuple of (image_bytes, output_mime_type)
        """
        if not image_bytes:
            raise BytePlusImageGenerationError("Input image is empty")

        full_prompt = prompt.strip() if prompt else "Generate a stylized character image."
        if negative_prompt and negative_prompt.strip():
            full_prompt = f"{full_prompt}\n\nAvoid: {negative_prompt.strip()}"

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{mime_type or 'image/jpeg'};base64,{image_b64}"

        candidate_base_urls = [self.base_url]
        # DNS-safe fallback if user has old/incorrect region host in env.
        if self.base_url != "https://ark.ap-southeast.bytepluses.com":
            candidate_base_urls.append("https://ark.ap-southeast.bytepluses.com")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "image": data_uri,
            "response_format": "url",
            "stream": False,
            "watermark": self.use_watermark,
            # Minimum documented resolution for max output count from free quota.
            "width": self.width,
            "height": self.height,
        }

        response = None
        last_request_error = None
        last_http_error = None
        # Try configured model first, then fallback models if account/model access differs.
        for model_id in self.model_candidates:
            payload["model"] = model_id
            for base in candidate_base_urls:
                url = f"{base}/api/v3/images/generations"
                try:
                    response = requests.post(url, headers=headers, json=payload, timeout=180)
                except requests.RequestException as exc:
                    last_request_error = exc
                    continue

                if response.status_code == 200:
                    break

                detail = response.text[:1000]
                last_http_error = (response.status_code, detail, model_id)
                # Retry with next model only for model/endpoint not found or forbidden.
                if response.status_code in (403, 404):
                    lower_detail = detail.lower()
                    if any(token in lower_detail for token in ["invalidendpointormodel.notfound", "does not exist", "not found", "no access", "forbidden"]):
                        response = None
                        continue
                # Any other HTTP error should fail fast.
                raise BytePlusImageGenerationError(
                    f"BytePlus API error {response.status_code} (model={model_id}): {detail}",
                    status_code=response.status_code
                )
            if response is not None:
                break

        if response is None:
            if last_http_error:
                status_code, detail, model_id = last_http_error
                raise BytePlusImageGenerationError(
                    f"BytePlus API error {status_code} (model={model_id}): {detail}",
                    status_code=status_code
                )
            raise BytePlusImageGenerationError(f"BytePlus API request failed: {last_request_error}") from last_request_error

        try:
            data = response.json()
        except ValueError as exc:
            raise BytePlusImageGenerationError("Invalid JSON response from BytePlus API") from exc

        image_entries = data.get("data", [])
        if not image_entries:
            raise BytePlusImageGenerationError("BytePlus API returned no image output")

        first = image_entries[0]
        image_url = first.get("url")
        b64_json = first.get("b64_json")

        if b64_json:
            try:
                return base64.b64decode(b64_json), "image/png"
            except Exception as exc:
                raise BytePlusImageGenerationError("Failed to decode BytePlus base64 image") from exc

        if image_url:
            try:
                image_response = requests.get(image_url, timeout=120)
                image_response.raise_for_status()
            except requests.RequestException as exc:
                raise BytePlusImageGenerationError(f"Failed to download BytePlus output image: {exc}") from exc

            out_mime = image_response.headers.get("Content-Type", "image/png").split(";")[0]
            return image_response.content, out_mime

        raise BytePlusImageGenerationError("BytePlus API response missing both url and b64_json")

