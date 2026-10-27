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

> **T1 et T2 validées et fusionnées dans `test`** (audit axe sur 8 écrans, dates en français, test d'export). Fais `git pull origin test`.

## T3 — Images de la galerie et des actualités (reprise de la tâche de Massogui)
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h 30
- **À faire :** après `python manage.py seed_all` (qui génère les images de démonstration), vérifie que chaque carte de la galerie, des actualités et des partenaires affiche son image. Réserve la place des images (`aspect-ratio`) pour éviter les sauts de page (constat C5 de la recette : sur 390 px, les cartes du bas de la galerie apparaissent en retard). En cas d'image manquante : un repli visuel propre, jamais le texte alternatif seul. Massogui garde l'unification de l'en-tête et la vidéo : ne touche pas à l'en-tête.
- **Tu attends :** rien. Branche : `Alioune`.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** aucune carte n'affiche un cadre vide ni le texte alternatif, en 1280 px et en 390 px.
