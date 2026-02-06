"""
Schémas Pydantic (DTOs) pour l'API de vérification faciale.
"""
from pydantic import BaseModel, field_validator
from app.config import MAX_IMAGE_SIZE


class Base64ImageRequest(BaseModel):
    """Requête contenant une image encodée en base64."""
    image: str

    @field_validator('image')
    @classmethod
    def validate_image_size(cls, v: str) -> str:
        """Valide que l'image ne dépasse pas la taille maximale."""
        image_data = v
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Taille réelle ≈ 75% de la taille base64
        estimated_size = len(image_data) * 3 / 4
        if estimated_size > MAX_IMAGE_SIZE:
            raise ValueError(f"Image trop volumineuse. Maximum: {MAX_IMAGE_SIZE // (1024*1024)} MB")
        return v


class VerificationResponse(BaseModel):
    """Réponse de vérification faciale."""
    success: bool
    faceDetected: bool
    age: int | None = None
    ageRange: str | None = None
    gender: str | None = None
    genderConfidence: float | None = None
    isAdult: bool = False
    isRealFace: bool = False
    message: str


class AntiSpoofResponse(BaseModel):
    """Réponse de vérification anti-spoof."""
    is_real: bool
    confidence: float
    message: str
    checks: dict | None = None


class HealthResponse(BaseModel):
    """Réponse du health check."""
    status: str
    service: str
