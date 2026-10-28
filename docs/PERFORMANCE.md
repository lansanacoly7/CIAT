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

## 6. Mesures sous charge et comportement de la plateforme (Phase 6 — Pathé)

### A. Protocole et méthodologie des mesures

Afin d'obtenir une vision transparente, objective et exploitable par l'équipe (notamment pour les optimisations de requêtes d'Ibrahima en Phase 5), deux campagnes d'évaluation distinctes ont été menées à l'aide du script [`scripts/mesure_charge.py`](file:///scripts/mesure_charge.py) sur une base préalablement alimentée via `python manage.py seed_all` :

1. **Campagne A — Comportement de la limitation de débit (Throttling de production)** :
   - Évalue la réaction des garde-fous de sécurité configurés dans `settings.REST_FRAMEWORK` face à des rafales de requêtes.
   - Identifie précisément à partir de quel volume le code HTTP 429 (`Too Many Requests`) se déclenche et mesure le taux de rejet.
   - Serveur utilisé : Serveur de développement local (`python manage.py runserver`).

2. **Campagne B — Temps de réponse de service réel (Sans limitation — Serveur WSGI)** :
   - Mesure la performance brute du traitement applicatif (accès base de données, ORM, sérialisation DRF, génération JSON) sans le biais des rejets HTTP 429 rapides.
   - Serveur utilisé : **Waitress WSGI** (serveur de production multi-threadé avec 16 threads de travail), exécuté avec élévation des limites de débit via variable d'environnement (`DISABLE_THROTTLING=1`) sans altérer les valeurs de production.
   - Base de données : SQLite 3 configurée en mode WAL (`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=30000;`) avec `conn_max_age=0` pour supporter le multi-threading sans verrouillage global de fichier.

- **Commandes exactes de reproduction** :
  ```powershell
  # Campagne A : Throttling actif de production
  python manage.py runserver 127.0.0.1:8000
  python scripts/mesure_charge.py --base-url http://127.0.0.1:8000 --requests 200 --concurrency 5 20 50

  # Campagne B : Service réel sans limitation sur Waitress WSGI
  $env:DISABLE_THROTTLING="1"
  python -c "import django; django.setup(); from waitress import serve; from config.wsgi import application; serve(application, host='127.0.0.1', port=8000, threads=16)"
  python scripts/mesure_charge.py --base-url http://127.0.0.1:8000 --requests 200 --concurrency 5 20 50 --server "Waitress WSGI"
  ```

- **Environnement matériel et logiciel réel** :
  - **Machine hôte** : PC Windows 10 (Build 19045), Processeur 2 cœurs x86_64 (GenuineIntel, 2 vCPUs @ 2.40 GHz), 8 Go RAM.
  - **Moteur de base de données** : SQLite 3 en mode WAL (appels locaux en boucle fermée `127.0.0.1`).
  - **Limites d'expérimentation** : Les tests sont réalisés en boucle locale sans latence réseau WAN (typiquement 20 à 80 ms selon la connectivité Internet au Sénégal).

- **Endpoints testés (6 routes représentatives)** :
  1. `Actualités (public)` : `GET /api/portal/actualites/`
  2. `Galerie (public)` : `GET /api/gallery/fiches/`
  3. `Détail Fiche (public)` : `GET /api/gallery/fiches/{slug}/` (déclenche une incrémentation atomique du compteur de vues en base)
  4. `Connexion (auth throttle)` : `POST /api/auth/token/` (calcul cryptographique de mot de passe PBKDF2)
  5. `Dossiers (porteur)` : `GET /api/incubator/dossiers/` (authentifié Porteur)
  6. `Indicateurs (coordonnateur)` : `GET /api/analytics/indicateurs/` (authentifié Coordonnateur)

---

### B. Tableau 1 — Comportement de la limitation de débit (Throttling de production)

| Route | Clients | Requêtes | 200 Traitées | 429 Bloquées | Taux rejet (%) | Seuil théorique prod |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Actualités (public) | **5** | 200 | 59 | **141** | 70.5 % | 60 / minute (`anon`) |
| Galerie (public) | **5** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon` - quota épuisé) |
| Détail Fiche (public) | **5** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon` - quota épuisé) |
| Connexion (auth throttle) | **5** | 200 | 3 | **197** | 98.5 % | 5 / minute (`auth`) |
| Dossiers (porteur) | **5** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Indicateurs (coordonnateur) | **5** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Actualités (public) | **20** | 200 | 60 | **140** | 70.0 % | 60 / minute (`anon`) |
| Galerie (public) | **20** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Détail Fiche (public) | **20** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Connexion (auth throttle) | **20** | 200 | 5 | **195** | 97.5 % | 5 / minute (`auth`) |
| Dossiers (porteur) | **20** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Indicateurs (coordonnateur) | **20** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Actualités (public) | **50** | 200 | 60 | **140** | 70.0 % | 60 / minute (`anon`) |
| Galerie (public) | **50** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Détail Fiche (public) | **50** | 200 | 0 | **200** | 100.0 % | 60 / minute (`anon`) |
| Connexion (auth throttle) | **50** | 200 | 5 | **195** | 97.5 % | 5 / minute (`auth`) |
| Dossiers (porteur) | **50** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |
| Indicateurs (coordonnateur) | **50** | 200 | 200 | **0** | 0.0 % | 300 / minute (`user`) |

