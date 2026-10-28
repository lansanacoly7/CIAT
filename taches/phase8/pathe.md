# Pathé — Phase 8

> Ta Phase 7 est validée et fusionnée dans `test` (301 tests verts, route de santé, aucune erreur 500, contrat d'API vérifié). Fais `git pull origin test` sur ta branche `pathe`. Back-end uniquement : le design est géré ailleurs. Ces trois tâches comblent des écarts avec le sujet d'évaluation.

Ordre conseillé : T1, puis T2, puis T3.

## T1 — Manifestations d'intérêt pour la galerie (partenaires et investisseurs)
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet (projet 6) demande un « espace destiné aux partenaires et investisseurs » et la « mesure de l'intérêt des visiteurs ». Ajoute :
  - `POST /api/gallery/fiches/{slug}/interet/` (public, fiche publiée seulement) : `{ nom, email, organisation, message }` → `201`. Validation stricte (email valide, message limité), limitation de débit adaptée contre le spam, anti-doublon (même email et même fiche dans l'heure). Un email de notification est envoyé au porteur du projet via ton module d'emails (une panne d'envoi ne bloque jamais la réponse).
  - `GET /api/gallery/interets/` (coordonnateur et administrateur : tout ; porteur : seulement les siennes) avec filtres par fiche et par date, paginé.
  - Les compteurs d'intérêt par fiche s'ajoutent à `GET /api/gallery/statistiques/` (sans changer les champs existants).
  - Fiche inconnue ou non publiée : `404`. Aucune donnée personnelle visible pour le public ou un autre porteur.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Massogui (formulaire « Je suis intéressé » sur la fiche), Alioune (indicateur d'intérêt), Lansana (conformité au sujet).
- **Terminé quand :** les droits de chaque rôle sont testés, le spam et les doublons sont bloqués, la route est dans `taches/CONTRATS_API.md` et dans `/api/docs/`, et toute la suite reste verte.

## T2 — Interface d'administration complète
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet demande une « interface d'administration pour gérer les contenus et les candidatures ». Rends l'administration Django réellement utilisable pour tous les modèles (portail, incubateur, documents, galerie, analyse, assistant, utilisateurs) : libellés en français, `list_display` utiles, `list_filter`, `search_fields`, `date_hierarchy` quand c'est pertinent, champs en lecture seule pour les données calculées, `list_select_related` pour éviter les requêtes superflues, et une action « exporter en CSV » sur les listes principales (dossiers, projets, utilisateurs : sans mot de passe ni donnée sensible). Aucun secret affiché. Ajoute des tests : l'accès est réservé à l'administrateur, les pages de liste s'ouvrent sans erreur 500.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Lansana (démonstration de la gestion des contenus et candidatures).
- **Terminé quand :** chaque modèle a une page de liste claire, les exports CSV fonctionnent, et la suite reste verte.

## T3 — Protection des données personnelles
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet exige la « protection des données » et l'information sur l'usage de l'IA. Ajoute pour l'utilisateur connecté :
  - `GET /api/auth/me/export/` : un fichier JSON de toutes ses données (profil, projets, dossiers, documents, conversations de l'assistant, interactions) ;
  - `DELETE /api/auth/me/` : suppression ou anonymisation du compte (confirmation par mot de passe), en conservant ce que l'intégrité des projets et décisions exige, et en supprimant ses conversations de l'assistant ;
  - `DELETE /api/assistant/conversations/{id}/` si ce n'est pas déjà possible, limitée à ses propres conversations.
  Rédige dans `docs/` une page courte « Données personnelles » (quelles données, pourquoi, combien de temps, comment les récupérer ou les supprimer, ce qui est envoyé aux fournisseurs d'IA). Écris seulement ce que fait réellement le code. Ajoute les tests (un utilisateur ne peut jamais exporter ni supprimer les données d'un autre).
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Lansana (rapport, section protection des données), le guide utilisateur.
- **Terminé quand :** l'export, la suppression et l'anonymisation sont testés, la page décrit le comportement réel, et les routes figurent dans le contrat et dans `/api/docs/`.

## Avant de pousser
`python manage.py check`, `makemigrations --check` et la suite complète `python manage.py test` doivent être verts (pense à isoler le cache et les limites de débit dans tes nouveaux tests). Pousse sur `pathe` et préviens Lansana.
