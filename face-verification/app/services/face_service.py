"""
Service de vérification faciale.
Contient la logique métier pour l'analyse de visages.
"""
import base64
import logging
import numpy as np
import cv2
from deepface import DeepFace

from datetime import datetime

from app.config import (
    MIN_IMAGE_WIDTH,
    MIN_IMAGE_HEIGHT,
    MIN_BLUR_SCORE,
    MAX_EDGE_DENSITY,
    MIN_AGE,
    MIN_GENDER_CONFIDENCE,
    AGE_ESTIMATION_MARGIN,
    DETECTOR_BACKEND,
    MIN_FACE_CONFIDENCE,
    REQUIRE_ANTI_SPOOF,
)
from app.schemas import VerificationResponse, AntiSpoofResponse

logger = logging.getLogger(__name__)


class FaceVerificationService:
    """Service pour la vérification faciale avec DeepFace."""

    @staticmethod
    def preload_models() -> None:
        """Précharge les modèles DeepFace au démarrage."""
        logger.info("Préchargement des modèles DeepFace...")
        try:
            # Image de test pour forcer le chargement
            test_img = np.zeros((100, 100, 3), dtype=np.uint8)
            test_img[30:70, 30:70] = [255, 200, 150]

            try:
                DeepFace.analyze(
                    img_path=test_img,
                    actions=['age', 'gender'],
                    enforce_detection=False,
                    detector_backend=DETECTOR_BACKEND,
                    silent=True
                )
                logger.info("Modèles DeepFace chargés avec succès!")
            except Exception as e:
                logger.warning(f"Model preloading encountered an issue (will load on first request): {e}")
        except Exception as e:
            logger.error(f"Erreur lors du préchargement: {e}")

    @staticmethod
    def decode_base64_image(image_data: str) -> np.ndarray:
        """Décode une image base64 en numpy array."""
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Validate base64 size before decoding (max 10MB decoded)
        MAX_BASE64_SIZE = 14_000_000  # ~10MB decoded = ~13.3MB base64
        if len(image_data) > MAX_BASE64_SIZE:
            raise ValueError("Image trop volumineuse (max 10 Mo)")

        image_bytes = base64.b64decode(image_data)

        # Validate decoded size
        if len(image_bytes) > 10_000_000:
            raise ValueError("Image trop volumineuse (max 10 Mo)")

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Format d'image invalide")

        # Validate dimensions (max 4096x4096)
        height, width = img.shape[:2]
        if height > 4096 or width > 4096:
            raise ValueError("Dimensions de l'image trop grandes (max 4096x4096)")

        return img

    @staticmethod
    def get_age_range(age: int) -> str:
        """Retourne la tranche d'âge correspondante."""
        if age < 18:
            return "Mineur (<18)"
        elif age < 25:
            return "18-24"
        elif age < 35:
            return "25-34"
        elif age < 45:
            return "35-44"
        elif age < 55:
            return "45-54"
        else:
            return "55+"

    @staticmethod
    def translate_gender(gender: str) -> str:
        """Traduit le genre en français."""
        return "Homme" if gender.lower() == "man" else "Femme"

    def _check_anti_spoof_sync(self, img, face_region: dict = None) -> dict:
        """Internal anti-spoof check that takes a numpy array directly.

        Args:
            img: Image numpy array (BGR)
            face_region: Optional dict with 'x', 'y', 'w', 'h' keys for the detected face region.
                         Used for color variance analysis on the face area specifically.
        """
        try:
            height, width = img.shape[:2]
            if height < 200 or width < 200:
                return {"is_real": False, "confidence": 0, "message": "Résolution trop faible"}

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / (height * width)

            is_sharp = laplacian_var > MIN_BLUR_SCORE
            has_no_moire = edge_density < MAX_EDGE_DENSITY

            # Color variance check: real faces have more color diversity than printed photos or screens
            has_color_diversity = True
            color_std = 0.0
            if face_region is not None:
                try:
                    fx = max(0, face_region.get('x', 0))
                    fy = max(0, face_region.get('y', 0))
                    fw = face_region.get('w', 0)
                    fh = face_region.get('h', 0)
                    face_crop = img[fy:fy + fh, fx:fx + fw]
                    if face_crop.size > 0:
                        # Calculate standard deviation of each color channel in the face region
                        b_std = np.std(face_crop[:, :, 0])
                        g_std = np.std(face_crop[:, :, 1])
                        r_std = np.std(face_crop[:, :, 2])
                        color_std = (b_std + g_std + r_std) / 3.0
                        # Real faces typically have color std > 15; printed/screen images are flatter
                        has_color_diversity = color_std > 15.0
                        logger.info(f"Anti-spoof color variance: b_std={b_std:.1f}, g_std={g_std:.1f}, r_std={r_std:.1f}, avg_std={color_std:.1f}, pass={has_color_diversity}")
                except Exception as color_err:
                    logger.warning(f"Color variance check failed (non-blocking): {color_err}")
                    has_color_diversity = True  # Don't block on error for this sub-check

            is_real = is_sharp and has_no_moire and has_color_diversity

            confidence = min(1.0, laplacian_var / 500) * 0.4 + (1 - edge_density) * 0.3 + min(1.0, color_std / 50.0) * 0.3

            return {
                "is_real": is_real,
                "confidence": round(confidence, 2),
                "message": "Image authentique" if is_real else "Image suspecte détectée"
            }
        except Exception as e:
            logger.error(f"Anti-spoof check error: {e}")
            return {"is_real": False, "confidence": 0, "message": "Erreur lors de la vérification"}

    def verify_face(self, image_data: str, client_ip: str = None) -> VerificationResponse:
        """
        Analyse une image pour détecter l'âge et le genre.

        Args:
            image_data: Image encodée en base64
            client_ip: Adresse IP du client (optionnel, pour logging)

        Returns:
            VerificationResponse avec les résultats de l'analyse
        """
        attempt_time = datetime.utcnow().isoformat()
        try:
            img = self.decode_base64_image(image_data)
            img_height, img_width = img.shape[:2]
            img_area = img_height * img_width

            try:
                result = DeepFace.analyze(
                    img_path=img,
                    actions=['age', 'gender'],
                    detector_backend=DETECTOR_BACKEND,
                    enforce_detection=True,
                    silent=True
                )

                if isinstance(result, list):
                    result = result[0]

                # --- Face detection confidence check ---
                face_region = result.get('region', {})
                face_confidence = face_region.get('confidence', 0) if isinstance(face_region, dict) else 0
                # Some DeepFace versions return confidence at top level
                if face_confidence == 0:
                    face_confidence = result.get('face_confidence', 0)

                if face_confidence > 0 and face_confidence < MIN_FACE_CONFIDENCE:
                    logger.warning(f"Face confidence too low: {face_confidence:.2f} < {MIN_FACE_CONFIDENCE}")
                    self._log_attempt(attempt_time, client_ip, False, 0, "low_face_confidence")
                    return VerificationResponse(
                        success=False,
                        faceDetected=False,
                        message="La détection du visage n'est pas assez fiable. Veuillez prendre une photo plus claire."
                    )

                # --- Face region size check (10%-80% of image area) ---
                face_x = face_region.get('x', 0) if isinstance(face_region, dict) else 0
                face_y = face_region.get('y', 0) if isinstance(face_region, dict) else 0
                face_w = face_region.get('w', 0) if isinstance(face_region, dict) else 0
                face_h = face_region.get('h', 0) if isinstance(face_region, dict) else 0
                face_area = face_w * face_h

                if img_area > 0 and face_area > 0:
                    face_ratio = face_area / img_area
                    if face_ratio < 0.10:
                        logger.warning(f"Face too small: {face_ratio:.2%} of image (min 10%)")
                        self._log_attempt(attempt_time, client_ip, False, 0, "face_too_small")
                        return VerificationResponse(
                            success=False,
                            faceDetected=True,
                            message="Votre visage est trop éloigné. Veuillez vous rapprocher de la caméra."
                        )
                    if face_ratio > 0.80:
                        logger.warning(f"Face too large: {face_ratio:.2%} of image (max 80%)")
                        self._log_attempt(attempt_time, client_ip, False, 0, "face_too_large")
                        return VerificationResponse(
                            success=False,
                            faceDetected=True,
                            message="Votre visage est trop proche ou l'image semble être une capture d'écran zoomée."
                        )

                age = result.get('age', 0)
                gender_data = result.get('gender', {})

                if isinstance(gender_data, dict):
                    dominant_gender = result.get('dominant_gender', 'Unknown')
                    gender_confidence = gender_data.get(dominant_gender, 0) / 100
                else:
                    dominant_gender = str(gender_data)
                    gender_confidence = 0.5

                # Apply confidence check on gender
                if gender_confidence < MIN_GENDER_CONFIDENCE:
                    dominant_gender = 'Unknown'

                gender_fr = self.translate_gender(dominant_gender) if dominant_gender != 'Unknown' else 'Indéterminé'
                age_range = self.get_age_range(age)
                # Apply age estimation margin: must be >= MIN_AGE even with margin of error
                # With margin=5, detected age must be >= 23 to pass (23 - 5 = 18)
                is_adult = (age - AGE_ESTIMATION_MARGIN) >= MIN_AGE

                # Run anti-spoof check on the same image, passing face region for color analysis
                face_region_dict = {'x': face_x, 'y': face_y, 'w': face_w, 'h': face_h}
                anti_spoof_result = self._check_anti_spoof_sync(img, face_region=face_region_dict)
                is_real = anti_spoof_result.get("is_real", False)
                spoof_confidence = anti_spoof_result.get("confidence", 0)

                # If anti-spoof is mandatory and it failed, block the verification
                if REQUIRE_ANTI_SPOOF and not is_real:
                    logger.warning(f"Anti-spoof MANDATORY check failed: is_real={is_real}, confidence={spoof_confidence}")
                    self._log_attempt(attempt_time, client_ip, False, age, "anti_spoof_failed")
                    return VerificationResponse(
                        success=False,
                        faceDetected=True,
                        age=int(age),
                        ageRange=age_range,
                        gender=gender_fr,
                        genderConfidence=round(gender_confidence, 2),
                        isAdult=is_adult,
                        isRealFace=False,
                        message="La photo ne semble pas être authentique. Veuillez prendre une vraie photo de votre visage dans un endroit bien éclairé."
                    )

                # Determine overall success
                success = is_adult and is_real

                logger.info(f"Analyse réussie: age={age} (margin={AGE_ESTIMATION_MARGIN}, min_effective={MIN_AGE + AGE_ESTIMATION_MARGIN}), gender={gender_fr}, confidence={gender_confidence:.2f}, face_confidence={face_confidence:.2f}, adult={is_adult}, is_real={is_real}, spoof_confidence={spoof_confidence}")

                # Log the verification attempt
                result_label = "success" if success else ("minor" if not is_adult else "spoof")
                self._log_attempt(attempt_time, client_ip, success, age, result_label)

                message = "Vérification réussie" if success else "Vous devez avoir 18 ans ou plus pour vous inscrire"
                return VerificationResponse(
                    success=success,
                    faceDetected=True,
                    age=int(age),
                    ageRange=age_range,
                    gender=gender_fr,
                    genderConfidence=round(gender_confidence, 2),
                    isAdult=is_adult,
                    isRealFace=is_real,
                    message=message
                )

            except ValueError as e:
                logger.warning(f"Aucun visage détecté: {str(e)}")
                self._log_attempt(attempt_time, client_ip, False, 0, "no_face")
                return VerificationResponse(
                    success=False,
                    faceDetected=False,
                    message="Aucun visage détecté. Veuillez prendre une photo claire de votre visage."
                )

        except Exception as e:
            logger.error(f"Erreur de vérification: {str(e)}")
            self._log_attempt(attempt_time, client_ip, False, 0, f"error: {str(e)[:100]}")
            raise

    @staticmethod
    def _log_attempt(timestamp: str, client_ip: str, success: bool, age_detected: int, result_label: str):
        """Log every verification attempt for audit purposes."""
        ip_str = client_ip or "unknown"
        logger.info(
            f"VERIFICATION_ATTEMPT | time={timestamp} | ip={ip_str} | "
            f"success={success} | age={age_detected} | result={result_label}"
        )

    def check_anti_spoof(self, image_data: str) -> AntiSpoofResponse:
        """
        Vérifie si l'image est authentique (pas une photo d'écran).

        Args:
            image_data: Image encodée en base64

        Returns:
            AntiSpoofResponse avec le résultat de l'analyse
        """
        try:
            img = self.decode_base64_image(image_data)
            height, width = img.shape[:2]

            # 1. Vérifier la résolution
            if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
                return AntiSpoofResponse(
                    is_real=False,
                    confidence=0.3,
                    message="Résolution trop faible"
                )

            # 2. Vérifier le flou (variance du Laplacien)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            if laplacian_var < MIN_BLUR_SCORE:
                return AntiSpoofResponse(
                    is_real=False,
                    confidence=0.4,
                    message="Image trop floue"
                )

            # 3. Vérifier les patterns moiré (photos d'écran)
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / (width * height)

            if edge_density > MAX_EDGE_DENSITY:
                return AntiSpoofResponse(
                    is_real=False,
                    confidence=0.5,
                    message="Pattern suspect détecté"
                )

            return AntiSpoofResponse(
                is_real=True,
                confidence=0.8,
                message="L'image semble authentique",
                checks={
                    "resolution": f"{width}x{height}",
                    "blur_score": round(laplacian_var, 2),
                    "edge_density": round(edge_density, 4)
                }
            )

        except Exception as e:
            logger.error(f"Erreur anti-spoof: {str(e)}")
            return AntiSpoofResponse(
                is_real=False,
                confidence=0,
                message="Erreur lors de l'analyse. Veuillez réessayer."
            )
