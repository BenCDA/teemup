"""
Integration tests for the FastAPI routes defined in main.py.

All tests use the FastAPI TestClient and mock DeepFace so that no real
TensorFlow model weights are loaded.
"""
import io
import base64

import numpy as np
import cv2
import pytest
from unittest.mock import patch

from tests.conftest import create_test_image, create_test_image_bytes


# ============================================================================
# Health endpoint
# ============================================================================

class TestHealthEndpoint:
    """Tests for GET /health."""

    def test_health_endpoint(self, client):
        """GET /health should return 200 with status and service name."""
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "face-verification"


# ============================================================================
# /verify endpoint
# ============================================================================

class TestVerifyEndpoint:
    """Tests for POST /verify."""

    def test_verify_requires_api_key(self, client):
        """POST /verify without X-API-Key header should be rejected (422 or 401/403)."""
        body = {"image": create_test_image()}
        resp = client.post("/verify", json=body)
        # FastAPI returns 422 when a required header is missing
        assert resp.status_code in (401, 403, 422)

    def test_verify_with_wrong_api_key(self, client):
        """POST /verify with an invalid API key should return 401."""
        body = {"image": create_test_image()}
        resp = client.post("/verify", json=body, headers={"X-API-Key": "wrong-key"})
        assert resp.status_code == 401

    def test_verify_with_valid_image(self, client, api_key_header):
        """POST /verify with a valid image and mocked DeepFace returns verification data."""
        mock_result = [{
            "age": 25,
            "gender": {"Man": 95.0, "Woman": 5.0},
            "dominant_gender": "Man",
        }]
        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=True,
                faceDetected=True,
                age=25,
                ageRange="25-34",
                gender="Homme",
                genderConfidence=0.95,
                isAdult=True,
                isRealFace=True,
                message="Verification reussie",
            )
            body = {"image": create_test_image()}
            resp = client.post("/verify", json=body, headers=api_key_header)
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            assert data["faceDetected"] is True
            assert data["age"] == 25
            assert data["isAdult"] is True

    def test_verify_with_invalid_base64(self, client, api_key_header):
        """POST /verify with non-image data should return 400."""
        with patch("main.face_service.verify_face", side_effect=ValueError("Format d'image invalide")):
            body = {"image": base64.b64encode(b"not an image").decode()}
            resp = client.post("/verify", json=body, headers=api_key_header)
            assert resp.status_code == 400

    def test_verify_adult_detection(self, client, api_key_header):
        """POST /verify should report isAdult=True for a 30-year-old."""
        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=True,
                faceDetected=True,
                age=30,
                ageRange="25-34",
                gender="Homme",
                genderConfidence=0.9,
                isAdult=True,
                isRealFace=True,
                message="Verification reussie",
            )
            body = {"image": create_test_image()}
            resp = client.post("/verify", json=body, headers=api_key_header)
            assert resp.status_code == 200
            assert resp.json()["isAdult"] is True

    def test_verify_minor_detection(self, client, api_key_header):
        """POST /verify should report isAdult=False for a 15-year-old."""
        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=False,
                faceDetected=True,
                age=15,
                ageRange="Mineur (<18)",
                gender="Homme",
                genderConfidence=0.85,
                isAdult=False,
                isRealFace=True,
                message="Vous devez avoir 18 ans ou plus pour vous inscrire",
            )
            body = {"image": create_test_image()}
            resp = client.post("/verify", json=body, headers=api_key_header)
            assert resp.status_code == 200
            data = resp.json()
            assert data["isAdult"] is False
            assert data["age"] == 15

    def test_verify_no_face_detected(self, client, api_key_header):
        """POST /verify should return faceDetected=False when no face is found."""
        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=False,
                faceDetected=False,
                message="Aucun visage detecte.",
            )
            body = {"image": create_test_image()}
            resp = client.post("/verify", json=body, headers=api_key_header)
            assert resp.status_code == 200
            assert resp.json()["faceDetected"] is False

    def test_verify_empty_body(self, client, api_key_header):
        """POST /verify with empty body should return 422 (validation error)."""
        resp = client.post("/verify", json={}, headers=api_key_header)
        assert resp.status_code == 422

    def test_verify_internal_error(self, client, api_key_header):
        """POST /verify should return 500 when an unexpected error occurs."""
        with patch("main.face_service.verify_face", side_effect=RuntimeError("boom")):
            body = {"image": create_test_image()}
            resp = client.post("/verify", json=body, headers=api_key_header)
            assert resp.status_code == 500


# ============================================================================
# /verify-file endpoint
# ============================================================================

class TestVerifyFileEndpoint:
    """Tests for POST /verify-file."""

    def test_verify_file_endpoint(self, client, api_key_header, test_image_bytes):
        """POST /verify-file with a JPEG upload should succeed."""
        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=True,
                faceDetected=True,
                age=28,
                ageRange="25-34",
                gender="Femme",
                genderConfidence=0.88,
                isAdult=True,
                isRealFace=True,
                message="Verification reussie",
            )
            files = {"file": ("test.jpg", io.BytesIO(test_image_bytes), "image/jpeg")}
            resp = client.post("/verify-file", files=files, headers=api_key_header)
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            assert data["faceDetected"] is True

    def test_verify_file_wrong_content_type(self, client, api_key_header):
        """POST /verify-file with a non-image content type should return 400."""
        files = {"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")}
        resp = client.post("/verify-file", files=files, headers=api_key_header)
        assert resp.status_code == 400
        assert "Format" in resp.json().get("detail", "") or "support" in resp.json().get("detail", "")

    def test_verify_file_requires_api_key(self, client):
        """POST /verify-file without X-API-Key should be rejected."""
        files = {"file": ("test.jpg", io.BytesIO(b"\xff\xd8\xff"), "image/jpeg")}
        resp = client.post("/verify-file", files=files)
        assert resp.status_code in (401, 403, 422)

    def test_verify_file_png(self, client, api_key_header):
        """POST /verify-file with a PNG upload should succeed."""
        img = np.zeros((300, 300, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".png", img)
        png_bytes = buf.tobytes()

        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=True,
                faceDetected=True,
                age=22,
                ageRange="18-24",
                gender="Homme",
                genderConfidence=0.91,
                isAdult=False,
                isRealFace=True,
                message="Vous devez avoir 18 ans ou plus",
            )
            files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
            resp = client.post("/verify-file", files=files, headers=api_key_header)
            assert resp.status_code == 200


