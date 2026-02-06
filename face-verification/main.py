"""
TeemUp Face Verification API
Point d'entrée de l'application FastAPI.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import base64
import logging

from app.config import ALLOWED_ORIGINS, MAX_IMAGE_SIZE
from app.schemas import (
    Base64ImageRequest,
    VerificationResponse,
    AntiSpoofResponse,
    HealthResponse,
)
from app.services import FaceVerificationService

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Instance du service
face_service = FaceVerificationService()

# Application FastAPI
app = FastAPI(
    title="TeemUp Face Verification API",
    description="Service de vérification faciale pour l'âge et le genre",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# =============================================================================
# Events
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Précharge les modèles DeepFace au démarrage."""
    await face_service.preload_models()


# =============================================================================
# Routes
# =============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", service="face-verification")


@app.post("/verify", response_model=VerificationResponse)
async def verify_face(request: Base64ImageRequest):
    """
    Analyse une image pour détecter l'âge et le genre.

    - **image**: Image encodée en base64

    Retourne les informations sur l'âge, le genre et si la personne est majeure.
    """
    try:
        return await face_service.verify_face(request.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur de vérification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la vérification. Veuillez réessayer."
        )


@app.post("/verify-file", response_model=VerificationResponse)
async def verify_face_file(file: UploadFile = File(...)):
    """
    Analyse une image uploadée pour détecter l'âge et le genre.

    - **file**: Fichier image (JPEG, PNG)
    """
    try:
        contents = await file.read()

        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Image trop volumineuse. Maximum: {MAX_IMAGE_SIZE // (1024*1024)} MB"
            )

        image_base64 = base64.b64encode(contents).decode('utf-8')
        return await face_service.verify_face(image_base64)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur de vérification fichier: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la vérification. Veuillez réessayer."
        )


@app.post("/anti-spoof", response_model=AntiSpoofResponse)
async def check_anti_spoof(request: Base64ImageRequest):
    """
    Vérifie si l'image est une vraie photo ou une capture d'écran.

    - **image**: Image encodée en base64

    Effectue des vérifications de qualité (résolution, flou, patterns).
    """
    return await face_service.check_anti_spoof(request.image)


# =============================================================================
# Point d'entrée
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
