# Pathé — Phase 3

> Domaine : back-end. Modules : **P1 Portail (suite)** et **P3 Tableau de bord (exports)**. Code dans `backend/apps/portal/` et `backend/apps/analytics/`.
> Ta Phase 2 est validée et fusionnée dans `test` : versions, workflow et export des documents. Fais d'abord `git pull origin test` sur ta branche `pathe`.
> Lis [../00_PRIORITES.md](../00_PRIORITES.md) et [../CONTRATS_API.md](../CONTRATS_API.md) (compléments P1 et P3 en bas du fichier). Back-end uniquement.
> Tes tests doivent être rapides : `@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])`.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Brouillon et publication des actualités
- **Complexité :** Faible · **Importance :** Normale · **Durée estimée :** 2 h
- **À faire :** ajouter un champ `publie` (booléen, `False` par défaut) aux actualités. Le public ne voit que les actualités publiées (liste et détail) ; l'équipe CIAT les voit toutes et peut modifier `publie`. Migration de données : les actualités existantes passent à `publie = True`. Le format de l'API publique ne change pas.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** Massogui (les pages d'actualités n'affichent que les publiées : aucun changement de son côté).
- **Terminé quand :** une actualité non publiée n'apparaît jamais côté public (liste vide, détail en `404`), et le coordonnateur peut la publier.

## T2 — Statistiques de consultation du portail
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 h
- **À faire :** compter les consultations des actualités et des projets incubés (champ `vues`, incrémentation atomique à chaque lecture d'un détail). Route `GET /api/portal/statistiques/` réservée à l'équipe CIAT, format dans le contrat.
- **Tu attends :** rien. Branche : ta branche personnelle.
- **Attendu par :** le rapport final (statistiques de consultation du portail).
- **Terminé quand :** deux lectures d'un détail donnent `vues = 2`, un anonyme ne peut pas lire les statistiques, une migration propre est fournie.

## T3 — Export des analyses du tableau de bord
- **Complexité :** Moyenne · **Importance :** Normale · **Durée estimée :** 3 à 4 h
- **À faire :** `GET /api/analytics/export/?format=xlsx` (Excel, avec `openpyxl`) et `?format=pdf` (avec `reportlab`, déjà dans les dépendances) : mêmes filtres que les autres endpoints d'analyse (`debut`, `fin`, `cohorte`, `domaine`, `statut`), avec les indicateurs et les répartitions par domaine, cohorte et genre. Accès limité aux mêmes rôles que les endpoints d'analyse (écrits par Alioune, dans `test` après sa fusion). Charte : titres en brun `#612D10`.
- **Tu attends :** la fusion de la branche d'Alioune dans `test` (annoncée par Lansana). Branche : ta branche personnelle.
- **Attendu par :** Alioune (boutons d'export du dashboard).
- **Terminé quand :** les deux fichiers s'ouvrent correctement avec les accents, les filtres s'appliquent, un porteur reçoit `403`.

## Quand tu as fini
Vérifie `python manage.py check` et `makemigrations --check`. Pousse ta branche et préviens Lansana.
