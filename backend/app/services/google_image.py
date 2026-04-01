"""Google Gemini image generation service."""
import base64
import os
from typing import Optional, Tuple

import requests


class GoogleImageGenerationError(Exception):
    """Raised when Google image generation fails."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class GoogleImageService:
    """Wrapper for Gemini image generation with image + text prompt."""

    def __init__(self, api_key: str, model: Optional[str] = None):
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is required")
        self.api_key = api_key
        self.model = model or os.getenv("GOOGLE_IMAGE_MODEL", "gemini-2.5-flash-image-preview")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    def generate_image_from_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str,
        negative_prompt: Optional[str] = None
    ) -> Tuple[bytes, str]:
        """
        Generate an image using uploaded image + prompt.

        Returns:
            Tuple of (image_bytes, output_mime_type)
        """
        if not image_bytes:
            raise GoogleImageGenerationError("Input image is empty")

        full_prompt = prompt.strip() if prompt else "Generate a stylized character image."
        if negative_prompt and negative_prompt.strip():
            full_prompt = f"{full_prompt}\n\nAvoid: {negative_prompt.strip()}"

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": full_prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type or "image/jpeg",
                                "data": image_b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"]
            }
        }

        try:
            response = requests.post(url, json=payload, timeout=120)
        except requests.RequestException as exc:
            raise GoogleImageGenerationError(f"Google API request failed: {exc}") from exc

        if response.status_code != 200:
            detail = response.text[:1000]
            raise GoogleImageGenerationError(
                f"Google API error {response.status_code}: {detail}",
                status_code=response.status_code
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise GoogleImageGenerationError("Invalid JSON response from Google API") from exc

        candidates = data.get("candidates", [])
        for candidate in candidates:
            content = candidate.get("content", {})
            parts = content.get("parts", [])
            for part in parts:
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and inline.get("data"):
                    out_mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                    try:
                        output_bytes = base64.b64decode(inline["data"])
                        return output_bytes, out_mime
                    except Exception as exc:
                        raise GoogleImageGenerationError("Failed to decode generated image data") from exc

        raise GoogleImageGenerationError(
            "Google API returned no image output. Try a different prompt or model."
        )

