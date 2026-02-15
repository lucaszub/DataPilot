# Conventions générales DataPilot

## Git workflow
- Feature branches : `feat/<TASK-ID>-<description>`
- Conventional commits : `feat(<scope>): <description> (<TASK-ID>)`
- PRs créées avec `gh pr create`
- Ne jamais travailler directement sur `main`

## Documentation
- Chaque tâche terminée = doc à jour
- Concis mais précis — un dev doit comprendre en 30 secondes
- Ne documenter que ce qui existe (pas de TODO spéculatifs)
- Un seul endroit par sujet (pas de doublons entre fichiers)

| Changement | Fichier à mettre à jour |
|---|---|
| Nouvel endpoint API | `docs/api/<domaine>.md` |
| Nouveau modèle ou migration | `CLAUDE.md` + `BACKLOG.md` |
| Décision d'architecture | `CLAUDE.md` section concernée |
| Tâche terminée | `BACKLOG.md` (status → completed) |

## Scope
- Rester STRICTEMENT dans le scope de la tâche demandée
- Ne PAS ajouter de features non demandées
- Ne PAS refactorer du code hors scope
