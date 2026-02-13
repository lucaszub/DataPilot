# DataPilot API — Guide de test

## Prérequis

```bash
# Lancer les services
cd ~/DataPilot
docker compose up -d postgres backend

# Appliquer les migrations
docker compose exec backend alembic upgrade head

# Vérifier que le backend tourne
curl http://localhost:8000/health
# → {"status":"ok"}
```

## Interface Swagger

Ouvre **http://localhost:8000/docs** dans ton navigateur pour tester visuellement.

---

## Auth Endpoints

### 1. Register — Créer un utilisateur

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@datapilot.fr",
    "password": "MonMotDePasse123!",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Réponse attendue (201) :**
```json
{
  "id": "uuid-généré",
  "email": "test@datapilot.fr",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "user"
}
```

**Erreurs possibles :**
- `409` — Email déjà utilisé
- `422` — Email invalide ou champs manquants

### 2. Login — Obtenir un JWT

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@datapilot.fr",
    "password": "MonMotDePasse123!"
  }'
```

**Réponse attendue (200) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Erreurs possibles :**
- `401` — Email ou mot de passe incorrect

### 3. Me — Vérifier l'utilisateur connecté

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Réponse attendue (200) :**
```json
{
  "id": "uuid",
  "email": "test@datapilot.fr",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "user"
}
```

**Erreurs possibles :**
- `401` — Token manquant, expiré ou invalide
- `403` — Token de type "refresh" au lieu de "access"

### 4. Refresh — Renouveler le token

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN>"
  }'
```

**Réponse attendue (200) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

## Script de test rapide (tout-en-un)

```bash
#!/bin/bash
# test_auth.sh — Teste le flow complet register → login → me → refresh

API="http://localhost:8000/api/v1/auth"

echo "=== 1. Register ==="
REGISTER=$(curl -s -X POST "$API/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"Test1234!","tenant_id":"550e8400-e29b-41d4-a716-446655440000"}')
echo "$REGISTER"

echo -e "\n=== 2. Login ==="
LOGIN=$(curl -s -X POST "$API/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"Test1234!"}')
echo "$LOGIN"

ACCESS_TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
REFRESH_TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")

echo -e "\n=== 3. Me ==="
curl -s "$API/me" -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool

echo -e "\n=== 4. Refresh ==="
curl -s -X POST "$API/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" | python3 -m json.tool

echo -e "\n=== 5. Me avec mauvais token (doit renvoyer 401) ==="
curl -s "$API/me" -H "Authorization: Bearer invalid-token"
echo ""
```

---

## Tests automatiques

```bash
# Depuis la machine locale (sans Docker)
cd ~/DataPilot/backend
source .venv/bin/activate
python -m pytest tests/ -v

# Depuis Docker
docker compose exec backend python -m pytest tests/ -v
```
