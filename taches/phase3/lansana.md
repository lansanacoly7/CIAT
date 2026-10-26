# Lansana — Phase 3

> Domaine : lead technique, intervient partout. Axes : **données de démonstration cohérentes**, **parcours de test de bout en bout**, **livrables documentaires**. Revue des demandes de fusion en continu.
> Phase 2 : assistant (P4) et galerie (P6) validés et fusionnés dans `test`. La tâche de déploiement (CI et hébergement) reste **reportée** : à relancer quand l'équipe approche de la livraison.
> Tu travailles directement sur `dev-lansana-coly`.

Ordre conseillé : T1, puis T3, puis T2.

## T1 — Remplissage cohérent de tous les modules (`seed_all`)
- **Complexité :** Élevée · **Importance :** Critique · **Durée estimée :** 5 à 6 h
- **À faire :** une commande `python manage.py seed_all` qui appelle dans l'ordre `seed_demo`, `seed_portal`, `seed_incubator`, `seed_documents` (et `seed_analytics` quand Alioune l'aura écrite), puis complète ce qui manque pour que **chaque projet soit cohérent dans tous les modules** :
  - un dossier de candidature par projet non « idée », avec ses 3 pièces obligatoires, une soumission, des évaluations de membres du comité et de mentors, et une décision motivée dont le résultat correspond au statut du projet (`selectionne` et au-delà : accepté ; `rejete` : refusé) ;
  - un mentor affecté aux projets sélectionnés ou incubés, des objectifs, des jalons dont certains en retard, des commentaires, des bilans à 3 et 6 mois pour les projets anciens ;
  - une fiche de galerie pour les projets en prototype ou terminés (une partie publiée, quelques-unes en brouillon ou en validation) ;
  - quelques documents générés (conventions, fiches de projet) liés à des projets, **sans appel au service IA** (textes rédigés à l'avance), avec une version validée ou publiée ;
  - des actualités, événements, appels et partenaires déjà fournis par `seed_portal`, reliés aux domaines et cohortes réels.
  Les dates doivent être cohérentes (dépôt avant évaluation, évaluation avant décision, jalons après sélection). Tout est **idempotent** : relancer ne crée aucun doublon.
- **Tu attends :** rien (tous les modules sont dans `test`). Branche : `dev-lansana-coly`, après `git merge origin/test`.
- **Attendu par :** toute l'équipe (des écrans pleins de données reliées), la démonstration, le rapport.
- **Terminé quand :** après `python manage.py seed_all`, un projet pris au hasard se retrouve cohérent partout (dossier, décision, mentor, jalons, fiche de galerie si prototype) ; les totaux du dashboard recoupent ceux des autres modules ; une deuxième exécution ne change aucun compte ; un test automatisé vérifie ces cohérences.

## T3 — Parcours complet de test et anomalies
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** un test automatisé de bout en bout du côté API (`apps/core/tests/test_parcours_complet.py`, avec `MD5PasswordHasher`) : un porteur s'inscrit, crée un projet et un dossier, dépose ses pièces et soumet ; un membre du comité évalue ; le coordonnateur décide ; un mentor est affecté ; un jalon passe en retard et apparaît dans les alertes ; le porteur crée une fiche de galerie, le coordonnateur la publie, elle apparaît publiquement avec son QR code ; un document est généré (service IA remplacé par un faux), modifié, validé et exporté. Chaque étape vérifie aussi les **droits** (ce que chaque rôle ne doit pas pouvoir faire). Consigne dans `docs/TESTS_ET_ANOMALIES.md` ce qui a été testé, les anomalies trouvées et leur état (corrigée ou signalée à son responsable).
- **Tu attends :** T1 pour les données (le test crée ses propres données, il n'en dépend pas). Branche : `dev-lansana-coly`.
- **Attendu par :** le rapport final (livrable « tester les fonctions essentielles et consigner les anomalies ») et la sécurité de la démonstration.
- **Terminé quand :** le parcours passe en moins de 30 secondes, et le fichier d'anomalies liste chaque problème avec son responsable.

## T2 — Livrables documentaires obligatoires
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 5 à 6 h
- **À faire :** rédiger dans `docs/livrables/`, à partir du code, des fichiers `taches/` et du PDF d'évaluation : le **cahier des charges** (contexte, utilisateurs et rôles, exigences, priorités, limites), le **guide utilisateur** (une page par rôle : porteur, comité, mentor, coordonnateur, administrateur, visiteur), le **schéma de base de données** (modèles et relations, diagramme en texte ou Mermaid) en complétant `docs/dictionnaire_donnees.md` pour **tous** les modèles, et le **journal des prompts** (prompts des moteurs de documents, de l'assistant et de l'analyse, avec leurs corrections et leurs résultats : lis le code des services IA). Un premier jet du **rapport** de 5 à 10 pages (choix techniques, résultats, limites, usage de l'IA) à faire valider par Lansana. Aucune affirmation qui ne soit pas vérifiable dans le code ou les tests.
- **Tu attends :** T1 et T3 pour que le rapport décrive un état stable. Branche : `dev-lansana-coly`.
- **Attendu par :** la livraison finale (livrables obligatoires 1, 5, 6, 7 et 8 du PDF d'évaluation).
- **Terminé quand :** chaque livrable existe, est cohérent avec le code actuel, et Lansana a relu le rapport.

## Reporté — Intégration continue et déploiement
Branche existante : `dev-lansana-coly--ci-deploiement` (non vérifiée). À reprendre à l'approche de la livraison : workflow GitHub Actions, protection de `main` et `test`, variables d'environnement de production (dont `SITE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`), hébergement gratuit pour le jury. Livrable obligatoire : le lien de déploiement.

## En continu — revues
Vérifier chaque branche poussée par l'équipe (contrôles, périmètre, secrets, conformité au contrat), fusionner dans `test` si c'est bon, puis donner la tâche suivante.
