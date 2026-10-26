# Lansana — Phase 2

> Domaine : lead technique. Modules : **P4 Assistant IA (back-end)** et **P6 Galerie des innovations (back-end)**. Revue des demandes de fusion en continu.
> Phase 1 : tâches 1 et 2 validées et fusionnées. La tâche 3 (intégration continue et déploiement) est **reportée** : à relancer quand l'équipe approche de la livraison. Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (sections P4 et P6).

Ordre conseillé : T1, puis T2.

## T1 — Assistant IA : recherche dans les documents du CIAT (P4)
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 5 à 6 h
- **À faire :** dans `backend/apps/assistant/` : indexation des documents publics du portail (`DocumentPublic`, fichiers PDF, Word ou texte) découpés en passages, avec recherche par mots-clés (pas de service payant ni de base vectorielle). Conversation : l'utilisateur pose une question, l'assistant cherche les passages pertinents, répond **uniquement** à partir d'eux via `ai.chat`, et cite ses sources (titre du document et extrait). Si aucun passage n'est pertinent, il le dit clairement au lieu d'inventer. Historique des échanges par utilisateur, et mention de l'usage de l'IA dans chaque réponse. Aide à la rédaction (fiche de projet, pitch, analyse SWOT) en mode « atelier » sans sources obligatoires, mais avec le même refus d'inventer des faits sur le CIAT.
- **Tu attends :** Pathé (les documents publics existent déjà dans `test`). Clés IA dans `backend/.env`. Branche : ta branche personnelle.
- **Attendu par :** Maimouna (interface de chat), Massogui (assistant sur le portail).
- **Terminé quand :** une question dont la réponse est dans un document donne une réponse avec la bonne source ; une question hors sujet reçoit un refus explicite ; l'historique est conservé par utilisateur ; sans clé IA l'API répond `503` avec un message clair.

## T2 — Galerie des innovations (P6)
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 4 h
- **À faire :** dans `backend/apps/gallery/` : fiche d'innovation liée à un projet (problème, solution, équipe, niveau d'avancement, médias par liens), workflow de validation avant publication (brouillon, en validation, publié, refusé), consultation publique des fiches publiées avec recherche et filtres, compteur de consultations et route de statistiques, QR code par fiche (PNG). Fiche promotionnelle en PDF : reportée à la fin si le temps le permet.
- **Tu attends :** rien (l'annuaire public de Pathé existe). Branche : ta branche personnelle.
- **Attendu par :** Massogui ou un autre développeur front pour les pages de la galerie.
- **Terminé quand :** une fiche non publiée n'est jamais visible publiquement, le workflow respecte les droits (porteur soumet, coordonnateur valide), le QR code mène à la bonne fiche, le compteur augmente à chaque consultation.

## En continu — revues
Vérifier chaque branche poussée (contrôles, périmètre, secrets, conformité au contrat), fusionner si c'est bon, puis donner la tâche suivante.
