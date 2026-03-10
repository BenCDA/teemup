"""
Fixtures partagées pour les tests du service de vérification faciale.
"""
import os
import sys
import base64

# ---------------------------------------------------------------------------
# Mock DeepFace at sys.modules level BEFORE any app code is imported.
# This prevents TensorFlow / RetinaFace from being loaded during test
# collection. The actual DeepFace.analyze calls are patched per-test.
# ---------------------------------------------------------------------------
from unittest.mock import patch, MagicMock  # noqa: E402

_mock_deepface_module = MagicMock()
if "deepface" not in sys.modules:
    sys.modules["deepface"] = _mock_deepface_module
    sys.modules["deepface.DeepFace"] = _mock_deepface_module.DeepFace

import numpy as np
import cv2
import pytest

# ---------------------------------------------------------------------------
# Environment setup -- must happen BEFORE any app imports so that config.py
# does not raise RuntimeError about the missing API_KEY.
# ---------------------------------------------------------------------------
os.environ.setdefault("API_KEY", "test-api-key-12345")

# Ensure project root is on sys.path so that "app.*" imports resolve.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


# ---------------------------------------------------------------------------
# Helpers -- reusable image generators
# ---------------------------------------------------------------------------

def create_test_image(width: int = 300, height: int = 300) -> str:
    """
    Create a small synthetic JPEG image and return it as a raw base64 string
    (no data-URI prefix).
    """
    img = np.zeros((height, width, 3), dtype=np.uint8)
    # Add a skin-coloured rectangle in the centre to mimic a face region
    cy, cx = height // 2, width // 2
    half = min(width, height) // 4
    img[cy - half:cy + half, cx - half:cx + half] = [255, 200, 150]
    _, buffer = cv2.imencode(".jpg", img)
    return base64.b64encode(buffer.tobytes()).decode("utf-8")


def create_test_image_with_prefix(width: int = 300, height: int = 300) -> str:
    """Same as *create_test_image* but with a ``data:image/jpeg;base64,`` prefix."""
    raw = create_test_image(width, height)
    return f"data:image/jpeg;base64,{raw}"


def create_test_image_bytes(width: int = 300, height: int = 300) -> bytes:
    """Return raw JPEG bytes for file-upload tests."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    cy, cx = height // 2, width // 2
    half = min(width, height) // 4
    img[cy - half:cy + half, cx - half:cx + half] = [255, 200, 150]
    _, buffer = cv2.imencode(".jpg", img)
    return buffer.tobytes()


def create_blurry_image(width: int = 300, height: int = 300) -> str:
    """Create a very blurry image that should fail the Laplacian variance check."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    cy, cx = height // 2, width // 2
    half = min(width, height) // 4
    img[cy - half:cy + half, cx - half:cx + half] = [255, 200, 150]
    # Heavy Gaussian blur => low Laplacian variance
    img = cv2.GaussianBlur(img, (51, 51), 30)
    _, buffer = cv2.imencode(".jpg", img)
    return base64.b64encode(buffer.tobytes()).decode("utf-8")


def create_high_edge_image(width: int = 300, height: int = 300) -> str:
    """
    Create an image with extremely high edge density -- simulates a screen
    capture / moire pattern.
    """
    img = np.zeros((height, width, 3), dtype=np.uint8)
    # Alternating black/white rows create maximal edge density
    img[0::2, :] = [255, 255, 255]
    _, buffer = cv2.imencode(".jpg", img)
    return base64.b64encode(buffer.tobytes()).decode("utf-8")


# ---------------------------------------------------------------------------
# Pytest fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_key() -> str:
    """Return the test API key (must match the env var set above)."""
    return os.environ["API_KEY"]


@pytest.fixture
def api_key_header(api_key: str) -> dict:
    """Return a header dict suitable for authenticated requests."""
    return {"X-API-Key": api_key}


@pytest.fixture
def valid_base64_image() -> str:
    """A small valid JPEG encoded as raw base64."""
    return create_test_image()


@pytest.fixture
def valid_base64_image_with_prefix() -> str:
    """A valid base64 image string with the data-URI prefix."""
    return create_test_image_with_prefix()


@pytest.fixture
def invalid_base64_image() -> str:
    """A base64 string that is NOT a valid image (just random ASCII)."""
    return base64.b64encode(b"this is definitely not a jpeg image at all").decode("utf-8")


@pytest.fixture
def too_large_base64_image() -> str:
    """A base64 string that exceeds the 10 MB decoded limit (~14 MB base64)."""
    # 15 million bytes of base64 text => decoded ~11.25 MB which exceeds limit
    return "A" * 15_000_000


@pytest.fixture
def blurry_base64_image() -> str:
    """An image that is intentionally blurry (low Laplacian variance)."""
    return create_blurry_image()


@pytest.fixture
def high_edge_base64_image() -> str:
    """An image with very high edge density (simulated screen capture)."""
    return create_high_edge_image()


@pytest.fixture
def test_image_bytes() -> bytes:
    """Raw JPEG bytes for file-upload tests."""
    return create_test_image_bytes()


@pytest.fixture
def face_service():
    """An instance of FaceVerificationService for unit tests."""
    from app.services.face_service import FaceVerificationService
    return FaceVerificationService()


@pytest.fixture
def mock_deepface_adult():
    """
    Patch DeepFace.analyze to return results for a 25-year-old male with
    high confidence.
    """
    mock_result = [{
        "age": 25,
        "gender": {"Man": 95.0, "Woman": 5.0},
        "dominant_gender": "Man",
    }]
    with patch("app.services.face_service.DeepFace.analyze", return_value=mock_result) as m:
        yield m


@pytest.fixture
def mock_deepface_minor():
    """Patch DeepFace.analyze to return results for a 16-year-old."""
    mock_result = [{
        "age": 16,
        "gender": {"Man": 80.0, "Woman": 20.0},
        "dominant_gender": "Man",
    }]
    with patch("app.services.face_service.DeepFace.analyze", return_value=mock_result) as m:
        yield m


@pytest.fixture
def mock_deepface_no_face():
    """Patch DeepFace.analyze to raise a ValueError (no face detected)."""
    with patch(
        "app.services.face_service.DeepFace.analyze",
        side_effect=ValueError("Face could not be detected"),
    ) as m:
        yield m


# ---------------------------------------------------------------------------
# FastAPI TestClient -- we need to disable the lifespan so that preload_models
# is not called (it would try to import TensorFlow).
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """
    A FastAPI TestClient for route-level integration tests.
    The lifespan is patched out so that DeepFace model preloading is skipped.
    """
    with patch("main.face_service.preload_models"):
        # We need to set models_loaded to True so health endpoint returns "healthy"
        import main as main_module
        main_module.models_loaded = True

        from fastapi.testclient import TestClient
        # Use TestClient without triggering the lifespan by overriding it
        from contextlib import asynccontextmanager

        @asynccontextmanager
        async def noop_lifespan(app):
            yield

        original_lifespan = main_module.app.router.lifespan_context
        main_module.app.router.lifespan_context = noop_lifespan
        try:
            with TestClient(main_module.app) as c:
                yield c
        finally:
            main_module.app.router.lifespan_context = original_lifespan
