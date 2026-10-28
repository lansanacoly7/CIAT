# Plateforme CIAT

Une seule plateforme pour le Centre d'Innovation, d'Application et de Transfert (ISEP Amadou Trawaré, Diamniadio).
Backend Django REST Framework, frontend Next.js (TypeScript, Tailwind).

> Écrit pour toute l'équipe du projet. Le plan, les priorités et la file de tâches sont dans [PLAN_EQUIPE.md](docs/PLAN_EQUIPE.md). Les couleurs, polices et composants sont dans [Charte_Graphique_CIAT_ISEP.pdf](docs/Charte_Graphique_CIAT_ISEP.pdf).

## Démarrer en 5 minutes

### 1. Backend (http://localhost:8000)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/Mac : source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # Linux/Mac : cp .env.example .env
python manage.py migrate
python manage.py seed_demo      # domaines, cohorte et comptes de démonstration
python manage.py runserver
```
- Documentation de l'API : http://localhost:8000/api/docs/
- Administration : http://localhost:8000/admin/
- Sans configuration, la base est un fichier SQLite local. Pour PostgreSQL : `docker compose up -d` puis `DATABASE_URL=postgres://ciat:ciat@localhost:5432/ciat` dans `backend/.env`.

### 2. Frontend (http://localhost:3000)
```bash
cd frontend
copy .env.example .env.local    # Linux/Mac : cp .env.example .env.local
npm install
npm run dev
```

### Comptes de démonstration (développement uniquement)
Mot de passe : `Ciat2026!`

| Email | Rôle |
|---|---|
| admin@ciat.sn | Administrateur |
| coordo@ciat.sn | Coordonnateur |
| mentor@ciat.sn | Mentor |
| comite@ciat.sn | Membre du comité |
| porteur@ciat.sn | Porteur de projet |

Un visiteur est un utilisateur non connecté. L'inscription publique crée toujours un porteur de projet.

## Structure

```
backend/
  config/            réglages, routes générales
  apps/
    core/            utilisateurs, rôles, domaines, cohortes, projets, service IA
    documents/       générateur de documents
    incubator/       gestion de l'incubateur
    portal/          portail institutionnel
    analytics/       tableau de bord décisionnel
    assistant/       assistant IA
    gallery/         galerie des innovations
frontend/
  src/app/           une page par module (documents, incubateur, portail, ...)
  src/components/    en-tête, pied de page, composants de la charte (ui.tsx)
  src/lib/           client de l'API (api.ts), liste des modules (modules.ts)
```

Chaque module a son préfixe d'API : `/api/documents/`, `/api/incubator/`, `/api/portal/`, `/api/analytics/`, `/api/assistant/`, `/api/gallery/`. On ajoute ses routes dans `apps/<module>/urls.py`.

## Règles de travail

- **Droits** : utiliser les permissions de `apps/core/permissions.py` (`HasRole(...)`, `ReadOnlyOrRole(...)`). Ne jamais écrire de vérification de rôle à la main.
- **Modèles communs** : `User`, `Domaine`, `Cohorte`, `Projet` sont dans `apps/core`. Les autres modules s'y rattachent avec une clé étrangère, sans les dupliquer.
- **Appels à l'IA** : toujours via `from apps.core.ai import ai`. Jamais d'appel direct à un fournisseur.
- **Apparence** : couleurs et polices viennent de la charte (variables dans `globals.css`, composants dans `components/ui.tsx`).
- **Secrets** : les fichiers `.env` ne sont jamais publiés sur Git. Les clés d'API restent chez chacun.
- **Git** : `main` ne se touche pas jusqu'à la fin du développement. Chacun travaille sur **une seule branche personnelle** à son nom (créée depuis `test`), sans branches de fonctionnalité. Quand tu as fini une tâche, tu pousses et tu préviens Lansana : il vérifie et fusionne dans `test`. Le détail pas à pas est dans [docs/GUIDE_GIT.md](docs/GUIDE_GIT.md).

