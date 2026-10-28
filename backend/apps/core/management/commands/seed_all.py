"""Commande maîtresse de remplissage cohérent de tous les modules du CIAT.

Usage :
    python manage.py seed_all

Orchestre dans l'ordre :
1. seed_demo       (core : domaines, cohortes, utilisateurs, projets)
2. seed_portal     (portail : actualités, événements, appels, partenaires, documents publics)
3. seed_incubator  (incubateur : grille d'évaluation et critères)
4. seed_documents  (documents : types et modèles de documents officiels)
5. seed_analytics  (analytique : si présente)

Puis complète de manière cohérente et idempotente l'écosystème :
- Dossiers de candidature pour tous les projets non « idée » avec les 3 pièces obligatoires (PDF valides).
- Soumission, évaluations multicritères par le comité et les mentors, et décision motivée concordante.
- Affectation de mentors, objectifs opérationnels, jalons d'avancement (dont certains en retard),
  commentaires horodatés, et bilans de suivi à 3 et 6 mois pour les projets anciens.
- Fiches de la galerie des innovations pour les projets en prototype ou terminés (publiées, en validation, brouillons).
- Documents institutionnels générés (conventions d'incubation, fiches de projet) pré-rédigés sans appel IA.
- Respect strict de la cohérence temporelle : création -> soumission -> évaluation -> décision -> incubation/jalons.
"""
from datetime import timedelta
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management import call_command, get_commands
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import Projet, Role, User
from apps.documents.models import Document, ModeleDocument, VersionDocument
from apps.gallery.models import FicheInnovation
from apps.incubator.models import (
    AffectationMentor,
    CommentaireJalon,
    Decision,
    DecisionType,
    Dossier,
    EcheanceSuivi,
    Evaluation,
    Grille,
    Jalon,
    Note,
    Objectif,
    Piece,
    PreuveJalon,
    StatutDossier,
    StatutJalon,
    StatutObjectif,
    SuiviProjet,
    TypePiece,
)


