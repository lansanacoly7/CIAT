# Guide de Déploiement et d'Intégration Continue — Plateforme CIAT

> **Plateforme du Centre d'Innovation, d'Application et de Transfert (ISEP Diamniadio)**  
> Ce document formalise la stratégie de protection des branches, l'intégration continue (CI), l'architecture d'hébergement gratuit retenue pour la démonstration devant le jury, la liste des variables d'environnement de production (noms uniquement) et le guide d'exécution pas-à-pas pour le lead technique (Lansana).

---

## 1. Protection des branches Git (`main`, `test`, `dev-lansana-coly`)

Pour garantir l'intégrité du code et éviter toute régression ou secret accidentellement poussé, la gouvernance des branches sur GitHub (`Settings > Branches > Add branch protection rule`) doit être configurée comme suit :

### A. Règles pour la branche `main` (Production)
- **Branch name pattern :** `main`
- **Require a pull request before merging :** Activé.
  - Require approvals : 1 approbation minimum.
  - Dismiss stale pull request approvals when new commits are pushed.
- **Require status checks to pass before merging :** Activé.
  - Vérifications obligatoires : `Backend Django (Python 3.13)` et `Frontend Next.js (Node 22)`.
  - Require branches to be up to date before merging : Activé.
- **Do not allow bypassing the above settings :** Activé (s'applique à tous, y compris les administrateurs).
- **Restrict who can push to matching branches :** Poussée directe formellement interdite. Fusion réservée exclusivement à Lansana.

### B. Règles pour la branche `test` & `dev-lansana-coly` (Intégration)
- **Branch name pattern :** `test` et `dev-lansana-coly`
- **Require a pull request before merging :** Activé.
- **Require status checks to pass before merging :** Activé (`Backend Django (Python 3.13)` et `Frontend Next.js (Node 22)`).
- **Restrict who can push to matching branches :** Poussée directe interdite. Les développeurs travaillent uniquement sur des branches `feature/*`.

---

## 2. Intégration Continue (GitHub Actions)

Le fichier `.github/workflows/ci.yml` automatise les tests et validations de conformité à chaque `push` sur les branches `feature/*`, `dev-lansana-coly`, `test`, ainsi qu'à chaque `pull_request` :

1. **Job Backend (`Python 3.13`) :**
   - Installation des dépendances depuis `backend/requirements.txt` avec mise en cache `pip`.
   - `python manage.py check` : diagnostic complet de configuration.
   - `python manage.py makemigrations --check --dry-run` : détection immédiate de tout modèle modifié sans migration associée.
   - `python manage.py test` : exécution de la suite complète des 21 tests unitaires.
2. **Job Frontend (`Node 22`) :**
   - Installation propre via `npm ci` avec mise en cache `npm`.
   - `npm run lint` : analyse statique ESLint Next.js.
   - `npm run build` : compilation de production Next.js (Turbopack, TypeScript, rendu statique).

---

## 3. Choix d'Hébergement Gratuit pour le Jury

Pour offrir une URL accessible en ligne au jury sans frais d'infrastructure, l'architecture découplée suivante est recommandée :

| Composant | Hébergeur recommandé | Justification technique |
|---|---|---|
| **Frontend Next.js** | **Vercel** (Hobby Plan gratuit) | Créateur de Next.js, support natif de SSR et Turbopack, CDN mondial haute performance, HTTPS automatique, builds instantanés à chaque commit GitHub. |
| **Backend Django** | **Render** (Free Tier Web Service) | Support Python natif, prise en compte déclarative de `render.yaml` et `Procfile`, renouvellement SSL gratuit, redémarrage automatique, journalisation en temps réel. |
| **Base de Données** | **Render PostgreSQL** (Free Managed DB) | PostgreSQL managé inclus, compatible avec `dj-database-url` via variable `DATABASE_URL`, sauvegardes et isolation réseau. |

*(Alternative PaaS compatible : Railway, Koyeb ou Fly.io en utilisant le `Procfile` fourni à la racine).*

---

## 4. Gestion des Fichiers Statiques, Médias et Migrations

### A. Fichiers Statiques (CSS, JS, Logos de la Charte)
- Pris en charge en production par **WhiteNoise** (`whitenoise.middleware.WhiteNoiseMiddleware`), déjà configuré dans `backend/config/settings.py`.
- Permet à Django de servir les assets statiques avec compression Gzip/Brotli et en-têtes de cache optimaux sans dépendre d'un serveur Nginx externe.
- La commande `python manage.py collectstatic --no-input` est automatiquement appelée lors du build.

### B. Migrations automatiques
- La commande `python manage.py migrate` est intégrée directement dans le script de build/déploiement de Render (`buildCommand`). Toute nouvelle table ou modification de schéma s'applique avant la mise en service du code.

### C. Fichiers Médias (PDF, pièces jointes)
- Les pièces déposées sont plafonnées à 10 Mo (`FILE_UPLOAD_MAX_MEMORY_SIZE`).
- Pour un usage de démonstration devant le jury, le stockage local sous `backend/media/` est fonctionnel. Pour une persistance long terme en production multi-instances, un bucket compatible S3 (Cloudinary, Supabase Storage ou AWS S3 gratuit) peut être connecté en renseignant `django-storages`.

---

## 5. Dictionnaire des Variables d'Environnement de Production

> **Règle absolue :** Ne jamais consigner de valeurs réelles dans ce document ni dans le dépôt Git. Les valeurs sont saisies manuellement dans les interfaces sécurisées de Vercel et de Render.

### A. Backend (Variables d'environnement Render)
| Nom de la variable | Rôle / Description |
|---|---|
| `DJANGO_SECRET_KEY` | Clé cryptographique forte générée pour la production (différente du dev). |
| `DJANGO_DEBUG` | Doit être strictement fixée à `0` en production. |
| `DJANGO_SETTINGS_MODULE` | Réglages Django (`config.settings`). |
| `DJANGO_ALLOWED_HOSTS` | Liste des domaines autorisés séparés par une virgule (ex. `ciat-backend.onrender.com`). |
| `CORS_ALLOWED_ORIGINS` | Origine autorisée pour le frontend (ex. `https://ciat-frontend.vercel.app`). |
| `CSRF_TRUSTED_ORIGINS` | Origines de confiance pour les requêtes POST (ex. `https://ciat-backend.onrender.com,https://ciat-frontend.vercel.app`). |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL injectée automatiquement par Render. |
| `AI_PROVIDERS` | Ordre des fournisseurs IA de secours (`groq,gemini`). |
| `GROQ_API_KEY` | Clé d'API Groq (obtenue gratuitement sur console.groq.com). |
| `GROQ_MODEL` | Modèle Groq utilisé (ex. `llama-3.3-70b-versatile`). |
| `GEMINI_API_KEY` | Clé d'API Google AI Studio (obtenue gratuitement sur aistudio.google.com). |
| `GEMINI_MODEL` | Modèle Gemini utilisé (ex. `gemini-2.5-flash`). |

### B. Frontend (Variables d'environnement Vercel)
| Nom de la variable | Rôle / Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL publique de l'API Django (ex. `https://ciat-backend.onrender.com/api`). |

---

## 6. Procédure Manuelle de Déploiement Pas-à-Pas (pour Lansana)

### Étape 1 : Création des comptes d'hébergement
1. Se connecter sur [render.com](https://render.com) avec le compte GitHub de l'organisation ou personnel.
2. Se connecter sur [vercel.com](https://vercel.com) avec le même compte GitHub.

### Étape 2 : Déploiement de la base de données et du backend sur Render
1. Dans le tableau de bord Render, cliquer sur **New +** > **Blueprint**.
2. Sélectionner le dépôt `lansanacoly7/CIAT` et la branche `main` (ou `test`).
3. Render détecte automatiquement le fichier `render.yaml` et initialise :
   - La base PostgreSQL `ciat-postgres`.
   - Le service web `ciat-backend`.
4. Renseigner les variables d'environnement dans l'interface Render :
   - `DJANGO_ALLOWED_HOSTS` : `<nom-service>.onrender.com`
   - `GROQ_API_KEY` et `GEMINI_API_KEY` : vos clés d'API gratuites.
5. Cliquer sur **Apply**. Render lance l'installation, le `collectstatic`, les `migrate` et démarre Gunicorn.
6. Noter l'URL publique fournie (ex. `https://ciat-backend.onrender.com`).

### Étape 3 : Peuplement des données de démonstration initiales
1. Dans le tableau de bord Render, ouvrir l'onglet **Shell** du service web `ciat-backend`.
2. Exécuter la commande pour créer les cohortes, domaines, comptes équipes et les 62 projets :
   ```bash
   python manage.py seed_demo
   ```
3. Exécuter la commande pour vérifier les gabarits de documents :
   ```bash
   python manage.py seed_documents
   ```

### Étape 4 : Déploiement du frontend sur Vercel
1. Dans le tableau de bord Vercel, cliquer sur **Add New...** > **Project**.
2. Importer le dépôt Git `lansanacoly7/CIAT`.
3. Dans la configuration du projet :
   - **Root Directory :** sélectionner `frontend`.
   - **Framework Preset :** Next.js (détecté automatiquement).
4. Dans **Environment Variables**, ajouter :
   - `NEXT_PUBLIC_API_URL` = `https://<nom-backend>.onrender.com/api`
5. Cliquer sur **Deploy**.
6. Vercel compile le projet et délivre l'URL finale (ex. `https://ciat.vercel.app`).

### Étape 5 : Mise à jour des autorisations CORS sur Render
1. Retourner dans le service `ciat-backend` sur Render > **Environment**.
2. Mettre à jour `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS` avec l'URL Vercel définitive générée à l'étape 4.
3. Le service redémarre automatiquement avec les autorisations finalisées.

---

## 7. Recette Finale et Vérification Jury

Une fois les URLs en ligne disponibles :
1. Accéder à l'URL Vercel : vérifier le chargement de la page d'accueil et des composants de la charte.
2. Tester la connexion avec le compte `admin@ciat.sn` ou `porteur@ciat.sn` (mot de passe : `Ciat2026!`).
3. Tester la consultation des projets incubés dans le portail et la galerie.
4. Générer un document officiel dans le module P5 : vérifier la complétude des sections générées par l'IA.
