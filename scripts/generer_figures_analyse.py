"""Script de génération reproductible des 5 figures d'analyse pour le rapport CIAT (T3 — Phase 8).

Lit directement la base de données de `seed_all` via l'ORM Django et génère
5 visualisations haute résolution (300 DPI) respectant la charte graphique du CIAT :
1. Répartition des projets par domaine (titre <= 6 mots)
2. Répartition des porteurs par genre (titre <= 6 mots)
3. Évolution mensuelle des dépôts (titre <= 6 mots)
4. Comparaison des promotions par cohorte (titre <= 6 mots)
5. Financements mobilisés par guichet (titre <= 6 mots)

Enregistre les images dans docs/livrables/figures/.
"""
import os
import sys
from pathlib import Path

# Configuration de l'environnement Django
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth

from apps.core.models import Cohorte, Domaine, Projet
from apps.analytics.models import Financement, StatutFinancement

# Charte graphique officielle du CIAT
CIAT_DARK = "#21130D"      # Brun sombre institutionnel
CIAT_COPPER = "#8C5E2D"    # Cuivre / Terracotta
CIAT_IVORY = "#FAF7F2"     # Ivoire chaud
CIAT_SAND = "#EFE4D6"      # Sable / Bordure douce
CIAT_CHOCOLAT = "#612D10"  # Chocolat dense
CIAT_BLUE = "#4A6B82"      # Bleu ardoise
CIAT_GREEN = "#1E5222"     # Vert forêt / succès
CIAT_GRAY = "#6B5646"      # Texte secondaire

FIGURES_DIR = BASE_DIR / "docs" / "livrables" / "figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)


def set_plot_style(ax, title):
    """Applique le style institutionnel CIAT à l'axe."""
    ax.set_facecolor("#FFFFFF")
    ax.figure.patch.set_facecolor("#FFFFFF")
    ax.set_title(
        title,
        fontsize=13,
        fontweight="bold",
        color=CIAT_DARK,
        pad=16,
        loc="left",
    )
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(CIAT_SAND)
    ax.spines["bottom"].set_color(CIAT_SAND)
    ax.tick_params(colors=CIAT_GRAY, labelsize=9)
    ax.grid(axis="x", color=CIAT_SAND, linestyle="--", linewidth=0.7, alpha=0.6)


def generer_figure_1_domaines():
    """Figure 1 : Répartition des projets par domaine."""
    qs = (
        Projet.objects.values("domaine__nom")
        .annotate(total=Count("id"))
        .order_by("total")
    )
    labels = [item["domaine__nom"] for item in qs]
    valeurs = [item["total"] for item in qs]

    fig, ax = plt.subplots(figsize=(8.5, 4.5), dpi=300)
    set_plot_style(ax, "Répartition des projets par domaine")

    bars = ax.barh(labels, valeurs, color=CIAT_COPPER, height=0.6, edgecolor=CIAT_CHOCOLAT, linewidth=0.5)

    for bar in bars:
        w = bar.get_width()
        pct = (w / sum(valeurs)) * 100
        ax.text(
            w + 0.15,
            bar.get_y() + bar.get_height() / 2,
            f"{int(w)} projets ({pct:.1f} %)",
            ha="left",
            va="center",
            fontsize=8.5,
            fontweight="bold",
            color=CIAT_DARK,
        )

    ax.set_xlim(0, max(valeurs) + 2.5)
    ax.set_xlabel("Nombre de projets enregistrés", color=CIAT_GRAY, fontsize=9, labelpad=8)
    plt.tight_layout()

    out_path = FIGURES_DIR / "fig1_repartition_domaine.png"
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"  [OK] Figure 1 enregistrée : {out_path.name}")


