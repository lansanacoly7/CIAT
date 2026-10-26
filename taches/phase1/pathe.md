# Pathé — Phase 1

> Domaine : back-end. Module : **P1 Portail institutionnel** (priorité 2). Code dans `backend/apps/portal/`.
> Lis d'abord [00_PRIORITES.md](../00_PRIORITES.md) et [CONTRATS_API.md](../CONTRATS_API.md) (section P1).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Actualités, événements et appels à projets
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 h
- **À faire :** modèles `Actualite`, `Evenement`, `AppelProjet` avec leur API : lecture publique, écriture réservée à l'administrateur et au coordonnateur (utilise `ReadOnlyOrRole` de `apps/core/permissions.py`). Filtre `?a_venir=1` sur les événements. Statut d'un appel calculé selon sa date limite. Enregistre les modèles dans l'administration Django.
- **Tu attends :** rien. Branche : `feature/portal-contenus`.
- **Attendu par :** Massogui (pages actualités, événements et appels).
- **Terminé quand :** un visiteur non connecté lit les trois listes, un porteur ne peut pas les modifier, un coordonnateur crée une actualité depuis l'API.

## T2 — Partenaires, documents publics et formulaire de contact
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** modèles `Partenaire` (logo), `DocumentPublic` (fichier, catégorie) et `MessageContact`. `POST /contact/` est public, avec limitation de débit (throttle) contre le spam et validation de l'email. Les messages sont visibles uniquement par l'équipe CIAT.
- **Tu attends :** T1 (même app). Branche : `feature/portal-partenaires-contact`.
- **Attendu par :** Massogui (pages partenaires, documents et contact).
- **Terminé quand :** un message de contact est enregistré sans connexion, un email invalide est refusé, la liste des messages est refusée à un visiteur.

## T3 — Annuaire public des projets incubés
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 à 3 h
- **À faire :** `GET /api/portal/projets-incubes/` : public, ne renvoie que les projets aux statuts `incube`, `prototype`, `termine`, et seulement les champs prévus au contrat (jamais l'email du porteur ni d'information privée). Filtres par domaine, cohorte et statut, recherche sur le titre et le résumé.
- **Tu attends :** les statuts des projets sont posés par Ibrahima (T3), mais tu peux tester avec le jeu de données de Lansana. Branche : `feature/portal-annuaire`.
- **Attendu par :** Massogui (page annuaire). Cet endpoint servira aussi à la galerie en Phase 2.
- **Terminé quand :** un projet en statut `idee` n'apparaît jamais, les filtres et la recherche fonctionnent, aucune donnée privée n'est exposée.

## Quand tu as fini
Écris quelques tests (`python manage.py test apps.portal`), vérifie `python manage.py check` et `makemigrations --check`. Ouvre ta demande de fusion et préviens Lansana : la tâche suivante te sera donnée après validation.

## À corriger : tests trop lents
Les tests de ton module prennent environ 1 minute, à cause du hachage des mots de passe à chaque création d'utilisateur de test. Passe au hasheur rapide dans tes classes de test, sans toucher aux réglages de production :

```python
from django.test import override_settings

@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class MesTests(TestCase):
    ...
```
Vérifie ensuite que `python manage.py test apps.portal` passe en quelques secondes. Fais cette correction sur une branche à part (`fix/portal-tests-rapides`) et préviens Lansana.
