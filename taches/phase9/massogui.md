# Massogui — Phase 9 : pages à élever au niveau de ton index

> Ton site public est la référence visuelle (ton index des domaines est la meilleure page du site, notée 4,4 sur 5 à l'audit). Lansana te confie maintenant les pages qui ne sont pas encore à ce niveau, et quelques corrections de navigation. Ta branche a plus de 40 commits d'avance sur `test` : **fais `git pull origin test` dès maintenant et régulièrement** pour éviter les gros conflits (d'autres membres ont touché `assistant`, `incubateur` et `AppShell`). Tout ce qui est fusionné sera vérifié par `npm run lint && npm run build` et par les tests.

Ordre conseillé : T1, puis T2, T3, T4, puis T5.

## T1 — Redirections des 5 adresses courtes
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h
- **À faire :** `/domaines`, `/ciat`, `/contact`, `/actualites` et `/partenaires` sont des doublons de `/portail/*` (trois d'entre elles ne sont reliées à rien). Ajoute dans `next.config.ts` des redirections **permanentes** vers `/portail/domaines`, `/portail/ciat`, `/portail/contact`, `/portail/actualites` et `/portail/partenaires`, supprime les fichiers de pages doublons devenus inutiles, mets à jour le `sitemap.ts`, et vérifie qu'aucun lien interne ne pointe vers l'ancienne adresse (`git grep`).
- **Tu attends :** rien. Branche : `dev-massogui`.
- **Attendu par :** Lansana (cohérence, démonstration).
- **Terminé quand :** les cinq adresses redirigent (test avec `curl -I`), le sitemap ne liste que les adresses canoniques, et le build passe.

## T2 — Page Partenaires
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** aujourd'hui une grille uniforme de logos, sans hiérarchie ni appel à l'action. Refais-la dans le style de ton index : un hero avec photographie (pas de dégradé), les partenaires regroupés par catégorie en grands visuels (institutions de tutelle, partenaires techniques, partenaires de financement, d'après les données de l'API, jamais inventées), un bandeau de chiffres réels, un grand bouton « Devenir partenaire » vers le contact. Pas de rangée de 3 ou 4 cartes identiques répétée : varie les compositions.
- **Tu attends :** rien. Branche : `dev-massogui`.
- **Terminé quand :** la page est au niveau de ton index en 1280 px et 390 px, les images s'affichent, aucune donnée n'est écrite dans le code.

## T3 — Page Documents publics
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** une liste terne de cartes ressemblant à un explorateur de fichiers. Refais-la avec un hero, les documents phares mis en avant avec une vignette de couverture (première page du PDF ou visuel soigné), les autres regroupés par catégorie, un bouton « Télécharger » clair avec le format et le poids, et une courte explication (2 lignes) de ce que contient chaque document. Aucun texte inventé : titre et catégorie viennent de l'API.
- **Tu attends :** rien. Branche : `dev-massogui`.
- **Terminé quand :** les documents sont attrayants et téléchargeables, en 1280 px et 390 px.

## T4 — Page Actualités (liste et détail)
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 h
- **À faire :** un article phare en grand (image pleine largeur), puis les autres actualités dans une composition variée (une grande, deux moyennes, une liste), un filtre simple par catégorie ou par mois, et sur la page de détail un fil d'Ariane, une grande image d'en-tête, une largeur de lecture confortable et des liens vers les articles suivants. L'actualité d'exemple (« [Exemple] ») reste marquée comme telle.
- **Tu attends :** rien. Branche : `dev-massogui`.
- **Terminé quand :** liste et détail au niveau de ton index, fil d'Ariane présent, aucun débordement à 390 px.

## T5 — Alertes de retard (en accord avec Maimouna)
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 2 h 30
- **À faire :** `/incubateur/alertes` est un tableau administratif austère. **Cette page appartient à Maimouna : parle-lui avant de commencer** (elle y a travaillé récemment) et mettez-vous d'accord sur qui la fait. Si c'est toi : un bandeau de synthèse (nombre de jalons en retard par niveau de gravité), des cartes classées par urgence avec un code couleur et une icône de la charte, le projet et le mentor concernés, un lien direct vers le jalon, et un bel état vide quand tout est à jour.
- **Tu attends :** l'accord de Maimouna. Branche : `dev-massogui`.
- **Terminé quand :** la page se lit en quelques secondes, avec un état vide soigné, en 1280 px et 390 px.

## Corrections rapides à glisser
- Le carrousel de logos de l'accueil déborde à 390 px (la page mesure 412 px de large pour un écran de 390). Corrige-le.
- Ajoute un fil d'Ariane sur les fiches de détail (projet incubé, fiche de galerie).

## À venir (je te préviendrai)
Quand Pathé aura livré ses routes (lettre d'information, recherche globale, chiffres clés), tu auras à brancher le formulaire du pied de page (aujourd'hui un faux succès), la recherche de l'en-tête et les chiffres de l'accueil.

## Avant de pousser
`npm run lint && npm run build` jusqu'au bout. Pousse sur `dev-massogui` et préviens Lansana.
