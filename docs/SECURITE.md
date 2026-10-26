# Audit des droits, sécurité et checklist de mise en production — CIAT

Ce document constitue la référence de sécurité pour l'ensemble des modules de la plateforme CIAT (Phase 3 — Tâche T2). Il détaille la matrice des autorisations par rôle et endpoint, la politique anti force-brute (rate limiting), la validation des fichiers déposés, et la checklist préalable au déploiement en production.

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
- **200 / 201** : Accès autorisé et action exécutée avec succès.
- **401** : Non authentifié (Authentification requise).
- **403** : Authentifié mais rôle insuffisant ou ressource n'appartenant pas à l'utilisateur.
- **404** : Ressource non trouvée ou isolée par étanchéité de données.
- **JAMAIS 500** : Toute requête invalide est interceptée et renvoie une erreur 400 ou 422 standardisée.

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
| `/api/incubator/dossiers/` | GET | 401 | 200 (vide) | 200 (ses dossiers) | 200 (ses dossiers) | 200 | 200 | 200 | 200 |
| `/api/incubator/dossiers/` | POST | 401 | 403 | 201 | 403 (si tiers) | 403 | 403 | 201 | 201 |
| `/api/incubator/dossiers/{id}/pieces/` | POST | 401 | 403 | 201 | 403 | 403 | 403 | 201 | 201 |
| `/api/incubator/dossiers/{id}/soumettre/` | POST | 401 | 403 | 200 | 403 | 403 | 403 | 200 | 200 |
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
3. **Mots de passe et secrets** :
   - Les champs `password` sont configurés en `write_only=True` (`RegisterSerializer`).
   - Aucun hash (ex. PBKDF2/MD5) n'est jamais présent dans les réponses sérialisées.
4. **Isolations d'incubateur** :
   - Les projets au statut `idee` ou non acceptés n'apparaissent jamais dans l'annuaire public des projets incubés.

---

## 4. Politique de limitation de débit (Rate Limiting)

Pour prémunir la plateforme contre les attaques par force brute et par déni de service (DoS), des limitations sont appliquées via DRF Throttling :

| Scope | Taux limite | Cible | Action en cas de dépassement |
| :--- | :--- | :--- | :--- |
| `auth` | **5 requêtes / minute** | `/api/auth/token/`, `/api/auth/register/` | `HTTP 429 Too Many Requests` |
| `ai` | **20 requêtes / minute** | Génération de documents IA (`/api/documents/generer/`) | `HTTP 429 Too Many Requests` |
| `anon` | **60 requêtes / minute** | Tout endpoint public pour client non authentifié | `HTTP 429 Too Many Requests` |
| `user` | **300 requêtes / minute** | Utilisateurs authentifiés standard | `HTTP 429 Too Many Requests` |

---

## 5. Politique de validation et sécurité des fichiers (Uploads)

Pour empêcher l'injection de fichiers malveillants, l'écrasement de fichiers système et les attaques de déni de service :

1. **Taille maximale autorisée** :
   - Limite stricte : **10 Mo** par fichier (`FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024`).
   - Les fichiers vides (0 octet) sont systématiquement rejetés avec `ValidationError`.
2. **Extensions interdites et filtrées** :
   - Seules les extensions approuvées pour les pièces justificatives et preuves sont acceptées : `pdf`, `png`, `jpg`, `jpeg`, `docx`, `xlsx`.
   - Extensions exécutables (`.exe`, `.sh`, `.bat`, `.cmd`, `.php`, `.js`, `.py`) rejetées dès la validation de formulaire.
3. **Vérification du contenu binaire (Magic Bytes)** :
   - Le système ne se fie pas uniquement à l'extension déclarée dans le nom du fichier.
   - La fonction `validate_file_content` inspecte les premiers octets (signatures binaires) :
     - Pour un PDF : doit débuter par `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`).
     - Pour un PNG : doit débuter par `\x89PNG\r\n\x1a\n`.
     - Pour un JPEG : doit débuter par `\xff\xd8\xff`.
4. **Assainissement des noms de fichiers (Path Traversal)** :
   - Fonction `sanitize_filename()` : élimine les séquences `../`, les séparateurs de dossiers et les caractères non ASCII pour éviter toute tentative d'écriture hors du répertoire média désigné.

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
  - Blocage strict à l'initialisation si `DEBUG=False` et que la clé est absente ou fixée à la valeur par défaut.
- [x] **Mode Débogage (`DEBUG`)** :
  - `DJANGO_DEBUG=0` obligatoirement en production.
- [x] **Hôtes autorisés (`ALLOWED_HOSTS`)** :
  - Restreint aux noms de domaine et adresses IP exacts de production (ex: `plateforme.ciat.sn`).
- [x] **En-têtes HTTPS et HSTS** :
  - `SECURE_SSL_REDIRECT = True` (redirection automatique HTTP vers HTTPS).
  - `SESSION_COOKIE_SECURE = True` (transmission des cookies de session uniquement sur HTTPS).
  - `CSRF_COOKIE_SECURE = True` (transmission du cookie CSRF uniquement sur HTTPS).
  - `SECURE_HSTS_SECONDS = 31536000` (1 an).
  - `SECURE_HSTS_INCLUDE_SUBDOMAINS = True` et `SECURE_HSTS_PRELOAD = True`.
- [x] **Protection contre le détournement de clic (Clickjacking) et de type MIME** :
  - `X_FRAME_OPTIONS = "DENY"`.
  - `SECURE_CONTENT_TYPE_NOSNIFF = True`.
  - `XFrameOptionsMiddleware` actif dans `MIDDLEWARE`.
- [x] **Base de données relationnelle** :
  - PostgreSQL 16 configuré via `DATABASE_URL` avec utilisateur dédié non-root et mot de passe robuste.
- [x] **CORS & CSRF** :
  - Restreints aux domaines du frontend autorisés (`CORS_ALLOWED_ORIGINS`).
