"""
Configuration du service de vérification faciale.
"""
import os

# Clé API pour l'authentification
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY environment variable is required for face-verification service")

# Taille maximale des images (10 MB)
MAX_IMAGE_SIZE = 10 * 1024 * 1024

# Origines CORS autorisées
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8081,http://localhost:19006,http://localhost:8000"
).split(",")

# Seuils de détection
MIN_IMAGE_WIDTH = 200
MIN_IMAGE_HEIGHT = 200
MIN_BLUR_SCORE = 150  # Score Laplacien minimum (augmenté pour qualité d'image plus stricte)
MAX_EDGE_DENSITY = 0.25  # Densité d'arêtes max (détection écran, réduit pour plus de rigueur)

# Confiance minimale de détection faciale (0-1)
MIN_FACE_CONFIDENCE = 0.85

# Anti-spoof obligatoire - si True, bloque l'inscription si l'anti-spoof échoue
REQUIRE_ANTI_SPOOF = True

# Age minimum pour inscription
MIN_AGE = 18

# Seuil de confiance minimum pour la détection de genre (0-1)
MIN_GENDER_CONFIDENCE = 0.7

# Marge d'erreur appliquée à l'estimation d'âge (+/- ans)
# Avec margin=5, l'âge détecté doit être >= 23 pour passer (23 - 5 = 18)
AGE_ESTIMATION_MARGIN = 5

# Rate limiting (requêtes par minute par IP)
RATE_LIMIT_PER_MINUTE = 10

# Backend de détection faciale
DETECTOR_BACKEND = 'opencv'
