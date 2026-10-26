# Priorités et Phase 1

> Écrit pour toute l'équipe. Chacun a son fichier de tâches dans ce dossier, au nom de son prénom.

## Ordre de priorité des modules

| Rang | Module | Pourquoi |
|---|---|---|
| 1 | **P2 Gestion de l'incubateur** | Il produit les dossiers, les décisions et les statuts dont tous les autres modules ont besoin. |
| 2 | **P1 Portail institutionnel** | C'est la vitrine publique et l'entrée des candidatures. |
| 3 | **P3 Tableau de bord** | Il montre la valeur des données, et il peut avancer tout de suite avec des données fictives. |
| 4 | **P5 Générateur de documents** | Il apporte la fonction d'IA générative exigée par l'évaluation. Ses fondations démarrent dès la Phase 1. |
| 5 | **P4 Assistant IA** | Il réutilise le service IA et les documents du CIAT. Phase 2. |
| 6 | **P6 Galerie des innovations** | Elle réutilise les projets déjà publiés. Phase 2. |

La Phase 1 fait avancer les quatre premiers modules en parallèle. La Phase 2 (P5 interface, P4, P6, finitions, tests, déploiement, documentation) démarre quand les tâches de la Phase 1 sont validées.

## Comment lire ton fichier

Chaque tâche indique :
- **Complexité** : Faible, Moyenne ou Élevée.
- **Importance** : Critique (bloque d'autres personnes), Haute ou Normale.
- **Durée estimée**.
- **Tu attends** : ce qui doit exister avant que tu puisses terminer. Tu peux quand même commencer avec des données fictives.
- **Attendu par** : qui a besoin de ton résultat. Si tu prends du retard, préviens-les.
- **Terminé quand** : le critère pour dire que la tâche est faite.

## Règles communes

1. Les endpoints et les formats de données sont fixés dans [CONTRATS_API.md](CONTRATS_API.md). Ne les change pas sans prévenir Lansana : d'autres codent dessus.
2. Une branche par tâche : `feature/<module>-<sujet>` (le nom est donné dans chaque tâche). Jamais de travail direct sur `main`.
3. Quand ta tâche est terminée, ouvre une demande de fusion (pull request) vers `main` et préviens Lansana. Il vérifie, accepte, puis te donne la tâche suivante.
4. Si tu attends quelqu'un, ne reste pas bloqué : travaille avec des données fictives respectant le contrat, puis branche le vrai service.
5. Avant de proposer ton travail : `python manage.py check` (back) ou `npm run lint && npm run build` (front). Le détail est dans le README à la racine.
6. Les couleurs, polices et composants viennent de la charte (`Charte_Graphique_CIAT_ISEP.pdf`) et de `frontend/src/components/ui.tsx`.
