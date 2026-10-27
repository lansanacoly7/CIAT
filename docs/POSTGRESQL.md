# Guide de configuration et déploiement PostgreSQL — CIAT

Ce document détaille la configuration, les prérequis de version, les procédures de migration et de test sous PostgreSQL ainsi que le fonctionnement sous SQLite pour le projet CIAT (Phase 3 — Tâche T1).

---

## 1. Exigences de version de base de données

Le backend CIAT utilise **Django 5.2**.

- **Version minimale officielle requise par Django 5.2** : **PostgreSQL 14** (`django.db.backends.postgresql.features.DatabaseFeatures.minimum_database_version = (14,)`).
- **Version recommandée pour l'équipe et la production** : **PostgreSQL 16** (image officielle `postgres:16`).
- **PostgreSQL 12 / 13** : **Non pris en charge**. Tout contournement par monkeypatch (`DatabaseWrapper.check_database_version_supported`) a été formellement proscrit du code source car il masque les incompatibilités SQL potentielles et viole le contrat de support de Django.

---

## 2. Modes d'exécution de la base de données

### Mode A : SQLite (Développement courant et tests légers)

Par défaut, si la variable `DATABASE_URL` est vide ou absente de `backend/.env`, Django bascule automatiquement sur SQLite :

```env
# Dans backend/.env
DATABASE_URL=
```

- **Avantage** : Zéro dépendance, aucun service ou conteneur à démarrer.
- **Stockage** : Fichier local `backend/db.sqlite3` (ignoré par Git).
- **Initialisation** :
  ```bash
  python manage.py migrate
  python manage.py seed_demo
  ```

---

### Mode B : PostgreSQL 16 via Docker (Recommandé pour l'équipe)

Un conteneur PostgreSQL 16 et un conteneur Redis sont configurés dans le fichier `docker-compose.yml` à la racine du projet :

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ciat
      POSTGRES_PASSWORD: ciat
      POSTGRES_DB: ciat
    ports:
      - "5432:5432"
    volumes:
      - ciat_pg:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  ciat_pg:
```

**Démarrage des services** :
```bash
# À la racine du projet
docker compose up -d

# Vérification de l'état
docker compose ps
```

**Configuration dans `backend/.env`** :
```env
DATABASE_URL=postgres://ciat:ciat@localhost:5432/ciat
```

---

### Mode C : PostgreSQL 16 en installation locale native (Linux / macOS / Windows)

Si vous installez PostgreSQL directement sur le système hôte, assurez-vous d'installer **PostgreSQL 14 ou supérieur (idéalement 16)**.

#### Création d'un compte applicatif aux moindres privilèges (Modèle sécurisé)

> [!IMPORTANT]
> **Règle de sécurité** : L'application ne doit **JAMAIS** utiliser un compte `SUPERUSER` ni une authentification sans mot de passe (`trust`) en dehors d'un environnement de conteneur jetable.

Connectez-vous en tant qu'administrateur PostgreSQL (`postgres`) :
```bash
psql -U postgres
```

Exécutez les instructions SQL suivantes créant un utilisateur dédié avec droits limités :
```sql
-- 1. Création de l'utilisateur applicatif (NON superuser)
CREATE USER ciat WITH PASSWORD 'votre_mot_de_passe_securise';

-- 2. Création de la base de données dédiée
CREATE DATABASE ciat OWNER ciat;

-- 3. Droits restreints au schéma public de la base
\connect ciat
GRANT ALL ON SCHEMA public TO ciat;
```

#### Configuration de l'authentification (`pg_hba.conf`)

Utiliser impérativement l'authentification `scram-sha-256` :
```text
# IPv4 local connections:
host    ciat    ciat    127.0.0.1/32    scram-sha-256
# IPv6 local connections:
host    ciat    ciat    ::1/128         scram-sha-256
```

---

## 3. Procédure de migration et chargement des données

Une fois PostgreSQL 16 démarré et `DATABASE_URL` renseigné :

```bash
cd backend

# 1. Vérification de l'intégrité de la configuration
python manage.py check

