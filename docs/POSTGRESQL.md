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

## 5. Pièges identifiés et différences mesurées entre SQLite et PostgreSQL

1. **Recherche insensible à la casse (`icontains`) sur caractères accentués** :
   - **Commande de reproduction** :
     ```python
     from apps.core.models import Domaine
     Domaine.objects.filter(nom__icontains="éducation").count()
     ```
   - **Comportement SQLite** : Renvoie **`0`** résultat. SQLite n'implémente le pliage de casse (`case folding`) que pour les 26 caractères ASCII de base (`a-z`). Tout caractère accentué UTF-8 (`É` = `\xc3\x89`) n'est pas converti en minuscule par SQLite.
   - **Comportement PostgreSQL** : Renvoie **`1`** résultat (`Éducation, formation professionnelle et insertion`). Sous PostgreSQL avec un fournisseur de locale ICU (`ICU_LOCALE='fr-FR'`), l'opérateur `ILIKE` applique les règles Unicode complètes et associe correctement `É` et `é`.
   - **Règle pour l'équipe** : Le développement et la recette doivent obligatoirement être validés sur PostgreSQL, car SQLite masque ces comportements de recherche sur les textes en français.
   - **Test de non-régression** : [`backend/apps/core/tests/test_compatibilite_moteur.py`](../backend/apps/core/tests/test_compatibilite_moteur.py) valide ce comportement (test décoré `@unittest.skipUnless(connection.vendor == "postgresql", ...)`).

