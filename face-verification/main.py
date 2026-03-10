"""
TeemUp Face Verification API
Point d'entrée de l'application FastAPI.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import base64
import logging

from app.config import ALLOWED_ORIGINS, MAX_IMAGE_SIZE, RATE_LIMIT_PER_MINUTE, API_KEY
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

# Rate limiter par IP
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{RATE_LIMIT_PER_MINUTE}/minute"])

# Track model readiness
models_loaded = False


# =============================================================================
# Authentification par clé API
# =============================================================================

async def verify_api_key(x_api_key: str = Header(...)):
    """Vérifie la clé API dans le header X-API-Key."""
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Clé API invalide")


# =============================================================================
# Lifespan (startup / shutdown)
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global models_loaded
    # Startup
    face_service.preload_models()
    models_loaded = True
    logger.info("Service de vérification faciale prêt")
    yield
    # Shutdown (cleanup if needed)


# Application FastAPI
app = FastAPI(
    title="TeemUp Face Verification API",
    description="Service de vérification faciale pour l'âge et le genre",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)


# =============================================================================
# Routes
# =============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    status = "healthy" if models_loaded else "degraded"
    return HealthResponse(status=status, service="face-verification")


@app.post("/verify", response_model=VerificationResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
def verify_face(request: Request, body: Base64ImageRequest):
    """
    Analyse une image pour détecter l'âge et le genre.

    - **image**: Image encodée en base64

    Retourne les informations sur l'âge, le genre et si la personne est majeure.
    """
    try:
        client_ip = get_remote_address(request)
        return face_service.verify_face(body.image, client_ip=client_ip)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur de vérification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la vérification. Veuillez réessayer."
        )


@app.post("/verify-file", response_model=VerificationResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def verify_face_file(request: Request, file: UploadFile = File(...)):
    """
    Analyse une image uploadée pour détecter l'âge et le genre.

    - **file**: Fichier image (JPEG, PNG)
    """
    try:
        # Validate content type
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Format non supporté. Utilisez JPEG ou PNG.")

        # Read file with size limit
        contents = await file.read()
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Image trop volumineuse (max {MAX_IMAGE_SIZE // (1024*1024)}MB)"
            )

        image_base64 = base64.b64encode(contents).decode('utf-8')
        client_ip = get_remote_address(request)
        return face_service.verify_face(image_base64, client_ip=client_ip)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur de vérification fichier: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la vérification. Veuillez réessayer."
        )


@app.post("/anti-spoof", response_model=AntiSpoofResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
def check_anti_spoof(request: Request, body: Base64ImageRequest):
    """
    Vérifie si l'image est une vraie photo ou une capture d'écran.

    - **image**: Image encodée en base64

    Effectue des vérifications de qualité (résolution, flou, patterns).
    """
    try:
        return face_service.check_anti_spoof(body.image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur anti-spoof: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la vérification. Veuillez réessayer."
        )


# =============================================================================
# Point d'entrée
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
