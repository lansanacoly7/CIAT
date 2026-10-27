# Ibrahima — Phase 7

> Ta Phase 5 est entièrement fusionnée dans `test` (preuve PostgreSQL 16.10, couverture mesurée, optimisation avant/après, contrastes). Fais `git pull origin test` sur ta branche `Kalz`. Back-end uniquement.

## T1 — Calendrier de l'incubateur (API)
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet demande un « calendrier, jalons, preuves et alertes de retard » pour la plateforme de gestion. Aujourd'hui il n'y a que des listes. Ajoute `GET /api/incubator/calendrier/?mois=AAAA-MM`, qui renvoie pour l'utilisateur connecté les jalons et objectifs du mois sous la forme `[{ date, type, titre, projet, statut, en_retard }]`, triés par date.
  - **Droits :** le porteur voit ses projets, le mentor ceux qui lui sont affectés, le coordonnateur et l'administrateur tout ; le visiteur et un porteur étranger ne voient rien d'autre.
  - **Erreurs :** mois invalide ou absent → 400 avec message clair ; non connecté → 401.
  - **Qualité :** pas de requêtes superflues (`select_related`), tests des droits pour chaque rôle, un test de performance en nombre de requêtes.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Maimouna (vue calendrier de l'espace incubateur), Lansana (conformité au sujet).
- **Terminé quand :** les tests passent, la route est décrite dans `taches/CONTRATS_API.md` et dans `/api/docs/`, et toute la suite (`python manage.py test`) reste verte avant de pousser.
