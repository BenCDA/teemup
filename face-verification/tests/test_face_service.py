"""
Unit tests for app.services.face_service.FaceVerificationService.

All DeepFace calls are mocked so that TensorFlow / large model weights are
never loaded during the test run.
"""
import base64

import cv2
import numpy as np
import pytest
from unittest.mock import patch

from app.services.face_service import FaceVerificationService

# Re-use helpers from conftest (they are plain functions, not fixtures)
from tests.conftest import (
    create_test_image,
    create_test_image_with_prefix,
    create_blurry_image,
    create_high_edge_image,
)


# ============================================================================
# decode_base64_image
# ============================================================================

class TestDecodeBase64Image:
    """Tests for FaceVerificationService.decode_base64_image."""

    def test_decode_base64_image_valid(self, face_service, valid_base64_image):
        """A valid base64-encoded JPEG should decode into a 3-channel numpy array."""
        img = face_service.decode_base64_image(valid_base64_image)
        assert isinstance(img, np.ndarray)
        assert img.ndim == 3
        assert img.shape[2] == 3  # BGR channels
        assert img.shape[0] == 300 and img.shape[1] == 300

    def test_decode_base64_image_with_prefix(self, face_service, valid_base64_image_with_prefix):
        """A data-URI prefixed base64 string should be handled transparently."""
        img = face_service.decode_base64_image(valid_base64_image_with_prefix)
        assert isinstance(img, np.ndarray)
        assert img.ndim == 3

    def test_decode_base64_image_too_large(self, face_service, too_large_base64_image):
        """An image exceeding the size limit should raise ValueError."""
        with pytest.raises(ValueError, match="trop volumineuse"):
            face_service.decode_base64_image(too_large_base64_image)

    def test_decode_base64_image_invalid(self, face_service, invalid_base64_image):
        """Non-image base64 data should raise ValueError with 'invalide'."""
        with pytest.raises(ValueError, match="invalide"):
            face_service.decode_base64_image(invalid_base64_image)

    def test_decode_base64_image_too_large_dimensions(self, face_service):
        """An image wider/taller than 4096 px should raise ValueError."""
        # Create a very wide image (5000 x 100) -- still small in bytes
        img = np.zeros((100, 5000, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".jpg", img)
        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        with pytest.raises(ValueError, match="Dimensions.*trop grandes"):
            face_service.decode_base64_image(b64)

    def test_decode_base64_image_too_large_height(self, face_service):
        """An image taller than 4096 px should also raise ValueError."""
        img = np.zeros((5000, 100, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".jpg", img)
        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        with pytest.raises(ValueError, match="Dimensions.*trop grandes"):
            face_service.decode_base64_image(b64)


# ============================================================================
# get_age_range
# ============================================================================

class TestGetAgeRange:
    """Tests for all age range buckets."""

    @pytest.mark.parametrize(
        "age, expected",
        [
            (5, "Mineur (<18)"),
            (12, "Mineur (<18)"),
            (17, "Mineur (<18)"),
            (18, "18-24"),
            (20, "18-24"),
            (24, "18-24"),
            (25, "25-34"),
            (30, "25-34"),
            (34, "25-34"),
            (35, "35-44"),
            (40, "35-44"),
            (44, "35-44"),
            (45, "45-54"),
            (50, "45-54"),
            (54, "45-54"),
            (55, "55+"),
            (70, "55+"),
            (99, "55+"),
        ],
    )
    def test_get_age_range(self, face_service, age, expected):
        assert face_service.get_age_range(age) == expected


# ============================================================================
# translate_gender
# ============================================================================

class TestTranslateGender:
    """Tests for gender translation to French."""

    def test_translate_gender_man(self, face_service):
        assert face_service.translate_gender("Man") == "Homme"

    def test_translate_gender_man_lowercase(self, face_service):
        assert face_service.translate_gender("man") == "Homme"

    def test_translate_gender_woman(self, face_service):
        assert face_service.translate_gender("Woman") == "Femme"

    def test_translate_gender_woman_lowercase(self, face_service):
        assert face_service.translate_gender("woman") == "Femme"

    def test_translate_gender_other(self, face_service):
        """Any value that is not 'man' (case-insensitive) maps to 'Femme'."""
        assert face_service.translate_gender("Unknown") == "Femme"
        assert face_service.translate_gender("other") == "Femme"


# ============================================================================
# verify_face  (DeepFace is always mocked)
# ============================================================================

class TestVerifyFace:
    """Tests for FaceVerificationService.verify_face with mocked DeepFace."""

    def test_verify_face_adult(self, face_service, valid_base64_image, mock_deepface_adult):
        """A 25-year-old should be detected as adult (25 - 3 = 22 >= 18)."""
        resp = face_service.verify_face(valid_base64_image)
        assert resp.success is True
        assert resp.faceDetected is True
        assert resp.age == 25
        assert resp.isAdult is True
        assert resp.gender == "Homme"
        assert resp.ageRange == "25-34"

    def test_verify_face_minor(self, face_service, valid_base64_image, mock_deepface_minor):
        """A 16-year-old should be detected as minor (16 - 3 = 13 < 18)."""
        resp = face_service.verify_face(valid_base64_image)
        assert resp.success is False or resp.isAdult is False
        assert resp.faceDetected is True
        assert resp.age == 16
        assert resp.isAdult is False
        assert resp.ageRange == "Mineur (<18)"

    def test_verify_face_borderline_age(self, face_service, valid_base64_image):
        """Age 20 with margin 3 => 20-3=17 < 18 => NOT adult."""
        mock_result = [{
            "age": 20,
            "gender": {"Man": 90.0, "Woman": 10.0},
            "dominant_gender": "Man",
        }]
        with patch("app.services.face_service.DeepFace.analyze", return_value=mock_result):
            resp = face_service.verify_face(valid_base64_image)
            assert resp.faceDetected is True
            assert resp.age == 20
            assert resp.isAdult is False  # 20 - 3 = 17 < 18

    def test_verify_face_exactly_21(self, face_service, valid_base64_image):
        """Age 21 with margin 3 => 21-3=18 >= 18 => IS adult."""
        mock_result = [{
            "age": 21,
            "gender": {"Woman": 85.0, "Man": 15.0},
            "dominant_gender": "Woman",
        }]
        with patch("app.services.face_service.DeepFace.analyze", return_value=mock_result):
            resp = face_service.verify_face(valid_base64_image)
            assert resp.faceDetected is True
            assert resp.age == 21
            assert resp.isAdult is True  # 21 - 3 = 18 >= 18
            assert resp.gender == "Femme"

    def test_verify_face_no_face_detected(
        self, face_service, valid_base64_image, mock_deepface_no_face
    ):
        """When DeepFace raises ValueError the response should indicate no face."""
        resp = face_service.verify_face(valid_base64_image)
        assert resp.success is False
        assert resp.faceDetected is False
        assert resp.age is None
        assert resp.gender is None

    def test_verify_face_low_gender_confidence(self, face_service, valid_base64_image):
        """When gender confidence is below MIN_GENDER_CONFIDENCE, gender is 'Indetermine'."""
        mock_result = [{
            "age": 30,
            "gender": {"Man": 55.0, "Woman": 45.0},
            "dominant_gender": "Man",
        }]
        with patch("app.services.face_service.DeepFace.analyze", return_value=mock_result):
            resp = face_service.verify_face(valid_base64_image)
            assert resp.faceDetected is True
            # 55/100 = 0.55 < 0.6 threshold => gender should be Indetermine
            assert resp.gender == "Indetermine" or resp.gender == "Indetermine\u0301" or "Ind" in resp.gender

    def test_verify_face_result_not_list(self, face_service, valid_base64_image):
        """DeepFace sometimes returns a dict rather than a list."""
        mock_result = {
            "age": 28,
            "gender": {"Man": 90.0, "Woman": 10.0},
            "dominant_gender": "Man",
        }
        with patch("app.services.face_service.DeepFace.analyze", return_value=mock_result):
            resp = face_service.verify_face(valid_base64_image)
            assert resp.faceDetected is True
            assert resp.age == 28

    def test_verify_face_message_adult(self, face_service, valid_base64_image, mock_deepface_adult):
        """Adult verification should return the success message."""
        resp = face_service.verify_face(valid_base64_image)
        assert "ussie" in resp.message  # "Verification reussie"

    def test_verify_face_message_minor(self, face_service, valid_base64_image, mock_deepface_minor):
        """Minor verification should return the rejection message."""
        resp = face_service.verify_face(valid_base64_image)
        assert "18 ans" in resp.message


# ============================================================================
# Anti-spoof checks  (_check_anti_spoof_sync & check_anti_spoof)
# ============================================================================

class TestAntiSpoof:
    """Tests for anti-spoof logic."""

    def test_anti_spoof_real_image(self, face_service):
        """
        A sharp image with moderate edge density should pass all checks.
        We create an image with some high-frequency detail to ensure the
        Laplacian variance exceeds MIN_BLUR_SCORE (100).
        """
        # Create a sharp image with natural-looking variation
        img = np.random.randint(0, 256, (300, 300, 3), dtype=np.uint8)
        # Ensure edges are not too dense by smoothing a bit
        img = cv2.GaussianBlur(img, (3, 3), 1)
        _, buf = cv2.imencode(".jpg", img)
        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        resp = face_service.check_anti_spoof(b64)
        # The random noise image should have high Laplacian variance
        assert resp.is_real is True
        assert resp.confidence > 0
        assert "authentique" in resp.message

    def test_anti_spoof_blurry_image(self, face_service, blurry_base64_image):
        """A very blurry image should fail the Laplacian variance check."""
        resp = face_service.check_anti_spoof(blurry_base64_image)
        assert resp.is_real is False
        assert "floue" in resp.message.lower() or "suspecte" in resp.message.lower() or "faible" in resp.message.lower()

    def test_anti_spoof_screen_capture(self, face_service, high_edge_base64_image):
        """An image with very high edge density should be flagged as screen capture."""
        resp = face_service.check_anti_spoof(high_edge_base64_image)
        assert resp.is_real is False

    def test_anti_spoof_too_small(self, face_service):
        """An image below MIN_IMAGE_WIDTH/HEIGHT should fail with resolution error."""
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".jpg", img)
        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        resp = face_service.check_anti_spoof(b64)
        assert resp.is_real is False
        assert "solution" in resp.message.lower() or "faible" in resp.message.lower()

    def test_anti_spoof_real_returns_checks(self, face_service):
        """When an image passes, the response should include quality checks dict."""
        img = np.random.randint(0, 256, (300, 300, 3), dtype=np.uint8)
        img = cv2.GaussianBlur(img, (3, 3), 1)
        _, buf = cv2.imencode(".jpg", img)
        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        resp = face_service.check_anti_spoof(b64)
        if resp.is_real:
            assert resp.checks is not None
            assert "resolution" in resp.checks
            assert "blur_score" in resp.checks
            assert "edge_density" in resp.checks

    def test_internal_anti_spoof_sync_small_image(self, face_service):
        """_check_anti_spoof_sync with a tiny image returns is_real=False."""
        img = np.zeros((50, 50, 3), dtype=np.uint8)
        result = face_service._check_anti_spoof_sync(img)
        assert result["is_real"] is False
        assert "solution" in result["message"].lower() or "faible" in result["message"].lower()


# ============================================================================
# preload_models (just verify it doesn't crash when DeepFace is mocked)
# ============================================================================

class TestPreloadModels:
    """Verify preload_models handles errors gracefully."""

    def test_preload_models_success(self, face_service):
        """preload_models should not raise even if DeepFace.analyze fails."""
        with patch("app.services.face_service.DeepFace.analyze", side_effect=Exception("no GPU")):
            # Should not raise
            face_service.preload_models()

    def test_preload_models_happy_path(self, face_service):
        """preload_models calls DeepFace.analyze once."""
        with patch("app.services.face_service.DeepFace.analyze") as mock_analyze:
            face_service.preload_models()
            mock_analyze.assert_called_once()
