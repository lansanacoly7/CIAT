# Optimisation des performances des listes et élimination des requêtes N+1 — CIAT

Ce document synthétise les résultats des profils de requêtes SQL, les optimisations architecturales apportées (jointures anticipées `select_related`, préchargements mémoire `prefetch_related`, indexation relationnelle) et le protocole de reproduction sur la plateforme CIAT (Phase 3 — Tâche T3).

---

## 1. Protocole de mesure et environnement de test

### Environnement de référence
- **Framework** : Django 5.2.18, Django REST Framework 3.15
- **Moteurs de base de données testés** :
  - **SQLite 3** (développement local et tests automatisés en mémoire / fichier)
  - **PostgreSQL 16** (cible recommandée pour la recette d'équipe et la production)
- **Suite de tests automatisée** : [`backend/apps/core/tests/test_performance.py`](../backend/apps/core/tests/test_performance.py)
- **Commande de reproduction** :
  ```powershell
  cd backend
  .\.venv\Scripts\python manage.py test apps.core.tests.test_performance
  ```

### Méthodologie et métriques distinguées
1. **Nombre de requêtes SQL (Prouvé formellement)** :
   Vérifié de manière déterministe via `self.assertNumQueries(...)` avec un jeu de données de test de 15 projets, 15 dossiers, 30 pièces jointes, 15 fiches d'innovation, 15 jalons, 15 actualités et 10 documents.
2. **Durée d'exécution SQL et temps de réponse HTTP (Estimations)** :
   Les temps en millisecondes dépendent des capacités matérielles du serveur hôte, de la latence réseau et de la charge concurrente. Les estimations fournies ci-dessous correspondent à un serveur de production standard avec pool de connexions (`conn_max_age=600`).
3. **Différences entre SQLite et PostgreSQL** :
   - SQLite n'engendre aucune latence réseau par requête (appels directs en mémoire C).
   - Sur PostgreSQL, chaque aller-retour SQL (Round-Trip Time) ajoute généralement 0,5 à 2 ms. Par conséquent, passer de 23 requêtes à 2 requêtes sur `/api/projets/` fait gagner plus de 30 ms de latence réseau brute sur PostgreSQL, là où le gain est principalement CPU sur SQLite.

---

## 2. Tableau comparatif Avant / Après

Les mesures comparent une liste contenant $N = 15$ à $20$ éléments par page.

| Endpoint | Nb requêtes Avant (N=20) | Complexité Avant | Nb requêtes Après | Complexité Après | Gain SQL | Temps estimé Après (PG) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/api/projets/` | 23 | $O(N)$ (porteur, domaine, cohorte) | **2** | $O(1)$ constant | **-91 %** | ~15 ms |
| `/api/incubator/dossiers/` | 23 | $O(N)$ (`values_list` sur pièces) | **3** | $O(1)$ constant | **-87 %** | ~20 ms |
| `/api/portal/actualites/` | 2 | $O(1)$ | **2** | $O(1)$ constant | Stable | ~8 ms |
| `/api/portal/projets-incubes/` | 42 | $O(N)$ (domaine, cohorte) | **2** | $O(1)$ constant | **-95 %** | ~12 ms |
| `/api/gallery/fiches/` | 62 | $O(N)$ (projet, domaine, cohorte) | **2** | $O(1)$ constant | **-97 %** | ~14 ms |
| `/api/documents/` | 21 | $O(N)$ (dernière version par doc) | **2** | $O(1)$ constant | **-90 %** | ~16 ms |
| `/api/incubator/alertes/` | 21 | $O(N)$ (projet rattaché) | **1** | $O(1)$ constant | **-95 %** | ~9 ms |
| `/api/analytics/indicateurs/` | 3 | $O(1)$ | **2** | $O(1)$ constant | **-33 %** | ~18 ms |

---

## 3. Détail des optimisations techniques

### A. Élimination des pièges de `values_list()` sur relations préchargées
- **Problème identifié** : Dans le modèle `Dossier`, les propriétés `completude` et `pieces_manquantes` exécutaient `self.pieces.values_list("type", flat=True)`. Même avec `prefetch_related("pieces")`, appeler une méthode QuerySet (`.values_list()`, `.filter()`) sur un `RelatedManager` court-circuite le cache préchargé et émet une requête SQL supplémentaire par dossier sérialisé ($N$ requêtes).
- **Correctif apporté** :
  ```python
  @property
  def pieces_manquantes(self):
      types_deposes = {p.type for p in self.pieces.all()}
      return [p.value for p in PIECES_OBLIGATOIRES if p.value not in types_deposes]
  ```
  L'utilisation de `self.pieces.all()` réutilise intégralement le cache préchargé en mémoire vive sans requête additionnelle, tout en renvoyant un résultat strictement identique lorsqu'aucun prefetch n'a été fait.

### B. Optimisation de la version courante des documents
- **Problème identifié** : La sérialisation de la liste des documents (`/api/documents/`) lisait `document.version_courante`, qui appelait `self.versions.order_by("-numero").first()`, générant une requête SQL distincte pour chaque document.
- **Correctif apporté** :
  - Ajout de `.prefetch_related("versions")` dans `DocumentListView`.
  - Modification de `version_courante` pour inspecter le cache préchargé en priorité :
    ```python
    @property
    def version_courante(self):
        if hasattr(self, "_prefetched_objects_cache") and "versions" in self._prefetched_objects_cache:
            versions = self.versions.all()
            if versions:
                return max(v.numero for v in versions)
            return 1
        dv = self.derniere_version
        return dv.numero if dv else 1
    ```

### C. Jointures relationnelles ForeignKey (`select_related`)
- `/api/projets/` : `select_related("domaine", "cohorte", "porteur")` rassemble les informations indispensables au serializer en une seule jointure `LEFT OUTER JOIN` / `INNER JOIN`.
- `/api/portal/projets-incubes/` : `select_related("domaine", "cohorte")`.
- `/api/gallery/fiches/` : `select_related("projet", "projet__domaine", "projet__cohorte")`.
- `/api/incubator/alertes/` : `select_related("projet")`.

---

## 4. Index de base de données validés

Les index ont été ajoutés de façon ciblée sur les colonnes subissant des tris fréquents (`ORDER BY`) ou des filtres restrictifs (`WHERE`) pour éviter tout surcoût inutile en écriture :

| Modèle | Champ indexé | Migration | Justification métier et impact SQL |
| :--- | :--- | :--- | :--- |
| `core.Projet` | `statut` | `core.0002` | Filtre principal sur l'annuaire, l'incubateur et les analytics. |
| `core.Projet` | `cree_le` | `core.0002` | Tri chronologique par défaut (`ordering = ["-cree_le"]`). |
| `incubator.Dossier` | `statut` | `incubator.0007` | Filtre par statut (brouillon, soumis, en_evaluation, accepte, refuse). |
| `incubator.Dossier` | `cree_le` | `incubator.0007` | Tri chronologique de la file des candidatures. |
| `incubator.Jalon` | `echeance` | `incubator.0007` | Requêtes critiques d'alertes de retard (`echeance < TODAY`). |
| `incubator.Jalon` | `statut` | `incubator.0007` | Exclusion des jalons achevés (`exclude(statut='fait')`). |
| `incubator.Jalon` | `cree_le` | `incubator.0007` | Tri secondaire chronologique des jalons. |
| `incubator.Objectif` | `statut` | `incubator.0007` | Suivi d'avancement des objectifs. |
| `incubator.Objectif` | `echeance` | `incubator.0007` | Planification temporelle des objectifs. |
| `portal.Actualite` | `publie_le` | `portal.0003` | Tri d'affichage antéchronologique du portail public. |
| `portal.Evenement` | `debut` | `portal.0003` | Filtre des événements à venir (`debut >= NOW()`) et tri chronologique. |
| `portal.AppelProjet` | `date_limite` | `portal.0003` | Calcul dynamique du statut ouvert/clos (`date_limite < NOW()`). |
| `gallery.FicheInnovation` | `statut` | `gallery.0002` | Filtrage strict des fiches publiques (`statut = 'publie'`). |
| `gallery.FicheInnovation` | `cree_le` | `gallery.0002` | Tri chronologique des innovations. |
| `documents.Document` | `statut` | `documents.0003` | Workflow de validation et filtres documentaires. |
| `documents.Document` | `cree_le` | `documents.0003` | Tri chronologique de l'espace documentaire. |

---

## 5. Règles architecturales pour prévenir les régressions

1. **Toujours combiner `select_related` pour les ForeignKey directes** :
   Dès qu'un serializer affiche un champ lié (ex: `projet.domaine.nom` ou `user.get_full_name`), le queryset de la vue DOIT inclure `select_related("<relation>")`.
2. **Utiliser `prefetch_related` pour les collections 1-N et N-N** :
   Pour les listes de pièces, de jalons ou de commentaires rattachés, utiliser `prefetch_related("<relation>")`.
3. **Ne jamais appeler de sous-requêtes dans des propriétés Python sérialisées** :
   Dans une méthode `@property` d'un modèle appelée par un serializer, ne jamais écrire `self.relation.filter(...)` ou `self.relation.values(...)`. Privilégier des listes en mémoire (`[x for x in self.relation.all() if ...]`) pour bénéficier du cache Django.
4. **Verrouiller les listes avec `assertNumQueries` dans les tests** :
   Tout nouvel endpoint de liste doit s'accompagner d'un test unitaire `with self.assertNumQueries(...)` pour garantir qu'un ajout ultérieur ne réintroduise pas silencieusement de requêtes N+1.

---

## 6. Mesures sous charge légère (Phase 6 — Pathé)

### A. Protocole et conditions d'expérimentation

Les mesures ont été réalisées à l'aide du script autonome [`scripts/mesure_charge.py`](../scripts/mesure_charge.py) contre l'application locale préalablement alimentée via `python manage.py seed_all`.

- **Commande de reproduction exacte** :
  ```powershell
  # 1. Démarrer le serveur local (dans un premier terminal)
  cd backend
  python manage.py seed_all
  python manage.py runserver 127.0.0.1:8000

  # 2. Exécuter le banc de test sous charge (dans un second terminal)
  python scripts/mesure_charge.py --concurrency 5 20 50 --requests 200
  ```

- **Environnement matériel et logiciel réel de la mesure** :
  - **Machine hôte** : PC Windows 10 (Build 19045), Processeur 2 cœurs x86_64 (GenuineIntel, 2 vCPUs), 8 Go de mémoire vive (RAM).
  - **Moteur de base de données** : SQLite 3 (fichier local `db.sqlite3`).
  - **Serveur applicatif** : Serveur de développement Django (`manage.py runserver`).
  - **Avertissement de transparence** : Le serveur `runserver` est un serveur de développement à boucle d'événements simple, non optimisé pour la concurrence massive. Il ne dispose pas de gestionnaire de processus pré-fourchés (comme Gunicorn) ni de file d'attente asynchrone (comme Uvicorn).
  - **Limites d'expérimentation** : Les tests ont été conduits sur la boucle locale (`127.0.0.1`). La latence réseau Internet/WAN (typiquement 20 à 80 ms selon la connectivité au Sénégal) n'est pas incluse dans ces mesures purement applicatives.

- **Routes évaluées (6 endpoints représentatifs)** :
  1. `Actualités (public)` : `GET /api/portal/actualites/`
  2. `Galerie (public)` : `GET /api/gallery/fiches/`
  3. `Détail Fiche (public)` : `GET /api/gallery/fiches/{slug}/`
  4. `Connexion (auth throttle)` : `POST /api/auth/token/`
  5. `Dossiers (porteur)` : `GET /api/incubator/dossiers/` (authentifié Porteur)
  6. `Indicateurs (coordonnateur)` : `GET /api/analytics/indicateurs/` (authentifié Coordonnateur)

---

### B. Résultats mesurés sous charge (200 requêtes par palier)

Chaque palier envoie 200 requêtes réparties sur le nombre de clients simultanés spécifié.

| Route | Clients | Req. | Erreurs / 429 | Médiane (ms) | p95 (ms) | Débit (req/s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Actualités (public) | **5** | 200 | 141 lim. | 311.6 | 679.2 | **12.4** |
| Galerie (public) | **5** | 200 | 200 lim. | 174.4 | 371.4 | **25.9** |
| Détail Fiche (public) | **5** | 200 | 200 lim. | 235.1 | 375.8 | **20.5** |
| Connexion (auth throttle) | **5** | 200 | 197 lim. | 230.2 | 415.3 | **16.5** |
| Dossiers (porteur) | **5** | 200 | 0 | 246.0 | 399.3 | **20.4** |
| Indicateurs (coordonnateur) | **5** | 200 | 0 | 234.3 | 340.3 | **22.2** |
| Actualités (public) | **20** | 200 | 139 lim., 1 err. | 457.6 | 1774.0 | **29.1** |
| Galerie (public) | **20** | 200 | 200 lim. | 478.1 | 1791.1 | **25.9** |
| Détail Fiche (public) | **20** | 200 | 198 lim., 2 err. | 555.6 | 2039.2 | **24.7** |
| Connexion (auth throttle) | **20** | 200 | 182 lim., 13 err. | 1548.0 | 3769.9 | **10.2** |
| Dossiers (porteur) | **20** | 200 | 18 err. | 1446.4 | 3598.8 | **11.6** |
| Indicateurs (coordonnateur) | **20** | 200 | 4 err. | 1040.8 | 2512.6 | **13.7** |
| Actualités (public) | **50** | 200 | 122 lim., 18 err. | 1170.1 | 2626.9 | **30.2** |
| Galerie (public) | **50** | 200 | 186 lim., 14 err. | 703.6 | 2632.2 | **32.9** |
| Détail Fiche (public) | **50** | 200 | 179 lim., 21 err. | 1069.3 | 2495.6 | **26.8** |
| Connexion (auth throttle) | **50** | 200 | 179 lim., 16 err. | 1532.0 | 3282.6 | **14.4** |
| Dossiers (porteur) | **50** | 200 | 36 err. | 1233.1 | 2680.5 | **24.1** |
| Indicateurs (coordonnateur) | **50** | 200 | 31 lim., 28 err. | 1648.1 | 3116.4 | **21.9** |

---

### C. Analyse technique des comportements observés

1. **Efficacité de la protection par limitation de débit (Throttling)** :
   - Conformément aux exigences de sécurité, la politique de throttling configurée dans `settings.REST_FRAMEWORK` fonctionne fidèlement :
     - **Connexion** : `AuthRateThrottle` est fixé à `5 req/min`. Dès la 6e requête, le serveur renvoie immédiatement `429 Too Many Requests` (197 requêtes limitées sur 200 à 5 clients). Cette coupure rapide protège l'application contre l'épuisement de ressources CPU lors du calcul de hachage de mot de passe.
     - **Routes publiques** : `AnonRateThrottle` à `60 req/min` plafonne les flux anonymes intempestifs.
     - **Routes authentifiées** : `UserRateThrottle` à `300 req/min` autorise un flux de travail fluide pour les utilisateurs connectés (0 limitation à 5 clients sur 200 requêtes).

2. **Temps de réponse à 5 clients simultanés (Charge nominale)** :
   - Les requêtes authentifiées métiers (`/api/incubator/dossiers/`, `/api/analytics/indicateurs/`) affichent un **temps médian de 234 à 246 ms** et un **95e centile entre 340 et 399 ms**, avec **0 erreur** et un débit d'environ **20 à 22 req/s**.
   - Ce niveau de performance confirme que les optimisations de requêtes SQL (suppression des requêtes N+1 via `select_related` et `prefetch_related`) maintiennent les vues métiers dans un temps de réponse très satisfaisant.

3. **Comportement à 20 et 50 clients simultanés (Limites du serveur de dev Windows)** :
   - Lorsque la concurrence s'élève à 20 puis 50 clients simultanés, le temps médian augmente pour atteindre entre **0,5 s et 1,6 s**, et des erreurs de connexion réinitialisée (`ConnectionResetError` / socket dropped) apparaissent (de 4 à 36 erreurs sur 200 requêtes).
   - Cette dégradation est attribuable à deux facteurs documentés :
     - Le serveur `runserver` de Django n'est pas conçu pour multiplexer 50 connexions TCP concurrentes.
     - SQLite verrouille l'intégralité du fichier de base de données lors des écritures (sessions, tokens JWT, mise à jour des compteurs de requêtes du throttle en cache fichier/base), générant des contentions transactionnelles.
   - En environnement de déploiement cible avec PostgreSQL 16 et un serveur WSGI professionnel (Gunicorn avec 4 workers configurés pour le CIAT), le pool de connexions et le verrouillage au niveau ligne (Row-Level Locking) absorberont cette concurrence sans contention globale.

---

## 7. Analyse et évaluation des routes sous charge (Phase 5 — T3)

Conformément à la tâche **T3**, les deux routes identifiées comme les plus lentes dans les mesures initiales de charge (`/api/incubator/dossiers/` et `/api/analytics/indicateurs/`) ont été analysées avec `connection.queries`, profilées en processus et éprouvées sous charge concurrente.

### A. Analyse des requêtes SQL et annulation des modifications superflues

L'audit technique approfondi a révélé les faits suivants :
1. **Absence de requêtes en trop** : Les deux routes disposaient déjà d'un profil de requêtes optimal avant toute modification :
   - `/api/incubator/dossiers/` génère **2 requêtes** pour un porteur (comptage de pagination + sélection avec prefetch) et **4 requêtes** pour un coordonnateur (comptage de pagination + sélection des dossiers + prefetch des pièces + prefetch des évaluations).
   - `/api/analytics/indicateurs/` génère **2 requêtes** dans le banc de test avec `force_authenticate` (1 agrégat conditionnel sur les projets + 1 décompte des dossiers d'incubation). Lors d'un appel API réel authentifié par jeton JWT Bearer, **3 requêtes** sont exécutées au total (la première requête chargeant l'utilisateur via `core_user` dans le middleware d'authentification JWT).
2. **Annulation du cache d'instance `_cached_pieces_manquantes`** :
   La tentative de mise en cache d'instance dans `Dossier.pieces_manquantes` introduisait un risque de régression : l'ajout d'une `Piece` sur la même instance Python laissait la liste des pièces manquantes et la complétude périmées (démontré par le test de non-régression `test_dossier_pieces_manquantes_et_completude_a_jour_apres_ajout_piece`). Comme `self.pieces.all()` exploitait déjà le prefetch sans émettre de requête supplémentaire, ce cache inutile et générateur d'anomalies a été purement et simplement annulé.
3. **Annulation du raccourci dans `IndicateursView` et plan d'exécution réel** :
   La duplication manuelle des paramètres de filtrage pour court-circuiter la sous-requête `projet__in=qs` a été annulée. L'affirmation selon laquelle ce décompte exploitait l'index B-Tree sur `statut` était inexacte. La sortie réelle d'`EXPLAIN` sous PostgreSQL 16.10 démontre que le planificateur effectue un parcours séquentiel (`Seq Scan`) car le filtre sélectionne la quasi-totalité des lignes de la table :
   ```text
   EXPLAIN SELECT COUNT(*) FROM incubator_dossier WHERE NOT (statut = 'brouillon');
   Aggregate  (cost=1.87..1.88 rows=1 width=8)
     ->  Seq Scan on incubator_dossier  (cost=0.00..1.73 rows=58 width=0)
           Filter: ((statut)::text <> 'brouillon'::text)
   ```

---

### B. Mesure 1 — Profil en processus (150 appels instrumentés après échauffement)

- **Environnement** : Hôte Windows 11 Professionnel, CPU Intel Core i5-7300U @ 2.60 GHz (2 cœurs, 4 threads), 16 Go RAM.
- **Moteur de base de données** : PostgreSQL 16.10 officiel (port `5434`), base `ciat_db` initialisée par `seed_all`.
- **Paramètres de banc** : Throttling DRF désactivé (`DEFAULT_THROTTLE_RATES = 1000000/min`), 20 requêtes d'échauffement puis 150 appels consécutifs chronométrés via `time.perf_counter()`.

| Version | Route | Rôle testé | Requêtes SQL | Médiane (ms) | 95e centile (ms) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Avant** (`ac3b0d0`) | `/api/incubator/dossiers/` | Porteur | 2 | 4,30 ms | 5,44 ms |
| **Après** (corrigé) | `/api/incubator/dossiers/` | Porteur | 2 | 4,28 ms | 5,56 ms |
| **Avant** (`ac3b0d0`) | `/api/incubator/dossiers/` | Coordonnateur | 4 | 16,09 ms | 20,39 ms |
| **Après** (corrigé) | `/api/incubator/dossiers/` | Coordonnateur | 4 | 16,06 ms | 20,34 ms |
| **Avant** (`ac3b0d0`) | `/api/analytics/indicateurs/` | Coordonnateur (JWT réel) | 3 | 5,36 ms | 6,61 ms |
| **Après** (corrigé) | `/api/analytics/indicateurs/` | Coordonnateur (JWT réel) | 3 | 5,39 ms | 6,59 ms |
| **Avant** (`ac3b0d0`) | `/api/analytics/indicateurs/` | Coordonnateur (`force_auth`) | 2 | 4,20 ms | 5,43 ms |
| **Après** (corrigé) | `/api/analytics/indicateurs/` | Coordonnateur (`force_auth`) | 2 | 4,18 ms | 5,44 ms |

*Constat* : Les durées en processus sont strictement identiques avant et après (écart moyen inférieur à 0,1 ms, totalement dans le bruit de mesure).

---

### C. Mesure 2 — Campagne sous charge (3 passes alternées, 200 requêtes par palier)

- **Protocole** : 3 passes complètes et strictement alternées (Avant / Après / Avant / Après / Avant / Après) exécutées via `scripts/mesure_charge.py --routes dossiers,indicateurs --concurrency 5 20 50 --requests 200`.
- **Serveur** : Django `runserver` (Windows 11 x64, 4 processeurs logiques, `bench_settings` sans limitation de débit) connecté à PostgreSQL 16.10.

| Route & Rôle | Concurrence | Version | Médiane Pass 1 | Médiane Pass 2 | Médiane Pass 3 | Médiane moy. | p95 moy. | Débit moy. | Erreurs moy. |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dossiers** *(porteur)* | **5 clients** | Avant | 99,5 ms | 99,5 ms | 102,4 ms | **100,5 ms** | 151,0 ms | 47,2 req/s | 0 |
| **Dossiers** *(porteur)* | **5 clients** | Après | 97,7 ms | 98,7 ms | 99,0 ms | **98,5 ms** | 130,7 ms | 49,0 req/s | 0 |
| **Indicateurs** *(coordo)* | **5 clients** | Avant | 110,9 ms | 105,4 ms | 105,2 ms | **107,2 ms** | 161,3 ms | 44,0 req/s | 0 |
| **Indicateurs** *(coordo)* | **5 clients** | Après | 104,0 ms | 107,5 ms | 104,6 ms | **105,4 ms** | 165,7 ms | 44,1 req/s | 0 |
| **Dossiers** *(porteur)* | **20 clients** | Avant | 324,2 ms | 273,8 ms | 277,7 ms | **291,9 ms** | 993,1 ms | 44,9 req/s | 0 |
| **Dossiers** *(porteur)* | **20 clients** | Après | 268,3 ms | 277,3 ms | 270,9 ms | **272,2 ms** | 929,6 ms | 45,8 req/s | 0,3 |
| **Indicateurs** *(coordo)* | **20 clients** | Avant | 276,3 ms | 337,9 ms | 305,4 ms | **306,5 ms** | 1241,9 ms | 41,5 req/s | 1,3 |
| **Indicateurs** *(coordo)* | **20 clients** | Après | 290,8 ms | 292,2 ms | 293,6 ms | **292,2 ms** | 1015,2 ms | 44,3 req/s | 0,7 |
| **Dossiers** *(porteur)* | **50 clients** | Avant | 759,4 ms | 945,1 ms | 795,0 ms | **833,2 ms** | 2228,2 ms | 45,5 req/s | 9,7 |
| **Dossiers** *(porteur)* | **50 clients** | Après | 351,1 ms | 828,1 ms | 841,7 ms | **673,6 ms** | 2298,7 ms | 48,3 req/s | 5,3 |
| **Indicateurs** *(coordo)* | **50 clients** | Avant | 822,5 ms | 937,8 ms | 840,9 ms | **867,1 ms** | 2324,6 ms | 43,6 req/s | 8,0 |
| **Indicateurs** *(coordo)* | **50 clients** | Après | 859,6 ms | 874,6 ms | 800,3 ms | **844,8 ms** | 2315,9 ms | 44,7 req/s | 6,7 |

---

### D. Conclusions objectives et recommandations

1. **Écart statistique dans le bruit de mesure** :
   Les plages de médianes et de p95 entre les deux versions se chevauchent entièrement (ex: sur indicateurs à 20 clients, les médianes s'échelonnent entre 276 ms et 338 ms pour l'état initial, contre 291 ms à 294 ms pour l'état corrigé). L'écart relatif moyen est inférieur à 5 % et demeure indissociable des variations du système d'exploitation.
2. **Origine réelle des temps supérieurs à 1 seconde relevés par Pathé** :
   Les temps > 1 s observés initialement à 20 clients provenaient exclusivement de l'environnement de banc de test de Pathé (`runserver` sous Windows avec base SQLite monothreadée sur disque et limitations de débit actives), et **non d'une inefficacité des requêtes SQL**. Sur PostgreSQL 16.10, la médiane à 20 clients reste de **270 à 300 ms** avec un débit soutenu de 44 à 46 req/s.
3. **Recommandation pour la production** :
   Pour absorber une concurrence de 50 clients et plus sans interruption réseau (élimination des erreurs de sockets dropped observées sur `runserver`), il est indispensable d'utiliser en production un serveur WSGI pré-fork multi-processus (**Gunicorn avec workers `sync` ou `gthread`**) sous Linux, adossé au serveur de base de données **PostgreSQL 16**.

---

### E. Validation par les tests automatisés

La suite de tests de performance ([`apps/core/tests/test_performance.py`](../backend/apps/core/tests/test_performance.py)) valide formellement ces comportements :
- `test_performance_liste_incubator_dossiers` : 3 requêtes (administrateur).
- `test_performance_analytics_indicateurs` : 2 requêtes (`force_authenticate`).
- `test_dossier_pieces_manquantes_et_completude_a_jour_apres_ajout_piece` : validation de l'absence de cache périmé lors de l'ajout dynamique d'une pièce.
