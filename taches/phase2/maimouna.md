# Maimouna — Phase 2

> Domaine : front-end et back-end (surtout front ici). Modules : **P5 Générateur de documents (interface)** et **P2 suivi des projets (interface)**. Code dans `frontend/src/`.
> Ta Phase 1 est validée et fusionnée dans `test` : connexion, dépôt de dossier, évaluation du comité. Fais d'abord `git pull origin test` sur ta branche `dev-maimouna`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (sections P5 et P2 Phase 2). Le back-end de ces écrans existe déjà dans `test` (Pathé pour les documents, Ibrahima pour le suivi).
> **Règle :** aucune fausse donnée affichée comme réelle. En cas d'erreur de l'API, un message clair ; jamais de données fictives de secours.

Ordre conseillé : T1, puis T2, puis T3. Tu travailles sur ta branche personnelle `dev-maimouna` et tu pousses après chaque tâche.

## T1 — Générateur de documents : création
- **Complexité :** Élevée · **Importance :** Critique · **Durée estimée :** 5 à 6 h
- **À faire :** page `/documents` (connexion obligatoire) : choisir un type de document, puis un des modèles proposés (aperçu de sa structure en sections), saisir le sujet et les informations utiles (champs libres), lier éventuellement un projet. Bouton « Générer » qui appelle `POST /api/documents/generer/`, avec un état de chargement (la génération prend quelques secondes) et des messages en français pour les erreurs `503` (service IA indisponible), `502` (réponse invalide, réessayer) et `400`. Affiche ensuite le document généré section par section.
- **Tu attends :** rien (le moteur est dans `test`). Clés IA dans le `.env` du serveur pour tester en vrai.
- **Attendu par :** ta T2, et Lansana (démonstration : c'est la fonction d'IA phare de la plateforme).
- **Terminé quand :** avec une clé IA, on génère une convention complète depuis l'interface ; sans clé, le message d'erreur est clair et le formulaire reste rempli ; l'écran est utilisable sur téléphone.

## T2 — Documents : édition, versions, validation et export
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 à 5 h
- **À faire :** liste « Mes documents » (`GET /api/documents/`), éditeur des sections (enregistrer crée une nouvelle version avec `PATCH`), historique des versions consultable, boutons « Valider », « Publier » et « Repasser en brouillon » visibles selon le rôle (la décision réelle reste côté serveur : affiche le message d'erreur `403` ou `409` tel quel), boutons « Télécharger Word » et « Télécharger PDF » (`export/?format=docx|pdf`).
- **Tu attends :** ta T1. Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** on modifie un document, on voit la version 2, on le valide avec un coordonnateur, on le publie avec un administrateur, et les deux exports se téléchargent ; un document validé n'est plus modifiable depuis l'interface.

## T3 — Suivi des projets incubés (mentor, objectifs, jalons, alertes)
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 à 4 h
- **À faire :** dans `/incubateur`, une page de suivi d'un projet : mentor affecté, objectifs, jalons avec leur statut (retard bien visible), dépôt de preuves, commentaires, et une page « Alertes » avec les jalons en retard visibles selon le rôle. Le coordonnateur peut affecter un mentor.
- **Tu attends :** rien (le back-end d'Ibrahima est dans `test`). Branche : ta branche personnelle.
- **Attendu par :** la démonstration (alertes de retard).
- **Terminé quand :** un porteur voit ses jalons et ses alertes, un mentor voit seulement ses projets affectés, le coordonnateur affecte un mentor, aucun écran n'affiche de fausses données.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build` (et `package-lock.json` synchronisé : `npm ci` doit réussir). Pousse ta branche et préviens Lansana.
