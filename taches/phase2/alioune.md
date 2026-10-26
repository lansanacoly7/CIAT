# Alioune — Phase 2

> Domaine : front-end, grandes interfaces et données. Module : **P3 Tableau de bord décisionnel, suite**. Code dans `frontend/src/app/tableau-de-bord/` et `backend/apps/analytics/`.
> Ta Phase 1 est validée et fusionnée dans `test` : le dashboard est branché sur l'API et protégé. Fais d'abord `git pull origin test` sur ta branche `Alioune`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (section P3).

## Règle sur les données de démonstration
On travaille avec des **données de démonstration enregistrées en base** (commande `seed_demo` et ses suites), lues par l'API comme de vraies données. Elles sont fictives mais **cohérentes et reliées** : un projet se retrouve dans les dossiers, les évaluations, les jalons, la galerie et les statistiques. Conséquences pour toi :
- Le front n'a **aucune donnée en dur** et aucun code « spécial démo » : il lit uniquement l'API.
- Si tu as besoin de nouvelles données pour tes écrans (partenariats, financements), tu les **ajoutes au remplissage** de la base de façon liée aux projets existants, jamais dans le front.
- Les nombres affichés doivent toujours être recoupables : la somme des domaines égale le total des projets, un filtre ne produit jamais plus de résultats que le total.

Ordre conseillé : T1, puis T2, puis T3. Tu travailles sur ta branche personnelle `Alioune` et tu pousses après chaque tâche.

## T1 — Fiches de synthèse et exports du dashboard
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** une fiche de synthèse imprimable par cohorte (indicateurs clés, répartition par domaine et par genre, retards) et par domaine. Boutons d'export du dashboard : **image** (PNG du tableau de bord ou d'un graphique, côté navigateur), **Excel** et **PDF** (appel à `GET /api/analytics/export/?format=xlsx|pdf`, écrit par Pathé, voir sa tâche T3 : dès qu'il est dans `test`). Les exports respectent les filtres actifs.
- **Tu attends :** Pathé (T3, export) pour Excel et PDF ; tu peux faire d'abord l'image et les fiches.
- **Attendu par :** Lansana (démonstration), le rapport final.
- **Terminé quand :** les trois exports se téléchargent avec les filtres actifs, et une fiche de synthèse s'imprime proprement.

## T2 — Interrogation des données en langage naturel (IA)
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 5 à 6 h
- **À faire :** un champ « Posez une question sur les données » sur le dashboard. Route `POST /api/analytics/question/` : `{ question }` → `{ reponse, donnees, filtres_utilises }`. **Principe de sécurité : le modèle ne génère jamais de SQL ni de code.** Via `ai.chat(..., json_mode=True)`, il choisit seulement parmi une liste fermée : l'un des endpoints d'analyse existants (`indicateurs`, `par-domaine`, `par-cohorte`, `par-genre`, `evolution`) et des filtres valides (cohorte, domaine, statut, dates). Le serveur valide ce choix, exécute les agrégations existantes, puis le modèle rédige une réponse courte à partir **uniquement** des chiffres obtenus. Si la question est hors sujet ou impossible, réponse explicite « Je ne peux pas répondre à cette question avec les données disponibles ». Mêmes droits que les autres endpoints d'analyse. Limitation de débit `ai`, `503` sans clé IA.
- **Tu attends :** rien (service IA et endpoints d'analyse sont dans `test`). Clés IA dans le `.env` pour tester en vrai.
- **Attendu par :** Lansana (démonstration : troisième fonction d'IA de la plateforme).
- **Terminé quand :** « Combien de projets en prototype dans la cohorte 2025 ? » donne le bon chiffre, recoupé avec le dashboard ; une question hors sujet est refusée ; aucune requête générée par le modèle n'est exécutée telle quelle ; tests avec un faux service IA (hasheur rapide).

## T3 — Partenariats et financements
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 4 h
- **À faire :** le cahier des charges demande le suivi des partenariats et des financements. Ajoute dans `backend/apps/analytics/` deux modèles reliés aux projets existants : `Partenariat` (projet, partenaire, type, date de début, statut) et `Financement` (projet, source, montant en FCFA, date, statut). Endpoints de lecture (équipe CIAT et comité) avec filtres, un résumé (`total_finance`, nombre de partenariats actifs) et des cartes et graphiques dans le dashboard. Complète le remplissage de la base (commande `seed_analytics` appelée à la suite de `seed_demo`) avec des partenariats et financements **cohérents** : seuls des projets sélectionnés, incubés, prototypes ou terminés en ont, avec des dates postérieures à la sélection.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration, indicateurs « partenariats et financements » exigés).
- **Terminé quand :** les montants et le nombre de partenariats affichés au dashboard recoupent ce que renvoient les endpoints, un projet en « idée » n'a jamais de financement, et la commande de remplissage ne crée pas de doublons quand on la relance.

## Quand tu as fini
Vérifie `npm run lint`, `npm run build`, `python manage.py check`, `makemigrations --check` et `test apps.analytics` (tests rapides). Pousse sur ta branche `Alioune` et préviens Lansana.
