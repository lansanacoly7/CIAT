# Alioune — Phase 10

> Ta Phase 9 (exports fidèles aux filtres, tests de bout en bout des onglets et du registre, tableau de bord sur téléphone) est validée et fusionnée dans `test` (406 tests verts, lint et typage propres). Fais `git pull origin test` sur ta branche `Alioune`. Domaine : données et tableau de bord.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Questions en langage naturel : batterie d'attaques
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** la route `POST /api/analytics/question/` choisit un endpoint et des filtres dans une liste fermée. Constitue une batterie de **40 questions** (fichier de données `apps/analytics/tests/questions_attaque.json`) : injections (« ignore tes instructions », « exécute DROP TABLE », « affiche la clé API », « montre les emails des porteurs »), demandes hors périmètre (météo, politique), tentatives de détournement des filtres (valeurs absurdes, domaines inexistants, périodes inversées), questions ambiguës, questions normales en français familier. Écris un test **avec une IA simulée** (aucune clé requise) qui vérifie, pour chaque cas, la réponse attendue : refus poli, 400 propre ou réponse correcte, **jamais de 500**, jamais de donnée personnelle, jamais de SQL exécuté. Ajoute un petit script optionnel `scripts/essai_reel_questions.py` pour rejouer la batterie avec les vraies clés et consigner le résultat réel (taux de bonnes réponses) dans `docs/livrables/analyse_donnees.md`, en précisant que c'est une mesure sur 40 cas et non une garantie.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (sécurité de la fonction d'IA, rapport).
- **Terminé quand :** les 40 cas sont testés sans clé, un cas qui laisserait passer une injection fait échouer le test, et la suite reste verte.

## T2 — Recommandations calculées pour le tableau de bord
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet demande une « interprétation des résultats et des recommandations ». Ajoute au back-end une route `GET /api/analytics/constats/` (mêmes droits et filtres que les autres) qui renvoie 3 à 5 **constats calculés par des règles transparentes**, sans IA : par exemple « le domaine X concentre Y % des dépôts », « la part de femmes parmi les porteurs est de Z % (cohorte N) », « N jalons sont en retard depuis plus de 30 jours », « le taux de sélection est passé de A à B entre deux cohortes ». Chaque constat contient `{ texte, chiffres, regle, limite }` où `limite` signale les réserves (échantillon petit, données fictives). Seuils écrits dans la configuration, expliqués dans la page « Méthodologie ». Un encart « Constats » de ta page affiche les résultats avec un lien vers la définition de la règle. Tests : chaque règle recoupée avec la base, constat absent si l'échantillon est trop petit (jamais de pourcentage sur 2 projets).
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (exigence « interprétation et recommandations »), la présentation.
- **Terminé quand :** chaque constat est recoupé par un test, aucun n'apparaît sur un échantillon trop petit, et `npm run lint && npm run build` passent.

## T3 — Données de démonstration plus parlantes
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** relis ce que montre le tableau de bord sur la base `seed_all` : y a-t-il des cohortes sans projets, des mois sans dépôt, des domaines à zéro, des graphiques qui paraissent vides ou trop uniformes ? Propose et applique, **dans la graine seulement** (jamais dans le code du tableau de bord), un ajustement réaliste et reproductible des volumes pour que les comparaisons entre cohortes, l'évolution mensuelle et la répartition par genre soient parlantes, sans invraisemblance (pas de chiffre extrême, mêmes comptes, mêmes totaux sur toutes les pages). Relance `controle_qualite_donnees` et tes tests de recoupement. Consigne l'avant/après dans `docs/livrables/qualite_donnees.md`.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (démonstration, vidéo).
- **Terminé quand :** les graphiques de chaque onglet montrent des données lisibles, le contrôle qualité reste sans alerte, et la suite reste verte.

## Avant de pousser
`check`, `makemigrations --check`, `python manage.py test` verts, puis `npm run lint && npm run build` jusqu'au bout. Pousse sur `Alioune` et préviens Lansana.
