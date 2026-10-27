# Alioune — Phase 5

> Domaine : données et tableau de bord. Ta barre latérale unique est fusionnée dans `test` (le débordement de `/documents` a disparu) et tes tests de bout en bout aussi. Fais `git pull origin test` sur ta branche `Alioune`. Termine d'abord la section « Corrections » de `taches/phase3/alioune_corrections.md` si ce n'est pas fait.

Ordre conseillé : T1, puis T2.

## T1 — Accessibilité mesurée avec axe
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** ajoute `@axe-core/playwright` à tes tests de bout en bout et passe 8 écrans (accueil, galerie, connexion, tableau de bord, documents, incubateur, assistant, méthodologie). Corrige les violations graves et critiques dans ton domaine (tableau de bord, barre latérale), signale les autres au propriétaire de l'écran, et consigne dans `docs/ACCESSIBILITE.md` le tableau des violations restantes.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (exigence d'ergonomie, rapport).
- **Terminé quand :** le test axe tourne avec la commande documentée et le tableau des violations est honnête.

## T2 — Finitions du tableau de bord
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** les champs de date du filtre s'affichent en `mm/dd/yyyy` (anglais). Mets-les au format français `jj/mm/aaaa`. Vérifie aussi les états vides (aucun résultat) et d'erreur de chaque graphique, et le bon fonctionnement des exports PNG, Excel et PDF avec les filtres actifs. Ajoute un test de bout en bout qui télécharge un export.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** les dates sont en français, aucun graphique ne reste vide sans message, et l'export est testé.
