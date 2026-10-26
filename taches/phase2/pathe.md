# Pathé — Phase 2

> Domaine : back-end. Module : **P5 Générateur de documents, suite** (versions, workflow, export). Code dans `backend/apps/documents/`.
> Ta Phase 1 est validée et fusionnée, bravo. Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (section « P5 — Ajouts de la Phase 2 »).
> Le moteur de génération et les modèles de documents existent déjà dans `test` : lis d'abord `models.py`, `services.py` et `views.py` de `apps/documents/`. Ne modifie pas le moteur de génération ni les routes déjà existantes (`types`, `modeles`, `generer`).

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Consultation et modification d'un document (versions)
- **Complexité :** Moyenne · **Importance :** Critique · **Durée estimée :** 3 à 4 h
- **À faire :** routes de consultation (`GET /`, `GET /{id}/`) : un utilisateur voit ses documents, l'équipe CIAT les voit tous. Route de modification `PATCH /{id}/` qui prend les sections corrigées et crée une **nouvelle version** (numéro suivant, l'ancienne reste intacte). Routes `GET /{id}/versions/` et `GET /{id}/versions/{numero}/`. Valide que les codes de section envoyés existent dans le modèle du document.
- **Tu attends :** rien (le moteur est dans `test`). Branche : ta branche personnelle.
- **Attendu par :** Maimouna (éditeur de documents), et ta propre T2.
- **Terminé quand :** deux modifications successives donnent les versions 2 et 3, la version 1 est toujours lisible, un autre utilisateur ne peut pas lire ni modifier le document de quelqu'un d'autre, un code de section inconnu est refusé avec un message clair.

## T2 — Workflow de validation et droits
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 2 à 3 h
- **À faire :** routes `valider`, `publier` et `brouillon` du contrat. Tout utilisateur connecté crée un brouillon ; seuls coordonnateur et administrateur valident ; seul l'administrateur publie. Un document `valide` ou `publie` ne se modifie plus (`409`) tant qu'il n'est pas repassé en brouillon. Utilise les permissions de `apps/core/permissions.py`.
- **Tu attends :** ta T1. Branche : ta branche personnelle.
- **Attendu par :** Maimouna (boutons de validation et de publication).
- **Terminé quand :** chaque transition interdite est refusée avec le bon code et un message en français, et chaque rôle ne peut faire que ce qui lui est permis.

## T3 — Export Word et PDF avec la charte
- **Complexité :** Élevée · **Importance :** Haute · **Durée estimée :** 4 à 5 h
- **À faire :** `GET /{id}/export/?format=docx` et `?format=pdf`. En-tête avec le nom du CIAT, titre en brun `#612D10`, intertitres en brun, texte noir `#24140D`, numéro de page, mention du statut et de la version. Choisis des bibliothèques légères, ajoutées à `requirements.txt` (par exemple `python-docx` pour Word ; pour le PDF évite ce qui exige des installations système lourdes sous Windows, par exemple `reportlab`). Nom de fichier propre (titre nettoyé et numéro de version).
- **Tu attends :** ta T1. Branche : ta branche personnelle.
- **Attendu par :** Maimouna (bouton « Télécharger »), Lansana (démonstration).
- **Terminé quand :** un document généré s'exporte dans les deux formats, les fichiers s'ouvrent correctement (Word et un lecteur PDF), les accents s'affichent, et un format inconnu renvoie `400`.

## Quand tu as fini
Écris des tests (`python manage.py test apps.documents`, avec `MD5PasswordHasher` pour qu'ils soient rapides), vérifie `check` et `makemigrations --check`. Pousse ta branche et préviens Lansana. Back-end uniquement : aucune tâche côté interface.
