# Déploiement de la plateforme CIAT

Architecture : **site Next.js sur Vercel** → **API Django sur Render** → **base PostgreSQL sur Neon** (persistante).
Les clés et mots de passe se saisissent dans les tableaux de bord des hébergeurs, jamais dans le dépôt.

## 1. Base de données (Neon)
1. Créer un projet sur neon.tech (région Europe), base `ciat`.
2. Copier l'adresse de connexion (`postgresql://…?sslmode=require`) : c'est la valeur de `DATABASE_URL`.

## 2. API (Render)
1. Render → *New* → *Blueprint* → choisir le dépôt GitHub, branche `test` : `render.yaml` crée le service `ciat-backend`.
2. Renseigner les variables marquées « à renseigner » :
   - `DATABASE_URL` : adresse Neon ;
   - `GROQ_API_KEY`, `GEMINI_API_KEY` : clés d'IA ;
   - `DJANGO_ALLOWED_HOSTS` : `ciat-backend.onrender.com` (l'adresse attribuée) ;
   - `CORS_ALLOWED_ORIGINS` : l'adresse Vercel (ex. `https://ciat.vercel.app`) ;
   - `CSRF_TRUSTED_ORIGINS` : l'adresse Render et l'adresse Vercel, séparées par une virgule.
3. Au démarrage, le service applique les migrations puis charge les données de démonstration (`seed_all`, sans doublon).
4. Vérifier : `https://<adresse-render>/api/docs/`.

## 3. Site (Vercel)
1. Vercel → *Add New Project* → dépôt GitHub, branche `test`, dossier racine `frontend`.
2. Variable : `NEXT_PUBLIC_API_URL` = `https://<adresse-render>/api`.
3. Déployer, puis reporter l'adresse Vercel dans `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS` sur Render.

## Points d'attention
- Plan gratuit Render : le service s'endort après ~15 min d'inactivité ; la première requête prend 30 à 60 s. Ouvrir le site avant la présentation.
- Les fichiers générés (images, PDF) sont recréés au démarrage : le disque gratuit n'est pas persistant. Les données, elles, sont dans Neon.
- Alternative sans Render : `backend/Dockerfile` et `entrypoint.sh` (Hugging Face Spaces, Koyeb…), avec la même `DATABASE_URL`.
