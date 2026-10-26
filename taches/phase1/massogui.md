# Massogui — Phase 1

> Domaine : front-end, conception du site web. Module : **P1 Portail institutionnel** (priorité 2). Code dans `frontend/src/app/` et `frontend/src/components/`.
> Lis d'abord [00_PRIORITES.md](../00_PRIORITES.md) et [CONTRATS_API.md](../CONTRATS_API.md) (section P1).

Ordre conseillé : T1, puis T2, puis T3, puis T4.

## T1 — Structure du site public et pages de présentation
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 4 h
- **À faire :** finaliser l'accueil (déjà esquissé) et créer les pages de présentation : le CIAT et sa mission, l'incubateur et son parcours, les domaines d'intervention (les 7 du cahier des charges). Navigation claire, pied de page, responsive. Respecte la charte (`Charte_Graphique_CIAT_ISEP.pdf`) et réutilise `components/ui.tsx`. Les textes viennent du PDF d'évaluation et de la description du CIAT : n'invente pas de chiffres ni de dates.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** toute l'équipe (c'est l'habillage et la navigation de la plateforme), Lansana pour la démonstration.
- **Terminé quand :** toutes les pages existent, la navigation fonctionne sur téléphone, aucune page ne casse la charte.

## T2 — Actualités, événements et appels à projets
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 à 4 h
- **À faire :** pages liste et détail des actualités, calendrier ou liste des événements à venir, liste des appels à projets avec badge « ouvert » ou « clos » et date limite. Chaque appel ouvert a un bouton « Candidater ».
- **Tu attends :** Pathé (T1). Pars sur des données fictives conformes au contrat. Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration).
- **Terminé quand :** les pages affichent les vraies données de l'API, gèrent la liste vide et l'erreur réseau, et le bouton « Candidater » mène vers le dépôt de dossier de Maimouna (ou vers la connexion si l'utilisateur n'est pas connecté).

## T3 — Annuaire des projets incubés
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** page annuaire avec recherche, filtres par domaine, cohorte et statut, cartes de projets (titre, résumé, domaine, statut), pagination. Page de détail simple.
- **Tu attends :** Pathé (T3, annuaire public). Branche : ta branche personnelle.
- **Attendu par :** Lansana (démonstration). Ces cartes serviront de base à la galerie en Phase 2.
- **Terminé quand :** recherche et filtres combinés fonctionnent, un résumé très long ne casse pas la carte, le cas « aucun résultat » est géré.

## T4 — Partenaires, documents et contact
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** page partenaires (logos), espace documentaire téléchargeable par catégorie, formulaire de contact avec validation et message de confirmation.
- **Tu attends :** Pathé (T2). Branche : ta branche personnelle.
- **Attendu par :** personne en particulier. Tâche qui complète le portail.
- **Terminé quand :** un message de contact est bien envoyé et confirmé, une erreur de validation s'affiche sous le champ concerné.

## Quand tu as fini
Vérifie `npm run lint` et `npm run build`. Ouvre ta demande de fusion et préviens Lansana : la tâche suivante te sera donnée après validation.

## À corriger : fausses données affichées en cas de panne
Ton portail est complet et fusionné dans `test`, bravo. Un point doit être corrigé avant la livraison : dans `src/lib/portal-api.ts`, quand l'API ne répond pas, le site affiche de **fausses données de secours** (`MOCK_ACTUALITES`, `MOCK_EVENEMENTS`, `MOCK_APPELS`, `MOCK_PROJETS_INCUBES`). Un visiteur ou le jury verrait de fausses actualités, de faux appels à projets (avec de fausses dates limites) et de faux projets comme s'ils étaient réels.

1. **Supprime l'affichage des fausses données quand l'API échoue.** À la place, affiche un message clair (« Les actualités sont momentanément indisponibles. Réessayez plus tard. ») avec un bouton « Réessayer ». Une liste vide quand l'API répond, mais sans résultat, reste « Aucun résultat » : ce sont deux cas différents.
2. **Si tu veux garder ces données pour tes essais sans serveur**, mets-les derrière une variable `NEXT_PUBLIC_MODE_DEMO=1`, absente par défaut et jamais activée sur `test`. Quand elle est active, un bandeau « MODE DÉMONSTRATION : données fictives » doit rester visible sur chaque page concernée.
3. **Vérifie** : avec le serveur arrêté, aucune fausse actualité ni faux projet ne s'affiche, seulement le message d'erreur ; avec le serveur lancé et le jeu de données (`seed_demo`, `seed_portal`), les vraies données s'affichent ; `npm run lint` et `npm run build` passent.

Fais cette correction sur ta branche personnelle `dev-massogui`, puis préviens Lansana.
