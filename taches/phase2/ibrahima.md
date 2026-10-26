# Ibrahima — Phase 2

> Domaine : back-end. Module : **P2 Gestion de l'incubateur, suite** (mentors, jalons, suivi). Code dans `backend/apps/incubator/`.
> Ta Phase 1 est validée et fusionnée dans `test`, bravo. Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (section « P2 — Ajouts de la Phase 2 »).
> Ne modifie pas les routes et modèles de la Phase 1 sans prévenir Lansana : l'interface de Maimouna s'appuie dessus.
> Avant de commencer, corrige la lenteur de tes tests (voir la fin de [../phase1/ibrahima.md](../phase1/ibrahima.md)).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Affectation d'un mentor et objectifs
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** un projet sélectionné reçoit un mentor (utilisateur de rôle `mentor`), affecté par un coordonnateur ou administrateur. Un mentor ne voit que les projets qui lui sont affectés (en plus des dossiers qu'il peut déjà évaluer). Objectifs d'un projet : libellé, échéance, statut (`a_faire`, `en_cours`, `atteint`), créés par le coordonnateur ou le mentor, modifiables par eux.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** Maimouna (écrans de suivi), ta propre T2.
- **Terminé quand :** un mentor affecté voit son projet et seulement les siens, un porteur voit les objectifs de son projet sans pouvoir les modifier, affecter un utilisateur qui n'est pas mentor est refusé.

## T2 — Jalons, preuves, commentaires et alertes de retard
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 à 5 h
- **À faire :** jalons d'un projet (titre, échéance, statut), dépôt de preuves en fichier (mêmes limites que les pièces de dossier), commentaires horodatés (porteur, mentor, coordonnateur). Un jalon dont l'échéance est passée et qui n'est pas fait est **en retard** (statut calculé, jamais saisi à la main). Route `GET /alertes/` : les jalons en retard visibles pour l'utilisateur selon son rôle.
- **Tu attends :** ta T1. Branche : ta branche personnelle.
- **Attendu par :** Maimouna (calendrier et alertes), Alioune (indicateurs de retard).
- **Terminé quand :** un jalon passé non fait apparaît dans `/alertes/` sans action manuelle, un porteur ne voit que ses propres alertes, une preuve trop lourde ou d'un type interdit est refusée avec un message clair.

## T3 — Suivi à trois et six mois et compte rendu
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 à 4 h
- **À faire :** bilans de suivi à 3 et 6 mois (échéance, bilan écrit, indicateurs libres) créés par le mentor ou le coordonnateur. Route de compte rendu d'un projet en Excel (`.xlsx`, avec `openpyxl`) : informations du projet, objectifs, jalons et bilans. Choisis des bibliothèques légères sous Windows et ajoute-les à `requirements.txt`.
- **Tu attends :** tes T1 et T2. Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration, livrable « comptes rendus »).
- **Terminé quand :** un projet a ses bilans à 3 et 6 mois, l'export Excel s'ouvre correctement avec les accents et les quatre blocs, et un porteur ne peut pas lire le compte rendu d'un autre projet.

## Quand tu as fini
Écris les tests (rapides !), vérifie `check` et `makemigrations --check`. Pousse ta branche et préviens Lansana. Back-end uniquement.

## À corriger pour valider ta Phase 2
Ta Phase 2 est fusionnée dans `test` et les routes correspondent au contrat. Trois points restent à régler pour la valider définitivement :
1. **Tests trop lents (bloquant).** `python manage.py test apps.incubator` prend **plus de 5 minutes** (55 tests). Mets en tête de tes classes de test `@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])` (de `django.test`) et, si tes tests créent beaucoup d'utilisateurs, utilise `setUpTestData`. Objectif : moins de 30 secondes. C'est une règle depuis ta Phase 1 : la CI ne peut pas tourner avec des tests aussi lents.
2. **Branches en trop.** Tu as créé `Kalz-features/p2-t2-jalons-preuves` et `Kalz-features/p2-t3-suivis-export`. La règle est une seule branche personnelle (`Kalz`). Vérifie que leur contenu est bien dans `Kalz` (`git branch -r --merged origin/Kalz`), puis préviens Lansana : il les supprime de GitHub. Ne crée plus d'autres branches.
3. **Export Excel.** Ajoute un test qui génère le compte rendu `.xlsx`, le rouvre avec `openpyxl` et vérifie que les quatre blocs (projet, objectifs, jalons, bilans) et les accents sont présents.

Fais ces corrections sur ta branche `Kalz`, vérifie `check`, `makemigrations --check` et `test`, puis préviens Lansana.
