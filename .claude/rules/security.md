---
paths:
  - "backend/**/*.py"
  - "frontend/**/*.ts"
  - "frontend/**/*.tsx"
---

# Sécurité — Vérifications automatiques

À chaque modification de code, vérifie SYSTÉMATIQUEMENT ces points :

## Backend Python
- **SQL Injection** : JAMAIS de f-string ou .format() dans les queries SQL. Utiliser les paramètres SQLAlchemy (`query.filter(Model.field == value)`) ou les bind parameters
- **XSS** : Toute donnée utilisateur retournée en réponse doit passer par un schema Pydantic (sanitization automatique)
- **Path Traversal** : Valider les noms de fichiers uploadés. Interdire `..`, `/`, `\` dans les chemins utilisateur
- **SSRF** : Ne jamais utiliser une URL fournie par l'utilisateur pour faire des requêtes côté serveur sans validation
- **Secrets** : Aucun secret hardcodé. Utiliser `app/config.py` (pydantic-settings). Vérifier qu'aucun `.env`, token, ou password n'apparaît dans le code
- **Auth** : Tout endpoint (sauf /auth/*) doit avoir `Depends(get_current_user)`
- **Mass Assignment** : Utiliser des Pydantic schemas explicites pour l'input (pas de `**kwargs` depuis le body)

## Frontend TypeScript
- **XSS** : JAMAIS de `dangerouslySetInnerHTML`. Si absolument nécessaire, sanitizer avec DOMPurify
- **CSRF** : Les cookies auth doivent avoir `SameSite=Strict` ou `Lax`
- **Secrets côté client** : Aucune clé API, token, ou secret dans le code frontend. Vérifier `NEXT_PUBLIC_*` ne contient pas de secrets
- **Open Redirect** : Valider les URLs de redirection (pas de redirect vers un domaine externe)
- **Input Validation** : Valider avec Zod AVANT d'envoyer au backend

## Si tu détectes un problème
Corrige-le immédiatement. Ne le signale pas "pour plus tard" — fix it now.
