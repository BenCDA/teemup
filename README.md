# TeemUp

Plateforme de mise en relation sportive - Application mobile React Native avec backend Spring Boot.

## Stack Technique

### Backend
- **Java 21** avec **Spring Boot 3.2**
- **PostgreSQL 16** - Base de données
- **Redis 7** - Cache et sessions
- **JWT** - Authentification
- **Socket.IO** - Messaging temps réel

### Frontend
- **React Native** avec **Expo SDK 54**
- **TypeScript**
- **TanStack React Query** - State management
- **Socket.IO Client** - WebSocket

## Prérequis

- Docker & Docker Compose
- Node.js 18+ et npm
- Expo Go (sur mobile) ou émulateur

## Installation

### 1. Cloner le projet
```bash
git clone <repository-url>
cd TeemUp
```

### 2. Configurer l'environnement

Copier les fichiers d'exemple :
```bash
# Backend
cp .env.example .env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Éditer `.env` avec vos valeurs (notamment les secrets JWT en production).

Éditer `frontend/.env.local` avec l'IP de votre machine :
```
EXPO_PUBLIC_API_URL=http://VOTRE_IP:8000
EXPO_PUBLIC_SOCKET_URL=http://VOTRE_IP:9092
```

### 3. Lancer le backend
```bash
docker compose up -d --build
```

Vérifier que tout fonctionne :
```bash
curl http://localhost:8000/api/health
```

### 4. Lancer le frontend
```bash
cd frontend
npm install
npm start
```

Scanner le QR code avec Expo Go ou appuyer sur `i` pour iOS / `a` pour Android.

## Endpoints API

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Utilisateur courant |

### Utilisateurs
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/users/{id}` | Détails utilisateur |
| PUT | `/api/users/{id}` | Modifier profil |
| GET | `/api/users/search?q=` | Rechercher |

### Messaging
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/messaging/conversations` | Mes conversations |
| POST | `/api/messaging/conversations` | Créer conversation |
| GET | `/api/messaging/conversations/{id}/messages` | Messages |
| POST | `/api/messaging/conversations/{id}/messages` | Envoyer message |

### Amis
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/friends` | Liste des amis |
| GET | `/api/friends/requests` | Demandes reçues |
| POST | `/api/friends/request/{userId}` | Envoyer demande |
| POST | `/api/friends/accept/{requestId}` | Accepter |
| POST | `/api/friends/decline/{requestId}` | Refuser |

## Règles de mot de passe

Le mot de passe doit contenir :
- Minimum **8 caractères**
- Au moins **1 majuscule**
- Au moins **1 minuscule**
- Au moins **1 chiffre**
- Au moins **1 caractère spécial** (!@#$%^&* etc.)

## Commandes utiles

```bash
# Logs backend
docker compose logs -f backend

# Redémarrer les services
docker compose restart

# Arrêter les services
docker compose down

# Reconstruire après modification
docker compose up -d --build
```

## Structure du projet

```
TeemUp/
├── backend/                 # Spring Boot API
│   ├── src/main/java/com/teemup/
│   │   ├── config/         # Configuration
│   │   ├── controller/     # REST Controllers
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── entity/         # JPA Entities
│   │   ├── repository/     # Spring Data Repositories
│   │   ├── security/       # JWT & Security
│   │   ├── service/        # Business Logic
│   │   ├── validation/     # Custom Validators
│   │   └── websocket/      # Socket.IO
│   └── Dockerfile
├── frontend/               # React Native Expo
│   ├── src/
│   │   ├── app/           # Expo Router screens
│   │   └── features/      # Features (auth, messaging, etc.)
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Licence

MIT