def generer_figure_2_genre():
    """Figure 2 : Répartition des porteurs par genre."""
    femmes = Projet.objects.filter(porteur__genre="F").count()
    hommes = Projet.objects.filter(porteur__genre="H").count()
    autre = Projet.objects.exclude(porteur__genre__in=["F", "H"]).count()

    labels = ["Femmes entrepreneures", "Hommes entrepreneurs"]
    valeurs = [femmes, hommes]
    couleurs = [CIAT_COPPER, CIAT_DARK]

    if autre > 0:
        labels.append("Autre / non précisé")
        valeurs.append(autre)
        couleurs.append(CIAT_BLUE)

    fig, ax = plt.subplots(figsize=(6.5, 4.5), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    ax.set_facecolor("#FFFFFF")

    wedges, texts, autotexts = ax.pie(
        valeurs,
        labels=None,
        autopct="%1.1f %%",
        startangle=140,
        colors=couleurs,
        pctdistance=0.76,
        wedgeprops=dict(width=0.45, edgecolor="#FFFFFF", linewidth=2.5),
    )

    for at in autotexts:
        at.set_color("#FFFFFF")
        at.set_fontsize(10)
        at.set_fontweight("bold")

    legend_labels = [f"{lbl} : {val} ({val/sum(valeurs)*100:.1f} %)" for lbl, val in zip(labels, valeurs)]
    ax.legend(
        wedges,
        legend_labels,
        loc="center",
        bbox_to_anchor=(0.5, -0.08),
        frameon=False,
        fontsize=9,
        ncol=2,
    )

    ax.set_title(
        "Répartition des porteurs par genre",
        fontsize=13,
        fontweight="bold",
        color=CIAT_DARK,
        pad=12,
        loc="center",
    )
    plt.tight_layout()

    out_path = FIGURES_DIR / "fig2_repartition_genre.png"
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"  [OK] Figure 2 enregistrée : {out_path.name}")


def generer_figure_3_evolution():
    """Figure 3 : Évolution mensuelle des dépôts."""
    qs = (
        Projet.objects.annotate(mois=TruncMonth("cree_le"))
        .values("mois")
        .annotate(total=Count("id"))
        .order_by("mois")
    )
    mois_labels = [item["mois"].strftime("%b %y") for item in qs if item["mois"]]
    totaux = [item["total"] for item in qs if item["mois"]]

    fig, ax = plt.subplots(figsize=(9, 4.2), dpi=300)
    set_plot_style(ax, "Évolution mensuelle des dépôts")
    ax.grid(axis="y", color=CIAT_SAND, linestyle="--", linewidth=0.7, alpha=0.6)
    ax.grid(axis="x", visible=False)

    x = range(len(mois_labels))
    ax.plot(x, totaux, color=CIAT_COPPER, linewidth=2.5, marker="o", markersize=6, markerfacecolor=CIAT_DARK)
    ax.fill_between(x, totaux, color=CIAT_COPPER, alpha=0.15)

    for i, txt in enumerate(totaux):
        ax.annotate(
            str(txt),
            (i, txt),
            textcoords="offset points",
            xytext=(0, 7),
            ha="center",
            fontsize=8.5,
            fontweight="bold",
            color=CIAT_DARK,
        )

    ax.set_xticks(x)
    ax.set_xticklabels(mois_labels, rotation=45, ha="right", fontsize=8.5)
    ax.set_ylabel("Projets déposés", color=CIAT_GRAY, fontsize=9, labelpad=8)
    ax.set_ylim(0, max(totaux) + 2)
    plt.tight_layout()

    out_path = FIGURES_DIR / "fig3_evolution_mensuelle.png"
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"  [OK] Figure 3 enregistrée : {out_path.name}")


