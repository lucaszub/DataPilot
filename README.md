# DataPilot

Plateforme SaaS de Business Intelligence avec IA conversationnelle.

**Connectez vos données. Posez une question. Obtenez la reponse.**

## Stack

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy + Alembic
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Recharts
- **Database**: PostgreSQL 16
- **AI**: Claude API (text-to-SQL)
- **Infra**: Docker Compose + Nginx

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Copy `.env.example` to `.env` and fill in your values

### Run

```bash
# Copy env file
cp .env.example .env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# View logs
docker-compose logs -f backend
```

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

## Development

```bash
# Backend logs
docker-compose logs -f backend

# Run tests
docker-compose exec backend pytest tests/ -v

# Create a new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head
```

## Project Structure

```
datapilot/
├── backend/          # FastAPI application
├── frontend/         # Next.js application
├── nginx/            # Reverse proxy config
├── CLAUDE.md         # AI context file
├── docker-compose.yml
└── .env.example
```
