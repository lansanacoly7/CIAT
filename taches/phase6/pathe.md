# Pathé — Phase 6

> Domaine : back-end. Ta Phase 5 est validée et fusionnée dans `test` (265 tests). Fais `git pull origin test` sur ta branche `pathe`.
> Objectif : **sortir des chiffres de performance mesurés**. Aucun livrable n'en donne aujourd'hui, parce que rien n'a été mesuré sous charge : on préfère un chiffre honnête à une promesse.

Ordre conseillé : T1, puis T2.

## T1 — Mesure du temps de réponse sous charge légère
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** écris `scripts/mesure_charge.py` (bibliothèque standard ou `httpx`, pas de nouvelle dépendance lourde). Contre un serveur local lancé avec `seed_all` (`python manage.py runserver`), il envoie des requêtes en parallèle (5, 20 puis 50 clients simultanés, 200 requêtes chacun) sur six routes : liste publique des actualités, galerie, détail d'une fiche, connexion, liste des dossiers (porteur connecté) et indicateurs du tableau de bord (coordonnateur). Il affiche pour chaque route : nombre de requêtes, erreurs, temps médian, 95e centile, débit. Les routes avec limitation de débit (connexion) sont mesurées en tenant compte de cette limite, sans la contourner en production.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Lansana (rapport, section performance), Ibrahima (document de performance).
- **Terminé quand :** le script tourne avec une commande documentée et produit un tableau lisible.

## T2 — Résultats honnêtes dans la documentation
- **Complexité :** Faible · **Importance :** Haute · **Durée estimée :** 1 h
- **À faire :** ajoute à `docs/PERFORMANCE.md` une section « Mesures sous charge » avec les résultats réels de T1, la machine utilisée (processeur, mémoire), la base (SQLite ou PostgreSQL), le serveur (`runserver` n'est pas un serveur de production : dis-le) et les limites (pas de réseau réel, pas de déploiement). Pas d'objectif promis : seulement ce que tu as mesuré.
- **Tu attends :** T1. Branche : `pathe`.
- **Attendu par :** Lansana (rapport final).
- **Terminé quand :** chaque chiffre de la section peut être retrouvé en relançant le script.

## T3 — Fiche promotionnelle PDF d'un projet de la galerie
- **Complexité :** Moyenne · **Importance :** Haute · **Durée estimée :** 3 h
- **À faire :** le sujet (projet 6) demande la « génération d'une fiche promotionnelle et d'un QR code par projet ». Le QR code existe ; la fiche non. Ajoute `GET /api/gallery/fiches/{slug}/fiche/` (public pour une fiche publiée) : un PDF d'une page A4 aux couleurs de la charte (titre, problème, solution, équipe, avancement, QR code vers la fiche), avec la même base que tes autres PDF. Fiche non publiée : `404`. Documente la route dans le contrat et dans `/api/docs/`.
- **Tu attends :** rien. Branche : `pathe`.
- **Attendu par :** Massogui (bouton « Télécharger la fiche » sur la page de la fiche), Lansana.
- **Terminé quand :** le PDF est valide avec les accents et le QR, une fiche non publiée donne `404`, avec tests.
