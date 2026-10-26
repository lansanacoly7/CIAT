# Massogui — Phase 2

> Domaine : front-end, conception du site web. Modules : **P6 Galerie des innovations** et **P4 Assistant IA (interface)**. Code dans `frontend/src/app/`.
> Ta Phase 1 et ton correctif sont validés et fusionnés dans `test`, bravo. Fais d'abord `git pull origin test` sur ta branche `dev-massogui`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (sections P6 et P4). Le back-end de ces deux modules existe déjà dans `test`.
> **Règle :** mêmes règles que ton correctif : aucune fausse donnée affichée comme réelle ; mode démonstration seulement derrière `NEXT_PUBLIC_MODE_DEMO=1` avec bandeau.

Ordre conseillé : T1, puis T2, puis T3. Tu travailles sur ta branche personnelle `dev-massogui`.

## T1 — Galerie publique des innovations
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 4 h
- **À faire :** page `/galerie` : cartes des fiches publiées avec recherche et filtres (domaine, cohorte, avancement), pagination. Page de détail `/galerie/[slug]` : problème, solution, équipe, niveau d'avancement, médias (photos, liens vidéo et démonstrations), image du QR code (`/api/gallery/fiches/{slug}/qr/`) téléchargeable, compteur de consultations. Même style que ton portail.
- **Tu attends :** rien. Pour avoir des fiches à afficher en test, crée-en via l'API (porteur puis coordonnateur) ou demande à Lansana un jeu de fiches.
- **Attendu par :** Lansana (démonstration), ta T3.
- **Terminé quand :** les fiches publiées s'affichent avec filtres, une fiche non publiée donne une page « introuvable », le QR code s'affiche, aucune fausse donnée.

## T2 — Interface de l'assistant IA
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 à 5 h
- **À faire :** page `/assistant` (connexion obligatoire, avec `ProtectedRoute` de Maimouna) : liste des conversations, fil de messages, champ de saisie, choix du mode « Documents du CIAT » ou « Atelier de rédaction ». Chaque réponse affiche ses **sources** (titre du document et extrait) et la mention d'usage de l'IA. Gère le refus explicite (aucune source), le chargement et les erreurs `503`. Un bouton « Nouvelle conversation ».
- **Tu attends :** rien (le back-end est dans `test`). Clés IA dans le `.env` du serveur pour tester en vrai.
- **Attendu par :** Lansana (démonstration : seconde fonction d'IA de la plateforme).
- **Terminé quand :** une question sur le parcours d'incubation affiche la réponse avec la source ; une question hors sujet affiche le refus ; l'historique se recharge après actualisation de la page.

## T3 — Espace porteur et équipe pour la galerie
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 h
- **À faire :** pour un porteur connecté : créer une fiche pour son projet (problème, solution, équipe, avancement, médias), la voir en brouillon, la soumettre. Pour le coordonnateur : liste des fiches « en validation » avec boutons « Valider » et « Refuser », et page de statistiques de consultation (`/api/gallery/statistiques/`).
- **Tu attends :** ta T1 et la connexion de Maimouna (dans `test`). Branche : ta branche personnelle.
- **Attendu par :** la démonstration de bout en bout (porteur, validation, publication).
- **Terminé quand :** le parcours complet fonctionne : un porteur crée et soumet une fiche, le coordonnateur la valide, elle apparaît dans la galerie publique.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build`. Pousse ta branche et préviens Lansana.