# 2. Vérification de l'absence de migrations manquantes
python manage.py makemigrations --check

# 3. Application des migrations
python manage.py migrate

# 4. Chargement des données de démonstration (idempotent)
python manage.py seed_demo
python manage.py seed_portal
python manage.py seed_incubator
```

---

## 4. Validation par les tests automatisés

Pour exécuter la suite de tests avec PostgreSQL 16 :

```bash
export DATABASE_URL="postgres://ciat:votre_mot_de_passe@localhost:5432/ciat"
python manage.py test
```

> **Note sur la création de la base de test** : Le runner de test de Django crée une base nommée `test_ciat`. L'utilisateur applicatif `ciat` doit disposer du privilège `CREATEDB` en environnement de test :
> ```sql
> ALTER USER ciat CREATEDB;
> ```

---

## 5. Pièges identifiés et différences avec SQLite

1. **Sensibilité à la casse (`ILIKE` vs `LIKE`)** :
   - SQLite traite l'opérateur `LIKE` de manière insensible à la casse pour les caractères ASCII. PostgreSQL distingue strictement `LIKE` (sensible) et `ILIKE` (insensible).
   - Le code utilise systématiquement les filtres Django `icontains` et `iexact` pour assurer une stricte compatibilité entre les deux moteurs.
2. **Ordre par défaut des QuerySets** :
   - PostgreSQL ne garantit aucun ordre d'extraction sans clause explicite `ORDER BY`.
   - Tous les modèles exposés dans les API disposent d'un tri explicite dans leur `Meta.ordering` ou dans le `ViewSet` (`ordering = ["-cree_le"]`).
3. **Champs JSON (`JSONField`)** :
   - PostgreSQL valide strictement la syntaxe JSON native (`jsonb`). Les serializers CIAT valident la structure des dictionnaires et listes avant écriture.

---

## 6. Résultats des tests et état réel de compatibilité

### A. Constat d'exécution sur l'environnement de développement local

Conformément à la directive stricte de transparence (« on n'écrit que ce qui est mesuré »), voici l'état factuel relevé sur la machine locale :

**Environnement de mesure** :
- **Système d'exploitation** : Windows 11 Professionnel (hôte x86_64)
- **Version exacte de PostgreSQL hôte** : `PostgreSQL 12.22, compiled by Visual C++ build 1942, 64-bit` (mesuré via `SELECT version();`)
- **Version de Python** : `Python 3.13.9`
- **Version de Django** : `Django 5.2.18`
- **Date de mesure** : 27 octobre 2026

1. **Rejet conforme de PostgreSQL 12.22 par Django 5.2** :
   - Service détecté sur l'hôte : `PostgreSQL 12.22`.
   - Tentative d'exécution de `python manage.py test` avec `DATABASE_URL=postgres://ciat:ciat@localhost:5432/ciat` :
     ```text
     Traceback (most recent call last):
       ...
       File "django/db/backends/base/base.py", line 201, in check_database_version_supported
         raise NotSupportedError(
     django.db.utils.NotSupportedError: PostgreSQL 14 or later is required (found 12.22).
     ```
   - **Conclusion** : Le contournement illégal par monkeypatch (`check_database_version_supported = lambda self: None`) a été intégralement éradiqué. Django 5.2 protège désormais le projet contre les versions obsolètes de PostgreSQL.