class Command(BaseCommand):
    help = "Exécute le peuplement complet et cohérent de tous les modules du CIAT (idempotent)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== Étape 1 : Exécution des commandes de base ==="))

        # 1. seed_demo
        self.stdout.write("1/4 Lancement de seed_demo...")
        call_command("seed_demo")

        # 2. seed_portal
        self.stdout.write("2/4 Lancement de seed_portal...")
        call_command("seed_portal")

        # 3. seed_incubator
        self.stdout.write("3/4 Lancement de seed_incubator...")
        call_command("seed_incubator")

        # 4. seed_documents
        self.stdout.write("4/4 Lancement de seed_documents...")
        call_command("seed_documents")

        # 5. seed_analytics (si Alioune l'a implémentée)
        commands = get_commands()
        if "seed_analytics" in commands:
            self.stdout.write("5/5 Lancement de seed_analytics...")
            call_command("seed_analytics")
        else:
            self.stdout.write("5/5 seed_analytics non encore présente (ignorée en toute sécurité).")

        self.stdout.write(self.style.MIGRATE_HEADING("=== Étape 2 : Préparation des acteurs et de la grille ==="))

        # Comptes clés
        coordo_user = User.objects.filter(role=Role.COORDONNATEUR).first()
        if not coordo_user:
            coordo_user = User.objects.filter(email="coordo@ciat.sn").first()

        admin_user = User.objects.filter(role=Role.ADMIN).first()

        comite_user = User.objects.filter(email="comite@ciat.sn").first()
        if not comite_user:
            comite_user = User.objects.filter(role=Role.COMITE).first()

        mentor_user = User.objects.filter(email="mentor@ciat.sn").first()
        if not mentor_user:
            mentor_user = User.objects.filter(role=Role.MENTOR).first()

        # Mentor et membre comité secondaires pour enrichir la diversité des évaluations
        mentor2_user, _ = User.objects.get_or_create(
            email="mentor2@ciat.sn",
            defaults={
                "first_name": "Ousmane",
                "last_name": "Diagne",
                "role": Role.MENTOR,
                "genre": User.Genre.HOMME,
                "organisation": "FabLab Diamniadio / ISEP",
                "telephone": "+221771000201",
            },
        )
        if _:
            mentor2_user.set_password("Ciat2026!")
            mentor2_user.save()

        comite2_user, _ = User.objects.get_or_create(
            email="comite2@ciat.sn",
            defaults={
                "first_name": "Aïssatou",
                "last_name": "Ba",
                "role": Role.COMITE,
                "genre": User.Genre.FEMME,
                "organisation": "Direction Recherche & Innovation MESRI",
                "telephone": "+221771000202",
            },
        )
        if _:
            comite2_user.set_password("Ciat2026!")
            comite2_user.save()

        # Grille active et critères
        grille = Grille.objects.filter(active=True).first()
        if not grille:
            grille, _ = Grille.objects.get_or_create(
                nom="Grille standard de sélection CIAT",
                defaults={"active": True},
            )
        criteres = list(grille.criteres.all().order_by("ordre"))

        self.stdout.write(self.style.MIGRATE_HEADING("=== Étape 3 : Dossiers de candidature et pièces obligatoires ==="))

        now = timezone.now()
        projets_non_idee = Projet.objects.exclude(statut=Projet.Statut.IDEE).order_by("id")

        nb_dossiers_crees = 0
        nb_pieces_crees = 0
        nb_evaluations_crees = 0
        nb_decisions_crees = 0

        # Répartition pour les 5 projets en statut 'depose'
        # 3 seront en 'en_evaluation' (avec 1 évaluation en cours), 2 en 'soumis'
        depose_projets = list(Projet.objects.filter(statut=Projet.Statut.DEPOSE).order_by("id"))
        depose_en_evaluation_ids = {p.id for p in depose_projets[:3]}

        for projet in projets_non_idee:
            date_projet = projet.cree_le or (now - timedelta(days=120))
            date_soumis = date_projet + timedelta(days=5)

            # Détermination du statut cible du dossier
            if projet.statut in (
                Projet.Statut.SELECTIONNE,
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ):
                statut_dossier = StatutDossier.ACCEPTE
            elif projet.statut == Projet.Statut.REJETE:
                statut_dossier = StatutDossier.REFUSE
            else:  # Projet.Statut.DEPOSE
                if projet.id in depose_en_evaluation_ids:
                    statut_dossier = StatutDossier.EN_EVALUATION
                else:
                    statut_dossier = StatutDossier.SOUMIS

            dossier, created_dos = Dossier.objects.get_or_create(
                projet=projet,
                defaults={
                    "statut": statut_dossier,
                    "soumis_le": date_soumis,
                },
            )
            if created_dos:
                nb_dossiers_crees += 1

            # Garantir les dates et statut même en cas d'existence préalable
            Dossier.objects.filter(id=dossier.id).update(
                statut=statut_dossier,
                soumis_le=date_soumis,
                cree_le=date_projet + timedelta(days=2),
                modifie_le=date_soumis + timedelta(days=10),
            )

            # 3 pièces obligatoires
            pieces_types = [
                (TypePiece.FICHE_PROJET, "Fiche descriptive officielle du projet"),
                (TypePiece.PRESENTATION_EQUIPE, "Composition et compétences de l'équipe"),
                (TypePiece.BUDGET_PREVISIONNEL, "Budget prévisionnel et besoins de prototypage"),
            ]
            for p_type, p_label in pieces_types:
                piece = Piece.objects.filter(dossier=dossier, type=p_type).first()
                if not piece:
                    pdf_content = (
                        b"%PDF-1.4\n"
                        b"% CIAT Piece Officielle - " + p_type.encode() + b"\n"
                        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
                        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
                        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj\n"
                        b"xref\n0 4\n0000000000 65535 f \n0000000050 00000 n \n0000000100 00000 n \n0000000160 00000 n \n"
                        b"trailer << /Size 4 /Root 1 0 R >>\nstartxref\n250\n%%EOF\n"
                    )
                    content_file = ContentFile(pdf_content, name=f"{p_type}_{projet.id}.pdf")
                    piece = Piece.objects.create(
                        dossier=dossier,
                        type=p_type,
                        nom=f"{p_label}.pdf",
                        fichier=content_file,
                    )
                    Piece.objects.filter(id=piece.id).update(depose_le=date_soumis)
                    nb_pieces_crees += 1

            # Évaluations et notes
            # Les dossiers acceptés et refusés ont 2 évaluations complètes (comité + mentor)
            # Les 3 dossiers depose en_evaluation ont 1 évaluation (comité)
            evaluer = False
            evaluators = []
            if statut_dossier in (StatutDossier.ACCEPTE, StatutDossier.REFUSE):
                evaluer = True
                evaluators = [comite_user, mentor_user if projet.id % 2 == 0 else mentor2_user]
            elif statut_dossier == StatutDossier.EN_EVALUATION:
                evaluer = True
                evaluators = [comite_user]

            if evaluer and criteres:
                for idx_ev, evaluateur in enumerate(evaluators):
                    if not evaluateur:
                        continue
                    eval_obj, created_eval = Evaluation.objects.get_or_create(
                        dossier=dossier,
                        evaluateur=evaluateur,
                        defaults={
                            "avis": (
                                "Dossier très prometteur avec un fort ancrage dans les priorités du CIAT. "
                                "Faisabilité technique confirmée."
                                if statut_dossier == StatutDossier.ACCEPTE
                                else (
                                    "Maturité technologique insuffisante et plan d'affaires trop imprécis."
                                    if statut_dossier == StatutDossier.REFUSE
                                    else "Dossier en cours d'instruction approfondie par le comité."
                                )
                            ),
                        },
                    )
                    if created_eval:
                        nb_evaluations_crees += 1

                    date_eval = date_soumis + timedelta(days=6 + idx_ev * 2)
                    Evaluation.objects.filter(id=eval_obj.id).update(cree_le=date_eval, modifie_le=date_eval)

                    # Notes sur les 5 critères
                    # Base de notes adaptées au statut
                    if statut_dossier == StatutDossier.ACCEPTE:
                        notes_base = [16.5, 17.0, 15.5, 18.0, 16.0]
                    elif statut_dossier == StatutDossier.REFUSE:
                        notes_base = [8.0, 7.5, 6.5, 8.5, 7.0]
                    else:
                        notes_base = [13.0, 14.0, 12.5, 13.5, 12.0]

                    for c_idx, crit in enumerate(criteres):
                        valeur = notes_base[c_idx % len(notes_base)]
                        # Petite variation selon l'évaluateur et le projet
                        ajustement = ((projet.id + idx_ev + c_idx) % 5) * 0.5 - 1.0
                        val_finale = max(5.0, min(19.5, round(valeur + ajustement, 1)))
                        Note.objects.get_or_create(
                            evaluation=eval_obj,
                            critere=crit,
                            defaults={"note": Decimal(str(val_finale))},
                        )

            # Décision motivée
            if statut_dossier == StatutDossier.ACCEPTE:
                dec, created_dec = Decision.objects.get_or_create(
                    dossier=dossier,
                    defaults={
                        "decision": DecisionType.ACCEPTE,
                        "motif": (
                            "Dossier sélectionné par le comité. Proposition technologique de haute qualité, "
                            "adéquation prouvée avec les ateliers du CIAT et impact socio-économique tangible."
                        ),
                        "decide_par": coordo_user,
                    },
                )
                if created_dec:
                    nb_decisions_crees += 1
                Decision.objects.filter(id=dec.id).update(cree_le=date_soumis + timedelta(days=12))

            elif statut_dossier == StatutDossier.REFUSE:
                dec, created_dec = Decision.objects.get_or_create(
                    dossier=dossier,
                    defaults={
                        "decision": DecisionType.REFUSE,
                        "motif": (
                            "Dossier non retenu pour la présente session d'incubation. "
                            "Les critères de maturité technologique et de rentabilité économique ne sont pas réunis."
                        ),
                        "decide_par": coordo_user,
                    },
                )
                if created_dec:
                    nb_decisions_crees += 1
                Decision.objects.filter(id=dec.id).update(cree_le=date_soumis + timedelta(days=12))

        self.stdout.write(
            f"Dossiers traités : {projets_non_idee.count()} ({nb_dossiers_crees} créés, "
            f"{nb_pieces_crees} pièces, {nb_evaluations_crees} évaluations, {nb_decisions_crees} décisions)."
        )

        self.stdout.write(self.style.MIGRATE_HEADING("=== Étape 4 : Mentors, Objectifs, Jalons, Suivis ==="))

        projets_selectionnes_ou_plus = Projet.objects.filter(
            statut__in=[
                Projet.Statut.SELECTIONNE,
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ]
        ).order_by("id")

        nb_mentors_affectes = 0
        nb_objectifs_crees = 0
        nb_jalons_crees = 0
        nb_suivis_crees = 0

        for p_idx, projet in enumerate(projets_selectionnes_ou_plus):
            date_projet = projet.cree_le or (now - timedelta(days=120))
            date_decision = date_projet + timedelta(days=17)
            mentor_assigne = mentor_user if p_idx % 2 == 0 else mentor2_user

            # 1. Affectation de mentor
            aff, created_aff = AffectationMentor.objects.get_or_create(
                projet=projet,
                defaults={
                    "mentor": mentor_assigne,
                    "affecte_par": coordo_user,
                },
            )
            if created_aff:
                nb_mentors_affectes += 1
            AffectationMentor.objects.filter(id=aff.id).update(affecte_le=date_decision + timedelta(days=2))

            # 2. Objectifs opérationnels (2 à 3 par projet)
            objectifs_def = [
                ("Validation du cahier des charges et modélisation CAO", 30),
                ("Fabrication des sous-ensembles et usinage FabLab", 90),
                ("Campagne d'essais terrain et conformité aux normes", 150),
            ]
            for o_idx, (libelle_obj, offset_jours) in enumerate(objectifs_def):
                # Statut de l'objectif adapté au statut du projet
                if projet.statut == Projet.Statut.TERMINE:
                    statut_obj = StatutObjectif.ATTEINT
                elif projet.statut == Projet.Statut.PROTOTYPE:
                    statut_obj = StatutObjectif.ATTEINT if o_idx < 2 else StatutObjectif.EN_COURS
                elif projet.statut == Projet.Statut.INCUBE:
                    statut_obj = (
                        StatutObjectif.ATTEINT
                        if o_idx == 0
                        else (StatutObjectif.EN_COURS if o_idx == 1 else StatutObjectif.A_FAIRE)
                    )
                else:  # SELECTIONNE
                    statut_obj = StatutObjectif.EN_COURS if o_idx == 0 else StatutObjectif.A_FAIRE

                obj, created_obj = Objectif.objects.get_or_create(
                    projet=projet,
                    libelle=libelle_obj,
                    defaults={
                        "echeance": (date_decision + timedelta(days=offset_jours)).date(),
                        "statut": statut_obj,
                        "cree_par": mentor_assigne,
                    },
                )
                if created_obj:
                    nb_objectifs_crees += 1
                Objectif.objects.filter(id=obj.id).update(
                    cree_le=date_decision + timedelta(days=4),
                    modifie_le=date_decision + timedelta(days=10),
                )

            # 3. Jalons (dont certains en retard)
            # Jalon 1 : Revue préliminaire (FAIT pour incubé, prototype, terminé ; EN COURS avec échéance future pour sélectionné)
            if projet.statut == Projet.Statut.SELECTIONNE:
                j1_statut = StatutJalon.EN_COURS
                j1_date = (now + timedelta(days=20)).date()
            else:
                j1_statut = StatutJalon.FAIT
                j1_date = (date_decision + timedelta(days=40)).date()

            j1, cr1 = Jalon.objects.get_or_create(
                projet=projet,
                titre="Revue de conception préliminaire (PDR)",
                defaults={
                    "echeance": j1_date,
                    "statut": j1_statut,
                    "cree_par": mentor_assigne,
                },
            )
            if cr1:
                nb_jalons_crees += 1
            else:
                Jalon.objects.filter(id=j1.id).update(echeance=j1_date, statut=j1_statut)
            Jalon.objects.filter(id=j1.id).update(cree_le=date_decision + timedelta(days=5))

            if j1.statut == StatutJalon.FAIT:
                comm1, _ = CommentaireJalon.objects.get_or_create(
                    jalon=j1,
                    auteur=mentor_assigne,
                    defaults={"texte": "Revue préliminaire validée sans réserve. L'équipe passe en atelier d'usinage."},
                )
                if _:
                    CommentaireJalon.objects.filter(id=comm1.id).update(cree_le=date_decision + timedelta(days=41))

                preuve1 = PreuveJalon.objects.filter(jalon=j1, nom="pv_revue_pdr.pdf").first()
                if not preuve1:
                    c1 = ContentFile(b"%PDF-1.4\n% Preuve Jalon 1 CIAT\n", name=f"preuve1_{j1.id}.pdf")
                    preuve1 = PreuveJalon.objects.create(
                        jalon=j1,
                        nom="pv_revue_pdr.pdf",
                        depose_par=projet.porteur,
                        fichier=c1,
                    )
                    PreuveJalon.objects.filter(id=preuve1.id).update(depose_le=date_decision + timedelta(days=40))

            # Jalon 2 : Banc d'essai et validation des performances
            # Pour introduire des jalons en retard crédibles :
            # Si le projet est incube ou prototype et p_idx % 3 == 0 -> En retard !
            is_retard = (projet.statut in (Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE)) and (p_idx % 3 == 0)

            if projet.statut == Projet.Statut.TERMINE:
                j2_statut = StatutJalon.FAIT
                j2_date = (date_decision + timedelta(days=100)).date()
            elif is_retard:
                j2_statut = StatutJalon.EN_COURS
                # Échéance passée pour déclencher la propriété en_retard
                j2_date = (now - timedelta(days=15)).date()
            elif projet.statut in (Projet.Statut.PROTOTYPE, Projet.Statut.INCUBE):
                j2_statut = StatutJalon.EN_COURS
                j2_date = (now + timedelta(days=25)).date()
            else:  # SELECTIONNE
                j2_statut = StatutJalon.A_FAIRE
                j2_date = (now + timedelta(days=60)).date()

            j2, cr2 = Jalon.objects.get_or_create(
                projet=projet,
                titre="Banc d'essai et validation des performances",
                defaults={
                    "echeance": j2_date,
                    "statut": j2_statut,
                    "cree_par": mentor_assigne,
                },
            )
            if cr2:
                nb_jalons_crees += 1
            else:
                Jalon.objects.filter(id=j2.id).update(echeance=j2_date, statut=j2_statut)
            Jalon.objects.filter(id=j2.id).update(cree_le=date_decision + timedelta(days=8))

            if is_retard:
                comm2, _ = CommentaireJalon.objects.get_or_create(
                    jalon=j2,
                    auteur=mentor_assigne,
                    defaults={
                        "texte": (
                            "Alerte retard mentor : rupture temporaire sur l'approvisionnement des capteurs. "
                            "Le banc d'essai est décalé de deux semaines en accord avec le FabLab."
                        )
                    },
                )
            elif j2_statut == StatutJalon.FAIT:
                comm2, _ = CommentaireJalon.objects.get_or_create(
                    jalon=j2,
                    auteur=mentor_assigne,
                    defaults={"texte": "Banc d'essai validé avec succès. Les relevés de télémétrie sont conformes."},
                )

            # Jalon 3 : Démonstrateur final et dossier de transfert
            if projet.statut == Projet.Statut.TERMINE:
                j3_statut = StatutJalon.FAIT
                j3_date = (date_decision + timedelta(days=170)).date()
            elif projet.statut == Projet.Statut.PROTOTYPE:
                j3_statut = StatutJalon.EN_COURS
                j3_date = (now + timedelta(days=45)).date()
            else:
                j3_statut = StatutJalon.A_FAIRE
                j3_date = (now + timedelta(days=90)).date()

            j3, cr3 = Jalon.objects.get_or_create(
                projet=projet,
                titre="Démonstrateur final et dossier de transfert",
                defaults={
                    "echeance": j3_date,
                    "statut": j3_statut,
                    "cree_par": mentor_assigne,
                },
            )
            if cr3:
                nb_jalons_crees += 1
            else:
                Jalon.objects.filter(id=j3.id).update(echeance=j3_date, statut=j3_statut)
            Jalon.objects.filter(id=j3.id).update(cree_le=date_decision + timedelta(days=10))

            # Sécurité : tout jalon en retard a un commentaire d'alerte
            for j_cand in (j1, j2, j3):
                if j_cand.en_retard and not j_cand.commentaires.exists():
                    CommentaireJalon.objects.create(
                        jalon=j_cand,
                        auteur=mentor_assigne,
                        texte="Alerte retard mentor : jalon non finalisé à l'échéance convenue. Point de suivi requis.",
                    )

            # 4. Bilans périodiques (3 mois et 6 mois) pour les projets anciens
            # Concerne les projets en cohorte 2024 / 2025 ou de statut PROTOTYPE / TERMINE
            cohorte_annee = projet.cohorte.annee if projet.cohorte else 2026
            est_ancien = cohorte_annee in (2024, 2025) or projet.statut in (
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            )

            if est_ancien:
                # Bilan 3 mois
                s3, cr_s3 = SuiviProjet.objects.get_or_create(
                    projet=projet,
                    echeance=EcheanceSuivi.TROIS_MOIS,
                    defaults={
                        "bilan": (
                            f"Bilan d'étape à 3 mois ({projet.titre}) : Les jalons de conception et de maquettage "
                            "ont été franchis avec brio. La régularité de l'équipe aux ateliers ISEP est exemplaire."
                        ),
                        "indicateurs": {
                            "taux_avancement": 55,
                            "heures_atelier_fablab": 68,
                            "depenses_engagees_fcfa": 1400000,
                            "jalons_valides": 1,
                            "assiduite_ateliers": "100%",
                        },
                        "redige_par": mentor_assigne,
                    },
                )
                if cr_s3:
                    nb_suivis_crees += 1
                SuiviProjet.objects.filter(id=s3.id).update(cree_le=date_decision + timedelta(days=92))

                # Bilan 6 mois (projets de 2024 ou de statut terminé)
                if cohorte_annee == 2024 or projet.statut == Projet.Statut.TERMINE:
                    s6, cr_s6 = SuiviProjet.objects.get_or_create(
                        projet=projet,
                        echeance=EcheanceSuivi.SIX_MOIS,
                        defaults={
                            "bilan": (
                                f"Bilan final d'incubation à 6 mois ({projet.titre}) : Prototype validé in situ. "
                                "Le dossier technologique est prêt pour l'exposition en galerie et le transfert vers l'industrie."
                            ),
                            "indicateurs": {
                                "taux_avancement": 100,
                                "heures_atelier_fablab": 154,
                                "depenses_engagees_fcfa": 3150000,
                                "jalons_valides": 3,
                                "trl_final": 7,
                                "partenaires_interesses": 2,
                            },
                            "redige_par": mentor_assigne,
                        },
                    )
                    if cr_s6:
                        nb_suivis_crees += 1
                    SuiviProjet.objects.filter(id=s6.id).update(cree_le=date_decision + timedelta(days=182))

        self.stdout.write(
            f"Accompagnement incubateur : {nb_mentors_affectes} mentors affectés, {nb_objectifs_crees} objectifs, "
            f"{nb_jalons_crees} jalons, {nb_suivis_crees} bilans de suivi."
        )

        self.stdout.write(self.style.MIGRATE_HEADING("=== Étape 5 : Galerie des innovations ==="))

        # Fiches de galerie pour les projets en prototype ou terminés
        projets_galerie = list(
            Projet.objects.filter(
                statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
            ).order_by("id")
        )

        nb_fiches_crees = 0
        proto_idx = 0
        for g_idx, projet in enumerate(projets_galerie):
            # Tous les 'termine' sont publiés
            # Pour les 'prototype' : 2 brouillons, 2 en validation, le reste publié
            if projet.statut == Projet.Statut.TERMINE:
                statut_fiche = FicheInnovation.Statut.PUBLIE
                vues = 140 + g_idx * 18
            else:
                proto_idx += 1
                if proto_idx in (1, 2):
                    statut_fiche = FicheInnovation.Statut.BROUILLON
                    vues = 0
                elif proto_idx in (3, 4):
                    statut_fiche = FicheInnovation.Statut.EN_VALIDATION
                    vues = 14
                else:
                    statut_fiche = FicheInnovation.Statut.PUBLIE
                    vues = 65 + g_idx * 12

            # Ne jamais exposer d'email ni téléphone privé dans equipe
            equipe_anonymisee = (
                f"Équipe {projet.porteur.get_full_name()} — Spécialistes en {projet.domaine.nom}. "
                f"Appui technique assuré par les mentors du CIAT Diamniadio."
            )

            slug_fiche = slugify(projet.titre) or f"fiche_{projet.id}"
            medias = [
                {
                    "type": "photo",
                    "url": f"/media/galerie/fiche_{slug_fiche}.jpg",
                    "legende": f"Démonstration du prototype {projet.titre} dans les ateliers du CIAT",
                },
                {
                    "type": "demo",
                    "url": "https://ciat.sn/galerie/demonstrateurs",
                    "legende": "Interface de contrôle et banc d'essai",
                },
            ]

            fiche, cr_fiche = FicheInnovation.objects.get_or_create(
                projet=projet,
                defaults={
                    "titre": projet.titre,
                    "probleme": projet.probleme or "Problématique technique et opérationnelle ciblée au Sénégal.",
                    "solution": projet.solution or "Solution technologique innovante développée au FabLab CIAT.",
                    "equipe": equipe_anonymisee,
                    "avancement": (
                        "Incubation terminée — Prototype certifié pour transfert"
                        if projet.statut == Projet.Statut.TERMINE
                        else "Prototype fonctionnel validé en laboratoire"
                    ),
                    "medias": medias,
                    "statut": statut_fiche,
                    "vues": vues,
                },
            )
            if cr_fiche:
                nb_fiches_crees += 1
            else:
                # S'assurer de la cohérence des vues et statut
                FicheInnovation.objects.filter(id=fiche.id).update(
                    statut=statut_fiche,
                    vues=vues,
                    equipe=equipe_anonymisee,
                )

        total_fiches = FicheInnovation.objects.count()
        publiees = FicheInnovation.objects.filter(statut=FicheInnovation.Statut.PUBLIE).count()
        en_val = FicheInnovation.objects.filter(statut=FicheInnovation.Statut.EN_VALIDATION).count()
        brouillons = FicheInnovation.objects.filter(statut=FicheInnovation.Statut.BROUILLON).count()
        self.stdout.write(
            f"Galerie : {total_fiches} fiches ({publiees} publiées, {en_val} en validation, "
            f"{brouillons} brouillons) — {nb_fiches_crees} créées lors de ce passage."
        )

        self.stdout.write(self.style.MIGRATE_HEADING("=== Étape 6 : Documents institutionnels générés ==="))

        modele_conv = ModeleDocument.objects.filter(type__code="convention").first()
        modele_fiche = ModeleDocument.objects.filter(type__code="fiche_projet").first()

        nb_docs_crees = 0

        # Rattacher quelques documents formels pré-rédigés (sans appel IA) à des projets sélectionnés
        projets_docs = list(projets_selectionnes_ou_plus[:6])

        for d_idx, projet in enumerate(projets_docs):
            # Alterner convention et fiche technique
            modele = modele_conv if d_idx % 2 == 0 else modele_fiche
            if not modele:
                continue

            titre_doc = (
                f"Convention d'incubation — {projet.titre}"
                if modele.type.code == "convention"
                else f"Fiche technique d'évaluation — {projet.titre}"
            )
            sujet_doc = (
                f"Convention officielle fixant le cadre d'incubation et les obligations bilatérales pour {projet.titre}."
                if modele.type.code == "convention"
                else f"Synthèse technique d'instruction et feuille de route technologique pour {projet.titre}."
            )
            statut_doc = Document.Statut.PUBLIE if d_idx % 2 == 0 else Document.Statut.VALIDE

            doc, cr_doc = Document.objects.get_or_create(
                projet=projet,
                modele=modele,
                defaults={
                    "titre": titre_doc,
                    "sujet": sujet_doc,
                    "auteur": coordo_user or admin_user,
                    "statut": statut_doc,
                },
            )
            if cr_doc:
                nb_docs_crees += 1

            # Version 1 pré-rédigée pour respecter scrupuleusement la charte et le gabarit
            sections_remplies = []
            for sec in modele.sections:
                code_sec = sec.get("code", "section")
                titre_sec = sec.get("titre", "Section")

                if "preambule" in code_sec or "presentation" in code_sec:
                    contenu_sec = (
                        f"Le présent document est établi entre le CIAT (ISEP Diamniadio) et {projet.porteur.get_full_name()} "
                        f"concernant le projet « {projet.titre} » inscrit dans le domaine {projet.domaine.nom}."
                    )
                elif "obligations" in code_sec or "engagement" in code_sec:
                    contenu_sec = (
                        "Le CIAT met à disposition ses infrastructures FabLab et son réseau d'experts. "
                        "Le porteur s'engage à l'assiduité technique et au respect scrupuleux des normes de sécurité HSE."
                    )
                elif "solution" in code_sec or "technique" in code_sec:
                    contenu_sec = projet.solution or "Développement d'un équipement technologique adapté aux besoins sahéliens."
                elif "probleme" in code_sec:
                    contenu_sec = projet.probleme or "Réponse ciblée aux contraintes de productivité et de maintenance locales."
                else:
                    contenu_sec = (
                        f"Dispositions validées par la coordination du CIAT. "
                        f"Conforme au référentiel d'incubation de la cohorte {projet.cohorte.nom if projet.cohorte else '2026'}."
                    )

                sections_remplies.append(
                    {
                        "code": code_sec,
                        "titre": titre_sec,
                        "contenu": contenu_sec,
                    }
                )

            VersionDocument.objects.get_or_create(
                document=doc,
                numero=1,
                defaults={
                    "sections": sections_remplies,
                    "auteur": coordo_user or admin_user,
                },
            )

        total_docs = Document.objects.count()
        self.stdout.write(f"Documents officiels : {total_docs} en base ({nb_docs_crees} créés).")

        self.stdout.write(self.style.MIGRATE_HEADING("=== Étape 7 : Images de démonstration locales (Pillow) ==="))
        from apps.core.demo_images import generer_toutes_images_demo
        generer_toutes_images_demo(stdout=self.stdout)

        self.stdout.write(self.style.SUCCESS("\n[SUCCÈS] Commande seed_all terminée : cohérence complète et idempotente établie sur tous les modules."))
