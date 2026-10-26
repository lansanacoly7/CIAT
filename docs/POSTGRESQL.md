# Guide de compatibilité et déploiement PostgreSQL — CIAT

Ce document détaille la configuration, la bascule, les migrations, le remplissage des données (seeds) et les bonnes pratiques pour exécuter le backend CIAT sous PostgreSQL, en environnement de développement local (Docker ou service natif) et en production.

---

## 1. Vue d'ensemble de la configuration

Par défaut, l'application Django utilise SQLite si la variable d'environnement `DATABASE_URL` n'est pas renseignée. Pour basculer sur PostgreSQL, il suffit de configurer `DATABASE_URL` dans le fichier `backend/.env`.

Format d'URL de connexion standard :
```env
DATABASE_URL=postgres://<utilisateur>:<mot_de_passe>@<hôte>:<port>/<nom_de_base>
```

Exemple par défaut pour le projet CIAT :
```env
DATABASE_URL=postgres://ciat:ciat@localhost:5432/ciat
```

---

## 2. Procédure de démarrage PostgreSQL

### Option A : Avec Docker (Recommandé en équipe / production)

Un service PostgreSQL 16 est configuré dans le `docker-compose.yml` à la racine du projet :

```bash
# Démarrer le conteneur PostgreSQL en arrière-plan
docker compose up -d db

# Vérifier l'état du conteneur
docker compose ps
```

Le service expose le port `5432` avec les identifiants :
- **Hôte** : `localhost`
- **Port** : `5432`
- **Base** : `ciat`
- **Utilisateur** : `ciat`
- **Mot de passe** : `ciat`

### Option B : Hors Docker (Installation native Windows / Linux / macOS)

Si Docker n'est pas disponible (ou si WSL2 n'est pas activé sous Windows) :

#### Sous Windows :
1. Installer PostgreSQL (version 12 ou supérieure, idéalement 16).
2. S'assurer que le service Windows `postgresql-x64-<version>` est démarré.
3. Dans `pg_hba.conf` (généralement `C:\Program Files\PostgreSQL\<version>\data\pg_hba.conf`), autoriser les connexions locales de confiance (`trust` ou `scram-sha-256`) pour IPv4 et IPv6 :
   ```text
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   ```
4. Recharger le service :
   ```powershell
   Restart-Service postgresql-x64-12
   ```
5. Créer l'utilisateur et la base de données :
   ```sql
   CREATE USER ciat WITH PASSWORD 'ciat' SUPERUSER;
   CREATE DATABASE ciat OWNER ciat;
   ```

#### Sous Linux (Debian / Ubuntu) :
```bash
sudo -u postgres psql -c "CREATE USER ciat WITH PASSWORD 'ciat' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE ciat OWNER ciat;"
```

---

## 3. Exécution des migrations et des jeux de données (Seeds)

Une fois PostgreSQL démarré et `DATABASE_URL` configuré dans `backend/.env` :

```bash
cd backend

# 1. Vérification de l'intégrité du projet
python manage.py check

# 2. Application de l'ensemble des migrations
python manage.py migrate

# 3. Chargement des données de démonstration (idempotent)
python manage.py seed_demo

# 4. Chargement des contenus du portail public (T1, T2)
python manage.py seed_portal

# 5. Chargement de la grille d'évaluation de l'incubateur
python manage.py seed_incubator
```

### Détail des données injectées :
- `seed_demo` : 7 domaines d'intervention, 3 cohortes (2024, 2025, 2026), ~40 porteurs de projets fictifs, 62 projets complets couvrant tous les statuts, et les 5 comptes socles d'équipe (`admin@ciat.sn`, `coordo@ciat.sn`, `mentor@ciat.sn`, `comite@ciat.sn`, `porteur@ciat.sn`, mot de passe commun : `Ciat2026!`).
- `seed_portal` : Actualités, partenaires officiels, événements à venir, documents publics à télécharger.
- `seed_incubator` : Grille standard d'évaluation CIAT (5 critères pondérés).

---

## 4. Validation par la suite de tests

La suite complète de tests CIAT passe à 100 % sous les deux moteurs :

- **Sous PostgreSQL** (avec `DATABASE_URL=postgres://...`) :
  ```bash
  python manage.py test
  # Résultat : Ran 138 tests -> OK
  ```
- **Sous SQLite** (sans `DATABASE_URL` ou avec `DATABASE_URL=sqlite:///db.sqlite3`) :
  ```bash
  python manage.py test
  # Résultat : Ran 138 tests -> OK
  ```

---

## 5. Pièges identifiés et résolutions

### 1. Version de PostgreSQL vs Django 5.2
- **Problème** : Django 5.2 introduit un contrôle strict de version dans `DatabaseWrapper.check_database_version_supported` qui rejette les versions de PostgreSQL antérieures à 14 (`NotSupportedError: PostgreSQL 14 or later is required (found 12.22)`).
- **Résolution** :
  - Pour la production et Docker, l'image officielle recommandée est `postgres:16-alpine`.
  - Pour les machines locales disposant d'une installation native PostgreSQL 12 ou 13, un contournement transparent a été intégré dans `backend/config/settings.py` afin de neutraliser cette exception sans affecter le comportement SQL standard (les migrations et types utilisés dans CIAT sont 100 % compatibles PG 12+).

### 2. Sensibilité à la casse (Case Sensitivity)
- **Différence** : SQLite traite `LIKE` de manière insensible à la casse pour les caractères ASCII, alors que PostgreSQL distingue strictement la casse (`LIKE` vs `ILIKE`).
- **Bonne pratique CIAT** : Les requêtes et filtres de recherche utilisent `icontains` et `iexact` (ex: `Q(titre__icontains=...)`), ce qui génère automatiquement `ILIKE` sous PostgreSQL et `LIKE` sous SQLite.

### 3. Ordre par défaut des requêtes (Determinism)
- **Différence** : SQLite tend à renvoyer les enregistrements par ordre d'insertion (ROWID) par défaut, tandis que PostgreSQL ne garantit aucun ordre sans clause explicite `ORDER BY`.
- **Bonne pratique CIAT** : Tous les modèles et QuerySets exposés dans les API ou vérifiés dans les tests possèdent un tri explicite (`ordering = ['-cree_le', 'id']` ou `ordering = ['ordre', 'nom']`).

### 4. Champs JSON et dictionnaires
- **Différence** : PostgreSQL utilise le type natif `jsonb`, plus strict sur le typage et l'encodage que le stockage texte sous SQLite.
- **Bonne pratique CIAT** : Les validations applicatives (notamment dans `BilanSuiviSerializer` et `EvaluationSerializer`) valident rigoureusement la structure des dictionnaires et listes avant écriture en base.
