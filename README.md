# TeemUp

Plateforme de mise en relation sportive - Application mobile React Native avec backend Spring Boot et service de vérification faciale IA.

## Stack Technique

### Backend
- **Java 21** avec **Spring Boot 3.2**
- **PostgreSQL 16** - Base de données relationnelle
- **JWT** - Authentification stateless
- **Socket.IO** - Messaging temps réel
- **Cloudinary** - Stockage des images

### Frontend
- **React Native** avec **Expo SDK 54**
- **TypeScript** - Typage statique
- **TanStack React Query** - State management & cache
- **Socket.IO Client** - WebSocket temps réel

### Service IA
- **Python 3.11** avec **FastAPI**
- **DeepFace** - Détection d'âge et genre
- **TensorFlow** - Modèles ML

## Architecture

```
TeemUp/
├── backend/                    # API Spring Boot (port 8000)
│   ├── src/main/java/com/teemup/
│   │   ├── config/            # Configuration (Security, Socket.IO, CORS)
│   │   ├── controller/        # REST Controllers (9 endpoints)
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── entity/            # Entités JPA (User, SportEvent, Message...)
│   │   ├── exception/         # Exceptions personnalisées
│   │   ├── repository/        # Spring Data Repositories
│   │   ├── security/          # JWT & filtres d'authentification
│   │   ├── service/           # Logique métier
│   │   ├── validation/        # Validateurs personnalisés
│   │   └── websocket/         # Service Socket.IO
│   └── Dockerfile
├── frontend/                   # App React Native Expo
│   ├── src/
│   │   ├── app/               # Écrans (Expo Router)
│   │   ├── components/        # Composants UI réutilisables
│   │   ├── features/          # Modules par domaine (auth, events, messaging)
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── constants/         # Constantes (sports, images)
│   │   └── types/             # Types TypeScript
│   └── package.json
├── face-verification/          # Service IA Python (port 5001 externe, 5000 interne)
│   ├── app/
│   │   ├── services/          # Logique de vérification faciale
│   │   └── schemas.py         # Modèles Pydantic
│   ├── main.py                # Point d'entrée FastAPI
│   └── Dockerfile
├── docker-compose.yml          # Orchestration des services
└── README.md
```

## Prérequis

- Docker & Docker Compose
- Node.js 18+ et npm
- Expo Go (sur mobile) ou émulateur iOS/Android

## Installation

### 1. Cloner le projet
```bash
git clone <repository-url>
cd TeemUp
```

### 2. Configurer l'environnement

Copier le fichier d'exemple :
```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :
```env
# Base de données
POSTGRES_DB=teemup
POSTGRES_USER=teemup
POSTGRES_PASSWORD=your_secure_password

# JWT (générer des secrets aléatoires en production)
JWT_SECRET=your-256-bit-secret-key-minimum-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-chars

# Cloudinary (optionnel - pour upload d'images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Configurer le frontend :
```bash
cd frontend
cp .env.example .env.local
```

Éditer `frontend/.env.local` avec l'IP de votre machine :
```env
EXPO_PUBLIC_API_URL=http://VOTRE_IP:8000
EXPO_PUBLIC_SOCKET_URL=http://VOTRE_IP:9092
```

### 3. Lancer les services
```bash
docker compose up -d --build
```

Vérifier que tout fonctionne :
```bash
# API Backend
curl http://localhost:8000/api/health

# Service Face Verification (peut prendre 2-3 min au premier démarrage)
curl http://localhost:5001/health
```

### 4. Lancer le frontend
```bash
cd frontend
npm install
npm start
```

Scanner le QR code avec Expo Go ou appuyer sur `i` (iOS) / `a` (Android).

## API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription avec vérification faciale |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Rafraîchir le token JWT |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Utilisateur courant |

### Utilisateurs
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/users/{id}` | Profil public d'un utilisateur |
| PUT | `/api/users/me` | Modifier son profil |
| GET | `/api/users/search?q=` | Rechercher des utilisateurs |
| GET | `/api/users/discover` | Découvrir des sportifs |

### Événements Sportifs
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/events` | Créer un événement |
| GET | `/api/events` | Liste des événements |
| GET | `/api/events/{id}` | Détails d'un événement |
| PUT | `/api/events/{id}` | Modifier un événement |
| DELETE | `/api/events/{id}` | Supprimer un événement |
| POST | `/api/events/{id}/join` | Rejoindre un événement |
| POST | `/api/events/{id}/leave` | Quitter un événement |
| GET | `/api/events/nearby` | Événements à proximité |
| GET | `/api/events/my` | Mes événements |

### Messaging
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/messaging/conversations` | Mes conversations |
| POST | `/api/messaging/conversations` | Créer une conversation |
| GET | `/api/messaging/conversations/{id}/messages` | Messages d'une conversation |
| POST | `/api/messaging/conversations/{id}/messages` | Envoyer un message |
| PUT | `/api/messaging/messages/{id}` | Modifier un message |
| DELETE | `/api/messaging/messages/{id}` | Supprimer un message |

### Amis
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/friends` | Liste des amis |
| GET | `/api/friends/requests` | Demandes reçues |
| POST | `/api/friends/request/{userId}` | Envoyer une demande |
| POST | `/api/friends/accept/{requestId}` | Accepter |
| POST | `/api/friends/decline/{requestId}` | Refuser |

### Notifications
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/notifications` | Liste des notifications |
| POST | `/api/notifications/{id}/read` | Marquer comme lue |
| POST | `/api/notifications/read-all` | Tout marquer comme lu |

### Vérification Faciale
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/verification/face` | Vérifier âge/genre via image |

## Fonctionnalités

### Authentification & Sécurité
- JWT avec access token (15 min) et refresh token (7 jours)
- Vérification de l'âge par reconnaissance faciale (18+ requis)
- Validation de mot de passe robuste

### Événements Sportifs
- Création d'événements publics/privés
- 25+ sports supportés
- Événements récurrents (quotidien, hebdomadaire, mensuel)
- Limitation du nombre de participants
- Événements payants (utilisateurs Pro)
- Recherche par localisation

### Messaging Temps Réel
- Conversations privées et groupes
- Statut en ligne
- Accusés de lecture
- Édition/suppression de messages

### Système d'Amis
- Demandes d'amis
- Liste d'amis avec statut en ligne

### Comptes Pro
- Badge Pro sur le profil
- Création d'événements payants
- Priorité dans les recherches

## Règles de mot de passe

Le mot de passe doit contenir :
- Minimum **8 caractères**
- Au moins **1 majuscule**
- Au moins **1 minuscule**
- Au moins **1 chiffre**
- Au moins **1 caractère spécial** (!@#$%^&* etc.)

## Commandes utiles

```bash
# Logs de tous les services
docker compose logs -f

# Logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f face-verification

# Redémarrer les services
docker compose restart

# Arrêter les services
docker compose down

# Reconstruire après modification
docker compose up -d --build

# Tests backend
cd backend && ./mvnw test

# Tests frontend
cd frontend && npm test

# Linter frontend
cd frontend && npm run lint
```

## Ports

| Service | Port |
|---------|------|
| Backend API | 8000 |
| Socket.IO | 9092 |
| PostgreSQL | 5432 |
| Face Verification | 5001 (externe) / 5000 (interne Docker) |

## Tests

### Backend (JUnit 5)
```bash
cd backend
./mvnw test
```

### Frontend (Jest)
```bash
cd frontend
npm test
```

## Licence

MIT