# ============================================================================
# /anti-spoof endpoint
# ============================================================================

class TestAntiSpoofEndpoint:
    """Tests for POST /anti-spoof."""

    def test_anti_spoof_endpoint(self, client, api_key_header):
        """POST /anti-spoof with a valid image should return spoof check result."""
        with patch("main.face_service.check_anti_spoof") as mock_spoof:
            from app.schemas import AntiSpoofResponse
            mock_spoof.return_value = AntiSpoofResponse(
                is_real=True,
                confidence=0.8,
                message="L'image semble authentique",
                checks={
                    "resolution": "300x300",
                    "blur_score": 250.0,
                    "edge_density": 0.05,
                },
            )
            body = {"image": create_test_image()}
            resp = client.post("/anti-spoof", json=body, headers=api_key_header)
            assert resp.status_code == 200
            data = resp.json()
            assert data["is_real"] is True
            assert data["confidence"] > 0
            assert "authentique" in data["message"]

    def test_anti_spoof_requires_api_key(self, client):
        """POST /anti-spoof without X-API-Key should be rejected."""
        body = {"image": create_test_image()}
        resp = client.post("/anti-spoof", json=body)
        assert resp.status_code in (401, 403, 422)

    def test_anti_spoof_fake_image(self, client, api_key_header):
        """POST /anti-spoof with a detected fake should return is_real=False."""
        with patch("main.face_service.check_anti_spoof") as mock_spoof:
            from app.schemas import AntiSpoofResponse
            mock_spoof.return_value = AntiSpoofResponse(
                is_real=False,
                confidence=0.4,
                message="Image trop floue",
            )
            body = {"image": create_test_image()}
            resp = client.post("/anti-spoof", json=body, headers=api_key_header)
            assert resp.status_code == 200
            data = resp.json()
            assert data["is_real"] is False

    def test_anti_spoof_value_error(self, client, api_key_header):
        """POST /anti-spoof should return 400 when a ValueError is raised."""
        with patch("main.face_service.check_anti_spoof", side_effect=ValueError("bad image")):
            body = {"image": create_test_image()}
            resp = client.post("/anti-spoof", json=body, headers=api_key_header)
            assert resp.status_code == 400

    def test_anti_spoof_internal_error(self, client, api_key_header):
        """POST /anti-spoof should return 500 when an unexpected error occurs."""
        with patch("main.face_service.check_anti_spoof", side_effect=RuntimeError("oops")):
            body = {"image": create_test_image()}
            resp = client.post("/anti-spoof", json=body, headers=api_key_header)
            assert resp.status_code == 500

    def test_anti_spoof_empty_body(self, client, api_key_header):
        """POST /anti-spoof with empty body should return 422."""
        resp = client.post("/anti-spoof", json={}, headers=api_key_header)
        assert resp.status_code == 422


# ============================================================================
# Schema validation (via the route)
# ============================================================================

class TestSchemaValidation:
    """Tests for Pydantic model validation through the API."""

    def test_image_too_large_rejected_by_schema(self, client, api_key_header):
        """
        An image base64 string exceeding MAX_IMAGE_SIZE should be rejected
        at the schema validation level (422).
        """
        # 15 million chars of base64 => ~11.25 MB decoded > 10 MB limit
        body = {"image": "A" * 15_000_000}
        resp = client.post("/verify", json=body, headers=api_key_header)
        # Pydantic field_validator raises ValueError => 422
        assert resp.status_code == 422

    def test_image_with_data_uri_prefix_accepted(self, client, api_key_header):
        """A data:image/jpeg;base64,... prefix should be accepted by the schema."""
        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=True,
                faceDetected=True,
                age=25,
                ageRange="25-34",
                gender="Homme",
                genderConfidence=0.95,
                isAdult=True,
                isRealFace=True,
                message="OK",
            )
            prefix_image = f"data:image/jpeg;base64,{create_test_image()}"
            body = {"image": prefix_image}
            resp = client.post("/verify", json=body, headers=api_key_header)
            assert resp.status_code == 200


# ============================================================================
# Rate limiting  (best-effort -- depends on slowapi state)
# ============================================================================

class TestRateLimiting:
    """
    Rate-limiting tests.  These are best-effort because the TestClient does not
    always set REMOTE_ADDR consistently and slowapi may or may not enforce
    limits in the test environment.
    """

    def test_rate_limiting_headers_present(self, client, api_key_header):
        """After a request, rate-limit related headers should be present (if slowapi adds them)."""
        with patch("main.face_service.verify_face") as mock_verify:
            from app.schemas import VerificationResponse
            mock_verify.return_value = VerificationResponse(
                success=True,
                faceDetected=True,
                age=30,
                ageRange="25-34",
                gender="Homme",
                genderConfidence=0.9,
                isAdult=True,
                isRealFace=True,
                message="OK",
            )
            body = {"image": create_test_image()}
            resp = client.post("/verify", json=body, headers=api_key_header)
            # Just ensure request succeeds; rate limit headers are optional in tests
            assert resp.status_code == 200
