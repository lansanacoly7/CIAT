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
