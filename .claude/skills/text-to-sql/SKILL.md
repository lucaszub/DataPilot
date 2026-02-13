---
name: text-to-sql
description: Guides implementation of the text-to-SQL AI feature using Claude API. Use when working on ai_service.py, the /ai/query endpoint, prompt engineering, or anything related to natural language to SQL conversion.
---

# Text-to-SQL — DataPilot

## Architecture du module
```
User question (FR)
       ↓
ai_service.py
       ↓  (1) Build prompt avec schema DB + semantic layer
Claude API (claude-sonnet-4-5-20250929)
       ↓  (2) Génère SQL
query_service.py
       ↓  (3) Sanitize + exécute
Résultat JSON
       ↓
Frontend (Recharts)
```

## Règles de sécurité critiques
- Le SQL généré passe TOUJOURS par `query_service.sanitize_sql()`
- UNIQUEMENT des SELECT autorisés (pas d'INSERT/UPDATE/DELETE)
- Toujours inclure `tenant_id` dans le WHERE du SQL généré
- Logger chaque requête pour debug

## Structure du prompt système
```python
system_prompt = f"""
Tu es un assistant SQL expert pour DataPilot.
Réponds UNIQUEMENT avec du SQL valide, sans explication.

Schéma de la base de données :
{schema_context}

Définitions métier (semantic layer) :
{semantic_context}

Contraintes obligatoires :
- Uniquement des requêtes SELECT
- Toujours filtrer par tenant_id = '{tenant_id}'
- Limiter à 1000 résultats max
"""
```

## Gestion des erreurs
- Si Claude génère du SQL invalide → retry avec message d'erreur dans le prompt
- Max 3 tentatives avant de retourner une erreur utilisateur
- Logger le SQL généré + le résultat pour monitoring
