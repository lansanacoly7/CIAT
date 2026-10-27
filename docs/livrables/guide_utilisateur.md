# Guide d'Utilisation de la Plateforme CIAT

> **Centre d'Innovation, d'Application et de Transfert — ISEP Amadou Trawaré, Diamniadio**  
> **Auteur :** Groupe de six apprenants : Lansana Coly, Pape Alioune Sène, Maimouna Sall, El Hadji Massogui Diop, Ibrahima Khalilou Diallo, Pathé Fall  
> **Référence :** Livrable Obligatoire N° 7 (Instructions détaillées pour chaque rôle utilisateur)  
> **Avertissement :** La plateforme est un environnement de travail et d'évaluation non déployé en production. Toutes les données de démonstration sont fictives. Les fonctionnalités d'IA reposent sur des quotas gratuits de services externes susceptibles d'être temporairement indisponibles.

---

## Sommaire
1. [Rôle 1 : Visiteur Public (Grand public, partenaires, investisseurs)](#1-guide-du-visiteur-public)
2. [Rôle 2 : Porteur de Projet (Candidat et entrepreneur incubé)](#2-guide-du-porteur-de-projet)
3. [Rôle 3 : Membre du Comité de Sélection (Jury et experts)](#3-guide-du-membre-du-comité-de-sélection)
4. [Rôle 4 : Mentor (Tuteur et accompagnateur métier)](#4-guide-du-mentor)
5. [Rôle 5 : Coordonnateur de l'Incubateur (Pilotage opérationnel)](#5-guide-du-coordonnateur-de-lincubateur)
6. [Rôle 6 : Administrateur Système (Gouvernance technique)](#6-guide-de-ladministrateur-système)

---

## 1. Guide du Visiteur Public

Le portail public du CIAT est accessible sans création de compte préalable. Il permet à tout citoyen, étudiant, chercheur ou partenaire économique de s'informer et de postuler aux opportunités d'accompagnement.

### 1.1 Découvrir le CIAT et son actualité
1. Rendez-vous sur la page d'accueil du portail (`/`).
2. Consultez la rubrique **Actualités** pour suivre les dernières initiatives de l'ISEP Diamniadio et du CIAT.
3. Accédez à l'onglet **Événements** pour visualiser les dates des futurs hackathons, journées portes ouvertes et ateliers de démonstration.

### 1.2 Explorer l'Annuaire et la Galerie des Innovations
1. Accédez à la **Galerie des innovations** (`/galerie`) ou à l'**Annuaire public des projets** (`/portail/projets` ou `/portail`).
2. Filtrez les projets par domaine technologique (ex. *Agriculture & Environnement*, *TIC & IA*, *Énergie*), par cohorte ou par niveau d'avancement.
3. Cliquez sur une fiche pour découvrir :
   - Le problème socio-économique résolu et la solution technologique apportée.
   - La composition de l'équipe fondatrice.
   - Les photos, vidéos ou démonstrations interactives du prototype.
4. Téléchargez le **QR Code officiel** de la fiche pour partager l'innovation sur vos supports mobiles.

### 1.3 Consulter les Appels à Projets et Candidater
1. Rendez-vous sur la section **Appels à projets**.
2. Repérez les appels affichant le badge vert **« Ouvert »** et vérifiez la date limite de soumission.
3. Cliquez sur **« Candidater »** : vous serez invité à vous inscrire pour formaliser votre dossier de candidature.

### 1.4 Télécharger les Documents Publics et Contacter le CIAT
1. Rendez-vous sur la page **Documents** pour télécharger librement les chartes éthiques, guides d'incubation et règlements intérieurs.
2. Utilisez le formulaire de la page **Contact** pour adresser une question à l'équipe administrative (un accusé de réception automatique s'affiche à l'envoi).

---

## 2. Guide du Porteur de Projet

Le porteur de projet dispose d'un espace sécurisé lui permettant de gérer son projet, de soumettre son dossier de sélection et de piloter son incubation au quotidien.

### 2.1 Inscription et Accès à l'Espace Porteur
1. Cliquez sur **« S'inscrire »** (`/inscription`) ou **« Se connecter »** (`/connexion`), renseignez votre nom, prénom, email institutionnel ou professionnel, mot de passe sécurisé et domaine d'activité.
2. Connectez-vous avec vos identifiants JWT. Vous êtes automatiquement dirigé vers votre tableau de bord personnel.

### 2.2 Créer et Renseigner sa Fiche Projet
1. Dans votre espace, cliquez sur **« Déposer un nouveau projet »**.
2. Renseignez l'intitulé du projet, le résumé exécutif, le problème cible rencontré et la solution technologique préconisée.
3. Sélectionnez le pôle technologique correspondant parmi les 7 domaines officiels du CIAT. Votre projet est initialement enregistré à l'état `idee`.

### 2.3 Constituer son Dossier et Déposer les Pièces Justificatives
1. Accédez à la rubrique **« Mon Dossier de Candidature »**.
2. Observez la jauge dynamique de complétude (initialement à **0 %**).
3. Téléversez obligatoirement les trois pièces maîtresses exigées par le règlement du CIAT :
   - **Fiche de projet détaillée** (format PDF ou Word).
   - **Présentation de l'équipe fondatrice** (curriculum vitae, compétences clés).
   - **Budget prévisionnel d'amorçage** (plan de financement initial).
4. Le système inspecte automatiquement le fichier : sa taille doit être inférieure à 10 Mo et sa signature binaire doit être valide. À chaque pièce validée, la jauge progresse (33 %, 66 %, puis **100 % - Dossier complet**).

### 2.4 Soumettre son Dossier au Comité de Sélection
1. Dès que la jauge affiche **100 %**, le bouton **« Soumettre définitivement »** devient actif.
2. Cliquez sur soumettre : votre dossier passe au statut `soumis` et votre projet au statut `depose`.
3. **Important :** Une fois soumis, le dossier est verrouillé. Aucune pièce ne peut être modifiée ni supprimée afin de garantir l'équité de traitement devant le jury.

### 2.5 Suivre les Jalons avec son Mentor
1. Lorsque votre projet est retenu et entre en statut `incube`, votre mentor désigné apparaît sur votre tableau de bord.
2. Consultez la liste des **Jalons opérationnels** fixés pour votre accompagnement.
3. Pour chaque jalon, téléversez votre **fichier de preuve** (rapport de test, photo de maquette, contrat de stage) et saisissez un commentaire d'étape.
4. Les jalons dont la date limite est dépassée apparaissent avec l'alerte visuelle orange **« En retard »**.

### 2.6 Proposer sa Fiche pour la Galerie Publique
1. Dès que votre solution atteint le stade de prototype fonctionnel, accédez à **« Ma Fiche Galerie »**.
2. Rédigez la synthèse promotionnelle, décrivez votre équipe et ajoutez des liens vers vos médias (vidéos YouTube, photos).
3. Cliquez sur **« Demander la publication »** : votre fiche passe en statut `en_validation` pour examen par le coordonnateur.

### 2.7 Utiliser l'Assistant IA en Mode Atelier
1. Cliquez sur l'onglet **Assistant IA** (`/assistant`).
2. Sélectionnez le mode **« Atelier de rédaction »**.
3. Sollicitez l'assistant pour structurer un pitch percutant, formaliser une matrice SWOT ou rédiger un argumentaire. L'assistant respecte scrupuleusement vos données et utilise des balises `[À COMPLÉTER]` pour vous signaler les points restant à chiffrer.
4. **Remarque opérationnelle :** L'assistant fait appel à des fournisseurs d'IA externes gratuits (Groq, Google Gemini) via `apps.core.ai` ; ses réponses sont soumises aux quotas de requêtes et à la connectivité externe.

---

## 3. Guide du Membre du Comité de Sélection

Les membres du comité d'évaluation ont pour mission d'instruire les candidatures de manière rigoureuse, objective et impartiale.

### 3.1 Accéder aux Dossiers à Évaluer
1. Connectez-vous avec votre compte accrédité en rôle `membre_comite`.
2. Accédez à la liste des candidatures : seuls les dossiers au statut `soumis`, `complet` ou `en_evaluation` sont présentés à l'instruction.
3. Les dossiers encore à l'état de brouillon chez le porteur ne sont pas visibles.

### 3.2 Consulter les Pièces Justificatives
1. Cliquez sur le dossier d'un projet pour ouvrir sa vue d'instruction.
2. Téléchargez et examinez chacune des pièces téléversées par le candidat (Fiche projet, Équipe, Budget).
3. Prenez connaissance des caractéristiques techniques, du caractère innovant et de l'ancrage territorial de la solution.

### 3.3 Noter selon la Grille Multicritère Active
1. Cliquez sur **« Évaluer ce dossier »**.
2. Le formulaire charge automatiquement la **Grille standard de sélection du CIAT** comportant 5 critères pondérés :
   - *Pertinence du problème et adéquation de la solution* (note sur 20, poids 2)
   - *Caractère innovant et faisabilité technique* (note sur 20, poids 3)
   - *Modèle économique et viabilité financière* (note sur 20, poids 2)
   - *Compétences, profil et complémentarité de l'équipe* (note sur 20, poids 2)
   - *Impact socio-économique, création de valeur et durabilité* (note sur 20, poids 1)
3. Attribuez une note chiffrée à chaque critère et rédigez votre appréciation qualitative dans le champ **Avis motivé**.
4. Cliquez sur **« Enregistrer l'évaluation »** :
   - Le système calcule la moyenne pondérée normalisée sur 20.
   - Le dossier bascule automatiquement au statut `en_evaluation`.
   - **Règle d'intégrité :** Un membre du jury ne peut évaluer qu'une seule fois un même dossier.

---

## 4. Guide du Mentor

Le mentor assure l'encadrement technique, méthodologique et entrepreneurial des startups qui lui sont formellement confiées par la direction du CIAT.

### 4.1 Consulter ses Projets Assignés
1. Connectez-vous avec vos identifiants en rôle `mentor`.
2. Votre espace liste exclusivement les projets pour lesquels une **Affectation officielle** a été validée par le coordonnateur.
3. **Protection des données :** Vous n'avez pas accès aux coordonnées des projets que vous n'encadrez pas.

### 4.2 Définir les Objectifs Stratégiques
1. Sur la fiche du projet incubé, cliquez sur **« Ajouter un objectif »**.
2. Formulez l'objectif (ex. *Finalisation du banc d'essai électronique*, *Obtention de l'agrément sanitaire*).
3. Fixez une date d'échéance prévisionnelle et suivez son statut (`a_faire`, `en_cours`, `atteint`).

### 4.3 Cadencer les Jalons et Gérer les Alertes
1. Découpez les objectifs en **Jalons opérationnels** datés.
2. Consultez l'onglet **Alertes de retard** (`/api/incubator/alertes/`) : le système y remonte immédiatement tout jalon non finalisé dont la date d'échéance est échue.
3. Téléchargez les pièces de preuve déposées par le porteur et déposez vos recommandations dans le fil de commentaires. Dès validation, passez le jalon à l'état `fait`.

### 4.4 Rédiger les Bilans Périodiques de Suivi
1. Aux jalons clés de l'accompagnement, accédez à l'onglet **« Bilans de suivi »**.
2. Rédigez le **Bilan à 3 mois** ou le **Bilan à 6 mois**.
3. Consignez l'état d'avancement du prototype, la dynamique de l'équipe et les besoins complémentaires d'expertise.

---

## 5. Guide du Coordonnateur de l'Incubateur

Le coordonnateur est le garant de la cohérence opérationnelle, de l'arbitrage des jurys et de la conformité institutionnelle de l'incubateur.

### 5.1 Arbitrer les Candidatures et Notifier la Décision
1. Connectez-vous avec votre profil en rôle `coordonnateur`.
2. Accédez à la vue de synthèse des délibérations du comité : visualisez le tableau récapitulatif des notes moyennes attribuées par les jurés.
3. Ouvrez le dossier instruit et cliquez sur **« Enregistrer la décision du jury »**.
4. Sélectionnez le verdict officiel :
   - **Accepté :** Le dossier passe à `accepte` et le projet devient `selectionne`.
   - **Refusé :** Le dossier passe à `refuse` et le projet devient `rejete`.
5. Rédigez obligatoirement le **motif synthétique de la décision** (argumentaire transmis au porteur).

### 5.2 Affecter un Mentor Dédié
1. Sur tout projet en statut `selectionne` ou `incube`, cliquez sur **« Affecter un mentor »**.
2. Sélectionnez un mentor accrédité dans la liste déroulante et validez : le mentor et le porteur reçoivent un accès partagé immédiat.

### 5.3 Valider les Fiches de la Galerie des Innovations
1. Accédez à la file d'attente de modération de la galerie (`/galerie/gestion`).
2. Examinez les fiches soumises par les porteurs en statut `en_validation`.
3. Vérifiez la qualité des descriptions et l'absence totale de données personnelles privées (emails, numéros personnels).
4. Cliquez sur **« Valider et Publier »** : la fiche devient instantanément accessible au public sur le portail et son QR code devient actif.

### 5.4 Générer et Publier les Documents Officiels (P5)
1. Rendez-vous sur le module **Documents** (`/documents`).
2. Cliquez sur **« Générer un document officiel »**.
3. Choisissez le gabarit souhaité (ex. *Convention d'incubation CIAT 2026*, *Fiche de synthèse de projet*, *Procès-verbal de sélection*).
4. Associez le document au projet concerné et saisissez les consignes complémentaires : l'IA génère les sections réglementaires conformes à la charte ISEP.
5. Relisez le brouillon généré, apportez d'éventuelles corrections manuelles (création d'une nouvelle version), puis cliquez sur **« Valider le document »**.
6. Exportez le document au format **PDF certifié** aux couleurs institutionnelles.
7. **Règle de sécurité :** Une fois validé ou publié, le document est juridiquement verrouillé et ne peut plus être modifié (`409 Conflict`).

### 5.5 Piloter l'Activité via le Tableau de Bord Décisionnel (P3)
1. Accédez au **Tableau de bord** (`/tableau-de-bord`).
2. Filtrez les données par période, cohorte d'incubation ou domaine technologique.
3. Analysez le taux de sélection, la représentativité des femmes fondatrices et la cadence de passage au prototype pour préparer les rapports de gouvernance.

---

## 6. Guide de l'Administrateur Système

L'administrateur système a la charge de la sécurité technique, du maintien opérationnel et de la configuration des référentiels transversaux.

### 6.1 Gestion des Comptes et Contrôle d'Accès
1. Accédez à l'interface d'administration Django (`/admin/`) avec vos identifiants à privilèges (`is_staff=True`).
2. Créez, mettez à jour ou désactivez les comptes utilisateurs.
3. Attribuez les rôles avec discernement selon la matrice RBAC (`porteur`, `membre_comite`, `mentor`, `coordonnateur`, `administrateur`).

### 6.2 Configuration des Grilles d'Évaluation
1. Dans la section **Incubateur > Grilles**, créez une nouvelle grille de notation si le barème officiel évolue.
2. Définissez les critères, leurs coefficients de pondération et leurs notes maximales.
3. Activez la grille : le système désactive automatiquement l'ancienne grille afin de préserver la règle d'**une seule grille active à la fois**.

### 6.3 Maintenance du RAG et Réindexation Documentaire
1. Lors du dépôt de nouveaux guides officiels ou rapports sur le portail, déclenchez la réindexation pour l'assistant IA :
   - Soit via l'endpoint sécurisé : `POST /api/assistant/indexation/` (réservé aux administrateurs).
   - Soit en ligne de commande : `python manage.py shell -c "from apps.assistant.services import indexer_documents_publics; indexer_documents_publics()"`.
2. Le service découpe les textes en passages de 200 à 300 mots et actualise l'index lexical.

### 6.4 Initialisation des Données de Démonstration (`seed_all`)
1. Pour initialiser ou réinitialiser un environnement de qualification ou de démonstration complet :
   ```bash
   python manage.py seed_all
   ```
2. Cette commande exécute séquentiellement et de manière **100 % idempotente** le peuplement de l'ensemble des modules avec des données de démonstration **strictement fictives** (64 projets, 8 domaines, 4 cohortes, 43 porteurs dont 16 femmes, 58 dossiers, 174 pièces obligatoires, 109 évaluations, 53 décisions, 49 affectations mentors, 147 objectifs, 147 jalons, 70 bilans de suivi, 49 partenariats, 50 financements, 23 fiches de galerie, 6 documents institutionnels, 28 images de démonstration générées localement avec Pillow, pour un total de 1 740 lignes enregistrées en base).
3. Vérifiez la conformité du système en lançant les contrôles qualité :
   ```bash
   python manage.py check
   python manage.py makemigrations --check
   python manage.py test apps
   ```
   Ces contrôles valident 256 tests automatisés (100 % passants) en ~30 à 40 secondes, sans aucun avertissement système ni migration en attente.
