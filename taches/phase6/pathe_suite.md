# Pathé — Phase 6 (suite)

> Tes mesures de charge corrigées et ta fiche promotionnelle sont fusionnées dans `test`. J'ai réconcilié `docs/PERFORMANCE.md` avec le travail d'Ibrahima et rajouté l'option `--routes` à ton script (le document d'Ibrahima la cite). Fais `git pull origin test` avant tout.

## T4 — Audit de sécurité des dépendances, des secrets et des en-têtes
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** (a) `pip-audit` sur `backend/requirements.txt` et `npm audit --omit=dev` dans `frontend/`, avec le résultat réel ; (b) recherche de secrets dans l'historique et l'arbre de travail (clés d'API, mots de passe, jetons) avec la commande de ton choix, en notant ce qui est un faux positif ; (c) vérifie les en-têtes de sécurité renvoyés par le back-end (`X-Content-Type-Options`, `X-Frame-Options`, cookies) et la configuration CORS ; (d) liste ce qui doit changer pour la production (`DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, HTTPS). Écris le tout dans `docs/SECURITE.md` (section « Audit de sécurité de fin de projet ») avec les commandes. Corrige les problèmes simples ; consigne les autres avec un responsable.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Lansana (sécurité, déploiement).
- **Terminé quand :** chaque contrôle a sa commande et son résultat réel, et les écarts sont listés ou corrigés.
