# Audit des droits, sécurité et checklist de mise en production — CIAT

Ce document constitue la référence de sécurité pour l'ensemble des modules de la plateforme CIAT (Phase 3 — Tâche T2). Il détaille la matrice des autorisations par rôle et endpoint, la politique anti force-brute (rate limiting), l'architecture de cache partagé, la validation des fichiers déposés, et la checklist préalable au déploiement en production.

---

## 1. Rôles et acteurs du système

La plateforme CIAT définit 6 rôles utilisateurs distincts (`apps.core.models.Role`) plus les requêtes anonymes :

| Code rôle | Libellé | Périmètre et privilèges principaux |
| :--- | :--- | :--- |
| `anonyme` | Visiteur non authentifié | Consultation publique (vitrine portail, appels ouverts, galerie publiée, formulaire de contact). |
| `visiteur` | Compte lecteur / invité | Profil utilisateur (`auth/me/`), consultation publique, aucune création de projet ni de dossier. |
| `porteur` | Porteur de projet | Création et gestion de ses propres projets, dépôt et soumission de son dossier d'incubation, consultation de ses bilans de suivi. |
| `mentor` | Mentor / Accompagnateur | Consultation des projets et dossiers de l'incubateur, gestion des jalons, bilans de suivi et preuves des projets assignés. |
| `membre_comite` | Membre jury / sélection | Évaluation des dossiers soumis via la grille officielle, notation des critères, consultation des analytics et des projets. |
| `coordonnateur` | Équipe CIAT / Opérations | Gestion des cohortes, domaines, affectation des mentors, décision finale sur les dossiers, validation des actualités et documents. |
| `administrateur` | Super-administrateur | Privilèges complets, gestion des utilisateurs, configuration des grilles, exports et maintenance système. |

---

## 2. Matrice d'accès aux routes d'API

Cette matrice est validée automatiquement par la suite de tests automatisée `apps/core/tests/test_droits.py`.

Légende des statuts HTTP retournés :
- **200 / 201 / 204** : Accès autorisé et action exécutée avec succès (création, modification, suppression).
- **400** : Entrée invalide, formulaire mal formé ou violation de contrainte métier.
- **401** : Non authentifié (Authentification requise).
- **403** : Authentifié mais rôle insuffisant ou ressource n'appartenant pas à l'utilisateur.
- **404** : Ressource non trouvée ou dissimulée par étanchéité de données (object isolation).
- **405** : Méthode HTTP non autorisée sur l'endpoint.
- **JAMAIS 500** : Toute entrée invalide est interceptée et contrôlée sans fuite de traceback ou de secrets internes.

