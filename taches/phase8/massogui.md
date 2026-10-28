# Massogui — Phase 8 : tâche prioritaire avant de continuer le design

> Décision de Lansana : cette tâche passe **avant** tout travail de design. Fais `git pull origin test` sur ta branche `dev-massogui`. Elle dépend de la route de Pathé (`taches/phase8/pathe.md`, T1) : commence dès que Lansana te dit qu'elle est fusionnée dans `test`, et livre-la avant de reprendre ton design.

## T1 — Formulaire « Je suis intéressé » sur la fiche de la galerie
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** le sujet (projet 6) demande un espace destiné aux partenaires et investisseurs et la mesure de l'intérêt des visiteurs. Sur la page d'une fiche (`/galerie/[slug]`), ajoute un bouton « Je suis intéressé » qui ouvre un court formulaire (nom, email, organisation, message) et envoie `POST /api/gallery/fiches/{slug}/interet/`.
  - Validation côté formulaire (email valide, message limité à la longueur acceptée par l'API), états de chargement, de succès (message de remerciement clair) et d'erreur (y compris limitation de débit et doublon), sans perdre ce que la personne a saisi.
  - Composants de `ui.tsx` pour les champs et boutons (`FormField`, `Input`, `Textarea`, `Button`), accessible au clavier, cible tactile d'au moins 44 px, utilisable en 390 px.
  - Aucune donnée écrite dans le code, aucun message de succès affiché si l'API échoue.
  - Texte court (une phrase d'explication), en cohérence visuelle avec ta galerie.
- **Tu attends :** la route de Pathé fusionnée dans `test` (Lansana te préviendra). Branche : `dev-massogui`.
- **Attendu par :** Lansana (conformité au sujet, démonstration).
- **Terminé quand :** un visiteur peut envoyer sa manifestation d'intérêt depuis la fiche et le coordonnateur la voit via l'API ; `npm run lint && npm run build` passent. Ensuite, reprends ton design.
