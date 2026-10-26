# Pathé — Phase 5

> Domaine : back-end. Ta Phase 4 est validée et fusionnée dans `test` (accusé PDF, compte rendu PDF, alertes, calendrier). J'ai renuméroté ta migration en `incubator/0009_alertejalonenvoyee` pour éviter un conflit avec celle d'Ibrahima, et remplacé l'expéditeur par défaut par `CIAT <noreply@localhost>` (on n'invente pas d'adresse de l'ISEP). **Fais `git pull origin test` avant toute chose** (pas de nouvelle migration au même numéro).
> Lis [../CONTRATS_API.md](../CONTRATS_API.md). Back-end uniquement, tests rapides.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Emails de confirmation et de décision
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** avec ton module de notifications, envoie un email au porteur quand son dossier est soumis (avec le lien de l'accusé) et quand une décision est prise (accepté ou refusé, avec le motif). Dans un nouveau fichier, sans modifier la logique d'Ibrahima au-delà d'un appel.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Lansana (démonstration du parcours).
- **Terminé quand :** les tests vérifient le contenu des emails (`mail.outbox`), et aucune erreur d'envoi ne bloque la soumission ni la décision.

## T2 — Test de bout en bout de l'API
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** un seul fichier de test qui déroule le parcours complet : inscription du porteur, dépôt et soumission du dossier, évaluation du comité, décision, affectation d'un mentor, jalon en retard, alerte, accusé PDF. Un test par grande étape, rapide.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Lansana (preuve de qualité du livrable).
- **Terminé quand :** le parcours passe en moins de 5 secondes et casse si une étape est rompue.

## T3 — Documentation de l'API à jour
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 1 h 30
- **À faire :** ajoute tes nouvelles routes à `taches/CONTRATS_API.md` et décris-les dans la documentation automatique `/api/docs/` (paramètres, codes `400` et `403`).
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Maimouna et Massogui (boutons du front), le rapport final.
- **Terminé quand :** chaque route de la Phase 4 apparaît avec sa description dans `/api/docs/` et dans le contrat.
