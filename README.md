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

La suite de tests E2E automatisée avec Playwright valide les 6 parcours critiques de l'application :
1. Connexion refusée sur mot de passe erroné (message d'erreur, pas de token).
2. Connexion d'un porteur de projet et accès immédiat à son espace incubateur (`/incubateur`).
3. Contrôle d'accès : un porteur tentant d'accéder au tableau de bord décisionnel (`/tableau-de-bord`) est intercepté et redirigé.
4. Parcours Coordonnateur : accès au tableau de bord décisionnel, chargement des indicateurs réels et question en langage naturel (autonome sans clé IA externe).
5. Accès au référentiel méthodologique (`/tableau-de-bord/methodologie`) avec filtres et formules de calcul.
6. Parcours public visiteur : consultation de la galerie des innovations (`/galerie`) et ouverture d'une fiche prototype détaillée.

### Lancer les tests E2E :
Prérequis : aucun serveur à démarrer manuellement. La commande lance elle-même le backend Django (avec migration et `seed_all`) et le frontend Next.js en local comme en CI via la configuration `webServer`.
```bash
cd frontend
npm run test:e2e
```
*Temps d'exécution mesuré : ~1 min 15 s (75 secondes sur démarrage complet avec migrations et seed_all, 100% autonome sans clé IA externe).*

## Vérifier avant de proposer son travail
```bash
cd backend && python manage.py check && python manage.py makemigrations --check && python manage.py test apps.analytics
cd frontend && npm run lint && npm run build && npm run test:e2e
```

