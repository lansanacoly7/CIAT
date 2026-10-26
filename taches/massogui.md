# Massogui — Phase 1

> Domaine : front-end, conception du site web. Module : **P1 Portail institutionnel** (priorité 2). Code dans `frontend/src/app/` et `frontend/src/components/`.
> Lis d'abord [00_PRIORITES.md](00_PRIORITES.md) et [CONTRATS_API.md](CONTRATS_API.md) (section P1).

Ordre conseillé : T1, puis T2, puis T3, puis T4.

## T1 — Structure du site public et pages de présentation
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 4 h
- **À faire :** finaliser l'accueil (déjà esquissé) et créer les pages de présentation : le CIAT et sa mission, l'incubateur et son parcours, les domaines d'intervention (les 7 du cahier des charges). Navigation claire, pied de page, responsive. Respecte la charte (`Charte_Graphique_CIAT_ISEP.pdf`) et réutilise `components/ui.tsx`. Les textes viennent du PDF d'évaluation et de la description du CIAT : n'invente pas de chiffres ni de dates.
- **Tu attends :** rien. Branche : `feature/portal-site`.
- **Attendu par :** toute l'équipe (c'est l'habillage et la navigation de la plateforme), Lansana pour la démonstration.
- **Terminé quand :** toutes les pages existent, la navigation fonctionne sur téléphone, aucune page ne casse la charte.

## T2 — Actualités, événements et appels à projets
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** pages liste et détail des actualités, calendrier ou liste des événements à venir, liste des appels à projets avec badge « ouvert » ou « clos » et date limite. Chaque appel ouvert a un bouton « Candidater ».
- **Tu attends :** Pathé (T1). Pars sur des données fictives conformes au contrat. Branche : `feature/portal-contenus-ui`.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** les pages affichent les vraies données de l'API, gèrent la liste vide et l'erreur réseau, et le bouton « Candidater » mène vers le dépôt de dossier de Maimouna (ou vers la connexion si l'utilisateur n'est pas connecté).

## T3 — Annuaire des projets incubés
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** page annuaire avec recherche, filtres par domaine, cohorte et statut, cartes de projets (titre, résumé, domaine, statut), pagination. Page de détail simple.
- **Tu attends :** Pathé (T3, annuaire public). Branche : `feature/portal-annuaire-ui`.
- **Attendu par :** Lansana (démonstration). Ces cartes serviront de base à la galerie en Phase 2.
- **Terminé quand :** recherche et filtres combinés fonctionnent, un résumé très long ne casse pas la carte, le cas « aucun résultat » est géré.

## T4 — Partenaires, documents et contact
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** page partenaires (logos), espace documentaire téléchargeable par catégorie, formulaire de contact avec validation et message de confirmation.
- **Tu attends :** Pathé (T2). Branche : `feature/portal-contact-ui`.
- **Attendu par :** personne en particulier. Tâche qui complète le portail.
- **Terminé quand :** un message de contact est bien envoyé et confirmé, une erreur de validation s'affiche sous le champ concerné.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build`. Ouvre ta demande de fusion et préviens Lansana : la tâche suivante te sera donnée après validation.