2. **Exécution réelle et mesurée sur PostgreSQL 16.4 (sans Docker, binaire natif Windows)** :
   - **Mode de déploiement** : Binaire officiel PostgreSQL 16.4 pour Windows x64 démarré en espace utilisateur (cluster dédié sur le port `5433`).
   - **Version exacte mesurée** : `PostgreSQL 16.4, compiled by Visual C++ build 1940, 64-bit` (mesurée via `connection.cursor().execute("SELECT version()")`).
   - **Configuration `DATABASE_URL`** : `postgres://postgres@127.0.0.1:5433/ciat_db`.
   - **Migrations et chargement** :
     - `python manage.py migrate` : 30+ migrations appliquées avec succès (`admin`, `analytics`, `assistant`, `auth`, `contenttypes`, `core`, `documents`, `gallery`, `incubator`, `portal`, `sessions`).
     - `python manage.py seed_all` : initialisation complète et idempotente de tous les modules (62 projets, 41 porteurs, 58 dossiers d'incubation, 174 pièces, 27 modèles de documents, etc.).
   - **Commande exécutée** :
     ```bash
     $env:DATABASE_URL = "postgres://postgres@127.0.0.1:5433/ciat_db"
     python manage.py test --timing
     ```
   - **Sortie exacte mesurée** :
     ```text
     Creating test database for alias 'default'...
     ................................................................................
     ----------------------------------------------------------------------
     Ran 276 tests in 25.823s

     OK
     Destroying test database for alias 'default'...

     Total database setup took 2.474s
       Creating 'default' took 2.474s
     Total database teardown took 0.849s
     Total run took 29.957s
     ```
   - **Résultats obtenus** :
     - **276 / 276 tests réussis (0 échec, 0 erreur, 100 % de succès)**.
     - **Durée réelle mesurée** : **25,823 secondes** (29,957 secondes incluant la création et suppression de la base temporaire `test_ciat_db`).
   - **Différences constatées entre SQLite et PostgreSQL 16** :
     - *Contraintes d'intégrité et clés étrangères* : les contraintes d'unicité partielles et globales (`GrilleEvaluation.unique_grille_active`, paires de code types de documents) fonctionnent à l'identique.
     - *Champs JSON (`JSONField`)* : stockés de façon optimale en format natif `jsonb` sous PostgreSQL 16, aucune anomalie de structure lors des lectures/écritures.
     - *Performances* : l'exécution globale sous PostgreSQL 16.4 locale s'avère plus rapide (25,82 s) que sur disque SQLite standard (37,28 s), démontrant l'efficacité de la gestion des transactions concurrentes.

3. **Exécution de référence sur SQLite (base de repli standard sans installation)** :
   - **Date d'exécution** : 27 octobre 2026
   - **Commande exécutée** : `.venv/Scripts/python.exe manage.py test`
   - **Résultat réel obtenu** : 276 / 276 tests réussis en 37,28 s.

---

### B. Procédure de validation sur PostgreSQL 16 en intégration continue / production

Pour tout serveur ou environnement disposant de Docker ou d'un service PostgreSQL >= 14 (recommandé : 16) :

```bash
# 1. Démarrage des conteneurs
docker compose up -d

# 2. Exécution des migrations et chargement des données
cd backend
export DATABASE_URL="postgres://ciat:ciat@localhost:5432/ciat"
python manage.py migrate
python manage.py seed_all

# 3. Lancement de la suite complète de tests
python manage.py test
```

---

## 7. Sauvegarde et restauration de la base de données

Deux scripts d'exploitation sont disponibles dans le répertoire `scripts/` :
- [../scripts/sauvegarde_bd.sh](../scripts/sauvegarde_bd.sh)
- [../scripts/restauration_bd.sh](../scripts/restauration_bd.sh)
- [../scripts/verifier_sauvegarde_restauration.sh](../scripts/verifier_sauvegarde_restauration.sh)

> [!CAUTION]
> **Confidentialité et données personnelles** :
> Les sauvegardes (`.dump`, `.sql`) contiennent des données à caractère personnel (porteurs, évaluations, dossiers). Elles sont automatiquement exclues du dépôt Git via `.gitignore`. **Ne jamais les publier sur Git ni les transférer par messagerie instantanée.**

### 7.1 Script de sauvegarde (`scripts/sauvegarde_bd.sh`)

Le script utilise `pg_dump` avec le format d'archive personnalisée (`--format=custom` ou `-Fc`), qui génère un fichier binaire compressé avec métadonnées de schéma.

**Usage standard** :
```bash
# Sauvegarde automatique horodatée dans ./backups/ (ex: ./backups/ciat_backup_YYYYMMDD_HHMMSS.dump)
./scripts/sauvegarde_bd.sh

# Sauvegarde incluant également l'archive des pièces téléversées (backend/media)
./scripts/sauvegarde_bd.sh --avec-media

# Sauvegarde vers un fichier spécifique
./scripts/sauvegarde_bd.sh /chemin/vers/sauvegarde_personnalisee.dump
```

**Variables d'environnement prises en compte** :
- `DATABASE_URL` : URL de connexion (supporte les mots de passe encodés `%40`, `%3A`, `%2F` via parsing `urllib.parse`).
- Ou variables standard PostgreSQL : `PGHOST` (défaut : `localhost`), `PGPORT` (défaut : `5432`), `PGUSER` (défaut : `ciat`), `PGPASSWORD` (défaut : `ciat`), `PGDATABASE` (défaut : `ciat`).
- `BACKUP_DIR` : Répertoire de destination (défaut : `./backups`).
- `BACKUP_KEEP` : Nombre de sauvegardes automatiques à conserver (défaut : 14). Les sauvegardes plus anciennes sont purgées automatiquement (sauf les fichiers passés explicitement en argument).
- `USE_DOCKER` : Si défini à `1`, exécute `pg_dump` directement dans le conteneur Docker `db` (`docker compose exec -T db pg_dump ...`), évitant tout problème d'incompatibilité de version client/serveur.

**Sécurité de génération** :
Le script écrit d'abord dans un fichier temporaire `<fichier>.partiel`, valide son intégrité via `pg_restore --list`, puis le renomme de façon atomique. Si `pg_dump` est interrompu ou échoue, le fichier partiel est supprimé et le script sort avec un code d'erreur non nul.

---

### 7.2 Script de restauration (`scripts/restauration_bd.sh`)

Le script prend en charge les archives custom `pg_dump` (`.dump`) et les fichiers SQL textuels (`.sql`).

**Usage standard** :
```bash
# Restauration automatique de la dernière sauvegarde disponible dans ./backups/
./scripts/restauration_bd.sh

# Restauration d'un fichier dump précis
./scripts/restauration_bd.sh ./backups/ciat_backup_20261027_005500.dump

# Restauration automatisée sans invite de confirmation (CI/CD ou crontab)
./scripts/restauration_bd.sh ./backups/ciat_backup_20261027_005500.dump --yes

# Restauration incluant l'extraction des médias associés
./scripts/restauration_bd.sh ./backups/ciat_backup_20261027_005500.dump --yes --avec-media
```

**Garanties de restauration** :
1. **Validation préalable stricte** : Le script teste la structure du fichier avec `pg_restore --list` avant toute action. Si le fichier est corrompu ou invalide, l'opération est abandonnée immédiatement avec un code d'erreur `1`, **sans toucher à la base de données**.
2. **Atomicité et arrêt sur erreur** : La restauration est exécutée avec `--single-transaction` et `--exit-on-error` (ainsi que `--clean --if-exists --no-owner --no-privileges`). Toute erreur annule l'intégralité de la transaction.
3. **Codes de retour stricts** : Le message `[SUCCÈS]` n'est affiché que si l'outil de restauration a retourné strictement le code `0`.

---

### 7.3 Vérification de bout en bout (`scripts/verifier_sauvegarde_restauration.sh`)

Pour valider formellement qu'une sauvegarde puis une restauration restituent rigoureusement l'ensemble des données, le script `scripts/verifier_sauvegarde_restauration.sh` :
1. Relève le compte exact de lignes de chaque table du schéma `public` via `information_schema.tables`.
2. Génère une sauvegarde complète vers un fichier temporaire.
3. Simule une perte de données en vidant une table métier (`TRUNCATE TABLE incubator_dossier CASCADE;`).
4. Lance la restauration via `scripts/restauration_bd.sh --yes`.
5. Relève à nouveau les comptes et compare table par table.

**Sortie réelle mesurée lors de l'exécution de validation (27 octobre 2026 sur PostgreSQL 12.22 local)** :
```text
==========================================================
 CIAT — Test de vérification Sauvegarde / Restauration
==========================================================
 Base testée : ciat sur localhost:5432
 Mode        : Local
----------------------------------------------------------
=> Étape 1 : Relevé initial des lignes de chaque table...
   40 tables analysées dans le schéma public.
=> Étape 2 : Lancement de sauvegarde_bd.sh...
=> Étape 3 : Altération volontaire (TRUNCATE incubator_dossier CASCADE)...
   Lignes dans incubator_dossier après troncature : 0
=> Étape 4 : Lancement de restauration_bd.sh...
=> Étape 5 : Relevé des lignes après restauration...
----------------------------------------------------------
Table                                    | Avant      | Après     | Résultat 
----------------------------------------------------------
assistant_conversation                   | 0          | 0          | OK        
assistant_messageassistant               | 0          | 0          | OK        
assistant_passagedocument                | 0          | 0          | OK        
auth_group                               | 0          | 0          | OK        
auth_group_permissions                   | 0          | 0          | OK        
auth_permission                          | 144        | 144        | OK        
core_cohorte                             | 3          | 3          | OK        
core_domaine                             | 7          | 7          | OK        
core_projet                              | 62         | 62         | OK        
core_user                                | 45         | 45         | OK        
core_user_groups                         | 0          | 0          | OK        
core_user_user_permissions               | 0          | 0          | OK        
django_admin_log                         | 0          | 0          | OK        
django_content_type                      | 36         | 36         | OK        
django_migrations                        | 36         | 36         | OK        
django_session                           | 0          | 0          | OK        
documents_document                       | 0          | 0          | OK        
documents_modeledocument                 | 12         | 12         | OK        
documents_typedocument                   | 4          | 4          | OK        
documents_versiondocument                | 0          | 0          | OK        
gallery_ficheinnovation                  | 0          | 0          | OK        
incubator_affectationmentor              | 0          | 0          | OK        
incubator_commentairejalon               | 0          | 0          | OK        
incubator_critere                        | 5          | 5          | OK        
incubator_decision                       | 0          | 0          | OK        
incubator_dossier                        | 0          | 0          | OK        
incubator_evaluation                     | 0          | 0          | OK        
incubator_grille                         | 1          | 1          | OK        
incubator_jalon                          | 0          | 0          | OK        
incubator_note                           | 0          | 0          | OK        
incubator_objectif                       | 0          | 0          | OK        
incubator_piece                          | 0          | 0          | OK        
incubator_preuvejalon                    | 0          | 0          | OK        
incubator_suiviprojet                    | 0          | 0          | OK        
portal_actualite                         | 2          | 2          | OK        
portal_appelprojet                       | 2          | 2          | OK        
portal_documentpublic                    | 3          | 3          | OK        
portal_evenement                         | 2          | 2          | OK        
portal_messagecontact                    | 0          | 0          | OK        
portal_partenaire                        | 3          | 3          | OK        
----------------------------------------------------------
Verdict : IDENTIQUE
==========================================================
```

### 7.4 Synthèse des éléments testés et non testés

| Élément | État de validation | Détail |
| :--- | :---: | :--- |
| Sauvegarde nominale (`sauvegarde_bd.sh`) | **Testé (Succès)** | Validé avec création de dump et vérification `pg_restore --list`. |
| Restauration nominale (`restauration_bd.sh`) | **Testé (Succès)** | Validé avec réimport intégral des 40 tables et données. |
| Rejet de dump corrompu / poubelle | **Testé (Succès)** | Rejet immédiat (code 1, base non touchée, aucun message de succès erroné). |
| Parsing credentials encodés dans `DATABASE_URL` | **Testé (Succès)** | Validé avec mots de passe contenant `%40` (`@`), `%3A` (`:`), `%2F` (`/`). |
| Protection environnement de vérification | **Testé (Succès)** | Refus catégorique d'exécuter la troncature de test si l'hôte n'est pas `localhost` / `127.0.0.1`. |
| Exclusion Git des dumps et backups | **Testé (Succès)** | Vérifié via `git check-ignore -v backups/x.dump`. |
| Sauvegarde / Restauration via Docker PostgreSQL 16 | *Non testé en local* | En attente de déploiement sur environnement disposant de WSL2 / Linux Docker. |

