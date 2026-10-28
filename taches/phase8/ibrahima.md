# Ibrahima — Phase 8

> Ta route de calendrier (`GET /api/incubator/calendrier/`) est bonne, mais ta branche n'est pas fusionnable en l'état : elle fait échouer **un test** de la suite complète. Fais `git pull origin test` (la suite est à 301 tests, avec le test de contrat d'API de Pathé).

## Correction bloquante
`apps.core.tests.test_contrat_api.test_all_documented_routes_exist_in_openapi_schema` échoue : la route `GET /api/incubator/calendrier/` est documentée dans `taches/CONTRATS_API.md` mais **absente du fichier committé `docs/openapi.yaml`** (elle existe bien dans le schéma généré). À faire :
1. Régénère le schéma : `python manage.py spectacular --file docs/openapi.yaml`.
2. `taches/CONTRATS_API.md` documente ta route **deux fois** (dans la liste P2 et dans une section « Calendrier de l'incubateur »). Garde une seule entrée.
3. Relance la suite **complète** : `check`, `makemigrations --check`, `python manage.py test` verts. Pousse sur `Kalz`.

## T1 — Journal d'audit des actions sensibles
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** pour la traçabilité des décisions, enregistre qui a fait quoi et quand sur les actions sensibles : décision sur un dossier, affectation d'un mentor, validation ou publication d'un document, validation ou refus d'une fiche de galerie, changement de rôle d'un utilisateur. Modèle `JournalAudit` (acteur, action, objet concerné, avant/après limités aux champs utiles, date), alimenté sans casser les vues existantes (signaux ou petit service appelé depuis les vues). `GET /api/audit/` en lecture seule pour l'administrateur et le coordonnateur, filtrable par acteur, action et date, paginé ; aucune donnée sensible (mots de passe, jetons) enregistrée. Migration propre.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (sécurité, rapport), Alioune (si on veut un tableau d'activité).
- **Terminé quand :** chaque action listée laisse une trace testée, les droits sont testés (un porteur reçoit 403), la route est dans le contrat et dans `/api/docs/`, et la suite complète reste verte.

## T2 — Notifications dans l'application
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** en plus des emails, des notifications visibles dans la plateforme : décision prise sur le dossier, jalon en retard, document validé ou publié, fiche de galerie validée ou refusée, nouveau mentor affecté. Modèle `Notification` (destinataire, type, message court, lien interne, lue ou non, date). Routes : `GET /api/notifications/` (les siennes, paginé, filtre `?non_lues=1`), `POST /api/notifications/{id}/lue/`, `POST /api/notifications/tout-lire/`. Un utilisateur ne voit et ne modifie que les siennes. Utilise le même mécanisme que ton journal d'audit pour déclencher la création.
- **Tu attends :** T1 (même mécanisme). Branche : `Kalz`.
- **Attendu par :** Maimouna (cloche de notifications), Lansana (démonstration).
- **Terminé quand :** chaque événement crée la bonne notification pour le bon destinataire, les droits sont testés, la route est dans le contrat, et la suite reste verte.

## T3 — Migrations réversibles sur PostgreSQL
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 1 h 30
- **À faire :** sur ton service PostgreSQL, vérifie que toutes les migrations s'appliquent depuis une base vide, puis se défont (`migrate <app> zero`) et se réappliquent sans erreur, et qu'un `seed_all` passe ensuite. Corrige les migrations non réversibles ou consigne-les. Ajoute les résultats réels dans `docs/POSTGRESQL.md`.
- **Tu attends :** rien. Branche : `Kalz`.
- **Attendu par :** Lansana (déploiement).
- **Terminé quand :** le résultat réel est consigné avec les commandes.
