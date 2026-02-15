# Contributing to DataPilot

Thank you for your interest in contributing to DataPilot! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Need Help?](#need-help)

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat(scope): description'`)
4. Push to your branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Types of Contributions

- **Bug reports** - Use the issue template to report bugs
- **Feature requests** - Use the issue template to suggest new features
- **Code contributions** - Implement features or fix bugs
- **Documentation improvements** - Help improve our docs
- **Test improvements** - Add or enhance test coverage

## Development Setup

### Prerequisites

- Docker & Docker Compose
- Python 3.12+ (for backend development)
- Node.js 18+ (for frontend development)
- PostgreSQL 16 (or use Docker)

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL via Docker
docker compose up postgres -d

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3000
```

### Full Stack (Docker)

```bash
cp .env.example .env
docker compose up -d
docker compose exec backend alembic upgrade head
# → http://localhost (nginx)
```

## Code Standards

### Git

- **Conventional Commits**: `<type>(<scope>): <description>`
- **Types**: feat, fix, refactor, test, docs, chore, ci
- **Branch naming**: `feat/<description>`, `fix/<description>`, `docs/<description>`
- **Never work directly on `main`** - always use feature branches

### Backend (Python)

- Python 3.12 with type hints required
- snake_case for functions and variables
- FastAPI dependency injection pattern
- SQLAlchemy 2.0 ORM
- **CRITICAL: Multi-tenant isolation** - ALL database queries MUST filter by `tenant_id`. No exceptions.

### Frontend (TypeScript)

- TypeScript strict mode, no `any` types
- Next.js 15 App Router
- Tailwind CSS for styling
- shadcn/ui for components
- React Hook Form + Zod for forms

## Testing

### Backend

```bash
# Run all tests
docker compose exec backend pytest tests/ -v

# Run specific test file
docker compose exec backend pytest tests/test_auth.py -v

# Local (with venv)
cd backend && pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm test
npm run test:watch
```

### Test Requirements

- All new features must include tests
- Backend: pytest with conftest fixtures
- Frontend: Jest + React Testing Library
- Maintain tenant isolation in all test scenarios

## Pull Request Process

1. Ensure all tests pass
2. Run linter (`cd frontend && npm run lint`)
3. Update documentation if needed
4. Fill out the PR template completely
5. Request review from maintainers

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated (if applicable)
- [ ] Linter passes
- [ ] No `eslint-disable` without justification
- [ ] Multi-tenant `tenant_id` filtering verified
- [ ] Conventional commit messages used

## Need Help?

- **GitHub Discussions** for questions and community support
- **GitHub Issues** for bug reports and feature requests
- **Documentation** at `docs/` for technical details
