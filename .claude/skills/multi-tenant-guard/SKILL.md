---
name: multi-tenant-guard
description: Verifies multi-tenant data isolation in DataPilot. Use proactively when writing database queries, services, or any code that accesses data to ensure tenant_id isolation is correctly implemented.
allowed-tools: Read, Grep
---

# Multi-Tenant Guard — DataPilot

## Règle fondamentale
CHAQUE accès à la base de données DOIT filtrer par `tenant_id`.
Une faille = fuite de données client = mort du produit.

## Checklist à vérifier sur chaque service
```python
# CORRECT
db.query(Dashboard).filter(
    Dashboard.id == id,
    Dashboard.tenant_id == current_user.tenant_id  # ✔️
).first()

# DANGEREUX - ne jamais faire
db.query(Dashboard).filter(Dashboard.id == id).first()  # ❌ pas de tenant check
```

## Commande de vérification
Recherche les queries sans tenant_id :
```bash
grep -r ".query(" backend/app/services/ | grep -v "tenant_id"
```
Si une ligne apparaît → faille potentielle à corriger.
