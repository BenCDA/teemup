from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from deepface import DeepFace
import numpy as np
import cv2
import base64
import tempfile
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB max
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081,http://localhost:19006").split(",")

app = FastAPI(
    title="TeemUp Face Verification API",
    description="Service de vérification faciale pour l'âge et le genre",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Précharger les modèles DeepFace au démarrage"""
    logger.info("Préchargement des modèles DeepFace...")
    try:
        # Créer une image de test pour forcer le chargement des modèles
        import tempfile
        test_img = np.zeros((100, 100, 3), dtype=np.uint8)
        test_img[30:70, 30:70] = [255, 200, 150]  # Simple face-like shape

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            cv2.imwrite(tmp.name, test_img)
            try:
                # Ceci va télécharger et charger les modèles
                DeepFace.analyze(
                    img_path=tmp.name,
                    actions=['age', 'gender'],
                    enforce_detection=False,
                    detector_backend='opencv',
                    silent=True
                )
                logger.info("Modèles DeepFace chargés avec succès!")
            except Exception as e:
                logger.info(f"Modèles initialisés (pas de visage dans l'image test): {e}")
            finally:
                os.remove(tmp.name)
    except Exception as e:
        logger.error(f"Erreur lors du préchargement: {e}")

# CORS configuration - restrict to known origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

class Base64ImageRequest(BaseModel):
    image: str  # Base64 encoded image

    @field_validator('image')
    @classmethod
    def validate_image_size(cls, v):
        # Remove data URL prefix if present for size calculation
        image_data = v
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Check base64 size (actual size is ~75% of base64 size)
        estimated_size = len(image_data) * 3 / 4
        if estimated_size > MAX_IMAGE_SIZE:
            raise ValueError(f"Image trop volumineuse. Maximum: {MAX_IMAGE_SIZE // (1024*1024)} MB")
        return v

class VerificationResponse(BaseModel):
    success: bool
    faceDetected: bool
    age: int | None = None
    ageRange: str | None = None
    gender: str | None = None
    genderConfidence: float | None = None
    isAdult: bool = False
    isRealFace: bool = False
    message: str

class HealthResponse(BaseModel):
    status: str
    service: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", service="face-verification")

@app.post("/verify", response_model=VerificationResponse)
async def verify_face(request: Base64ImageRequest):
    """
    Analyse une image pour détecter l'âge et le genre.
    Accepte une image encodée en base64.
    """
    try:
        # Decode base64 image
        image_data = request.image

        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64
        image_bytes = base64.b64decode(image_data)

        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Image invalide")

        # Save to temp file (DeepFace works better with file paths)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            cv2.imwrite(tmp.name, img)
            temp_path = tmp.name

        try:
            # Analyze face with DeepFace
            # Using VGG-Face for better accuracy
            result = DeepFace.analyze(
                img_path=temp_path,
                actions=['age', 'gender'],
                enforce_detection=True,
                detector_backend='opencv',  # Fast and reliable
                silent=True
            )

            # DeepFace returns a list if multiple faces, take the first one
            if isinstance(result, list):
                result = result[0]

            age = result.get('age', 0)
            gender_data = result.get('gender', {})

            # Get dominant gender and confidence
            if isinstance(gender_data, dict):
                dominant_gender = result.get('dominant_gender', 'Unknown')
                gender_confidence = gender_data.get(dominant_gender, 0) / 100
            else:
                dominant_gender = str(gender_data)
                gender_confidence = 0.5

            # Translate gender to French
            gender_fr = "Homme" if dominant_gender.lower() == "man" else "Femme"

            # Determine age range
            if age < 18:
                age_range = "Mineur (<18)"
            elif age < 25:
                age_range = "18-24"
            elif age < 35:
                age_range = "25-34"
            elif age < 45:
                age_range = "35-44"
            elif age < 55:
                age_range = "45-54"
            else:
                age_range = "55+"

            is_adult = age >= 18

            logger.info(f"Face analysis successful: age={age}, gender={gender_fr}, adult={is_adult}")

            return VerificationResponse(
                success=True,
                faceDetected=True,
                age=int(age),
                ageRange=age_range,
                gender=gender_fr,
                genderConfidence=round(gender_confidence, 2),
                isAdult=is_adult,
                isRealFace=True,  # Basic check passed
                message="Vérification réussie" if is_adult else "Vous devez avoir 18 ans ou plus pour vous inscrire"
            )

        except ValueError as e:
            # No face detected
            logger.warning(f"No face detected: {str(e)}")
            return VerificationResponse(
                success=False,
                faceDetected=False,
                message="Aucun visage détecté. Veuillez prendre une photo claire de votre visage."
            )
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification. Veuillez réessayer.")

@app.post("/verify-file")
async def verify_face_file(file: UploadFile = File(...)):
    """
    Analyse une image uploadée pour détecter l'âge et le genre.
    """
    try:
        # Read file content
        contents = await file.read()

        # Validate file size
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Image trop volumineuse. Maximum: {MAX_IMAGE_SIZE // (1024*1024)} MB"
            )

        # Convert to base64 and use the main verify function
        image_base64 = base64.b64encode(contents).decode('utf-8')

        request = Base64ImageRequest(image=image_base64)
        return await verify_face(request)

    except Exception as e:
        logger.error(f"File verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification. Veuillez réessayer.")

@app.post("/anti-spoof")
async def check_anti_spoof(request: Base64ImageRequest):
    """
    Vérifie si l'image est une vraie photo ou une photo d'écran.
    Note: Cette fonctionnalité basique vérifie la qualité de l'image.
    Pour une vraie détection anti-spoof, il faudrait un modèle dédié.
    """
    try:
        # Decode base64 image
        image_data = request.image
        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"is_real": False, "confidence": 0, "message": "Image invalide"}

        # Basic quality checks
        # 1. Check image resolution
        height, width = img.shape[:2]
        if width < 200 or height < 200:
            return {"is_real": False, "confidence": 0.3, "message": "Résolution trop faible"}

        # 2. Check for blur using Laplacian variance
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        if laplacian_var < 100:
            return {"is_real": False, "confidence": 0.4, "message": "Image trop floue"}

        # 3. Check for moiré patterns (common in screen photos)
        # This is a simplified check
        edges = cv2.Canny(gray, 100, 200)
        edge_density = np.sum(edges > 0) / (width * height)

        # High edge density might indicate screen capture
        if edge_density > 0.3:
            return {"is_real": False, "confidence": 0.5, "message": "Pattern suspect détecté"}

        return {
            "is_real": True,
            "confidence": 0.8,
            "message": "L'image semble authentique",
            "checks": {
                "resolution": f"{width}x{height}",
                "blur_score": round(laplacian_var, 2),
                "edge_density": round(edge_density, 4)
            }
        }

    except Exception as e:
        logger.error(f"Anti-spoof error: {str(e)}")
        return {"is_real": False, "confidence": 0, "message": "Erreur lors de l'analyse. Veuillez réessayer."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
