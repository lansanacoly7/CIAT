"""Commande Django : Contrôle de la qualité des données du CIAT (Phase 3 - T1).

Cette commande audite l'intégrité globale de la base de données de la plateforme CIAT :
1. Valeurs manquantes sur champs clés (résumé, domaine, cohorte, genre, porteur)
2. Doublons (titres de projets, emails d'utilisateurs, fiches en double)
3. Incohérences temporelles et chronologie métier (décision avant dépôt, jalon ou financement avant création)
4. Statuts incompatibles entre modules (projet en idée avec dossier/financement, fiche publiée non prototype)
5. Valeurs hors plage et bornes numériques (montants, notes sur critères, scores)

Commande purement en lecture seule (ne modifie aucune donnée).
Supporte la sortie texte formattée et l'option `--json`.
"""
import json
import sys
from datetime import date, datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db.models import Count, Q

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.incubator.models import (
    AffectationMentor,
    Critere,
    Decision,
    Dossier,
    Evaluation,
    Jalon,
    Note,
    StatutDossier,
)
from apps.gallery.models import FicheInnovation
from apps.analytics.models import Financement, Partenariat, StatutFinancement, StatutPartenariat


def executer_audit_qualite():
    """Exécute l'ensemble des contrôles de qualité des données et renvoie un dictionnaire structuré."""
    anomalies = []
    stats = {}

    # ------------------------------------------------------------------
    # 0. Recensement des volumes analysés
    # ------------------------------------------------------------------
    total_projets = Projet.objects.count()
    total_users = User.objects.count()
    total_cohortes = Cohorte.objects.count()
    total_dossiers = Dossier.objects.count()
    total_decisions = Decision.objects.count()
    total_jalons = Jalon.objects.count()
    total_fiches = FicheInnovation.objects.count()
    total_financements = Financement.objects.count()
    total_partenariats = Partenariat.objects.count()
    total_evaluations = Evaluation.objects.count()
    total_notes = Note.objects.count()

    stats = {
        "projets": total_projets,
        "utilisateurs": total_users,
        "cohortes": total_cohortes,
        "dossiers": total_dossiers,
        "decisions": total_decisions,
        "jalons": total_jalons,
        "fiches_innovation": total_fiches,
        "financements": total_financements,
        "partenariats": total_partenariats,
        "evaluations": total_evaluations,
        "notes": total_notes,
    }

    # ------------------------------------------------------------------
    # 1. VALEURS MANQUANTES SUR LES CHAMPS CLÉS
    # ------------------------------------------------------------------
    # Projets sans titre ou titre vide
    for p in Projet.objects.filter(Q(titre__isnull=True) | Q(titre__exact="")):
        anomalies.append({
            "code": "PROJET_TITRE_MANQUANT",
            "categorie": "valeurs_manquantes",
            "severite": "CRITIQUE",
            "objet": f"Projet #{p.id}",
            "message": "Le titre du projet est manquant ou vide.",
        })

    # Projets sans résumé ou résumé vide
    for p in Projet.objects.all():
        if not p.resume or not p.resume.strip():
            anomalies.append({
                "code": "PROJET_RESUME_MANQUANT",
                "categorie": "valeurs_manquantes",
                "severite": "CRITIQUE",
                "objet": f"Projet #{p.id} ({p.titre})",
                "message": "Le résumé du projet est manquant ou ne contient que des espaces.",
            })

    # Projets sans domaine
    for p in Projet.objects.filter(domaine__isnull=True):
        anomalies.append({
            "code": "PROJET_DOMAINE_MANQUANT",
            "categorie": "valeurs_manquantes",
            "severite": "CRITIQUE",
            "objet": f"Projet #{p.id} ({p.titre})",
            "message": "Le domaine d'intervention n'est pas renseigné.",
        })

    # Projets sans cohorte
    for p in Projet.objects.filter(cohorte__isnull=True):
        anomalies.append({
            "code": "PROJET_COHORTE_MANQUANTE",
            "categorie": "valeurs_manquantes",
            "severite": "CRITIQUE",
            "objet": f"Projet #{p.id} ({p.titre})",
            "message": "La cohorte de rattachement n'est pas renseignée.",
        })

    # Projets sans porteur
    for p in Projet.objects.filter(porteur__isnull=True):
        anomalies.append({
            "code": "PROJET_PORTEUR_MANQUANT",
            "categorie": "valeurs_manquantes",
            "severite": "CRITIQUE",
            "objet": f"Projet #{p.id} ({p.titre})",
            "message": "Le porteur du projet est manquant.",
        })

    # Utilisateurs porteurs sans genre
    for u in User.objects.filter(role=Role.PORTEUR):
        if not u.genre or u.genre not in ("H", "F", "A"):
            anomalies.append({
                "code": "USER_GENRE_MANQUANT",
                "categorie": "valeurs_manquantes",
                "severite": "AVERTISSEMENT",
                "objet": f"Utilisateur #{u.id} ({u.email})",
                "message": f"Le genre du porteur n'est pas valide ou absent : '{u.genre}'.",
            })

    # Dossiers orphelins sans projet
    for d in Dossier.objects.filter(projet__isnull=True):
        anomalies.append({
            "code": "DOSSIER_SANS_PROJET",
            "categorie": "valeurs_manquantes",
            "severite": "CRITIQUE",
            "objet": f"Dossier #{d.id}",
            "message": "Le dossier de candidature n'est relié à aucun projet.",
        })

    # ------------------------------------------------------------------
    # 2. DOUBLONS & UNICITÉ
    # ------------------------------------------------------------------
    # Projets de même titre (normalisé insensible à la casse et espaces superflus)
    titres_vus = {}
    for p in Projet.objects.all():
        titre_norm = " ".join(p.titre.strip().lower().split()) if p.titre else ""
        if titre_norm:
            titres_vus.setdefault(titre_norm, []).append(p)

    for titre_norm, projets in titres_vus.items():
        if len(projets) > 1:
            ids_str = ", ".join(f"#{pr.id}" for pr in projets)
            anomalies.append({
                "code": "PROJET_TITRE_DOUBLON",
                "categorie": "doublons",
                "severite": "CRITIQUE",
                "objet": f"Projets [{ids_str}]",
                "message": f"Titre de projet en doublon détecté : '{projets[0].titre}'.",
            })

    # Utilisateurs de même email normalisé
    emails_vus = {}
    for u in User.objects.all():
        email_norm = u.email.strip().lower() if u.email else ""
        if email_norm:
            emails_vus.setdefault(email_norm, []).append(u)

    for email_norm, users in emails_vus.items():
        if len(users) > 1:
            ids_str = ", ".join(f"#{usr.id}" for usr in users)
            anomalies.append({
                "code": "USER_EMAIL_DOUBLON",
                "categorie": "doublons",
                "severite": "CRITIQUE",
                "objet": f"Utilisateurs [{ids_str}]",
                "message": f"Adresse email en doublon détectée : '{email_norm}'.",
            })

    # Fiches de galerie en double pour un même projet
    fiches_par_projet = {}
    for f in FicheInnovation.objects.all():
        if f.projet_id:
            fiches_par_projet.setdefault(f.projet_id, []).append(f)

    for pid, fiches in fiches_par_projet.items():
        if len(fiches) > 1:
            ids_str = ", ".join(f"#{fic.id}" for fic in fiches)
            anomalies.append({
                "code": "FICHE_PROJET_DOUBLON",
                "categorie": "doublons",
                "severite": "AVERTISSEMENT",
                "objet": f"Projet #{pid} (Fiches [{ids_str}])",
                "message": "Plusieurs fiches de galerie sont rattachées au même projet.",
            })

    # ------------------------------------------------------------------
    # 3. INCOHÉRENCES TEMPORELLES & CHRONOLOGIE MÉTIER
    # ------------------------------------------------------------------
    # Cohorte : date_fin antérieure ou égale à date_debut
    for c in Cohorte.objects.all():
        if c.date_debut and c.date_fin and c.date_fin <= c.date_debut:
            anomalies.append({
                "code": "COHORTE_DATES_INVERSEES",
                "categorie": "incoherences_temporelles",
                "severite": "CRITIQUE",
                "objet": f"Cohorte #{c.id} ({c.nom})",
                "message": f"La date de fin ({c.date_fin}) est antérieure ou égale au début ({c.date_debut}).",
            })

    # Décision avant la date de soumission du dossier
    for dec in Decision.objects.select_related("dossier").all():
        if dec.dossier and dec.dossier.soumis_le and dec.cree_le:
            if dec.cree_le < dec.dossier.soumis_le:
                anomalies.append({
                    "code": "DECISION_AVANT_DEPOT",
                    "categorie": "incoherences_temporelles",
                    "severite": "CRITIQUE",
                    "objet": f"Décision #{dec.id} (Dossier #{dec.dossier_id})",
                    "message": f"La décision a été enregistrée le {dec.cree_le.strftime('%Y-%m-%d')} avant le dépôt le {dec.dossier.soumis_le.strftime('%Y-%m-%d')}.",
                })

    # Jalon avec échéance antérieure à la date de création du projet
    for j in Jalon.objects.select_related("projet").all():
        if j.projet and j.echeance and j.projet.cree_le:
            date_projet = j.projet.cree_le.date()
            if j.echeance < date_projet:
                anomalies.append({
                    "code": "JALON_AVANT_PROJET",
                    "categorie": "incoherences_temporelles",
                    "severite": "CRITIQUE",
                    "objet": f"Jalon #{j.id} '{j.titre}' (Projet #{j.projet_id})",
                    "message": f"Échéance du jalon ({j.echeance}) antérieure à la création du projet ({date_projet}).",
                })

    # Financement avec date antérieure à la création du projet
    for fin in Financement.objects.select_related("projet").all():
        if fin.projet and fin.date and fin.projet.cree_le:
            date_projet = fin.projet.cree_le.date()
            if fin.date < date_projet:
                anomalies.append({
                    "code": "FINANCEMENT_AVANT_PROJET",
                    "categorie": "incoherences_temporelles",
                    "severite": "CRITIQUE",
                    "objet": f"Financement #{fin.id} (Projet #{fin.projet_id})",
                    "message": f"Date de financement ({fin.date}) antérieure à la création du projet ({date_projet}).",
                })

    # Partenariat avec date_debut antérieure à la création du projet
    for part in Partenariat.objects.select_related("projet").all():
        if part.projet and part.date_debut and part.projet.cree_le:
            date_projet = part.projet.cree_le.date()
            if part.date_debut < date_projet:
                anomalies.append({
                    "code": "PARTENARIAT_AVANT_PROJET",
                    "categorie": "incoherences_temporelles",
                    "severite": "CRITIQUE",
                    "objet": f"Partenariat #{part.id} (Projet #{part.projet_id})",
                    "message": f"Date de partenariat ({part.date_debut}) antérieure à la création du projet ({date_projet}).",
                })

    # ------------------------------------------------------------------
    # 4. STATUTS INCOMPATIBLES ENTRE MODULES
    # ------------------------------------------------------------------
    # Projet au statut 'IDEE' avec un dossier soumis, en étude ou accepté
    for d in Dossier.objects.select_related("projet").all():
        if d.projet and d.projet.statut == Projet.Statut.IDEE:
            if d.statut in (StatutDossier.SOUMIS, StatutDossier.EN_EVALUATION, StatutDossier.ACCEPTE):
                anomalies.append({
                    "code": "STATUT_IDEE_AVEC_DOSSIER",
                    "categorie": "statuts_incompatibles",
                    "severite": "CRITIQUE",
                    "objet": f"Projet #{d.projet_id} '{d.projet.titre}'",
                    "message": f"Le projet est au stade 'idée' mais possède un dossier d'incubation actif au statut '{d.get_statut_display()}'.",
                })

    # Projet au statut 'IDEE' ou 'REJETE' avec des financements
    for fin in Financement.objects.select_related("projet").all():
        if fin.projet and fin.projet.statut in (Projet.Statut.IDEE, Projet.Statut.REJETE):
            if fin.statut in (StatutFinancement.ACCORDE, StatutFinancement.DECAISSE):
                anomalies.append({
                    "code": "STATUT_REJETE_AVEC_FINANCEMENT",
                    "categorie": "statuts_incompatibles",
                    "severite": "CRITIQUE",
                    "objet": f"Projet #{fin.projet_id} ({fin.projet.get_statut_display()})",
                    "message": f"Un projet {fin.projet.get_statut_display()} bénéficie d'un financement {fin.get_statut_display()} ({fin.montant} FCFA).",
                })

    # Projet au statut 'IDEE' ou 'REJETE' avec des partenariats actifs
    for part in Partenariat.objects.select_related("projet").all():
        if part.projet and part.projet.statut in (Projet.Statut.IDEE, Projet.Statut.REJETE):
            if part.statut in (StatutPartenariat.ACTIF, StatutPartenariat.SIGNE):
                anomalies.append({
                    "code": "STATUT_REJETE_AVEC_PARTENARIAT",
                    "categorie": "statuts_incompatibles",
                    "severite": "CRITIQUE",
                    "objet": f"Projet #{part.projet_id} ({part.projet.get_statut_display()})",
                    "message": f"Un projet {part.projet.get_statut_display()} possède un partenariat {part.get_statut_display()}.",
                })

    # Fiche de galerie publiée sur un projet non prototype / non sélectionné / non incubé / non terminé
    for f in FicheInnovation.objects.select_related("projet").all():
        if f.statut == FicheInnovation.Statut.PUBLIE and f.projet:
            statuts_valides = (
                Projet.Statut.SELECTIONNE,
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            )
            if f.projet.statut not in statuts_valides:
                anomalies.append({
                    "code": "FICHE_PUBLIEE_NON_ELIGIBLE",
                    "categorie": "statuts_incompatibles",
                    "severite": "CRITIQUE",
                    "objet": f"Fiche #{f.id} '{f.titre}' (Projet #{f.projet_id})",
                    "message": f"Fiche publiée dans la galerie alors que le projet est seulement au stade '{f.projet.get_statut_display()}'.",
                })

    # Projet au statut 'INCUBE' sans mentor affecté
    projets_incubes_sans_mentor = Projet.objects.filter(
        statut=Projet.Statut.INCUBE, affectation_mentor__isnull=True
    )

    for p in projets_incubes_sans_mentor:
        anomalies.append({
            "code": "PROJET_INCUBE_SANS_MENTOR",
            "categorie": "statuts_incompatibles",
            "severite": "AVERTISSEMENT",
            "objet": f"Projet #{p.id} ({p.titre})",
            "message": "Projet incubé sans aucun mentor actuellement affecté.",
        })

    # ------------------------------------------------------------------
    # 5. VALEURS HORS PLAGE & INTÉGRITÉ NUMÉRIQUE
    # ------------------------------------------------------------------
    # Financement avec montant <= 0
    for fin in Financement.objects.all():
        if fin.montant is None or fin.montant <= 0:
            anomalies.append({
                "code": "FINANCEMENT_MONTANT_INVALIDE",
                "categorie": "valeurs_hors_plage",
                "severite": "CRITIQUE",
                "objet": f"Financement #{fin.id}",
                "message": f"Montant de financement invalide : {fin.montant} FCFA.",
            })
        elif fin.montant > Decimal("5000000000"):  # 5 milliards FCFA
            anomalies.append({
                "code": "FINANCEMENT_MONTANT_ABERRANT",
                "categorie": "valeurs_hors_plage",
                "severite": "AVERTISSEMENT",
                "objet": f"Financement #{fin.id}",
                "message": f"Montant de financement supérieur au plafond vraisemblable (5 Mds) : {fin.montant:,.0f} FCFA.",
            })

    # Année de cohorte en dehors de [2020, 2035]
    for c in Cohorte.objects.all():
        if c.annee and (c.annee < 2020 or c.annee > 2035):
            anomalies.append({
                "code": "COHORTE_ANNEE_HORS_PLAGE",
                "categorie": "valeurs_hors_plage",
                "severite": "AVERTISSEMENT",
                "objet": f"Cohorte #{c.id} ({c.nom})",
                "message": f"L'année de cohorte {c.annee} est hors de la plage normale [2020-2035].",
            })

    # Note d'évaluation supérieure à la note max du critère ou négative
    for n in Note.objects.select_related("critere").all():
        if n.note is None or n.note < 0:
            anomalies.append({
                "code": "NOTE_EVALUATION_NEGATIVE",
                "categorie": "valeurs_hors_plage",
                "severite": "CRITIQUE",
                "objet": f"Note #{n.id} (Éval #{n.evaluation_id})",
                "message": f"Note négative attribuée : {n.note}.",
            })
        elif n.critere and n.note > Decimal(str(n.critere.note_max)):
            anomalies.append({
                "code": "NOTE_EVALUATION_HORS_PLAGE",
                "categorie": "valeurs_hors_plage",
                "severite": "CRITIQUE",
                "objet": f"Note #{n.id} (Éval #{n.evaluation_id})",
                "message": f"Note attribuée ({n.note}) supérieure à la note max du critère ({n.critere.note_max}).",
            })

    # Score d'évaluation calculé hors de [0, 20]
    for ev in Evaluation.objects.all():
        try:
            sc = ev.score
            if sc < 0.0 or sc > 20.0:
                anomalies.append({
                    "code": "EVALUATION_SCORE_HORS_PLAGE",
                    "categorie": "valeurs_hors_plage",
                    "severite": "CRITIQUE",
                    "objet": f"Évaluation #{ev.id}",
                    "message": f"Le score calculé ({sc}/20) est hors de la plage [0, 20].",
                })
        except Exception as e:
            anomalies.append({
                "code": "EVALUATION_SCORE_ERREUR",
                "categorie": "valeurs_hors_plage",
                "severite": "CRITIQUE",
                "objet": f"Évaluation #{ev.id}",
                "message": f"Erreur lors du calcul du score : {str(e)}.",
            })

    # ------------------------------------------------------------------
    # 6. Synthèse et classification
    # ------------------------------------------------------------------
    critiques = [a for a in anomalies if a["severite"] == "CRITIQUE"]
    avertissements = [a for a in anomalies if a["severite"] == "AVERTISSEMENT"]

    categories_map = {
        "valeurs_manquantes": "1. Valeurs manquantes et complétude",
        "doublons": "2. Unicité et détection de doublons",
        "incoherences_temporelles": "3. Incohérences temporelles et chronologie",
        "statuts_incompatibles": "4. Statuts incompatibles inter-modules",
        "valeurs_hors_plage": "5. Valeurs hors plage et bornes numériques",
    }

    par_categorie = {}
    for cat_slug, cat_libelle in categories_map.items():
        anoms_cat = [a for a in anomalies if a["categorie"] == cat_slug]
        par_categorie[cat_slug] = {
            "libelle": cat_libelle,
            "total": len(anoms_cat),
            "critiques": len([a for a in anoms_cat if a["severite"] == "CRITIQUE"]),
            "avertissements": len([a for a in anoms_cat if a["severite"] == "AVERTISSEMENT"]),
            "anomalies": anoms_cat,
        }

    statut_global = "SUCCES"
    if critiques:
        statut_global = "ECHEC"
    elif avertissements:
        statut_global = "AVERTISSEMENT"

    return {
        "statut": statut_global,
        "timestamp": datetime.now().isoformat(),
        "statistiques": stats,
        "total_anomalies": len(anomalies),
        "nb_critiques": len(critiques),
        "nb_avertissements": len(avertissements),
        "par_categorie": par_categorie,
        "anomalies": anomalies,
    }