## Service IA (Groq et Gemini, gratuits)

Les clés gratuites se créent ici : https://console.groq.com/keys et https://aistudio.google.com/apikey. On les met dans `backend/.env` :

```
AI_PROVIDERS=groq,gemini
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

L'ordre de `AI_PROVIDERS` est l'ordre d'essai : si Groq atteint son quota gratuit, Gemini prend le relais sans rien changer au code. Changer de modèle ou de fournisseur se fait uniquement dans `.env` et dans `AI_PROVIDER_CONFIG` (`backend/config/settings.py`).

```python
from apps.core.ai import ai
texte = ai.generate("Rédige une attestation ...", system="Tu rédiges des documents officiels de l'ISEP.")
```

## Tests de bout en bout (E2E) — Parcours clés de démonstration

La suite de tests E2E automatisée avec Playwright valide les 7 parcours critiques de l'application :
1. Connexion refusée sur mot de passe erroné (message d'erreur, pas de token).
2. Connexion d'un porteur de projet et accès immédiat à son espace incubateur (`/incubateur`).
3. Contrôle d'accès : un porteur tentant d'accéder au tableau de bord décisionnel (`/tableau-de-bord`) est intercepté et redirigé.
4. Parcours Coordonnateur : accès au tableau de bord décisionnel, chargement des indicateurs réels et question en langage naturel (autonome sans clé IA externe).
5. Accès au référentiel méthodologique (`/tableau-de-bord/methodologie`) avec filtres et formules de calcul.
6. Parcours public visiteur : consultation de la galerie des innovations (`/galerie`) et ouverture d'une fiche prototype détaillée.
7. Parcours Coordonnateur (filtres & export) : filtrage temporel au format français (`jj/mm/aaaa`), gestion des états vides et téléchargement d'un export consolidé (`.xlsx`).

### Lancer les tests E2E :
Prérequis : aucun serveur à démarrer manuellement. La commande lance elle-même le backend Django (avec migration et `seed_all`) et le frontend Next.js en local comme en CI via la configuration `webServer`.
```bash
cd frontend
npm run test:e2e
```
*Temps d'exécution mesuré : ~1 min 15 s (75 secondes sur démarrage complet avec migrations et seed_all, 100% autonome sans clé IA externe).*

## Vérifier la qualité du code (Linter Ruff)

L'organisation et la conformité du code source backend (tri des imports, détection d'erreurs de portée, prévention des bugs) sont vérifiées via `ruff` :
```bash
cd backend
ruff check .               # Analyse statique (All checks passed! exigé)
ruff check --fix .         # Application des corrections automatiques sûres
```

---

## Guide d'Exploitation

### 1. Sauvegarde et restauration de la base de données

Deux scripts POSIX robustes situés dans le dossier `scripts/` permettent d'exploiter les sauvegardes PostgreSQL, que la base soit hébergée localement ou dans un conteneur Docker.

#### Sauvegarde (`scripts/sauvegarde_bd.sh`)
Crée un dump binaire compressé avec `pg_dump -Fc`.
```bash
# Sauvegarde horodatée dans ./backups/ (ex: ciat_backup_YYYYMMDD_HHMMSS.dump)
./scripts/sauvegarde_bd.sh

# Sauvegarde vers un chemin personnalisé
./scripts/sauvegarde_bd.sh /chemin/vers/sauvegarde.dump

# Sauvegarde incluant également l'archive tar.gz du répertoire média (pièces jointes, visuels)
./scripts/sauvegarde_bd.sh --avec-media

# Sauvegarde via conteneur Docker (docker compose exec -T db)
USE_DOCKER=1 ./scripts/sauvegarde_bd.sh
```
*Rétention automatique :* le script conserve par défaut les 14 sauvegardes les plus récentes (paramétrable via `BACKUP_KEEP`).

#### Restauration (`scripts/restauration_bd.sh`)
Restaure un dump PostgreSQL de manière propre et atomique via `pg_restore --clean --if-exists`.
```bash
# Restauration automatique du dump le plus récent dans ./backups/
./scripts/restauration_bd.sh --yes

