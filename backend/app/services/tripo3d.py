"""Tripo 3D service wrapper for image-to-model generation."""
from __future__ import annotations

import io
import os
import time
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse

import requests
from PIL import Image, ImageOps


class Tripo3DError(Exception):
    """Raised when Tripo API operations fail."""


class Tripo3DService:
    """Client for Tripo open API image-to-3D workflow."""

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("TRIPO_API_KEY is required")

        self.api_key = api_key
        self.api_version = os.getenv("TRIPO_API_VERSION", "2").strip()
        self.base_url = os.getenv(
            "TRIPO_BASE_URL",
            f"https://api.tripo3d.ai/v{self.api_version}/openapi",
        ).rstrip("/")
        self.enable_v2_fallback = os.getenv("TRIPO_ENABLE_V2_FALLBACK", "true").lower() == "true"
        self.max_image_mb = float(os.getenv("TRIPO_MAX_IMAGE_MB", "10"))
        self.max_dimension = int(os.getenv("TRIPO_MAX_DIMENSION", "2048"))
        self.jpeg_quality = int(os.getenv("TRIPO_JPEG_QUALITY", "88"))
        self.request_timeout = int(os.getenv("TRIPO_REQUEST_TIMEOUT_SEC", "180"))
        self.max_retries = int(os.getenv("TRIPO_MAX_RETRIES", "3"))
        self.retry_backoff_sec = float(os.getenv("TRIPO_RETRY_BACKOFF_SEC", "1.0"))
        self.task_version = os.getenv("TRIPO_TASK_VERSION", "").strip()
        self._base_urls = self._build_base_urls()

    @property
    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.api_key}"}

    def _build_base_urls(self) -> list[str]:
        """
        Build ordered base URLs.
        Primary comes from TRIPO_BASE_URL / TRIPO_API_VERSION.
        Optional fallback adds v2 endpoint for compatibility when v3 is unavailable.
        """
        urls: list[str] = [self.base_url]
        v2_default = "https://api.tripo3d.ai/v2/openapi"
        if self.enable_v2_fallback and self.base_url != v2_default:
            urls.append(v2_default)
        return urls

    def _request_with_fallback(self, method: str, path: str, **kwargs) -> requests.Response:
        """
        Call Tripo endpoint with base URL fallback.
        Fallback to next base URL only for 404 (endpoint unavailable).
        """
        last_response: Optional[requests.Response] = None
        last_exc: Optional[Exception] = None

        for base in self._base_urls:
            url = f"{base}{path}"
            response = None
            for attempt in range(1, max(1, self.max_retries) + 1):
                try:
                    response = requests.request(method, url, timeout=self.request_timeout, **kwargs)
                except requests.RequestException as exc:
                    last_exc = exc
                    if attempt < self.max_retries:
                        time.sleep(self.retry_backoff_sec * attempt)
                    continue

                # Retry on transient upstream/API failures.
                if response.status_code in {429, 500, 502, 503, 504} and attempt < self.max_retries:
                    last_response = response
                    time.sleep(self.retry_backoff_sec * attempt)
                    continue
                break

            if response is None:
                continue

            # Endpoint unavailable in this API version -> try next base URL.
            if self._should_try_next_base(response) and base != self._base_urls[-1]:
                last_response = response
                continue
            return response

        if last_exc is not None:
            raise Tripo3DError(f"Tripo request failed: {last_exc}") from last_exc
        if last_response is not None:
            return last_response
        raise Tripo3DError("Tripo request failed without response")

    def _should_try_next_base(self, response: requests.Response) -> bool:
        """
        Decide if we should retry the same request on next base URL.
        We retry on:
        - 404 endpoint unavailable
        - known invalid-parameter error on newer API variants (code 1004)
        """
        if response.status_code == 404:
            return True
        if response.status_code != 400:
            return False
        text = (response.text or "").lower()
        return '"code":1004' in text or "parameter is invalid" in text

    def prepare_image(self, image_bytes: bytes, mime_type: Optional[str] = None) -> Tuple[bytes, str, str]:
        """
        Normalize image for Tripo constraints.
        Returns (bytes, file_type, output_mime).
        """
        if not image_bytes:
            raise Tripo3DError("Input image is empty")

        try:
            img = Image.open(io.BytesIO(image_bytes))
            img = ImageOps.exif_transpose(img)
        except Exception as exc:
            raise Tripo3DError(f"Invalid input image: {exc}") from exc

        # Tripo accepts JPG/PNG; JPG helps keep payload size low and predictable.
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")

        # Keep dimensions within a safe bound for API acceptance and speed.
        max_side = max(img.size)
        if max_side > self.max_dimension:
            ratio = self.max_dimension / max_side
            new_size = (max(1, int(img.width * ratio)), max(1, int(img.height * ratio)))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        max_bytes = int(self.max_image_mb * 1024 * 1024)
        quality = max(55, min(95, self.jpeg_quality))
        output_bytes = self._encode_jpeg(img, quality)

        # If still too large, reduce quality first.
        while len(output_bytes) > max_bytes and quality > 55:
            quality -= 5
            output_bytes = self._encode_jpeg(img, quality)

        # If still too large, progressively downscale and re-encode.
        while len(output_bytes) > max_bytes:
            if min(img.width, img.height) <= 512:
                raise Tripo3DError(
                    f"Image exceeds Tripo upload limit ({self.max_image_mb}MB) even after compression."
                )
            img = img.resize(
                (max(1, int(img.width * 0.85)), max(1, int(img.height * 0.85))),
                Image.Resampling.LANCZOS,
            )
            output_bytes = self._encode_jpeg(img, quality)

        return output_bytes, "jpg", "image/jpeg"

    def _encode_jpeg(self, img: Image.Image, quality: int) -> bytes:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        return buf.getvalue()

    def upload_image(self, image_bytes: bytes, file_name: str = "input.jpg") -> str:
        """Upload image and return Tripo file token."""
        response: Optional[requests.Response] = None
        last_exc: Optional[Exception] = None

        # Important: recreate multipart file object per retry.
        # A consumed stream cannot be reused across fallback attempts.
        for base in self._base_urls:
            url = f"{base}/upload"
            candidate = None
            for attempt in range(1, max(1, self.max_retries) + 1):
                files = {"file": (file_name, io.BytesIO(image_bytes), "image/jpeg")}
                try:
                    candidate = requests.post(url, headers=self._headers, files=files, timeout=self.request_timeout)
                except requests.RequestException as exc:
                    last_exc = exc
                    if attempt < self.max_retries:
                        time.sleep(self.retry_backoff_sec * attempt)
                    continue

                if candidate.status_code in {429, 500, 502, 503, 504} and attempt < self.max_retries:
                    response = candidate
                    time.sleep(self.retry_backoff_sec * attempt)
                    continue
                break

            if candidate is None:
                continue

            if self._should_try_next_base(candidate) and base != self._base_urls[-1]:
                response = candidate
                continue

            response = candidate
            break

        if response is None:
            if last_exc is not None:
                raise Tripo3DError(f"Tripo upload request failed: {last_exc}") from last_exc
            raise Tripo3DError("Tripo upload request failed without response")

        if response.status_code != 200:
            raise Tripo3DError(f"Tripo upload failed ({response.status_code}): {response.text[:1000]}")

        data = response.json()
        if data.get("code") != 0:
            raise Tripo3DError(f"Tripo upload error: {data.get('message', 'unknown error')}")

        token = (data.get("data") or {}).get("image_token")
        if not token:
            raise Tripo3DError("Tripo upload succeeded but image token missing")
        return token

    def create_image_to_model_task(self, file_token: str, file_type: str = "jpg") -> str:
        """Create Tripo image-to-model task and return task id."""
        payload = {
            "type": "image_to_model",
            "file": {
                "type": file_type,
                "file_token": file_token,
            },
        }
        if self.task_version:
            payload["version"] = self.task_version
        headers = {**self._headers, "Content-Type": "application/json"}
        try:
            response = self._request_with_fallback("POST", "/task", headers=headers, json=payload)
        except requests.RequestException as exc:
            raise Tripo3DError(f"Tripo task creation request failed: {exc}") from exc

        if response.status_code != 200:
            raise Tripo3DError(f"Tripo task creation failed ({response.status_code}): {response.text[:1000]}")

        data = response.json()
        if data.get("code") != 0:
            raise Tripo3DError(f"Tripo task creation error: {data.get('message', 'unknown error')}")

        task_id = (data.get("data") or {}).get("task_id")
        if not task_id:
            raise Tripo3DError("Tripo task created but task_id missing")
        return task_id

    def create_task_from_image(self, image_bytes: bytes, mime_type: Optional[str] = None) -> str:
        """Complete flow: normalize -> upload -> create task."""
        prepared, file_type, _ = self.prepare_image(image_bytes, mime_type)
        file_token = self.upload_image(prepared, file_name=f"input.{file_type}")
        return self.create_image_to_model_task(file_token, file_type=file_type)

    def get_task(self, task_id: str) -> dict:
        """Fetch task details from Tripo API."""
        try:
            response = self._request_with_fallback("GET", f"/task/{task_id}", headers=self._headers)
        except requests.RequestException as exc:
            raise Tripo3DError(f"Tripo task status request failed: {exc}") from exc

        if response.status_code != 200:
            raise Tripo3DError(f"Tripo task status failed ({response.status_code}): {response.text[:1000]}")

        data = response.json()
        if data.get("code") != 0:
            raise Tripo3DError(f"Tripo task status error: {data.get('message', 'unknown error')}")

        return data.get("data") or {}

    def extract_model_url(self, task_data: dict) -> Optional[str]:
        """Extract GLB model URL from task result payload."""
        result = task_data.get("result")
        if isinstance(result, str):
            return result
        if not isinstance(result, dict):
            return None

        # Common Tripo shape
        pbr_model = result.get("pbr_model")
        if isinstance(pbr_model, dict) and pbr_model.get("url"):
            return pbr_model["url"]

        # Fallback keys seen in variations
        for key in ("model", "glb", "mesh"):
            value = result.get(key)
            if isinstance(value, dict) and value.get("url"):
                return value["url"]
            if isinstance(value, str):
                return value
        return None

    def download_model(self, model_url: str) -> Tuple[bytes, str]:
        """Download model binary and infer extension."""
        try:
            response = requests.get(model_url, timeout=self.request_timeout)
        except requests.RequestException as exc:
            raise Tripo3DError(f"Tripo model download failed: {exc}") from exc

        if response.status_code != 200:
            raise Tripo3DError(f"Tripo model download failed ({response.status_code})")

        # Infer extension from URL path; default GLB.
        path = urlparse(model_url).path
        ext = Path(path).suffix.lower()
        if ext not in {".glb", ".gltf", ".obj"}:
            ext = ".glb"
        return response.content, ext
