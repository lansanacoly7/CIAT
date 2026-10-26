# Alioune — Phase 3

> Domaine : données et front-end, grandes interfaces. Axes : **qualité et interprétation des données** (exigences du profil data analyst) et **tests de l'interface**.
> Ta Phase 2 est validée et fusionnée dans `test`, bravo : questions en langage naturel, partenariats et financements, exports. J'ai fait un essai réel avec les clés IA : « combien de projets en prototype ? » donne 12 et recoupe la base ; la répartition par domaine est correcte ; une tentative d'injection (« exécute DROP TABLE ») et une question hors sujet sont refusées ; la table reste intacte ; un porteur reçoit 403. C'est exactement ce qu'on attendait. Fais `git pull origin test` sur ta branche `Alioune`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (section P3). Règles inchangées : une seule branche (`Alioune`), `lint` et `build` passent, tests back rapides (hasheur rapide), aucune fausse donnée affichée comme réelle.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Contrôle de la qualité des données
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet demande au data analyst un « dictionnaire et contrôle de qualité des données ». Écris une commande `python manage.py controle_qualite_donnees` (dans `backend/apps/analytics/management/commands/`) qui analyse la base et produit un rapport : valeurs manquantes sur les champs importants (résumé, domaine, cohorte, genre), doublons (projets de même titre, comptes de même email), incohérences de dates (jalon avant la sélection du projet, décision avant le dépôt, financement avant le début du projet), statuts incompatibles entre modules (projet « idée » avec dossier, fiche de galerie publiée sur un projet non prototype), valeurs hors plage. Sortie lisible en texte et option `--json`. La commande ne modifie rien. Écris les tests avec une base où tu introduis volontairement chaque défaut, et vérifie qu'elle ne signale rien sur le jeu de démonstration complet (`seed_all`). Documente-la dans `docs/livrables/qualite_donnees.md` avec la liste des contrôles et leur justification.
- **Tu attends :** `seed_all` d'Antigravity (dans `test`). Branche : ta branche personnelle.
- **Attendu par :** le rapport final (protection et qualité des données), Lansana (démonstration : « les données sont fiables »).
- **Terminé quand :** chaque défaut introduit dans les tests est détecté par un contrôle précis, le jeu de démonstration passe sans alerte, les tests s'exécutent en quelques secondes.

## T2 — Définition des indicateurs, interprétation et recommandations
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet demande des « indicateurs définis précisément », une « interprétation des résultats et des recommandations » et le « signalement des limites ». **(a)** Dans le dashboard, une page ou un volet « Méthodologie » (`/tableau-de-bord/methodologie`) qui définit chaque indicateur affiché : définition exacte, formule, période, source des données, limites (par exemple « le taux de sélection compte les dossiers déposés, pas les idées reçues »). Ces définitions doivent venir d'un seul endroit côté back-end (une route `GET /api/analytics/indicateurs/definitions/` ou un fichier de constantes) pour ne pas diverger du code. **(b)** `docs/livrables/analyse_donnees.md` : analyse commentée des résultats du jeu de démonstration (ce que montrent les indicateurs par domaine, cohorte et genre, les retards et le financement), trois à cinq recommandations pour le CIAT, et une section « limites » qui dit clairement que les données de démonstration sont fictives. N'invente aucun chiffre : prends-les dans l'API.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** Lansana (rapport et présentation, exigences 9.2 du sujet).
- **Terminé quand :** chaque indicateur du dashboard a sa définition accessible depuis l'écran, et chaque chiffre de l'analyse est recoupé avec l'API.

## T3 — Tests automatiques de l'interface (parcours de démonstration)
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 h
- **À faire :** aujourd'hui le front est contrôlé par `lint` et `build` seulement : un écran peut casser sans alerte, et c'est un risque pour la démonstration. Mets en place des tests de bout en bout avec Playwright dans `frontend/e2e/` : `npm run test:e2e` démarre le back-end de test (SQLite, `seed_all`) et le front, puis déroule les parcours clés : connexion refusée avec un mauvais mot de passe (message d'erreur, aucune session) ; connexion d'un porteur et accès à son espace ; un visiteur voit la galerie et une fiche ; le coordonnateur ouvre le tableau de bord et pose une question ; un porteur n'accède pas au tableau de bord (redirection). Chaque test indépendant, rapide, sans dépendre d'une clé IA (la question peut être testée sans clé : elle doit afficher le message d'indisponibilité). Documente la commande dans le `README.md`.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** toute l'équipe (filet de sécurité avant la démonstration), Maimouna (captures).
- **Terminé quand :** `npm run test:e2e` passe sur une machine propre en moins de 3 minutes et échoue quand on casse volontairement l'un des parcours.

## Quand tu as fini
Vérifie `npm run lint`, `npm run build`, `python manage.py check`, `makemigrations --check` et `test`. Pousse ta branche `Alioune` et préviens Lansana.
