#!/bin/bash

echo "========================================"
echo "    TeemUp - Development Environment    "
echo "========================================"
echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

echo "Starting services with Docker Compose..."
echo ""

# Start services
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "    Services started successfully!     "
    echo "========================================"
    echo ""
    echo "Backend API:     http://localhost:8000"
    echo "Socket.IO:       http://localhost:9092"
    echo "PostgreSQL:      localhost:5432"
    echo "Redis:           localhost:6379"
    echo ""
    echo "Health check:    http://localhost:8000/api/health"
    echo ""
    echo "To view logs:    docker compose logs -f backend"
    echo "To stop:         docker compose down"
    echo ""
    echo "Frontend: cd frontend && npm start"
    echo "========================================"
else
    echo ""
    echo "Error: Failed to start services"
    exit 1
fi
