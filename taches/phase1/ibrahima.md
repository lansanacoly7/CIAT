# Ibrahima — Phase 1

> Domaine : back-end. Module : **P2 Gestion de l'incubateur** (priorité 1). Code dans `backend/apps/incubator/`.
> Lis d'abord [00_PRIORITES.md](../00_PRIORITES.md) et [CONTRATS_API.md](../CONTRATS_API.md) (section P2).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Dossiers de candidature et pièces jointes
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 à 4 h
- **À faire :** modèles `Dossier` (lié à un `Projet`) et `Piece`. Dépôt de pièces en `multipart` (10 Mo max, types PDF, images, Word). Calcul de la complétude et de la liste des pièces manquantes. Action `soumettre` qui refuse tant qu'une pièce obligatoire manque. Droits : un porteur ne voit que ses dossiers.
- **Tu attends :** rien (le socle `apps/core` est prêt). Branche : `feature/incubator-dossiers`.
- **Attendu par :** Maimouna (formulaire de dépôt), Massogui (la page de candidature renvoie vers ce dépôt).
- **Terminé quand :** un porteur crée un dossier, dépose 3 pièces, voit `completude: 100`, soumet. Un dossier incomplet est refusé avec un message clair. Un autre porteur ne peut pas le voir.

## T2 — Grille d'évaluation et évaluations du comité
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** modèles `Grille` et `Critere` (libellé, poids, note maximale), `Evaluation` et `Note`. Une grille actuelle par défaut avec 5 critères. Un évaluateur (membre du comité, mentor, coordonnateur ou administrateur) note un dossier une seule fois. Calcul du score pondéré et du `score_moyen`.
- **Tu attends :** T1 (dossiers). Branche : `feature/incubator-evaluation`.
- **Attendu par :** Maimouna (écran d'évaluation du comité), Alioune (indicateurs).
- **Terminé quand :** deux membres du comité notent un dossier, le score moyen est correct, une deuxième évaluation du même membre est refusée.

## T3 — Décision motivée du comité
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 2 h
- **À faire :** modèle `Decision` (acceptation ou refus, motif obligatoire). La décision met à jour le statut du dossier et du projet : accepté donne `selectionne`, refusé donne `rejete`. Réservé au coordonnateur.
- **Tu attends :** T2. Branche : `feature/incubator-decision`.
- **Attendu par :** Massogui et Pathé (l'annuaire public dépend des statuts), Alioune (indicateurs de sélection).
- **Terminé quand :** la décision change bien le statut du projet, le motif vide est refusé, seuls coordonnateur et administrateur peuvent décider.

## Quand tu as fini
Prévois dans chaque tâche quelques tests (`python manage.py test apps.incubator`) et vérifie `python manage.py check` et `makemigrations --check`. Ouvre ta demande de fusion et préviens Lansana : la tâche suivante te sera donnée après validation.

## À corriger : tests trop lents
Les tests de ton module prennent environ 2 minutes 35, à cause du hachage des mots de passe à chaque création d'utilisateur de test. Passe au hasheur rapide dans tes classes de test, sans toucher aux réglages de production :

```python
from django.test import override_settings

@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class MesTests(TestCase):
    ...
```
Vérifie ensuite que `python manage.py test apps.incubator` passe en quelques secondes. Fais cette correction sur une branche à part (`fix/incubator-tests-rapides`) et préviens Lansana.
