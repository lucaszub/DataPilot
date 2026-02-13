---
name: start
description: Point d'entrée DataPilot. Affiche le status du projet et les commandes disponibles. Utiliser quand l'utilisateur ne sait pas quoi faire ou commence une session.
disable-model-invocation: true
---

# DataPilot — Démarrage session

Lis `BACKLOG.md` et affiche :

## 1. Status rapide

```
📊 DataPilot | Phase 1 MVP
Progression : X/23 (XX%)
Branche : <branche courante>
PRs ouverts : <nombre>
```

## 2. Commandes disponibles

Affiche ce tableau :

| Commande | Quoi | Quand |
|----------|------|-------|
| `/start` | Ce menu | Tu sais pas quoi faire |
| `/run-tasks <TASK-ID>` | Implémenter une tâche | Tu sais quelle tâche faire |
| `/datapilot-taskmaster status` | Status détaillé | Voir la progression |
| `/datapilot-taskmaster validate <ID>` | Valider une tâche | Après merge d'un PR |
| `/datapilot-taskmaster create-issues` | Créer les issues GitHub | Début de sprint |
| `/commit` | Commit rapide | Code prêt à committer |
| `/create-pull-request` | Créer un PR | Feature terminée |

## 3. Agents spécialisés

| Agent | Rôle | S'active quand tu dis... |
|-------|------|--------------------------|
| `scrum-master` | Gestion projet, prochaines étapes | "où on en est ?", "quoi faire ?" |
| `developer` | Implémentation EPCT | "implémente...", "code..." |
| `brainstorm` | Idéation features/archi | "on pourrait...", "et si on..." |
| `code-reviewer` | Review de code | "review le code", "vérifie..." |
| `test-runner` | Tests automatisés | "lance les tests" |
| `db-migrator` | Migrations Alembic | "migration", "schéma" |

## 4. Prochaine tâche recommandée

Identifie la prochaine tâche `todo` dans BACKLOG.md qui n'a pas de dépendance bloquante, et dis :

```
🎯 Prochaine tâche : <TASK-ID> — <description>
   → Tape : /run-tasks <TASK-ID>
```
