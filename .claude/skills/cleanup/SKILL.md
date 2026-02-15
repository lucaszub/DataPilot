---
name: cleanup
description: Analyse et nettoie le code DataPilot. Trouve les fichiers inutilisés, imports morts, dépendances obsolètes, et code mort.
---

# /cleanup — Nettoyage du code DataPilot

Effectue un audit complet du code et nettoie ce qui est inutilisé.

## Étapes

### 1. Imports Python morts
```bash
# Trouver les imports inutilisés dans le backend
cd /home/lucas-zubiarrain/DataPilot/backend
python3 -c "
import ast, os, sys
for root, dirs, files in os.walk('app'):
    for f in files:
        if f.endswith('.py'):
            path = os.path.join(root, f)
            try:
                tree = ast.parse(open(path).read())
                imports = [n.names[0].name if isinstance(n, ast.Import) else n.module for n in ast.walk(tree) if isinstance(n, (ast.Import, ast.ImportFrom))]
                if imports:
                    print(f'{path}: {len(imports)} imports')
            except: pass
"
```
Puis vérifier manuellement chaque import signalé avec Grep pour voir s'il est utilisé.

### 2. Dépendances Python inutilisées
```bash
# Lister les packages installés
cd /home/lucas-zubiarrain/DataPilot/backend
cat requirements.txt
# Pour chaque package, vérifier s'il est importé dans le code
```
Grepper chaque dépendance de requirements.txt dans le code. Si aucune occurrence → signaler.

### 3. Dépendances npm inutilisées
```bash
cd /home/lucas-zubiarrain/DataPilot/frontend
# Lister les dépendances de package.json
cat package.json | python3 -c "import sys,json; deps=json.load(sys.stdin); [print(d) for d in {**deps.get('dependencies',{}), **deps.get('devDependencies',{})}.keys()]"
```
Grepper chaque dépendance dans le code source. Si aucune occurrence → signaler.

### 4. Fichiers orphelins
- Composants React jamais importés
- Services Python jamais appelés
- Fichiers de test sans fichier source correspondant

### 5. Code mort
- Fonctions définies mais jamais appelées
- Variables assignées mais jamais lues
- Routes commentées ou désactivées
- TODO/FIXME/HACK restants

### 6. Fichiers de config
- Variables d'env dans .env.example mais pas utilisées dans le code
- Variables utilisées dans le code mais absentes de .env.example

## Format du rapport
```
Cleanup Report — DataPilot
===========================

Imports morts :
  - backend/app/services/foo.py: import bar (inutilisé)

Dépendances inutilisées :
  - requirements.txt: package-x (aucun import trouvé)
  - package.json: library-y (aucun import trouvé)

Fichiers orphelins :
  - frontend/src/components/OldComponent.tsx (jamais importé)

Code mort :
  - backend/app/utils.py:45 — fonction deprecated_helper() jamais appelée

TODO/FIXME :
  - backend/app/services/query.py:23 — TODO: optimize this query

.env inconsistencies :
  - MISSING in .env.example: NEW_VAR (utilisé dans config.py)
  - UNUSED in code: OLD_VAR (dans .env.example mais jamais lu)
```

## Règles
- Ne supprimer que ce qui est CLAIREMENT inutilisé (vérifier avec Grep avant de supprimer)
- Présenter le rapport AVANT de supprimer quoi que ce soit
- Demander confirmation à l'utilisateur avant chaque suppression
- Ne pas toucher aux fichiers de test (même s'ils semblent orphelins — vérifier d'abord)
