# Maimouna — Phase 1

> Domaine : front-end et back-end. Module : **P2 Gestion de l'incubateur, côté interface** (priorité 1), avec l'authentification de toute l'application. Code dans `frontend/src/`.
> Lis d'abord [00_PRIORITES.md](../00_PRIORITES.md) et [CONTRATS_API.md](../CONTRATS_API.md) (sections socle et P2).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Authentification côté interface
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 h
- **À faire :** pages `/connexion` et `/inscription`, un hook `useAuth` (utilisateur courant, connexion, déconnexion, rôle), une protection de routes selon le rôle (redirection vers la connexion, message si le rôle ne suffit pas). Le client `src/lib/api.ts` gère déjà les jetons et leur renouvellement : utilise-le. Le menu de l'en-tête affiche « Connexion » ou le nom de l'utilisateur et « Déconnexion ». Messages d'erreur clairs en français.
- **Tu attends :** rien (l'API d'authentification existe). Branche : `feature/auth-ui`.
- **Attendu par :** tout le monde pour les pages protégées : Alioune (dashboard réservé à l'équipe), Massogui (lien de connexion de l'en-tête).
- **Terminé quand :** on s'inscrit, on se connecte avec `porteur@ciat.sn`, on arrive connecté, on se déconnecte ; une page réservée au coordonnateur redirige un porteur.

## T2 — Dépôt de dossier par le porteur
- **Complexité :** Élevée · **Importance :** Critique · **Durée estimée :** 5 à 6 h
- **À faire :** espace « Mon dossier » : formulaire en étapes (informations du projet, pièces à joindre, récapitulatif), dépôt de fichiers avec progression et erreurs claires (taille, type), jauge de complétude, liste des pièces manquantes, bouton « Soumettre » qui n'est actif que si le dossier est complet. Utilisable sur téléphone.
- **Tu attends :** Ibrahima (T1, dossiers et pièces). Commence dès maintenant avec des données fictives qui respectent le contrat, puis branche l'API réelle. Branche : `feature/incubator-ui-depot`.
- **Attendu par :** Massogui (le bouton « Candidater » mène ici), Lansana (démonstration de bout en bout).
- **Terminé quand :** un porteur parcourt tout le parcours avec l'API réelle, un fichier trop lourd affiche un message, la soumission d'un dossier incomplet est impossible.

## T3 — Écran d'évaluation du comité
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** liste des dossiers à évaluer, fiche du dossier avec ses pièces, grille de notation (une note par critère, avis), score calculé, et pour le coordonnateur un bouton de décision avec motif obligatoire. Réservé aux rôles `membre_comite` et `coordonnateur`.
- **Tu attends :** Ibrahima (T2 évaluation, T3 décision) et ta propre T1 (protection des routes). Branche : `feature/incubator-ui-comite`.
- **Attendu par :** Lansana (démonstration), Alioune (les décisions alimentent ses indicateurs).
- **Terminé quand :** avec `comite@ciat.sn`, on note un dossier et on voit le score ; avec `coordo@ciat.sn`, on décide avec motif et le statut change ; un porteur n'accède pas à l'écran.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build`. Ouvre ta demande de fusion et préviens Lansana : la tâche suivante te sera donnée après validation. Si un manque côté back te bloque, dis-le à Lansana, il peut te confier une partie du back.
