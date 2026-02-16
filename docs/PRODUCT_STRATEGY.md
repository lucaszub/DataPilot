# DataPilot — Stratégie Produit & Analyse de Marché

> **Date** : Février 2026
> **Version** : 1.0
> **Statut** : Document fondateur

---

## Table des matières

1. [Vision Produit](#1-vision-produit)
2. [Analyse du Marché BI (2024-2026)](#2-analyse-du-marché-bi-2024-2026)
3. [Analyse Concurrentielle](#3-analyse-concurrentielle)
4. [Tableau Comparatif](#4-tableau-comparatif)
5. [Avantage Compétitif DataPilot](#5-avantage-compétitif-datapilot)
6. [Fonctionnalités Clés Détaillées](#6-fonctionnalités-clés-détaillées)
7. [Roadmap Produit](#7-roadmap-produit)

---

## 1. Vision Produit

### Pour qui ?

DataPilot s'adresse aux **équipes data et business** qui ont besoin d'analyser leurs données sans dépendre d'un data engineer à chaque requête :

- **PME (50-2000 salariés)** — Pas de budget pour Tableau/Looker, pas d'équipe data dédiée. Besoin d'un outil complet, simple, self-hostable.
- **Startups et scale-ups** — Données fragmentées (CSV exports, bases SQL, APIs). Besoin de dashboards rapides pour les investisseurs, le product, le sales.
- **Équipes data/analytics** — Data analysts et business analysts qui veulent un outil moderne, open source, avec semantic layer + AI, sans vendor lock-in.
- **Consultants et freelances** — Besoin de créer des dashboards design rapidement pour leurs clients.

### Quel problème ?

Le marché BI est polarisé entre deux extrêmes :

**Trop complexe et cher :**
- Tableau (~$75/user/mois), Looker (~$5000/mois minimum), Power BI (écosystème Microsoft obligatoire)
- Semaines de mise en place, formation nécessaire, consultant externe souvent requis
- Vendor lock-in massif (LookML propriétaire, Tableau Desktop, licences)

**Trop limité :**
- Excel/Google Sheets — Pas de semantic layer, pas de dashboards interactifs, pas scalable
- Metabase — Facile au départ mais pas de transformation, pas de semantic layer, pas d'AI, design basique
- Redash — SQL-only, abandonné, communauté moribonde

**Le gap :**
Aucun outil open source ne combine **transformation de données + semantic layer + dashboards design + AI conversationnelle** dans une seule plateforme. Les équipes doivent assembler une stack fragmentée (dbt + Metabase + notebooks + Claude) qui est complexe à maintenir et coûteuse.

### Pourquoi DataPilot ?

DataPilot est la **plateforme BI open source all-in-one** qui comble ce gap :

- **Dashboard complet en ~1h** — Du CSV brut au dashboard design, sans code, sans configuration complexe
- **100% open source** — Pas de vendor lock-in, communauté-driven, self-hostable partout (Docker)
- **AI-first** — Text-to-SQL avec Claude API, grounded dans le semantic layer pour des réponses précises
- **Approche hybride** — SQL + formules type spreadsheet + langage naturel — chacun travaille comme il préfère
- **Design moderne** — Dashboards inspirés Omni Analytics, templates de couleurs prêts à l'emploi

### Tagline

> **DataPilot — Open source BI platform. Transform, explore, dashboard. In one hour.**

---

## 2. Analyse du Marché BI (2024-2026)

### 2.1 Le marché BI en chiffres

Le marché mondial de la Business Intelligence connaît une croissance soutenue :

- **Marché global BI** : ~$33B en 2025, projection à ~$61B d'ici 2030 (CAGR ~13%)
- **Self-service BI** : segment le plus dynamique, de $7.1B à $12.2B d'ici 2030
- **Marché européen analytics** : $14B en 2024, projection $42B d'ici 2034
- **Open source BI** : 50% des entreprises augmentent leur adoption de solutions open source pour l'analytics

### 2.2 Tendances structurantes

#### Tendance 1 : Le semantic layer comme infrastructure critique

Le semantic layer est devenu le composant central de la stack data moderne. Il sert de **couche de vérité unique** entre les données brutes et la consommation analytics.

**Ce qui se passe :**
- **dbt Semantic Layer** (MetricFlow) s'impose comme standard pour les équipes dbt, mais requiert dbt Cloud ($100/mois+)
- **Cube.js** (open source) offre une couche d'accélération avec cache et pre-aggregations, utilisé par 30K+ projets
- **Omni Analytics** innove avec un modèle en 3 couches (shared model → workbook → dashboard) qui rend le semantic layer accessible aux non-techniques
- **LookML** (Looker/Google) reste puissant mais propriétaire et complexe

**Opportunité DataPilot :** Proposer un semantic layer **visuel, intégré et open source** — plus simple que dbt, plus complet que Metabase, inspiré du modèle Omni.

#### Tendance 2 : AI/LLM intégrés dans la BI

L'intégration des LLMs dans les outils BI est passée de gadget à feature critique en 2024-2025.

**Ce qui se passe :**
- **Text-to-SQL** : les meilleurs systèmes atteignent 85-94% de précision sur des schémas complexes quand ils sont grounded dans un semantic layer
- **Omni** a lancé un MCP Server permettant à Claude/ChatGPT d'interroger directement les données via le semantic layer
- **Hex** a intégré "Magic" — un assistant AI qui génère du SQL, Python et des visualisations
- **Sigma** propose "Ask Sigma" — requêtes en langage naturel sur les données du warehouse
- **Lightdash** a lancé des features AI-first pour la génération de métriques

**Opportunité DataPilot :** Text-to-SQL grounded dans le semantic layer via Claude API, avec un chat intégré qui comprend le contexte métier.

#### Tendance 3 : Conversational analytics

Au-delà du simple text-to-SQL, les utilisateurs veulent **converser** avec leurs données.

**Ce qui se passe :**
- **Julius AI** : 2M+ utilisateurs, chat-first analytics qui génère des charts et analyses à partir de CSV/Excel
- **Count** : "agentic analytics" — l'AI explore les données de manière autonome et génère des insights
- **Hex Threads** : conversations itératives avec contexte partagé en équipe
- **Rows.com** : AI intégré dans un spreadsheet, 89% de précision sur les formules

**Opportunité DataPilot :** Chat intégré où chaque réponse AI peut devenir un chart, un widget dashboard ou un modèle réutilisable.

#### Tendance 4 : Self-service BI pour PME

Les PME sont le segment le plus sous-servi du marché BI.

**Ce qui se passe :**
- Les outils enterprise (Tableau, Looker, Power BI) sont trop chers et complexes pour les PME
- Metabase domine ce segment mais montre ses limites (pas de transformation, semantic layer basique, AI limitée)
- Les PME utilisent encore massivement Excel/Google Sheets par défaut
- Le besoin de dashboards "design" et partageables croît (investisseurs, boards, clients)

**Opportunité DataPilot :** Se positionner comme le **Metabase killer** : aussi simple à démarrer, mais avec transformation, semantic layer et AI en plus.

#### Tendance 5 : L'essor de l'open source en BI

L'open source gagne du terrain face aux solutions propriétaires.

**Ce qui se passe :**
- **Metabase** (open core) : 50K+ stars GitHub, référence de la BI simple
- **Apache Superset** : 65K+ stars, puissant mais complexe, adopté par Airbnb, Lyft
- **Lightdash** : 4K+ stars, BI spécialisée dbt, montée rapide
- **Evidence** : BI-as-code, niche mais en croissance chez les developers
- **DuckDB** : 25K+ stars, moteur analytique in-process qui révolutionne le traitement local de données
- 50% des entreprises prévoient d'augmenter leur utilisation de solutions data open source

**Opportunité DataPilot :** Être le premier outil BI open source **all-in-one** (transformation + semantic + dashboard + AI) — combler le gap entre Metabase (trop simple) et Superset (trop complexe).

#### Tendance 6 : Convergence transformation + visualisation

La frontière entre préparation des données et visualisation s'estompe.

**Ce qui se passe :**
- **Omni** permet de transformer les données directement dans l'outil de BI, sans pipeline externe
- **Sigma Computing** offre une UX spreadsheet directement connectée au warehouse
- **Hex** combine notebooks (transformation) et dashboards dans un même espace
- **Quadratic** fusionne spreadsheet + Python + SQL dans une interface unique
- Les utilisateurs ne veulent plus basculer entre 5 outils différents

**Opportunité DataPilot :** Proposer un workflow unifié du CSV brut au dashboard final : upload → nettoyage → modèle → exploration → dashboard, le tout dans une seule interface.

---

## 3. Analyse Concurrentielle

### 3.1 Concurrents open source directs

#### Metabase
- **Positionnement** : BI simple et accessible, "analytics for everyone"
- **Forces** : Onboarding en 5 minutes, 50K+ stars GitHub, grande communauté, mode question visuel
- **Faiblesses** : Pas de vrai semantic layer, pas de transformation de données, AI très basique (autocompletion SQL seulement), dashboards au design limité, pricing agressif en version Pro ($85/user/mois)
- **Ce qui manque** : Transformation, semantic layer, text-to-SQL AI, templates design

#### Apache Superset
- **Positionnement** : Plateforme d'exploration et visualisation enterprise-grade
- **Forces** : 65K+ stars, 60+ types de charts, SQL Lab puissant, scalable, backing Apache Foundation
- **Faiblesses** : UX complexe (courbe d'apprentissage), pas d'AI, pas de semantic layer intégré, installation difficile, design daté
- **Ce qui manque** : Simplicité, AI, semantic layer, onboarding rapide

#### Lightdash
- **Positionnement** : BI open source pour les équipes dbt
- **Forces** : Intégration native dbt (metrics, dimensions), AI-first (génération de métriques), communauté dbt, interface moderne
- **Faiblesses** : **Requiert dbt** comme prérequis (élimine 80%+ des PME), pas de CSV/file upload, pas de transformation standalone
- **Ce qui manque** : Autonomie (sans dbt), support CSV, mode spreadsheet

#### Evidence
- **Positionnement** : BI-as-code pour developers
- **Forces** : Rapports en Markdown + SQL, version control natif, déploiement statique
- **Faiblesses** : Réservé aux développeurs, pas d'interface visuelle pour créer des dashboards, pas de self-service
- **Ce qui manque** : Interface utilisateur, self-service, AI, interactivité

#### Redash
- **Positionnement** : SQL-first query builder et dashboarding
- **Forces** : Simple, connecteurs multiples, collaboratif
- **Faiblesses** : Projet quasi-abandonné (racheté par Databricks, peu de maintenance), design très daté, fonctionnalités limitées, pas d'évolution AI
- **Ce qui manque** : Maintenance active, AI, design moderne, transformation

### 3.2 Plateformes modernes (inspiration)

#### Omni Analytics ⭐ (inspiration principale)
- **Positionnement** : "Modern BI for the modern data stack" — semantic layer + dashboards design
- **Forces** :
  - Modèle en 3 couches brillant : **Shared Model** (semantic layer, curated) → **Workbook** (exploration, ad-hoc) → **Dashboard** (présentation, design)
  - Dashboards au design exceptionnel (couleurs, typographie, layout)
  - AI intégrée (MCP Server, text-to-SQL grounded dans le modèle)
  - Spreadsheet-like exploration avec formules custom
  - Transition fluide exploration → dashboard
- **Faiblesses** : Propriétaire, cher (pricing enterprise), pas de CSV upload direct, requiert un data warehouse
- **Ce que DataPilot peut reprendre** : Le modèle 3 couches, l'approche design des dashboards, l'exploration hybride SQL+formules+NLQ

#### Sigma Computing
- **Positionnement** : "Spreadsheet-native cloud analytics"
- **Forces** : UX spreadsheet familière, directement connecté au warehouse, formules type Excel sur du live data, collaboration temps réel
- **Faiblesses** : Propriétaire, cher, dépendant d'un cloud warehouse, pas d'AI avancée
- **Ce que DataPilot peut reprendre** : Le mode spreadsheet comme interface de transformation

#### Hex
- **Positionnement** : "AI-native analytics platform" — notebooks + BI
- **Forces** : Magic AI (SQL + Python + viz generation), notebooks collaboratifs, apps interactives, transition notebook → dashboard
- **Faiblesses** : Complexe pour non-techniques, pricing élevé, plus orienté data science que BI PME
- **Ce que DataPilot peut reprendre** : L'AI intégrée dans le workflow, la transition exploration → dashboard

#### Count
- **Positionnement** : "Agentic data analytics"
- **Forces** : AI autonome qui explore les données et génère des insights, canvas collaboratif, approche narrative
- **Faiblesses** : Jeune produit, AI parfois imprécise, pas de dashboards traditionnels
- **Ce que DataPilot peut reprendre** : L'idée d'exploration AI autonome comme feature complémentaire

### 3.3 Semantic layer spécialisé

#### dbt Semantic Layer (MetricFlow)
- **Positionnement** : Couche de métriques standardisée pour l'écosystème dbt
- **Forces** : Standard de facto, intégrations multiples (Hex, Mode, Lightdash), open source (MetricFlow)
- **Faiblesses** : Requiert dbt Cloud pour le hosting ($100+/mois), syntaxe YAML complexe, pas d'interface visuelle
- **Pertinence** : DataPilot peut s'inspirer des concepts (dimensions, measures, entities) sans imposer dbt

#### Cube.js
- **Positionnement** : "Headless BI" — API de semantic layer
- **Forces** : Open source, 18K+ stars, cache et pre-aggregations, REST/GraphQL API, multi-database
- **Faiblesses** : Headless (pas de frontend), nécessite un outil de viz séparé, configuration JavaScript
- **Pertinence** : Concept de pre-aggregation intéressant pour la performance. DataPilot pourrait exposer une API compatible à terme.

#### LookML (Looker / Google Cloud)
- **Positionnement** : Langage de modélisation sémantique propriétaire Google
- **Forces** : Très puissant, mature (10+ ans), explores, derived tables
- **Faiblesses** : Propriétaire, vendor lock-in total, syntaxe complexe, pricing enterprise
- **Pertinence** : Concepts à reprendre (explores, dimensions, measures) mais avec une approche visuelle et open source

### 3.4 Outils AI-powered

#### Julius AI
- **Positionnement** : "Chat with your data" — AI analytics pour tous
- **Forces** : 2M+ utilisateurs, UX ultra-simple (upload CSV → chat → charts), multi-format (Excel, SQL, Python)
- **Faiblesses** : Pas de semantic layer, pas de dashboards persistants, pas de collaboration, données envoyées au cloud, pas open source
- **Ce qui manque** : Gouvernance, dashboards design, semantic layer, self-hosting

#### Rows.com
- **Positionnement** : "AI-powered spreadsheet"
- **Forces** : Spreadsheet avec AI intégrée, 89% précision sur formules, connecteurs natifs (API, DB), design moderne
- **Faiblesses** : Pas de dashboards, pas de semantic layer, propriétaire
- **Ce qui manque** : Dashboarding, semantic layer, open source

#### Quadratic
- **Positionnement** : "Agentic spreadsheet" — spreadsheet + Python + SQL
- **Forces** : Open source, multi-langage (formules + Python + SQL), code gen AI
- **Faiblesses** : Pas de dashboards, en early stage, communauté petite
- **Pertinence** : L'approche multi-langage (formules + SQL) est directement pertinente pour DataPilot

### 3.5 Marché français / européen

#### Toucan Toco
- **Positionnement** : "Data storytelling" pour entreprises françaises
- **Forces** : Made in France, storytelling intégré, mobile-first, templates sectoriels
- **Faiblesses** : Pas un vrai outil BI (pas de requêtes, pas d'exploration), propriétaire, pricing opaque
- **Ce qui manque** : SQL, exploration, transformation, AI, open source

**Constat** : Il n'existe **aucun outil BI open source d'origine française** sur le marché. DataPilot a un positionnement unique.

---

## 4. Tableau Comparatif

### Matrice fonctionnelle

| Fonctionnalité | DataPilot | Metabase | Superset | Lightdash | Omni | Sigma | Hex |
|---|---|---|---|---|---|---|---|
| **Open source** | Oui (100%) | Open core | Oui (Apache) | Oui | Non | Non | Non |
| **Self-hostable** | Oui (Docker) | Oui | Oui | Oui | Non | Non | Non |
| **Semantic layer** | Intégré visuel | Basique | Non | dbt natif | Avancé (3 couches) | Non | Non |
| **AI / Text-to-SQL** | Claude API | Non | Non | Basique | Oui (MCP) | Basique | Oui (Magic) |
| **Chat conversationnel** | Oui | Non | Non | Non | Oui | Oui (Ask) | Oui |
| **Dashboard design** | Templates Omni-like | Basique | Correct | Basique | Excellent | Bon | Apps |
| **CSV-first** | Oui (DuckDB) | Limité | Non | Non | Non | Non | Oui |
| **Mode spreadsheet** | Oui | Non | Non | Non | Oui | Oui (natif) | Notebooks |
| **Transformation** | Intégrée | Non | Non | Via dbt | Intégrée | Formules | Python/SQL |
| **Formules type Excel** | Oui | Non | Non | Non | Oui | Oui | Non |
| **Onboarding rapide** | ~5 min (CSV) | ~5 min | ~30 min | ~1h (dbt requis) | ~30 min | ~30 min | ~15 min |
| **Pricing** | Gratuit (OSS) | Gratuit / $85/u | Gratuit | Gratuit / $50/u | Enterprise | Enterprise | $30/u+ |
| **Cible principale** | PME, startups, analysts | PME | Enterprise | Équipes dbt | Enterprise | Enterprise | Data teams |

### Positionnement prix

```
Gratuit          $30/u/mois          $75/u/mois          Enterprise ($$$)
│                │                   │                    │
├─ DataPilot     ├─ Hex              ├─ Tableau           ├─ Omni
├─ Metabase OSS  ├─ Lightdash Pro    ├─ Metabase Pro      ├─ Sigma
├─ Superset      │                   ├─ Power BI          ├─ Looker
├─ Redash        │                   │                    │
```

**DataPilot se positionne dans le segment gratuit/open source avec des fonctionnalités de niveau enterprise.**

---

## 5. Avantage Compétitif DataPilot

### La thèse : pourquoi DataPilot peut gagner

Le marché BI est mûr pour une disruption open source. Voici pourquoi :

1. **Metabase a prouvé qu'un outil simple pouvait prendre des parts de marché** (50K+ stars, des milliers d'entreprises). Mais Metabase n'a pas évolué : pas de semantic layer, pas de transformation, pas d'AI, design figé.

2. **Omni a prouvé que le modèle 3 couches (semantic + exploration + dashboard) est la bonne architecture**. Mais Omni est propriétaire et cher.

3. **L'AI a prouvé que le text-to-SQL fonctionne** quand il est grounded dans un semantic layer. Mais aucun outil open source n'intègre ça nativement.

4. **DuckDB a prouvé qu'on peut faire de l'analytics puissant en local** sans warehouse cloud. Mais aucun outil BI n'en fait son moteur principal.

DataPilot combine ces 4 innovations dans un produit open source unique.

### Les 5 piliers de différenciation

#### Pilier 1 : Open source & self-hostable

- **100% open source** — Code transparent, auditable, contribuable
- **Self-hostable** — Docker Compose, déployable sur n'importe quel serveur (OVH, AWS, on-premise)
- **Pas de vendor lock-in** — Les données restent chez l'utilisateur, les modèles sont exportables
- **Communauté** — Contributions, plugins, connecteurs développés par la communauté
- **Vs Metabase** : Open core avec features critiques verrouillées derrière le paywall (SSO, embedding, permissions)
- **Vs Omni/Sigma/Hex** : Propriétaires, cloud-only, données envoyées à un tiers

#### Pilier 2 : Simplicité radicale

- **Du CSV au dashboard en ~1h** — Upload CSV → auto-détection types → nettoyage → modèle → exploration → dashboard
- **Onboarding en 2 minutes** — Pas de warehouse à configurer, pas de dbt à installer, pas de pipeline à construire
- **Interface intuitive** — Inspirée de Tableau pour la puissance, mais simplifiée pour les non-techniques
- **Vs Tableau/Looker** : Des semaines de setup, formation obligatoire, consultant externe
- **Vs Superset** : Courbe d'apprentissage abrupte, configuration complexe
- **Vs Lightdash** : Requiert dbt (élimine 80% des PME)

#### Pilier 3 : AI-first

- **Text-to-SQL avec Claude API** — Questions en langage naturel → requêtes SQL précises
- **Grounded dans le semantic layer** — L'AI comprend les dimensions, mesures et relations métier (pas juste les colonnes brutes)
- **Chat intégré** — Conversation itérative avec les données, chaque réponse peut devenir un chart ou widget
- **Vs Metabase/Superset** : Pas d'AI
- **Vs Julius AI** : Pas de semantic layer, pas de dashboards persistants, pas open source
- **Vs Omni** : Similaire en concept (MCP + semantic), mais propriétaire

#### Pilier 4 : All-in-one

- **Transformation + semantic layer + exploration + dashboarding** dans un seul outil
- **Pas besoin de stack fragmentée** : dbt (transformation) + Metabase (viz) + notebook (exploration) + Claude (AI)
- **Workflow unifié** : les données circulent naturellement d'une étape à l'autre
- **Vs la stack moderne** (dbt + Metabase + Hex) : 3 outils, 3 factures, 3 comptes, 3 formations
- **Vs Omni** : Même philosophie all-in-one, mais open source et accessible aux PME

#### Pilier 5 : Approche hybride (SQL + formules + NLQ)

- **3 modes d'interaction** — Chaque utilisateur travaille comme il préfère :
  - **SQL** : pour les data analysts et developers
  - **Formules type spreadsheet** : pour les business analysts habitués à Excel
  - **Langage naturel** : pour les managers et non-techniques
- **Transition fluide** — Commencer en langage naturel → voir le SQL généré → affiner en SQL → sauvegarder comme modèle
- **Vs Omni** : Même approche hybride, mais open source
- **Vs Sigma** : Spreadsheet-only, pas de SQL ni NLQ intégrés
- **Vs Hex** : Notebooks complexes, pas de formules spreadsheet

### Résumé du positionnement

```
                        Complet (features)
                              │
                    Omni ●    │
                              │    DataPilot ●
                 Hex ●        │
                              │
    Complexe ─────────────────┼──────────────────── Simple
                              │
            Superset ●        │         ● Metabase
                              │
              Looker ●        │    ● Redash
                              │
                        Basique (features)

    DataPilot = Quadrant supérieur droit : complet ET simple
    (unique dans l'open source)
```

---

## 6. Fonctionnalités Clés Détaillées

### 6.1 Connexion aux sources

**Objectif** : Rendre l'import de données aussi simple qu'un glisser-déposer.

**MVP (Phase 1) :**
- Upload CSV par drag & drop (multi-fichier)
- Auto-détection des types de colonnes (string, number, date, boolean) via DuckDB
- Prévisualisation immédiate des données (pagination, tri)
- Conversion automatique en Parquet pour les performances
- Gestion des encodages (UTF-8, Latin-1, etc.)

**Phase 2 :**
- Connecteurs PostgreSQL et MySQL (connexion directe aux bases)
- Merge de fichiers CSV (union, join) via interface visuelle
- Scheduling de refresh pour les sources connectées
- Support Excel (.xlsx)

**Inspiration** :
- **TableAI** : interface drag & drop ultra-simple, détection automatique
- **Julius AI** : upload → preview → chat en 3 clics
- **Sigma** : spreadsheet-like view immédiate après import

### 6.2 Modèle sémantique et nettoyage

**Objectif** : Permettre de structurer et normaliser les données pour des analyses fiables, sans écrire de code.

**MVP (Phase 1) :**
- Définition de modèles sémantiques (dimensions, mesures, relations)
- Canvas ERD visuel (ReactFlow) pour visualiser les relations entre tables
- Configuration des joins entre sources (clé primaire / clé étrangère)
- Rôles de colonnes : dimension, measure, ignore
- Sauvegarde et versioning des modèles

**Phase 2 :**
- Nettoyage visuel : renommer colonnes, changer types, filtrer lignes nulles
- Calculated fields : formules dérivées (ex: `revenue = quantity * unit_price`)
- Agrégations par défaut sur les mesures (SUM, AVG, COUNT, MIN, MAX)
- Héritage de modèles : un modèle "gold" partagé, des vues personnalisées par utilisateur

**Inspiration** :
- **Omni Shared Model** : modèle en 3 couches (shared → workbook → dashboard), c'est le coeur de leur produit
- **dbt** : concepts de dimensions/measures/entities (MetricFlow), mais avec une interface visuelle
- **Cube.js** : pre-aggregations pour la performance, API standardisée

### 6.3 Exploration et calculs

**Objectif** : Permettre d'interroger les données de 3 manières différentes, avec transition fluide vers la visualisation.

**Mode SQL :**
- Éditeur SQL (CodeMirror 6) avec autocomplétion sur les tables/colonnes du semantic layer
- Exécution sur DuckDB (rapide, local)
- Résultats en table paginée (TanStack Table)
- Sauvegarde des requêtes pour réutilisation

**Mode Spreadsheet :**
- Vue tableur des données (tri, filtre, recherche)
- Formules type Excel sur les colonnes (SUM, IF, CONCAT, DATE functions)
- Agrégations visuelles en footer (somme, moyenne, count)
- Colonnes calculées ajoutables en live
- Export CSV/Excel

**Mode Langage Naturel :**
- Chat intégré : "Quel est le CA par région ce trimestre ?"
- Text-to-SQL via Claude API, grounded dans le semantic layer
- Affichage du SQL généré (transparent, éditable)
- Suggestion de charts adaptés au résultat

**Transition vers charts :**
- Depuis n'importe quel mode : bouton "Visualiser" → sélection type de chart → configuration axes
- Quick chart : détection automatique du meilleur type de chart selon les données
- Sauvegarde comme widget ou saved query

**Inspiration** :
- **Omni Workbook** : exploration multi-mode avec transition vers dashboard
- **Sigma** : formules spreadsheet sur données live
- **Hex Magic** : AI qui suggère des visualisations

### 6.4 Charts et dashboarding

**Objectif** : Construire des dashboards beaux et fonctionnels en quelques minutes.

**Types de charts (MVP) :**
- KPI cards (valeur + variation %)
- Bar charts (vertical, horizontal, stacked)
- Line charts (temporel, multi-séries)
- Pie / Donut charts
- Tables formatées (avec conditional formatting)

**Types de charts (Phase 2) :**
- Area charts
- Scatter plots
- Heatmaps
- Funnel charts
- Treemaps
- Geographic maps

**Dashboard builder :**
- Canvas drag & drop (react-grid-layout)
- Resize libre des widgets
- Filtres globaux (date range, dimensions) qui s'appliquent à tous les widgets
- Auto-refresh configurable
- Mode présentation (fullscreen)

**Design et templates :**
- **4 thèmes de couleurs** prêts à l'emploi :
  - `Ocean` — bleus et teals, professionnel et sobre
  - `Forest` — verts et earth tones, naturel
  - `Sunset` — oranges et warm tones, énergique
  - `Monochrome` — niveaux de gris, élégant et minimal
- Personnalisation des couleurs par widget ou global
- Typographie moderne (Inter, system fonts)
- Spacing et layout cohérents (design system)
- Dark mode

**Inspiration** :
- **Omni** : le benchmark en termes de design dashboard (couleurs, espacement, typographie)
- **Tableau** : puissance des visualisations, interactivité
- **Notion** : simplicité du drag & drop, blocks modulaires

### 6.5 Interaction avec les données (Chat)

**Objectif** : Permettre à n'importe qui d'interroger les données en langage naturel et d'agir sur les résultats.

**Fonctionnement :**
1. L'utilisateur pose une question en français ou anglais
2. Claude API reçoit : la question + le schéma du semantic layer (dimensions, mesures, relations, exemples de valeurs)
3. Claude génère une requête SQL optimisée pour DuckDB
4. La requête est exécutée, les résultats sont affichés en table
5. Claude suggère une visualisation adaptée
6. L'utilisateur peut : affiner la question, modifier le SQL, sauvegarder le résultat

**Actions sur les résultats :**
- "Ajouter au dashboard" → crée un widget avec la requête
- "Sauvegarder comme modèle" → saved query réutilisable
- "Exporter" → CSV, Excel, PNG du chart
- "Affiner" → continuer la conversation avec contexte

**Sécurité :**
- Requêtes read-only uniquement (pas de DROP, DELETE, INSERT)
- Timeout configurable (30s par défaut)
- Limit automatique sur les résultats (1000 lignes par défaut)
- Logs d'audit des requêtes AI

**Inspiration** :
- **Julius AI** : chat ultra-simple, résultats visuels immédiats
- **Omni MCP** : semantic layer comme contexte pour l'AI
- **Count** : exploration agentic autonome

### 6.6 Gouvernance et partage

**Objectif** : Permettre le travail en équipe avec des contrôles simples mais efficaces.

**Multi-tenant :**
- Isolation stricte par `tenant_id` sur toute requête (règle critique du projet)
- Chaque organisation a son espace isolé
- Données, modèles, dashboards et requêtes cloisonnés

**Partage (MVP) :**
- Dashboards partageables par lien (public / authentifié)
- Export PDF des dashboards
- Partage de saved queries au sein du workspace

**Partage (Phase 2) :**
- Rôles et permissions (viewer, editor, admin)
- Workspaces multiples par organisation
- Commentaires sur les dashboards et widgets
- Historique des modifications (audit trail)

**Phase 3 :**
- Embedded analytics (iframe avec token)
- API publique pour intégrations tierces
- SSO (SAML, OIDC)
- Data lineage visuel (d'où vient chaque métrique)

---

## 7. Roadmap Produit

### Phase 1 — MVP (En cours, ~30% fait)

**Objectif** : Prouver le concept end-to-end. Du CSV au dashboard avec AI.

| Feature | Statut | Sprint |
|---------|--------|--------|
| Auth + multi-tenant | Fait | Sprint 1 |
| CSV upload + DuckDB engine | Fait | Sprint 1 |
| Semantic layer CRUD (backend) | Fait | Sprint 1 |
| Frontend : sidebar, navigation | En cours | Sprint 2 |
| Frontend : upload CSV + preview | En cours | Sprint 2 |
| Semantic layer : ERD canvas | En cours | Sprint 3 |
| Semantic layer : joins visuels | En cours | Sprint 3 |
| SQL Explorer : éditeur + résultats | En cours | Sprint 4 |
| Saved queries : CRUD + liste | En cours | Sprint 4 |
| Dashboard builder : canvas + widgets | A faire | Sprint 5 |
| Dashboard : 5 types de charts | A faire | Sprint 5 |
| Dashboard : filtres globaux | A faire | Sprint 5 |
| Dashboard : 4 thèmes couleur | A faire | Sprint 5 |
| Mode spreadsheet basique | A faire | Sprint 6 |
| Text-to-SQL avec Claude API | A faire | Sprint 7 |
| Chat interface | A faire | Sprint 7 |
| Docker Compose + déploiement | A faire | Sprint 8 |

**Critère de succès MVP** : Un utilisateur peut uploader un CSV, créer un modèle sémantique, explorer en SQL/chat, et construire un dashboard design en moins d'une heure.

### Phase 2 — Core Features

**Objectif** : Devenir un outil BI complet et compétitif.

| Feature | Priorité | Effort estimé |
|---------|----------|---------------|
| Connecteurs PostgreSQL / MySQL | Haute | 2 semaines |
| Semantic layer avancé (calculated fields, agrégations par défaut) | Haute | 2 semaines |
| Dashboard templates design (8 thèmes + dark mode) | Haute | 1 semaine |
| Mode spreadsheet complet (formules, colonnes calculées) | Haute | 3 semaines |
| Chat conversationnel avancé (contexte multi-tour, suggestions) | Moyenne | 2 semaines |
| Export multi-format (PNG, PDF, CSV, XLSX) | Moyenne | 1 semaine |
| Onboarding wizard (guide premier dashboard) | Moyenne | 1 semaine |
| Notifications et alertes sur métriques | Basse | 2 semaines |

### Phase 3 — Growth

**Objectif** : Attirer une communauté et des utilisateurs avancés.

| Feature | Priorité | Effort estimé |
|---------|----------|---------------|
| Embedded analytics (iframe + SDK JavaScript) | Haute | 3 semaines |
| Intégration dbt (import/export de modèles) | Haute | 2 semaines |
| Collaboration (commentaires, mentions, partage avancé) | Haute | 3 semaines |
| Templates sectoriels (e-commerce, SaaS, retail, RH) | Moyenne | 2 semaines |
| API publique REST (pour intégrations tierces) | Moyenne | 2 semaines |
| Rôles et permissions avancés (RBAC) | Moyenne | 2 semaines |
| SSO (SAML, OIDC) | Moyenne | 2 semaines |
| Plugin system (connecteurs communautaires) | Basse | 4 semaines |

### Phase 4 — Long terme

**Objectif** : Devenir la référence BI open source.

| Feature | Description |
|---------|-------------|
| Connecteurs cloud | Snowflake, BigQuery, Databricks, Redshift |
| MCP Server | Exposer DataPilot comme outil pour Claude Code, ChatGPT, Cursor |
| Real-time dashboards | WebSocket pour données en streaming |
| Data lineage | Visualisation de l'origine de chaque métrique |
| Gouvernance avancée | Audit trail, data catalog, glossaire métier |
| Marketplace | Connecteurs, widgets, templates partagés par la communauté |
| Mobile app | Consultation dashboards sur mobile (PWA) |
| Multi-langue | i18n complet (FR, EN, ES, DE, PT) |

### Timeline indicative

```
2026 Q1-Q2    Phase 1 — MVP
              ├── Sprint 2-4 : Frontend CSV + Semantic + Explorer
              ├── Sprint 5-6 : Dashboard builder + Spreadsheet
              └── Sprint 7-8 : Chat AI + Deploy

2026 Q3-Q4    Phase 2 — Core Features
              ├── Connecteurs DB
              ├── Semantic layer avancé
              ├── Dashboard templates
              └── Mode spreadsheet complet

2027 H1       Phase 3 — Growth
              ├── Embedded analytics
              ├── dbt integration
              ├── Collaboration
              └── API publique

2027 H2+      Phase 4 — Long terme
              ├── Connecteurs cloud
              ├── MCP Server
              ├── Marketplace
              └── Mobile
```

---

## Annexe : Stack Technique

| Composant | Technologie | Justification |
|-----------|------------|---------------|
| Backend | Python 3.12 + FastAPI | Performance async, écosystème data Python, typage fort |
| Base de données | PostgreSQL 16 | Fiabilité, performance, extensions (pg_stat, etc.) |
| ORM | SQLAlchemy 2.0 + Alembic | Standard Python, migrations versionnées |
| Query engine | DuckDB | Analytics in-process, CSV/Parquet natif, SQL standard, ultra-rapide |
| AI | Claude API (Anthropic) | Meilleur modèle pour text-to-SQL, context window large, français natif |
| Frontend | Next.js 15 + React 18 + TypeScript | SSR, App Router, écosystème riche |
| UI | Tailwind CSS + shadcn/ui | Design system modulaire, composants accessibles |
| Charts | Recharts | React-natif, personnalisable, léger |
| Tables | TanStack Table | Headless, performant, tri/filtre/pagination |
| SQL Editor | CodeMirror 6 | Extensible, autocomplétion, thèmes |
| ERD | ReactFlow | Canvas interactif, nodes/edges, zoom/pan |
| Dashboard grid | react-grid-layout | Drag & drop, resize, responsive |
| Infra | Docker Compose | Déploiement simple, reproductible |
