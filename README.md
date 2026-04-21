### NorthStar Insurance Platform — CPAN 212 Assignment 5–6

A full-stack insurance operations platform running on a multi-service Docker architecture with:

Next.js frontend

Node.js backend API

MongoDB database

Keycloak authentication (RBAC + realms + clients)

NGINX reverse proxy

Ollama GenAI service

Jenkins CI/CD

### How to Run the Project

docker compose up -d

### All services start automatically:

Frontend → http://localhost

Backend API → http://localhost/api

Keycloak → http://localhost:8080/keycloak

MongoDB → localhost:27017

### Architecture Overview

nginx → routes traffic to frontend, backend, keycloak
frontend-web → Next.js 15
backend-api → Node.js + Express + Keycloak auth
keycloak → realm: insurance-platform
mongodb → data persistence
genai-api → Ollama (mistral)
jenkins → CI/CD

### Project Structure

/frontend-web
/backend-api
/infrastructure/nginx
/infrastructure/keycloak
/infrastructure/genai-api
/infrastructure/jenkins
docker-compose.yml


Jenkins → http://localhost:8081

GenAI (Ollama) → http://localhost:11434