class Command(BaseCommand):
    help = "Vérifie l'intégrité et la qualité des données de la plateforme CIAT (Phase 3 - T1)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--json",
            action="store_true",
            help="Produit le rapport complet au format JSON.",
        )
        parser.add_argument(
            "--strict",
            action="store_true",
            help="Renvoie un code d'erreur (exit code 1) en cas d'anomalie critique.",
        )

    def handle(self, *args, **options):
        rapport = executer_audit_qualite()

        # Sortie JSON
        if options.get("json"):
            self.stdout.write(json.dumps(rapport, indent=2, ensure_ascii=False))
            if options.get("strict") and rapport["nb_critiques"] > 0:
                sys.exit(1)
            return

        # Sortie Texte mise en forme
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("  CIAT — CONTRÔLE DE LA QUALITÉ DES DONNÉES (AUDIT AUTOMATISÉ)"))
        self.stdout.write(f"  Horodatage : {rapport['timestamp']}")
        self.stdout.write("=" * 80)

        # Statistiques d'analyse
        st = rapport["statistiques"]
        self.stdout.write("\n[+] PERIMETRE DE LA BASE AUDITEE :")
        self.stdout.write(
            f"  - Projets : {st['projets']} | Utilisateurs : {st['utilisateurs']} | Cohortes : {st['cohortes']}\n"
            f"  - Dossiers : {st['dossiers']} | Décisions : {st['decisions']} | Jalons : {st['jalons']}\n"
            f"  - Fiches Galerie : {st['fiches_innovation']} | Financements : {st['financements']} | Partenariats : {st['partenariats']}\n"
            f"  - Évaluations : {st['evaluations']} | Notes : {st['notes']}"
        )

        self.stdout.write("\n" + "-" * 80)
        self.stdout.write("[+] RESULTATS PAR CATEGORIE DE CONTROLE :")
        self.stdout.write("-" * 80)

        for cat_slug, cat_data in rapport["par_categorie"].items():
            if cat_data["total"] == 0:
                icone = self.style.SUCCESS("[OK]")
                msg_stat = "0 anomalie détectée"
            else:
                icone = (
                    self.style.ERROR("[CRITIQUE]")
                    if cat_data["critiques"] > 0
                    else self.style.WARNING("[AVERTISSEMENT]")
                )
                msg_stat = f"{cat_data['total']} anomalie(s) ({cat_data['critiques']} critique(s), {cat_data['avertissements']} avertissement(s))"

            self.stdout.write(f"\n{cat_data['libelle']} : {icone} - {msg_stat}")

            if cat_data["anomalies"]:
                for anom in cat_data["anomalies"]:
                    badge = (
                        self.style.ERROR("[CRITIQUE]")
                        if anom["severite"] == "CRITIQUE"
                        else self.style.WARNING("[AVERTISSEMENT]")
                    )
                    self.stdout.write(f"    - {badge} {anom['objet']} : {anom['message']}")

        # Bilan final
        self.stdout.write("\n" + "=" * 80)
        if rapport["statut"] == "SUCCES":
            self.stdout.write(
                self.style.SUCCESS(
                    f"[SUCCES] Base 100% conforme. 0 anomalie detectee sur {st['projets']} projets et l'ensemble des modules."
                )
            )
        elif rapport["statut"] == "AVERTISSEMENT":
            self.stdout.write(
                self.style.WARNING(
                    f"[AVERTISSEMENT] {rapport['nb_avertissements']} avertissement(s) a surveiller (0 critique)."
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f"[ECHEC] {rapport['nb_critiques']} anomalie(s) critique(s) et {rapport['nb_avertissements']} avertissement(s) detectes."
                )
            )
        self.stdout.write("=" * 80 + "\n")

        if options.get("strict") and rapport["nb_critiques"] > 0:
            sys.exit(1)