# Restauration d'un fichier spécifique
./scripts/restauration_bd.sh /chemin/vers/sauvegarde.dump --yes

# Restauration avec extraction de l'archive média associée
./scripts/restauration_bd.sh /chemin/vers/sauvegarde.dump --yes --avec-media

# Restauration dans un conteneur Docker
USE_DOCKER=1 ./scripts/restauration_bd.sh /chemin/vers/sauvegarde.dump --yes
```

#### Test et vérification de la procédure
Des scripts de contrôle automatisés valident les procédures :
- Base de données :
```bash
./scripts/verifier_sauvegarde_restauration.sh
```
- Médias déposés (intégrité SHA-256 et comptage) :
```bash
python scripts/tester_sauvegarde_media.py
```
Lors de l'utilisation de l'option `--avec-media`, un manifeste SHA-256 (`.sha256`) est généré conjointement à l'archive `tar.gz`. La restauration vérifie systématiquement l'empreinte cryptographique avant de décompresser les fichiers pour garantir l'intégrité absolue des documents et pièces jointes.


---

### 2. Variables d'environnement importantes

| Variable | Fichier | Rôle & Impact | Valeur par défaut / Exemple |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | `backend/.env` | Clé cryptographique Django (sessions, tokens) | `change-me` en dev, générer une clé aléatoire forte en prod |
| `DJANGO_DEBUG` | `backend/.env` | Mode débogage (1 = actif, 0 = inactif pour production) | `1` en dev, impérativement `0` en prod |
| `DATABASE_URL` | `backend/.env` | URL de connexion à la base de données (PostgreSQL) | Non définie = SQLite locale (`db.sqlite3`) ; sinon `postgres://ciat:ciat@localhost:5432/ciat` |
| `SITE_URL` | `backend/.env` | URL publique du site, utilisée pour les liens absolus et QR codes | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | `backend/.env` | Domaines front-end autorisés pour les requêtes API | `http://localhost:3000` |
| `AI_PROVIDERS` | `backend/.env` | Ordre d'essai des fournisseurs d'IA avec bascule automatique | `groq,gemini` |
| `GROQ_API_KEY` | `backend/.env` | Clé d'API Groq (Llama / Mixtral) | Clé sur https://console.groq.com/keys |
| `GEMINI_API_KEY` | `backend/.env` | Clé d'API Google Gemini | Clé sur https://aistudio.google.com/apikey |
| `EMAIL_BACKEND` | `backend/.env` | Moteur d'envoi d'emails (console en dev, SMTP en prod) | `django.core.mail.backends.console.EmailBackend` |
| `DJANGO_LOG_LEVEL` | `backend/.env` | Seuil de journalisation (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | URL de l'API consommée par le client Next.js | `http://localhost:8000/api` |
| `NEXT_PUBLIC_SITE_URL` | `frontend/.env.local` | URL publique de base pour le SEO et le sitemap | `http://localhost:3000` |
| `NEXT_PUBLIC_MODE_DEMO`| `frontend/.env.local` | Active la simulation autonome en mode déconnecté | `0` (normal) ou `1` (démo autonome sans backend) |

---

### 3. Réinitialisation des données de démonstration

Pour remettre la base de données dans un état de référence propre et cohérent avec l'ensemble des 62 projets réalistes :

```bash
cd backend
.venv\Scripts\activate          # Linux/Mac : source .venv/bin/activate

# 1. Purge et réapplication des migrations
python manage.py flush --no-input
python manage.py migrate

# 2. Peuplement complet et cohérent de tous les modules (idempotent)
python manage.py seed_all
```

Cette commande initialise :
- Les 7 domaines d'intervention et 3 cohortes officielles (2024, 2025, 2026).
- Les 45 comptes utilisateurs (équipe CIAT et 40 porteurs de projets avec parité de 39 %).
- Les 62 projets répartis sur tous les statuts (idée, déposé, sélectionné, incubé, prototype, terminé, rejeté).
- Les 58 dossiers de candidature complets avec leurs 3 pièces obligatoires (PDF valides).
- Les évaluations multicritères et décisions motivées concordantes.
- Les affectations de mentors, objectifs opérationnels, jalons d'avancement et bilans de suivi à 3 et 6 mois.
- Les 23 fiches de la galerie des innovations avec photos locales et QR codes.
- Les documents institutionnels générés sans dépendance externe.
- Les partenariats et données financières du tableau de bord décisionnel.

---

### 4. Que faire si l'IA répond 503 (Service Unavailable)

L'architecture du module IA (`apps/core/ai.py`) intègre un mécanisme de résilience multi-niveaux :
1. **Tolérance aux pannes (Failover automatique) :** Si Groq répond une erreur de quota ou de timeout, l'orchestrateur bascule instantanément sur Gemini (et inversement selon `AI_PROVIDERS`).
2. **Gestion gracieuse des erreurs :** Lorsqu'aucun fournisseur n'est joignable, les vues (`/api/assistant/messages/`, `/api/documents/generer/`, `/api/analytics/question/`) retournent un code HTTP `503 Service Unavailable` documenté, empêchant tout crash serveur 500.
3. **Fonctionnement hors-ligne :**
   - Le générateur de documents dispose de gabarits structurés pré-remplis sans appel réseau.
   - Le tableau de bord décisionnel répond à un ensemble de questions métier en langage naturel via une analyse statistique locale directe.
   - Le frontend propose le mode autonome `NEXT_PUBLIC_MODE_DEMO=1`.

**Procédure de rétablissement en production :**
1. Consulter les journaux d'application (`[WARNING] [apps.core.ai]` ou `[ERROR] [apps.core.ai]`).
2. Vérifier les quotas sur les consoles fournisseurs :
   - Groq : https://console.groq.com/settings/limits
   - Google AI Studio : https://aistudio.google.com/
3. Inverser temporairement la priorité dans `backend/.env` :
   ```env
   AI_PROVIDERS=gemini,groq
   ```
4. Relancer le service backend (`python manage.py runserver` ou `systemctl restart ciat`).

---

### 5. Où lire et configurer les journaux (Logs)

La journalisation est unifiée via le module `apps.core.logging` et configurée dans `settings.py` :
- **Sécurité et conformité RGPD / Souveraineté :** Le filtre `SensitiveDataFilter` intercepte automatiquement chaque message de log et masque systématiquement les mots de passe, tokens JWT (`Bearer eyJ...`), clés d'API et numéros de cartes (`[MASQUÉ]`).

#### Emplacements des journaux :
- **En développement :** Les logs sont émis directement sur la sortie standard (`stdout` / `stderr`) du terminal exécutant `python manage.py runserver`.
- **En production sous Linux (systemd) :**
  ```bash
  # Suivre les journaux applicatifs en direct
  journalctl -u ciat -f

  # Consulter les 100 dernières lignes d'erreurs
  journalctl -u ciat -p err -n 100
  ```
- **En production sous Docker :**
  ```bash
  docker compose logs -f backend
  ```
- **Ajuster la granularité des logs :**
  Modifier la variable `DJANGO_LOG_LEVEL` dans `backend/.env` :
  - `DEBUG` : requêtes SQL détaillées et traçage complet (développement uniquement).
  - `INFO` : événements métier importants (authentifications, décisions, génération de documents, audits).
  - `WARNING` / `ERROR` : anomalies, indisponibilités temporaires d'API et rejets stricts.

---

## Vérifier avant de proposer son travail
```bash
cd backend && python manage.py check && python manage.py makemigrations --check && python manage.py test
cd frontend && npm run lint && npm run build && npm run test:e2e
```


