"""
Configuration du service de vérification faciale.
"""
import os

# Clé API pour l'authentification
API_KEY = os.getenv("API_KEY", "teemup-face-verification-key")

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
MIN_BLUR_SCORE = 100  # Score Laplacien minimum
MAX_EDGE_DENSITY = 0.3  # Densité d'arêtes max (détection écran)

# Age minimum pour inscription
MIN_AGE = 18

# Seuil de confiance minimum pour la détection de genre (0-1)
MIN_GENDER_CONFIDENCE = 0.6

# Marge d'erreur appliquée à l'estimation d'âge (+/- ans)
AGE_ESTIMATION_MARGIN = 3

# Rate limiting (requêtes par minute par IP)
RATE_LIMIT_PER_MINUTE = 10

# Backend de détection faciale
DETECTOR_BACKEND = 'opencv'