def generer_figure_4_cohortes():
    """Figure 4 : Comparaison des promotions par cohorte."""
    cohortes = Cohorte.objects.order_by("annee")
    noms = [c.nom for c in cohortes]
    totaux = []
    selectionnes = []
    prototypes = []

    for c in cohortes:
        qs = Projet.objects.filter(cohorte=c)
        totaux.append(qs.count())
        selectionnes.append(
            qs.filter(
                statut__in=[
                    Projet.Statut.SELECTIONNE,
                    Projet.Statut.INCUBE,
                    Projet.Statut.PROTOTYPE,
                    Projet.Statut.TERMINE,
                ]
            ).count()
        )
        prototypes.append(
            qs.filter(statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]).count()
        )

    import numpy as np
    x = np.arange(len(noms))
    width = 0.26

    fig, ax = plt.subplots(figsize=(8.5, 4.5), dpi=300)
    set_plot_style(ax, "Comparaison des promotions par cohorte")
    ax.grid(axis="y", color=CIAT_SAND, linestyle="--", linewidth=0.7, alpha=0.6)
    ax.grid(axis="x", visible=False)

    rects1 = ax.bar(x - width, totaux, width, label="Idées reçues", color=CIAT_SAND, edgecolor=CIAT_GRAY, linewidth=0.5)
    rects2 = ax.bar(x, selectionnes, width, label="Projets retenus", color=CIAT_COPPER, edgecolor=CIAT_CHOCOLAT, linewidth=0.5)
    rects3 = ax.bar(x + width, prototypes, width, label="Prototypes validés", color=CIAT_DARK, edgecolor=CIAT_CHOCOLAT, linewidth=0.5)

    def autolabel(rects):
        for rect in rects:
            h = rect.get_height()
            ax.annotate(
                f"{int(h)}",
                xy=(rect.get_x() + rect.get_width() / 2, h),
                xytext=(0, 4),
                textcoords="offset points",
                ha="center",
                va="bottom",
                fontsize=8,
                fontweight="bold",
                color=CIAT_DARK,
            )

    autolabel(rects1)
    autolabel(rects2)
    autolabel(rects3)

    ax.set_xticks(x)
    ax.set_xticklabels(noms, fontsize=9.5, fontweight="semibold", color=CIAT_DARK)
    ax.set_ylabel("Nombre de projets", color=CIAT_GRAY, fontsize=9)
    ax.set_ylim(0, max(totaux) + 5)
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    plt.tight_layout()

    out_path = FIGURES_DIR / "fig4_comparaison_cohortes.png"
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"  [OK] Figure 4 enregistrée : {out_path.name}")


def generer_figure_5_financements():
    """Figure 5 : Financements mobilisés par guichet."""
    qs = (
        Financement.objects.exclude(statut=StatutFinancement.REFUSE)
        .values("source")
        .annotate(total=Sum("montant"), count=Count("id"))
        .order_by("total")
    )

    sources = [item["source"] for item in qs]
    montants_m = [item["total"] / 1_000_000 for item in qs]

    fig, ax = plt.subplots(figsize=(9.5, 4.8), dpi=300)
    set_plot_style(ax, "Financements mobilisés par guichet")

    bars = ax.barh(sources, montants_m, color=CIAT_COPPER, height=0.6, edgecolor=CIAT_CHOCOLAT, linewidth=0.5)

    for bar in bars:
        w = bar.get_width()
        ax.text(
            w + 2,
            bar.get_y() + bar.get_height() / 2,
            f"{int(w)} M FCFA",
            ha="left",
            va="center",
            fontsize=8.5,
            fontweight="bold",
            color=CIAT_DARK,
        )

    ax.set_xlim(0, max(montants_m) + 18)
    ax.set_xlabel("Montant total mobilisé (Millions FCFA)", color=CIAT_GRAY, fontsize=9, labelpad=8)
    plt.tight_layout()

    out_path = FIGURES_DIR / "fig5_financements_sources.png"
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"  [OK] Figure 5 enregistrée : {out_path.name}")


def main():
    print("=== Génération des 5 figures d'analyse officielles du CIAT (Phase 8 - T3) ===")
    generer_figure_1_domaines()
    generer_figure_2_genre()
    generer_figure_3_evolution()
    generer_figure_4_cohortes()
    generer_figure_5_financements()
    print("\n[SUCCÈS] Les 5 figures ont été générées avec succès dans docs/livrables/figures/")


if __name__ == "__main__":
    main()