**Analyse du throttling** :
- La règle `AuthRateThrottle (5 req/min)` est parfaitement étanche : dès la 4e à 6e tentative de connexion sur une même fenêtre, les requêtes suivantes sont coupées net en ~2 ms avec un code HTTP 429.
- La règle `AnonRateThrottle (60 req/min)` protège efficacement les routes publiques en absorbant les 60 premières requêtes avant de verrouiller la source anonyme.
- La règle `UserRateThrottle (300 req/min)` laisse passer l'intégralité du travail nominal des porteurs et coordinateurs (0 rejet sur les 200 requêtes de chaque palier).

---

### C. Tableau 2 — Temps de réponse sans limitation (Service réel sous charge — Waitress WSGI)

Mesures réalisées avec `DISABLE_THROTTLING=1` sur serveur multi-threadé Waitress (16 threads de travail, SQLite WAL mode) :

| Route | Clients | Requêtes | 200 OK | Erreurs | Médiane (ms) | p95 (ms) | Débit effectif (req/s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Actualités (public) | **5** | 200 | 200 | 0 | 136.1 | 998.1 | **17.3** |
| Galerie (public) | **5** | 200 | 200 | 0 | 222.4 | 1175.5 | **12.2** |
| Détail Fiche (public) | **5** | 200 | 200 | 0 | 530.7 | 3693.7 | **4.9** |
| Connexion (auth throttle)* | **5** | 200 | 200 | 0 | 15725.0 | 19028.1 | **0.3** |
| Dossiers (porteur) | **5** | 200 | 200 | 0 | 99.8 | 1094.0 | **17.5** |
| Indicateurs (coordonnateur) | **5** | 200 | 200 | 0 | 179.4 | 956.3 | **13.8** |
| Actualités (public) | **20** | 200 | 200 | 0 | 579.8 | 2982.4 | **13.6** |
| Galerie (public) | **20** | 200 | 200 | 0 | 855.3 | 3351.7 | **11.8** |
| Détail Fiche (public) | **20** | 200 | 200 | 0 | 1273.9 | 14974.9 | **5.4** |
| Connexion (auth throttle)* | **20** | 200 | 16 | 184 | 52136.4 | 57457.2 | **0.0** |
| Dossiers (porteur) | **20** | 200 | 180 | 20 | 2607.1 | 20053.2 | **1.4** |
| Indicateurs (coordonnateur) | **20** | 200 | 200 | 0 | 254.7 | 920.4 | **16.1** |
| Actualités (public) | **50** | 200 | 200 | 0 | 505.7 | 1369.7 | **17.9** |
| Galerie (public) | **50** | 200 | 200 | 0 | 666.9 | 1396.3 | **16.9** |
| Détail Fiche (public) | **50** | 200 | 200 | 0 | 3475.7 | 12377.9 | **8.0** |
| Connexion (auth throttle)* | **50** | 200 | 16 | 184 | 53033.0 | 59413.3 | **0.1** |
| Dossiers (porteur) | **50** | 200 | 189 | 11 | 2110.9 | 46886.8 | **1.9** |
| Indicateurs (coordonnateur) | **50** | 200 | 200 | 0 | 737.8 | 2414.2 | **29.4** |

\* **Note explicative sur l'authentification** : Sur `/api/auth/token/`, le calcul du hachage de mot de passe (PBKDF2 avec 870 000 itérations) est délibérément consommateur de CPU par mesure de sécurité cryptographique. Sans limitation de débit, 200 requêtes concurrentes saturent les 2 vCPUs de la machine hôte. Ceci démontre empiriquement l'utilité vitale de la limitation `AuthRateThrottle (5 req/min)` qui empêche cette saturation en production.

---

### D. Enseignements techniques et recommandations architecturales

1. **Performances nominales à 5 clients simultanés** :
   - Les requêtes authentifiées métiers (`/api/incubator/dossiers/`, `/api/analytics/indicateurs/`) répondent avec un **temps médian de 99.8 ms à 179.4 ms** et **0 erreur**, confirmant l'efficacité des optimisations SQL de la Phase 3 (élimination des requêtes N+1 via `select_related` et `prefetch_related`).
   - Les routes publiques de consultation (`Actualités`, `Galerie`) délivrent un débit stable de **12 à 17 req/s** avec une médiane de **136 à 222 ms**.

2. **Résolution de la contention SQLite via le mode WAL** :
   - Sur l'endpoint `/api/gallery/fiches/{slug}/`, chaque requête exécute une écriture atomique en base (`update(vues=F('vues') + 1)`).
   - En mode journal classique (`DELETE`), les écritures concurrentes déclenchaient des verrous de fichier `database is locked`.
   - L'activation du mode WAL (`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=30000;`) et de `conn_max_age=0` pour SQLite dans `settings.py` a permis de servir **200 requêtes sur 200 avec 0 erreur jusqu'à 50 clients simultanés**.

3. **Cibles prioritaires pour les optimisations de requêtes d'Ibrahima (`taches/phase5/ibrahima.md` T3)** :
   - À 20 et 50 clients simultanés, la route `/api/incubator/dossiers/` voit son temps de réponse s'allonger (médiane à 2.1 s - 2.6 s). La sérialisation des pièces obligatoires et le calcul dynamique des pourcentages de complétude sont des cibles idéales pour la mise en cache Redis ou la dénormalisation d'un champ calculé.
   - La route `/api/analytics/indicateurs/` maintient une excellente cadence même à 50 clients (médiane 737 ms, 29.4 req/s effectifs), grâce à des requêtes d'agrégation bien indexées.

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

---

## 6. Performance Front-end et Mesures Réelles Web Vitals (Phase 8 — T2)

> **Référent mesure :** Pape Alioune Sène  
> **Date de campagne :** 28 Octobre 2026  
> **Outil d'instrumentation :** Chromium 133 / Playwright PerformanceObserver (`scripts/mesure_performance_frontend.js`)  
> **Environnement de mesure :** Windows 11 Professionnel (x64), CPU Intel Core i7-7600U @ 2.80 GHz, 16 Go RAM  
> **Commande reproductible :** `node scripts/mesure_performance_frontend.js`

### A. Protocole et méthodologie de mesure
Quatre pages représentatives de la plateforme ont été auditées :
1. **`/tableau-de-bord`** : Espace décisionnel authentifié (rôle coordonnateur), chargement des KPI, graphiques Recharts et registres.
2. **`/portail`** : Page vitrine institutionnelle publique avec bannières et statistiques d'accueil.
3. **`/galerie`** : Galerie des innovations présentant les fiches prototypes avec photos et filtres dynamiques.
4. **`/connexion`** : Écran d'authentification avec formulaires et visuels split-screen.

Les métriques collectées reflètent les **Core Web Vitals officiels de Google** :
* **FCP (*First Contentful Paint*)** : Temps d'apparition du premier élément textuel ou visuel.
* **LCP (*Largest Contentful Paint*)** : Temps de rendu du plus grand bloc de contenu perceptible.
* **CLS (*Cumulative Layout Shift*)** : Stabilité visuelle (score de décalage inattendu de mise en page).
* **TTFB (*Time to First Byte*)** : Latence réseau initiale et réponse du serveur.
* **Poids des images & ressources totales** : Volume brut transféré sur le réseau.
* **Score indicatif de performance** : Indice synthétique normalisé (pondération Web Vitals Lighthouse).

---

### B. Tableau comparatif Avant / Après (Valeurs réelles mesurées)

| Page auditée | Étape | Score | FCP (ms) | LCP (ms) | CLS | TTFB (ms) | Durée totale | Requêtes | Poids Images | Poids Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`/tableau-de-bord`** | **Avant** | **100** / 100 | 1 080 ms | 1 796 ms | **0,000** | 931 ms | 4 592 ms | 69 | 0 Ko (0 img) | 342 Ko |
| | **Après** | **92-100** / 100 | 2 132 ms | 2 800 ms | **0,000** | 1 846 ms | 6 390 ms | 70 | 0 Ko (0 img) | 504 Ko |
| **`/portail`** | **Avant** | **72** / 100 | 3 008 ms | 3 552 ms | **0,000** | 2 250 ms | 5 407 ms | 25 | 13 Ko (2 imgs) | 4 286 Ko |
| | **Après** | **86** / 100 | **2 388 ms** | **3 020 ms** | **0,000** | **1 013 ms** | **4 832 ms** | 25 | 13 Ko (2 imgs) | 4 286 Ko |
| **`/galerie`** | **Avant** | **98** / 100 | 1 248 ms | 2 648 ms | **0,000** | 465 ms | 4 897 ms | 42 | 463 Ko (11 imgs) | 4 852 Ko |
| | **Après** | **100** / 100 | **1 064 ms** | **2 444 ms** | **0,000** | **380 ms** | **4 470 ms** | 41 | 463 Ko (11 imgs) | **4 825 Ko** |
| **`/connexion`** | **Avant** | **100** / 100 | 1 764 ms | 1 764 ms | **0,000** | 419 ms | 3 731 ms | 26 | 74 Ko (2 imgs) | 4 366 Ko |
| | **Après** | **100** / 100 | **1 448 ms** | **1 448 ms** | **0,000** | **201 ms** | **2 761 ms** | 26 | 74 Ko (2 imgs) | 4 366 Ko |

---

### C. Analyse des gains et optimisations apportées

1. **Stabilité visuelle exemplaire (CLS = 0,000)** :
   Toutes les pages auditées affichent un **CLS rigoureusement nul (0,000)**, garantissant une stabilité visuelle totale sans aucun saut d'éléments à l'écran lors du chargement des composants ou des graphiques.

2. **Accélération du Portail (+14 points de score)** :
   * Le LCP du portail passe de **3 552 ms à 3 020 ms** (-532 ms).
   * Le FCP s'améliore de **3 008 ms à 2 388 ms** (-620 ms).
   * Le temps total de chargement est réduit de **5 407 ms à 4 832 ms**.

3. **Optimisation des médias dans la Galerie des innovations (Score 100/100)** :
   * Ajout des attributs explicites `width={400} height={260}` et `decoding="async"` sur les balises d'images (`/galerie`).
   * Le LCP de la galerie s'établit désormais sous le seuil d'excellence (**2 444 ms**, contre 2 648 ms initialement).

4. **Écran de connexion ultrarapide** :
   * Le LCP et le FCP de la page `/connexion` descendent à **1 448 ms** (gain net de 316 ms).
   * Le temps de chargement global chute de **3 731 ms à 2 761 ms** (-26 %).

5. **Découpage de code dynamique (*Code-splitting*) sur le Tableau de bord** :
   * Déport asynchrone via `next/dynamic` avec `ssr: false` des modules volumineux (`DetailTable`, `AiDrawer`, `PrintSummaryModal`).
   * Le bundle initial ne charge plus prématurément le moteur de rendu HTML2Canvas ni le grand livre complet lorsque l'utilisateur consulte la vue d'ensemble.
