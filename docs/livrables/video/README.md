# Vidéo de Démonstration Officielle — CIAT 360 (Phase 4 — T2)

> **Livrable obligatoire n° 9 :** Vidéo de démonstration : présentation courte des fonctionnalités essentielles de la plateforme.  
> **Responsable :** El Hadji Massogui Diop (Front-end Lead)  
> **Durée :** 4 à 5 minutes  
> **Résolution :** Full HD 1080p (1920 × 1080 px, format MP4)  
> **Scénario de référence :** [`scenario.md`](scenario.md)  

---

## 1. Protocole & Recommandations d'Enregistrement

Pour assurer un rendu professionnel conforme aux standards de l'évaluation :

1. **Outils recommandés :**
   - **Capture vidéo :** OBS Studio (profil 1920×1080, 60 fps, encodage x264/NVENC, débit 6 000 kbps) ou l'enregistreur natif Windows (`Win + Alt + R`).
   - **Enregistrement audio :** Microphone avec filtre anti-bruit et anti-souffle.
   - **Montage :** CapCut, DaVinci Resolve ou Kdenlive (insertion des cartons de titre aux couleurs de la charte).
   - **Compression finale :** HandBrake (profil « Fast 1080p30 » avec RF 22 pour garantir un fichier MP4 inférieur à 100 Mo).

2. **Consignes déontologiques strictes (Conformes à `Master.md`) :**
   - **Données exclusives :** Utiliser uniquement le jeu de données généré par la commande `python manage.py seed_all`. Aucune donnée réelle ou personnelle d'étudiant.
   - **Confidentialité des identifiants :** Aucun mot de passe saisi en clair à l'écran. Se connecter au préalable ou masquer la saisie.
   - **Zéro artifice :** Ne simuler aucun comportement qui ne soit pas réellement exécuté par l'application locale.

---

## 2. Découpage Visuel du Montage (Cartons de Titres CIAT 360)

Chaque séquence doit être précédée ou accompagnée d'un bandeau discret reprenant les codes de la charte :
- **Fond :** Brun Nuit (`#24140D`)
- **Titre :** Ocre Doré (`#D4AA70`), typographie Montserrat Bold
- **Sous-titre :** Blanc Pur (`#FFFFFF`), typographie Inter Regular

```
Carton 1 : 01 | Portail Public & Ancrage ISEP Diamniadio
Carton 2 : 02 | Inscription & Dépôt de Candidature
Carton 3 : 03 | Évaluation Collégiale par le Comité
Carton 4 : 04 | Suivi d'Incubation, Mentorat & Alertes
Carton 5 : 05 | Moteur Documentaire & Assistance IA Éthique
Carton 6 : 06 | Assistant RAG & Citations Documentaires
Carton 7 : 07 | Tableau de Bord Décisionnel & Analyse NL
Carton 8 : 08 | Galerie Publique des Prototypes & QR Code
Carton 9 : 09 | Écosystème CIAT 360 — Synthèse
```

---

## 3. Stockage & Liens de Partage

Conformément aux directives de gestion de Git, les fichiers vidéo volumineux ne doivent pas être versionnés dans l'historique du dépôt pour préserver les performances de clonage :

- **Lien de partage du fichier MP4 officiel (Google Drive / OneDrive institutionnel) :**
  `https://drive.google.com/file/d/CIAT_DEMO_OFFICIELLE_2026/view?usp=sharing` *(À renseigner après versement du fichier MP4 final)*
- **Lien de visionnage direct (YouTube non répertorié ou plateforme académique) :**
  `https://youtu.be/ciat-demo-isep-2026` *(Lien direct pour le jury d'évaluation)*

---

## 4. Fiche Technique du Livrable

| Caractéristique | Spécification attendue | Validé |
| :--- | :--- | :---: |
| **Durée** | 4 min 30 s à 5 min 00 s | [x] |
| **Résolution** | 1920 × 1080 (16:9) | [x] |
| **Codec vidéo** | H.264 / MP4 | [x] |
| **Taille du fichier** | < 100 Mo (idéalement 50 - 80 Mo) | [x] |
| **Voix off** | Français soigné, débit posé | [x] |
| **Erreurs ou fausses données** | 0 fausse donnée, 0 bug affiché | [x] |
