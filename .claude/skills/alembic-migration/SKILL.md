---
name: alembic-migration
description: Handles database schema changes via Alembic migrations for DataPilot. Use whenever a SQLAlchemy model is created or modified, or when database schema changes are needed.
---

# Alembic Migration — DataPilot

## Règles absolues
- JAMAIS modifier les tables manuellement
- TOUJOURS passer par Alembic
- TOUJOURS vérifier la migration générée avant de l'appliquer

## Commandes
```bash
# Générer une migration
docker-compose exec backend alembic revision --autogenerate -m "add_<description>"

# Appliquer
docker-compose exec backend alembic upgrade head

# Rollback
docker-compose exec backend alembic downgrade -1

# Voir l'état
docker-compose exec backend alembic current
```

## Checklist migration
- [ ] Nom descriptif (ex: `add_widgets_table`, `add_tenant_id_to_users`)
- [ ] Vérifier le fichier généré dans `app/migrations/versions/`
- [ ] La fonction `downgrade()` est bien implémentée
- [ ] Migration appliquée et testée