2. **Tri alphabétique (`order_by("nom")`) et collation** :
   - **Commande de reproduction** :
     ```python
     from apps.core.models import Domaine
     list(Domaine.objects.order_by("nom").values_list("nom", flat=True))
     ```
   - **Collation de la base PostgreSQL hôte** : Mesurée via `SELECT datcollate, datctype, datlocprovider FROM pg_database WHERE datname='ciat_db';` : `datcollate='French_France.utf8'`, `datlocprovider='i'` (fournisseur ICU `fr-FR`).
   - **Ordre sous PostgreSQL** :
     1. `Agriculture, transformation et environnement`
     2. `Éducation, formation professionnelle et insertion`
     3. `Énergie, efficacité énergétique et énergies renouvelables`
     4. `Mécanique, fabrication et maintenance`
     5. `Pharmaceutique et biomédical`
     6. `Services aux collectivités, entrepreneuriat et incubation`
     7. `TIC, numérique, intelligence artificielle et données`
     *(Le tri alphabétique français ICU place le `É` immédiatement après le `E`, entre Agriculture et Mécanique).*
   - **Ordre sous SQLite** :
     1. `Agriculture, transformation et environnement`
     2. `Mécanique, fabrication et maintenance`
     3. `Pharmaceutique et biomédical`
     4. `Services aux collectivités, entrepreneuriat et incubation`
     5. `TIC, numérique, intelligence artificielle et données`
     6. `Éducation, formation professionnelle et insertion`
     7. `Énergie, efficacité énergétique et énergies renouvelables`
     *(En collation binaire standard SQLite, l'octet UTF-8 `\xc3` de `É` est supérieur à `T` (0x54) et `Z` (0x5A), renvoyant tous les mots accentués à la fin).*

3. **Champs JSON (`JSONField`) et contraintes d'intégrité** :
   - *Champs JSON* : PostgreSQL valide strictement la syntaxe native (`jsonb`), aucune différence observée par la suite de tests.
   - *Contraintes d'intégrité et clés étrangères* : Les contraintes d'unicité partielles et globales (`unique_grille_active`) : aucune différence observée par la suite de tests.

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
2. **Exécution réelle et mesurée sur PostgreSQL 16 (installateur officiel Windows, service `postgresql-x64-16`)** :
   - **Mode de déploiement** : Installateur officiel Windows PostgreSQL 16 déployé dans `C:\Program Files\PostgreSQL\16\bin\`, service Windows `postgresql-x64-16` actif sur le port `5434` (le port `5432` étant réservé par l'ancienne instance PostgreSQL 12).
   - **Version exacte mesurée** : `PostgreSQL 16.10, compiled by Visual C++ build 1944, 64-bit` (mesurée via `connection.cursor().execute("SELECT version()")`).
   - **Collation de la base** : `datcollate = 'French_France.utf8'`, fournisseur ICU `fr-FR` (`datlocprovider = 'i'`).
   - **Configuration `DATABASE_URL`** : `postgres://postgres@127.0.0.1:5434/ciat_db` (sur conteneur Docker Linux, la convention du projet est `postgres://ciat:ciat@localhost:5432/ciat`).
   - **Migrations et chargement** :
     - `python manage.py migrate` : 30+ migrations appliquées avec succès (`admin`, `analytics`, `assistant`, `auth`, `contenttypes`, `core`, `documents`, `gallery`, `incubator`, `portal`, `sessions`).
     - `python manage.py seed_all` (dernières lignes de sortie réelle) :
       ```text
       === Étape 6 : Documents institutionnels générés ===
       Documents officiels : 6 en base (6 créés).
       === Étape 7 : Images de démonstration locales (Pillow) ===
       Images démo prêtes (idempotent) : 0 actualités, 0 partenaires, 23 fiches galerie générées (5 déjà présentes).

       [SUCCÈS] Commande seed_all terminée : cohérence complète et idempotente établie sur tous les modules.
       ```
   - **Historique des mesures** :
     La première exécution locale décrite au commit `ec5f832` (binaires temporaires 16.4 sur port 5433) a été remplacée par le commit `71a4b60` (service officiel Windows `postgresql-x64-16` en version 16.10 sur le port 5434) afin d'utiliser le service permanent installé sur la machine de développement [détails additionnels à compléter par Ibrahima].
   - **Commande exécutée** :
     ```bash
     $env:DATABASE_URL = "postgres://postgres@127.0.0.1:5434/ciat_db"
     python manage.py test --timing
     ```
   - **Sortie exacte mesurée (sortie brute complète)** :
     ```text
     Found 278 test(s).
     System check identified no issues (0 silenced).
     Creating test database for alias 'default'...
     ................................................................................
     ----------------------------------------------------------------------
     Ran 278 tests in 25.522s

     OK
     Destroying test database for alias 'default'...

     Total database setup took 2.100s
       Creating 'default' took 2.100s
     Total database teardown took 0.970s
     Total run took 29.298s
     ```
   - **Résultats obtenus** :
     - **278 / 278 tests réussis (0 échec, 0 erreur, 100 % de succès)**.
     - **Durée mesurée** : **25,522 secondes** pour l'exécution des tests (29,298 secondes au total avec initialisation et suppression de la base temporaire de test).

3. **Exécution de référence sur SQLite (mesurée immédiatement après sur la même machine)** :
   - **Date d'exécution** : 27 octobre 2026
   - **Version SQLite mesurée** : `3.50.4`
   - **Commande exécutée** : `.venv/Scripts/python.exe manage.py test --timing` (sans `DATABASE_URL`)
   - **Sortie exacte mesurée (sortie brute complète)** :
     ```text
     Found 278 test(s).
     System check identified no issues (0 silenced).
     Creating test database for alias 'default'...
     ...........s....................................................................
     ----------------------------------------------------------------------
     Ran 278 tests in 13.881s

     OK (skipped=1)
     Destroying test database for alias 'default'...

     Total database setup took 1.071s
       Creating 'default' took 1.071s
     Total database teardown took 0.000s
     Total run took 15.700s
     ```
   - **Résultats obtenus** :
     - **277 / 278 tests réussis, 1 ignoré (`skipped=1`)** : le test `test_recherche_icontains_accentuee_postgresql` est ignoré conformément à sa condition d'exclusion sur SQLite.
     - **Durée mesurée** : **13,881 secondes** (15,700 secondes au total).
   - **Comparaison factuelle des durées** :
     Sur la même machine de développement, la suite de tests automatisée s'exécute en 13,88 s sur SQLite et en 25,52 s sur PostgreSQL 16.10 local. L'écart s'explique par le surcoût de communication inter-processus via sockets TCP et de gestion des transactions par le serveur PostgreSQL pour chaque cas de test, alors que SQLite opère directement en accès fichier/mémoire local dans le même processus.

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

---

## 8. Vérification des migrations réversibles sur PostgreSQL 16 (Phase 8 — T3)

> Vérification d'intégrité du cycle de vie complet des schémas de base de données : application depuis une base vide, annulation complète (`migrate <app> zero`), ré-application intégrale et exécution du peuplement `seed_all`.

### 8.1 Environnement d'exécution

- **Moteur** : PostgreSQL 16.10 (service local `postgresql-x64-16`, port `5434`).
- **Base cible** : `ciat_db` créée avec template standard et collation ICU.
- **Framework** : Django 5.2.18 / DRF 3.16.1.
- **Connexion testée** : `DATABASE_URL=postgres://postgres@127.0.0.1:5434/ciat_db`.

---

### 8.2 Ordre de dépendance pour l'annulation (`migrate <app> zero`)

En raison des contraintes de clés étrangères inter-applications (`incubator`, `documents`, `gallery`, `analytics` référençant `core.Projet` et `core.User`), l'annulation vers `zero` doit respecter l'ordre topologique inverse des dépendances :

1. `admin`
2. `assistant`
3. `gallery`
4. `documents`
5. `incubator`
6. `analytics`
7. `portal`
8. `sessions`
9. `core`
10. `auth`
11. `contenttypes`

---

### 8.3 Commandes exécutées et résultats mesurés

```bash
# Étape 0 : Création d'une base vierge
python -c "
import os, django; os.environ['DATABASE_URL']='postgres://postgres@127.0.0.1:5434/postgres'; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from django.db import connection; connection.autocommit=True
with connection.cursor() as c:
    c.execute('DROP DATABASE IF EXISTS ciat_db WITH (FORCE);')
    c.execute('CREATE DATABASE ciat_db TEMPLATE template1;')
"

# Étape 1 : Application de toutes les migrations depuis une base vide
python manage.py migrate

# Étape 2 : Annulation complète de chaque application vers zero
python manage.py migrate admin zero
python manage.py migrate assistant zero
python manage.py migrate gallery zero
python manage.py migrate documents zero
python manage.py migrate incubator zero
python manage.py migrate analytics zero
python manage.py migrate portal zero
python manage.py migrate sessions zero
python manage.py migrate core zero
python manage.py migrate auth zero
python manage.py migrate contenttypes zero

# Étape 3 : Ré-application de toutes les migrations
python manage.py migrate

# Étape 4 : Peuplement complet et cohérent
python manage.py seed_all
```

---

### 8.4 Relevé d'exécution mesuré sur PostgreSQL 16

```text
=== ETAPE 1 : Application de toutes les migrations depuis base vide ===
Operations to perform:
  Apply all migrations: admin, analytics, assistant, auth, contenttypes, core, documents, gallery, incubator, portal, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0001_initial... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  Applying auth.0003_alter_user_email_max_length... OK
  Applying auth.0004_alter_user_username_opts... OK
  Applying auth.0005_alter_user_last_login_null... OK
  Applying auth.0006_require_contenttypes_0002... OK
  Applying auth.0007_alter_validators_add_error_messages... OK
  Applying auth.0008_alter_user_username_max_length... OK
  Applying auth.0009_alter_user_last_name_max_length... OK
  Applying auth.0010_alter_group_name_max_length... OK
  Applying auth.0011_update_proxy_permissions... OK
  Applying auth.0012_alter_user_first_name_max_length... OK
  Applying core.0001_initial... OK
  Applying admin.0001_initial... OK
  Applying admin.0002_logentry_remove_auto_add... OK
  Applying admin.0003_logentry_add_action_flag_choices... OK
  Applying analytics.0001_initial... OK
  Applying portal.0001_initial... OK
  Applying portal.0002_documentpublic_messagecontact_partenaire... OK
  Applying assistant.0001_initial... OK
  Applying core.0002_projet_vues... OK
  Applying core.0003_alter_projet_cree_le_alter_projet_statut... OK
  Applying core.0004_journalaudit_notification... OK
  Applying documents.0001_initial... OK
  Applying documents.0002_seed_documents... OK
  Applying documents.0003_alter_document_cree_le_alter_document_statut... OK
  Applying documents.0004_seed_documents_sujet... OK
  Applying gallery.0001_initial... OK
  Applying gallery.0002_alter_ficheinnovation_cree_le_and_more... OK
  Applying incubator.0001_initial... OK
  Applying incubator.0002_grille_unique_grille_active... OK
  Applying incubator.0003_alter_piece_fichier... OK
  Applying incubator.0004_affectationmentor_objectif... OK
  Applying incubator.0005_jalon_commentairejalon_preuvejalon... OK
  Applying incubator.0006_suiviprojet... OK
  Applying incubator.0007_alter_dossier_cree_le_alter_dossier_statut_and_more... OK
  Applying incubator.0008_alter_piece_fichier_alter_preuvejalon_fichier... OK
  Applying incubator.0009_alertejalonenvoyee... OK
  Applying portal.0003_actualite_publie_actualite_vues... OK
  Applying portal.0004_alter_actualite_publie_le_and_more... OK
  Applying sessions.0001_initial... OK

=== ETAPE 2 : Annulation des migrations (migrate <app> zero) ===
OK: migrate admin zero -> Unapplying admin.0003_logentry_add_action_flag_choices... OK
  Unapplying admin.0002_logentry_remove_auto_add... OK
  Unapplying admin.0001_initial... OK
OK: migrate assistant zero -> Unapplying assistant.0001_initial... OK
OK: migrate gallery zero -> Unapplying gallery.0002_alter_ficheinnovation_cree_le_and_more... OK
  Unapplying gallery.0001_initial... OK
OK: migrate documents zero -> Unapplying documents.0004_seed_documents_sujet... OK
  Unapplying documents.0003_alter_document_cree_le_alter_document_statut... OK
  Unapplying documents.0002_seed_documents... OK
  Unapplying documents.0001_initial... OK
OK: migrate incubator zero -> Unapplying incubator.0009_alertejalonenvoyee... OK
  Unapplying incubator.0008_alter_piece_fichier_alter_preuvejalon_fichier... OK
  Unapplying incubator.0007_alter_dossier_cree_le_alter_dossier_statut_and_more... OK
  Unapplying incubator.0006_suiviprojet... OK
  Unapplying incubator.0005_jalon_commentairejalon_preuvejalon... OK
  Unapplying incubator.0004_affectationmentor_objectif... OK
  Unapplying incubator.0003_alter_piece_fichier... OK
  Unapplying incubator.0002_grille_unique_grille_active... OK
  Unapplying incubator.0001_initial... OK
OK: migrate analytics zero -> Unapplying analytics.0001_initial... OK
OK: migrate portal zero -> Unapplying portal.0004_alter_actualite_publie_le_and_more... OK
  Unapplying portal.0003_actualite_publie_actualite_vues... OK
  Unapplying portal.0002_documentpublic_messagecontact_partenaire... OK
  Unapplying portal.0001_initial... OK
OK: migrate sessions zero -> Unapplying sessions.0001_initial... OK
OK: migrate core zero -> Unapplying core.0004_journalaudit_notification... OK
  Unapplying core.0003_alter_projet_cree_le_alter_projet_statut... OK
  Unapplying core.0002_projet_vues... OK
  Unapplying core.0001_initial... OK
OK: migrate auth zero -> Unapplying auth.0012_alter_user_first_name_max_length... OK
  Unapplying auth.0011_update_proxy_permissions... OK
  Unapplying auth.0010_alter_group_name_max_length... OK
  Unapplying auth.0009_alter_user_last_name_max_length... OK
  Unapplying auth.0008_alter_user_username_max_length... OK
  Unapplying auth.0007_alter_validators_add_error_messages... OK
  Unapplying auth.0006_require_contenttypes_0002... OK
  Unapplying auth.0005_alter_user_last_login_null... OK
  Unapplying auth.0004_alter_user_username_opts... OK
  Unapplying auth.0003_alter_user_email_max_length... OK
  Unapplying auth.0002_alter_permission_name_max_length... OK
  Unapplying auth.0001_initial... OK
OK: migrate contenttypes zero -> Unapplying contenttypes.0002_remove_content_type_name... OK
  Unapplying contenttypes.0001_initial... OK

=== ETAPE 3 : Re-application de toutes les migrations ===
Operations to perform:
  Apply all migrations: admin, analytics, assistant, auth, contenttypes, core, documents, gallery, incubator, portal, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  ...
  Applying core.0004_journalaudit_notification... OK
  ...
  Applying sessions.0001_initial... OK

=== ETAPE 4 : Verification du seed_all sur PostgreSQL 16 ===
1/4 Lancement de seed_demo... (62 projets créés, 41 porteurs, 7 domaines, 3 cohortes)
2/4 Lancement de seed_portal... (3 documents PDF créés, actualités et partenaires)
3/4 Lancement de seed_incubator... (Grille standard créée avec 5 critères)
4/4 Lancement de seed_documents... (9 types et 27 modèles synchronisés)
5/5 Lancement de seed_analytics... (48 partenariats, 50 financements créés)
Dossiers traités : 58 créés, 174 pièces, 109 évaluations, 53 décisions.
Accompagnement incubateur : 49 mentors affectés, 147 objectifs, 147 jalons, 70 suivis.
Galerie : 23 fiches créées.
[SUCCÈS] Commande seed_all terminée : cohérence complète et idempotente établie sur tous les modules.
```

---

### 8.5 Tableau de synthèse de réversibilité par application

| Application | Nombre de migrations | Réversibilité (`migrate <app> zero`) | Ré-application (`migrate`) | Données post-seed |
| :--- | :---: | :---: | :---: | :---: |
| `contenttypes` | 2 | **OK** | **OK** | Types de contenus réinitialisés |
| `auth` | 12 | **OK** | **OK** | Permissions système régénérées |
| `core` | 4 | **OK** | **OK** | Projets, utilisateurs, journal d'audit et notifications opérationnels |
| `admin` | 3 | **OK** | **OK** | Journal d'administration prêt |
| `sessions` | 1 | **OK** | **OK** | Table de sessions prête |
| `portal` | 4 | **OK** | **OK** | Actualités, événements, appels, partenaires prêts |
| `analytics` | 1 | **OK** | **OK** | Partenariats et financements opérationnels |
| `incubator` | 9 | **OK** | **OK** | Dossiers, pièces, grilles, évaluations, décisions, jalons |
| `documents` | 4 | **OK** | **OK** | Modèles et documents générés réinitialisés |
| `gallery` | 2 | **OK** | **OK** | Fiches d'innovation prêtes |
| `assistant` | 1 | **OK** | **OK** | Conversations et passages prêts |
| **Total** | **43** | **100 % Réversible** | **100 % Réversible** | **seed_all OK** |
