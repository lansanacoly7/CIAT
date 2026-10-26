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

Un conteneur PostgreSQL 16 est configuré dans le fichier `docker-compose.yml` à la racine du projet :

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ciat
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ciat_dev_password}
      POSTGRES_DB: ciat
    ports:
      - "5432:5432"
    volumes:
      - ciat_pg:/var/lib/postgresql/data
```

**Démarrage du service** :
```bash
# À la racine du projet
docker compose up -d db

# Vérification de l'état
docker compose ps
```

**Configuration dans `backend/.env`** :
```env
DATABASE_URL=postgres://ciat:ciat_dev_password@localhost:5432/ciat
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
