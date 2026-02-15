# DataPilot — Explorer & Dashboard Spec

> Decisions prises le 2026-02-14 | Statut: Approuve

---

## Decisions produit

### Ordre de developpement

1. **SQL Editor** (priorite 1) — plus simple a dev, base de tout
2. **Dashboard Builder** (avec Explorer integre)
3. **Spreadsheet mode** (toggle SQL/Sheet)
4. **Chat IA** — apres que le semantic model soit solide

### Explorer = integre dans le Dashboard Builder

L'Explorer n'est **pas** une page separee. Il est integre dans le dashboard builder :
- L'utilisateur ouvre un dashboard → clique "+" pour ajouter un widget
- Un panneau lateral s'ouvre avec l'Explorer (SQL ou Spreadsheet)
- Le resultat est directement ajoutable comme widget sur la grille

---

## Phase 1 : SQL Explorer

### Stack

| Composant | Choix | Raison |
|-----------|-------|--------|
| Editeur SQL | **CodeMirror 6** | 400kb, SSR-friendly, autocompletion |
| Execution | **DuckDB** in-process | Requetes sur CSV/Parquet du semantic model |
| Resultat tableau | **TanStack Table** | Headless, MIT, leger (~50kb) |

### Fonctionnalites MVP

- Editeur SQL avec coloration syntaxique
- Autocompletion depuis le schema semantique (noms tables/colonnes)
- Execution de requetes SELECT sur les CSV via DuckDB
- Resultat en tableau pagine (TanStack Table)
- Sauvegarde des requetes (objet `SavedQuery` en base)
- Raccourci Ctrl+Enter pour executer
- Read-only, timeout 30s, LIMIT force

### Objet SavedQuery

```
saved_queries:
  id, tenant_id, workspace_id, name, sql_text,
  chart_type (nullable), created_at, updated_at
```

Reutilisable pour : widgets dashboard, partage entre collegues.

---

## Phase 2 : Dashboard Builder

### Layout

| Config | Valeur |
|--------|--------|
| Grille | 12 colonnes (react-grid-layout) |
| Hauteur ligne | 200px |
| Gap | 16px |
| Min panel | 3 col x 1 ligne |
| Max panel | 12 col x 4 lignes |

### 5 types de charts MVP

1. **KPI Card** — chiffre cle + label + tendance (Custom React)
2. **Bar Chart** — comparaison categories (Recharts)
3. **Line Chart** — evolution temporelle (Recharts)
4. **Pie / Donut** — repartition (Recharts)
5. **Table** — donnees detaillees (TanStack Table)

### Ajout de widgets

Deux chemins :
1. Depuis l'Explorer integre : cliquer "+" dans le dashboard, configurer la requete, choisir le type de chart
2. Depuis une SavedQuery : selectionner une requete sauvegardee et l'ajouter comme widget

### Filtres globaux

- Barre de filtres en haut du dashboard (ex: date range, categorie)
- **L'utilisateur configure** quel widget est affecte par quel filtre
- Un widget peut etre exclu d'un filtre global (toggle par widget)
- Filtres par dimension : dropdown pour les string, date picker pour les dates

### Themes = palettes de couleurs

Pour le MVP, les themes sont **uniquement des palettes de couleurs pour les charts** :
- Chaque theme definit 6-8 couleurs pour les series de donnees
- Fond, bordures, typo = style par defaut (on verra plus tard)

Themes prevus :
| Theme | Couleurs principales |
|-------|---------------------|
| Classique | Bleu, gris, vert |
| Moderne | Noir, blanc, accent vif |
| Colore | Multi-couleurs vives |
| Corporate | Bleu marine, or, gris |

### Fonctionnalites dashboard MVP

- [x] Grille drag & drop (react-grid-layout)
- [x] 5 types de charts
- [x] Filtres globaux configurables par widget
- [x] Sauvegarde layout + widgets en base
- [x] Palettes de couleurs selectionnables
- [ ] Mode plein ecran — V1.1
- [ ] Export PDF/PNG — V1.2
- [ ] Partage par lien public — V1.2

---

## Phase 3 : Mode Spreadsheet

### Stack

| Composant | Choix | Raison |
|-----------|-------|--------|
| Tableau | **TanStack Table** | Deja utilise pour les resultats SQL, MIT, headless |

### Toggle SQL / Spreadsheet

- Dans le panneau Explorer du dashboard, un toggle : `SQL | Sheet`
- **Mode SQL** : editeur CodeMirror + resultat tableau
- **Mode Sheet** : vue tableur directe des donnees du semantic model
- Les deux modes partagent la meme source (semantic layer)

### Fonctionnalites spreadsheet

| Fonctionnalite | Priorite | Description |
|----------------|----------|-------------|
| Vue tableur | P0 | Colonnes redimensionnables, scroll horizontal |
| Tri par colonne | P0 | Clic sur header = tri asc/desc |
| Filtres colonne | P0 | Dropdown / range / texte par colonne |
| Agregations visuelles | P0 | Footer row : SUM, AVG, COUNT, MIN, MAX par colonne |
| Colonnes calculees | P1 | Ajouter une colonne avec formule (references autres colonnes) |
| Pagination | P0 | Navigation par pages |
| Export CSV | P1 | Telecharger le resultat filtre/trie |

**Pas de formules Excel dans les cellules** — on reste sur des agregations visuelles et colonnes calculees (type Google Sheets simplifie).

---

## Phase 4 : Chat IA

Apres que toutes les phases precedentes soient solides.

- NL → SemanticQuery → SQL → Resultat + suggestion de chart
- Le chat utilise le semantic model comme contexte
- L'utilisateur peut ajouter le resultat du chat comme widget

---

## Ordre des sprints (mis a jour)

| Sprint | Contenu | Depend de |
|--------|---------|-----------|
| Sprint 3 | Semantic Model (backend + ERD frontend) | Sprint 2 (CSV) |
| Sprint 4 | SQL Explorer + Query Execution | Sprint 3 (Semantic) |
| Sprint 5 | Dashboard Builder (grille + charts + filtres) | Sprint 4 (SQL) |
| Sprint 6 | Spreadsheet mode (toggle SQL/Sheet) | Sprint 5 (Dashboard) |
| Sprint 7 | Chat IA (NL → SQL) | Sprint 6 (tout le reste solide) |
| Sprint 8 | Polish, tests, deploy | Sprint 7 |