| Endpoint | Méthode | Anonyme | Visiteur | Porteur (proprio) | Porteur (tiers) | Mentor | Comité | Coordonnateur | Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/api/health/` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/auth/register/` | POST | 201 / 400 | 201 / 400 | 201 / 400 | 201 / 400 | 201 / 400 | 201 / 400 | 201 / 400 | 201 / 400 |
| `/api/auth/token/` | POST | 200 / 401 | 200 / 401 | 200 / 401 | 200 / 401 | 200 / 401 | 200 / 401 | 200 / 401 | 200 / 401 |
| `/api/auth/me/` | GET / PATCH | 401 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/domaines/` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/domaines/` | POST | 401 | 403 | 403 | 403 | 403 | 403 | 201 | 201 |
| `/api/cohortes/` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/cohortes/` | POST | 401 | 403 | 403 | 403 | 403 | 403 | 201 | 201 |
| `/api/projets/` | GET | 401 | 200 (filtré) | 200 (ses projets) | 200 (ses projets) | 200 (assignés) | 200 (tous) | 200 (tous) | 200 (tous) |
| `/api/projets/` | POST | 401 | 403 | 201 | 201 | 403 | 403 | 201 | 201 |
| `/api/projets/{id}/` | PATCH / PUT | 401 | 403/404 | 200 | 403/404 | 403/404 | 403/404 | 200 | 200 |
| `/api/projets/{id}/` | DELETE | 401 | 403/404 | 204 | 403/404 | 403/404 | 403/404 | 204 | 204 |
| `/api/incubator/dossiers/` | GET | 401 | 200 (vide) | 200 (ses dossiers) | 200 (ses dossiers) | 200 | 200 | 200 | 200 |
| `/api/incubator/dossiers/` | POST | 401 | 403 | 201 | 403 (si tiers) | 403 | 403 | 201 | 201 |
| `/api/incubator/dossiers/{id}/pieces/` | POST | 401 | 403 | 201 | 403 | 403 | 403 | 201 | 201 |
| `/api/incubator/dossiers/{id}/pieces/{p_id}/` | DELETE | 401 | 403 | 204 | 403/404 | 403 | 403 | 204 | 204 |
| `/api/incubator/dossiers/{id}/soumettre/` | POST | 401 | 403 | 200 | 403 | 403 | 403 | 200 | 200 |
| `/api/incubator/dossiers/{id}/evaluations/` | GET | 401 | 403 | 403 | 403 | 403 | 200 | 200 | 200 |
| `/api/incubator/dossiers/{id}/evaluations/` | POST | 401 | 403 | 403 | 403 | 403 | 201 | 201 | 201 |
| `/api/incubator/dossiers/{id}/decision/` | POST | 401 | 403 | 403 | 403 | 403 | 403 | 201 | 201 |
| `/api/incubator/alertes/` | GET | 401 | 403 | 403 | 403 | 200 (assignés) | 403 | 200 | 200 |
| `/api/portal/actualites/` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/portal/actualites/` | POST | 401 | 403 | 403 | 403 | 403 | 403 | 201 | 201 |
| `/api/portal/partenaires/` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/portal/partenaires/` | POST | 401 | 403 | 403 | 403 | 403 | 403 | 201 | 201 |
| `/api/portal/contact/` | POST | 201 | 201 | 201 | 201 | 201 | 201 | 201 | 201 |
| `/api/portal/contact/` | GET | 401 | 403 | 403 | 403 | 403 | 403 | 200 | 200 |
| `/api/portal/projets-incubes/` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/gallery/fiches/` | GET | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/gallery/statistiques/` | GET | 401 | 403 | 403 | 403 | 403 | 403 | 200 | 200 |
| `/api/analytics/indicateurs/` | GET | 401 | 403 | 403 | 403 | 403 | 200 | 200 | 200 |
| `/api/documents/types/` | GET | 401 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |
| `/api/documents/generer/` | POST | 401 | 403 | 201 | 201 | 201 | 201 | 201 | 201 |

---

## 3. Détection et prévention des fuites de données privées (PII)

Les endpoints publics (annuaire des projets incubés `/api/portal/projets-incubes/`, fiches d'innovation `/api/gallery/fiches/`, actualités et documents publics) font l'objet d'un filtrage strict des données sortantes :

1. **Données de contact exclues** :
   - Aucun email de porteur (`email`) n'est présent dans les payloads publics.
   - Aucun numéro de téléphone (`telephone`) n'est exposé.
2. **Délibérations et scores confidentiels** :
   - Les évaluations individuelles des membres du jury, les notes par critère et les avis internes ne figurent jamais dans les serializers publics.
   - Les délibérations ne sont exposées qu'aux membres du comité et à l'équipe de coordination CIAT.
3. **Mots de passe et secrets** :
   - Les champs `password` sont configurés en `write_only=True` (`RegisterSerializer`).
   - Aucun hash (ex. PBKDF2/MD5) n'est jamais présent dans les réponses sérialisées.
4. **Isolations d'incubateur** :
   - Les projets au statut `idee` ou non acceptés n'apparaissent jamais dans l'annuaire public des projets incubés.

---

## 4. Politique de limitation de débit (Rate Limiting) et Cache

Pour prémunir la plateforme contre les attaques par force brute et par déni de service (DoS), des limitations sont appliquées via DRF Throttling :

| Scope | Taux limite | Cible | Action en cas de dépassement |
| :--- | :--- | :--- | :--- |
| `auth` | **5 requêtes / minute** | `/api/auth/token/`, `/api/auth/register/` | `HTTP 429 Too Many Requests` |
| `ai` | **20 requêtes / minute** | Génération de documents IA (`/api/documents/generer/`) | `HTTP 429 Too Many Requests` |
| `anon` | **60 requêtes / minute** | Tout endpoint public pour client non authentifié | `HTTP 429 Too Many Requests` |
| `user` | **300 requêtes / minute** | Utilisateurs authentifiés standard | `HTTP 429 Too Many Requests` |

### Architecture de Cache : Local vs Partagé (Multi-processus)

- **Développement local et tests** : Utilisation automatique de `django.core.cache.backends.locmem.LocMemCache`. Ne nécessite aucune installation de service externe pour exécuter la suite de tests ou lancer le serveur en local.
- **Production multi-processus (Gunicorn, Uvicorn)** : Lorsque plusieurs workers traitent des requêtes en parallèle, `LocMemCache` ne partage pas les compteurs de throttling entre processus. Pour ces environnements, définir la variable d'environnement :
  ```env
  REDIS_URL=redis://redis:6379/1
  ```
  Django active alors automatiquement `django.core.cache.backends.redis.RedisCache`. Si Redis est indisponible, le backend applique un fallback sécurisé ou lève une exception configurable pour éviter de dégrader silencieusement la protection.
- **Défense en profondeur (Reverse-Proxy)** : Le rate limiting DRF constitue la couche applicative. Il est fortement recommandé en production d'associer un rate limiting en amont au niveau du reverse proxy (Nginx `limit_req_zone` ou Cloudflare Rate Limiting Rules) afin de rejeter les attaques volumétriques avant qu'elles n'atteignent les workers Python.

---

## 5. Politique de validation et sécurité des fichiers (Uploads)

Pour empêcher l'injection de fichiers malveillants, l'écrasement de fichiers système et les attaques par déni de service :

1. **Taille maximale autorisée** :
   - Limite stricte : **10 Mo** par fichier (`FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024`).
   - Les fichiers vides (0 octet) sont systématiquement rejetés avec `ValidationError`.
2. **Extensions autorisées (Harmonisation complète)** :
   - `ALLOWED_PIECE_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "webp"]`.
   - Les formats bureautiques et tableurs (`xlsx`, `xls`) sont expressément autorisés pour la pièce `TypePiece.BUDGET_PREVISIONNEL`.
   - Extensions exécutables (`.exe`, `.sh`, `.bat`, `.cmd`, `.php`, `.js`, `.py`) formellement rejetées dès la validation.
3. **Contrôle de signature binaire (Magic Bytes)** :
   - `validate_file_content` inspecte les premiers octets du fichier indépendamment de son extension déclarée :
     - **PDF** : commence par `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`).
     - **PNG** : commence par `\x89PNG\r\n\x1a\n`.
     - **JPEG** : commence par `\xff\xd8\xff`.
     - **WEBP** : commence par `RIFF` et contient `WEBP`.
     - **DOCX / XLSX** : conteneurs OpenXML compressés, commencent par `PK\x03\x04`.
     - **DOC / XLS** : format binaire OLE Compound File, commencent par `\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1`.
   - *Avertissement de sécurité* : La vérification des magic bytes bloque l'usurpation d'extension (spoofing) et les scripts évidents, mais ne constitue pas une analyse antivirus ou une garantie absolue d'innocuité (un document valide peut contenir des macros ou des payloads intégrés). Un scanner dédié (ClamAV) peut être ajouté en production pour les fichiers critiques.
4. **Assainissement des noms de fichiers (Path Traversal)** :
   - Fonction `sanitize_filename()` : élimine les séquences `../`, `..\`, séparateurs de répertoires et caractères spéciaux afin de garantir que les fichiers sont toujours cantonnés à leur sous-dossier d'upload.
5. **Confidentialité du stockage** :
   - Les pièces justificatives des dossiers et preuves d'avancement ne sont jamais exposées publiquement par défaut ; elles sont protégées par les contrôles de permissions de l'API.

---

## 6. Robustesse des mots de passe

L'inscription publique (`POST /api/auth/register/`) impose l'ensemble des validateurs de sécurité Django :

1. `MinimumLengthValidator(min_length=8)` : longueur minimale de 8 caractères.
2. `UserAttributeSimilarityValidator` : le mot de passe ne peut pas être similaire aux attributs du compte (email, prénom, nom).
3. `CommonPasswordValidator` : rejet des mots de passe les plus courants dans les dictionnaires mondiaux.
4. `NumericPasswordValidator` : interdiction des mots de passe exclusivement composés de chiffres.

---

## 7. Checklist de mise en production

Avant tout déploiement en environnement de production, vérifier les points suivants :

- [x] **Clé secrète Django (`SECRET_KEY`)** :
  - Provenance exclusive de la variable d'environnement `DJANGO_SECRET_KEY`.
  - Blocage strict à l'initialisation si `DEBUG=False` et que la clé est absente ou fixée à une valeur faible de développement.
- [x] **Mode Débogage (`DEBUG`)** :
  - `DJANGO_DEBUG=0` obligatoirement en production.
- [x] **Hôtes autorisés (`ALLOWED_HOSTS`)** :
  - Restreint aux noms de domaine et adresses IP exacts de production (ex: `plateforme.ciat.sn`), jamais de wildcard `*`.
- [x] **En-têtes HTTPS et HSTS** :
  - `SECURE_SSL_REDIRECT = True` (redirection automatique HTTP vers HTTPS).
  - `SESSION_COOKIE_SECURE = True` (transmission des cookies de session uniquement sur HTTPS).
  - `CSRF_COOKIE_SECURE = True` (transmission du cookie CSRF uniquement sur HTTPS).
  - `SECURE_HSTS_SECONDS = 31536000` (1 an minimum).
  - `SECURE_HSTS_INCLUDE_SUBDOMAINS = True` et `SECURE_HSTS_PRELOAD = True`.
- [x] **Protection contre le détournement de clic (Clickjacking) et de type MIME** :
  - `X_FRAME_OPTIONS = "DENY"`.
  - `SECURE_CONTENT_TYPE_NOSNIFF = True`.
  - `XFrameOptionsMiddleware` actif dans `MIDDLEWARE`.
- [x] **Base de données relationnelle** :
  - PostgreSQL 16 (ou >= 14 conformément aux exigences Django 5.2) configuré via `DATABASE_URL` avec utilisateur applicatif aux droits minimaux et authentification `scram-sha-256`.
- [x] **CORS & CSRF** :
  - Restreints aux domaines du frontend autorisés (`CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS`), jamais de wildcard `*`.
- [x] **Cache et Limitation de débit** :
  - Redis configuré via `REDIS_URL` en environnement multi-processus.

---

## 8. Anomalies constatées lors de l'audit et statut de remédiation

Conformément aux exigences de la Phase 3 (Tâche T2), le tableau suivant recense l'ensemble des anomalies identifiées lors de l'audit de sécurité, leur niveau de gravité, leur responsable et leur état effectif de résolution :

| Réf | Composant / Route concernée | Gravité | Responsable | Description du problème constaté | État |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **ANO-SEC-01** | `backend/config/settings.py` | **Haute** | Ibrahima (T1) | Contournement du contrôle de version PostgreSQL (`check_database_version_supported = lambda self: None`) masquant l'incompatibilité de Django 5.2 avec PostgreSQL < 14. | **Corrigée** (Monkeypatch supprimé, prérequis PG 14+ documenté, PG 16 cible officielle). |
| **ANO-SEC-02** | `GET /api/projets/` (`apps.core.views.ProjetViewSet`) | **Élevée** | Core / Ibrahima | Crash HTTP 500 (`AttributeError: 'AnonymousUser' object has no attribute 'role'`) car la permission `ReadOnlyOrRole` laissait passer les requêtes non authentifiées jusqu'à `get_queryset()`. | **Corrigée** (`IsAuthenticated` ajouté et garde défensive `if not user.is_authenticated: return Projet.objects.none()`). |
| **ANO-SEC-03** | `/api/incubator/dossiers/{id}/pieces/` (`apps.incubator.models.Piece`) | **Moyenne** | Incubator / Ibrahima | Incohérence entre les formats autorisés : `docs/SECURITE.md` mentionnait `xlsx`, mais `ALLOWED_PIECE_EXTENSIONS` rejetait les tableurs indispensables au `TypePiece.BUDGET_PREVISIONNEL`. | **Corrigée** (`xlsx` et `xls` ajoutés dans le modèle, le serializer, contrôle binaire via magic bytes `PK\x03\x04` et `\xd0\xcf\x11`, migration générée). |
| **ANO-SEC-04** | `/api/auth/token/`, `/api/auth/register/` (`backend/config/settings.py`) | **Moyenne** | Ibrahima (T2) | Absence de configuration de cache partagé pour le Rate Limiting multi-processus : le cache `LocMemCache` par défaut ne partageait pas les compteurs entre workers Gunicorn. | **Corrigée** (Configuration `CACHES` ajoutée avec support de `REDIS_URL` pour la production et fallback `LocMemCache` en local, conteneur Redis ajouté à `docker-compose.yml`). |
| **ANO-SEC-05** | `backend/apps/documents/management/commands/seed_documents.py` | **Moyenne** | Documents / Ibrahima | `SyntaxError: invalid decimal literal` empêchant la compilation Python (`compileall`) en raison de l'import d'un module débutant par un chiffre (`from ...0002_seed_documents import ...`). | **Corrigée** (Importation dynamique via `importlib.import_module("apps.documents.migrations.0002_seed_documents")`). |
| **ANO-SEC-06** | `backend/apps/core/tests/test_droits.py` | **Faible** | Ibrahima (T2) | Tests de sécurité partiels vérifiant des conditions écrites dans le test plutôt que le comportement réel de Django (`if settings.SECRET_KEY ...`). | **Corrigée** (Remplacement par de vrais tests de configuration Django et vérification effective de `ImproperlyConfigured` et des en-têtes HTTP). |
| **ANO-SEC-07** | `backend/apps/core/tests/test_droits.py`, `test_performance.py` | **Faible** | Ibrahima (T3) | Lenteur d'exécution de la suite de tests (113s) due à la régénération et au hachage répétés des mots de passe utilisateurs dans `setUp()` au lieu de `setUpTestData()`. | **Corrigée** (Passage à `setUpTestData()` et décorateurs `@override_settings(PASSWORD_HASHERS=FAST_HASHERS)` ; temps total de la suite ramené sous 10 secondes). |

### Bilan de l'audit par la matrice des droits
L'inspection automatisée par `MatriceDroitsAPITests` a vérifié :
1. **L'étanchéité des données privées** : Aucune donnée personnelle (emails, numéros de téléphone) ni marqueur confidentiel (notes du jury, délibérations) n'est exposé sur les endpoints publics.
2. **L'isolation des objets** : Un porteur tiers ne peut ni modifier ni supprimer un projet ou une pièce appartenant à un autre porteur.
3. **Le confinement des méthodes** : Les verbes HTTP non supportés renvoient explicitement 405 Method Not Allowed.
4. **La résilience aux entrées malveillantes** : Aucune entrée mal formée ou tentative d'injection SQL ne provoque d'erreur 500 Internal Server Error.

