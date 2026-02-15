---
paths:
  - "backend/app/**"
---

# Multi-Tenant — Règles CRITIQUES

**L'isolation multi-tenant est la règle de sécurité la plus importante du projet.**

## Checklist obligatoire
- [ ] TOUTE requête SELECT/UPDATE/DELETE filtre par `tenant_id`
- [ ] Les JOIN entre tables vérifient que les deux côtés ont le même `tenant_id`
- [ ] Toute nouvelle table a une colonne `tenant_id` (NOT NULL, avec index)
- [ ] Les endpoints utilisent `current_user.tenant_id` (jamais un tenant_id du body/query)
- [ ] Aucune route admin ne retourne des données cross-tenant sans vérification explicite

## Pattern standard
```python
# BON
items = db.query(Item).filter(
    Item.tenant_id == current_user.tenant_id,
    Item.id == item_id
).first()

# MAUVAIS — fuite de données possible
items = db.query(Item).filter(Item.id == item_id).first()
```

## Vérification
Utiliser le skill `/multi-tenant-guard` pour auditer le code après implémentation.
