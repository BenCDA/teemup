"""
Service de vérification faciale.
Contient la logique métier pour l'analyse de visages.
"""
import base64
import tempfile
import os
import logging
import numpy as np
import cv2
from deepface import DeepFace

from app.config import (
    MIN_IMAGE_WIDTH,
    MIN_IMAGE_HEIGHT,
    MIN_BLUR_SCORE,
    MAX_EDGE_DENSITY,
    MIN_AGE,
    DETECTOR_BACKEND,
)
from app.schemas import VerificationResponse, AntiSpoofResponse

logger = logging.getLogger(__name__)


class FaceVerificationService:
    """Service pour la vérification faciale avec DeepFace."""

    @staticmethod
    async def preload_models() -> None:
        """Précharge les modèles DeepFace au démarrage."""
        logger.info("Préchargement des modèles DeepFace...")
        try:
            # Image de test pour forcer le chargement
            test_img = np.zeros((100, 100, 3), dtype=np.uint8)
            test_img[30:70, 30:70] = [255, 200, 150]

            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                cv2.imwrite(tmp.name, test_img)
                try:
                    DeepFace.analyze(
                        img_path=tmp.name,
                        actions=['age', 'gender'],
                        enforce_detection=False,
                        detector_backend=DETECTOR_BACKEND,
                        silent=True
                    )
                    logger.info("Modèles DeepFace chargés avec succès!")
                except Exception as e:
                    logger.info(f"Modèles initialisés: {e}")
                finally:
                    os.remove(tmp.name)
        except Exception as e:
            logger.error(f"Erreur lors du préchargement: {e}")

    @staticmethod
    def decode_base64_image(image_data: str) -> np.ndarray:
        """Décode une image base64 en numpy array."""
        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Image invalide")

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

    async def verify_face(self, image_data: str) -> VerificationResponse:
        """
        Analyse une image pour détecter l'âge et le genre.

        Args:
            image_data: Image encodée en base64

        Returns:
            VerificationResponse avec les résultats de l'analyse
        """
        try:
            img = self.decode_base64_image(image_data)

            # Sauvegarder temporairement (DeepFace fonctionne mieux avec des fichiers)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                cv2.imwrite(tmp.name, img)
                temp_path = tmp.name

            try:
                result = DeepFace.analyze(
                    img_path=temp_path,
                    actions=['age', 'gender'],
                    enforce_detection=True,
                    detector_backend=DETECTOR_BACKEND,
                    silent=True
                )

                if isinstance(result, list):
                    result = result[0]

                age = result.get('age', 0)
                gender_data = result.get('gender', {})

                if isinstance(gender_data, dict):
                    dominant_gender = result.get('dominant_gender', 'Unknown')
                    gender_confidence = gender_data.get(dominant_gender, 0) / 100
                else:
                    dominant_gender = str(gender_data)
                    gender_confidence = 0.5

                gender_fr = self.translate_gender(dominant_gender)
                age_range = self.get_age_range(age)
                is_adult = age >= MIN_AGE

                logger.info(f"Analyse réussie: age={age}, gender={gender_fr}, adult={is_adult}")

                return VerificationResponse(
                    success=True,
                    faceDetected=True,
                    age=int(age),
                    ageRange=age_range,
                    gender=gender_fr,
                    genderConfidence=round(gender_confidence, 2),
                    isAdult=is_adult,
                    isRealFace=True,
                    message="Vérification réussie" if is_adult else "Vous devez avoir 18 ans ou plus pour vous inscrire"
                )

            except ValueError as e:
                logger.warning(f"Aucun visage détecté: {str(e)}")
                return VerificationResponse(
                    success=False,
                    faceDetected=False,
                    message="Aucun visage détecté. Veuillez prendre une photo claire de votre visage."
                )
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        except Exception as e:
            logger.error(f"Erreur de vérification: {str(e)}")
            raise

    async def check_anti_spoof(self, image_data: str) -> AntiSpoofResponse:
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


# Instance singleton du service
face_service = FaceVerificationService()
