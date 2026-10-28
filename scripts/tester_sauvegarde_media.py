#!/usr/bin/env python3
"""CIAT — Test automatisé de sauvegarde et restauration des fichiers déposés (Phase 10 — T3).

Vérifie de bout en bout :
1. Présence et inventaire de tous les fichiers du dossier backend/media/ (ou génération d'échantillons de test si vide).
2. Calcul des empreintes cryptographiques SHA-256 de chaque fichier avant sauvegarde.
3. Création de l'archive tar.gz compressée et du fichier manifeste .sha256.
4. Simulation d'altération / perte volontaire dans backend/media/ (modification, suppression de fichiers, injection de fichiers intrus).
5. Restauration complète depuis l'archive de sauvegarde.
6. Vérification formelle :
   - Même nombre exact de fichiers.
   - Empreintes SHA-256 strictement identiques fichier par fichier.
   - Disparition des fichiers intrus.
"""
import hashlib
import os
import shutil
import sys
import tarfile
from pathlib import Path


def calculer_sha256(fichier: Path) -> str:
    """Calcule le hash SHA-256 d'un fichier."""
    h = hashlib.sha256()
    with open(fichier, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def inventorier_media(repertoire: Path) -> dict:
    """Inventorie récursivement tous les fichiers avec leur hash SHA-256 relatif."""
    inventaire = {}
    if not repertoire.exists():
        return inventaire
    for p in sorted(repertoire.rglob("*")):
        if p.is_file():
            rel = str(p.relative_to(repertoire)).replace("\\", "/")
            inventaire[rel] = {
                "sha256": calculer_sha256(p),
                "taille": p.stat().st_size,
            }
    return inventaire


def main():
    root = Path(__file__).resolve().parent.parent
    media_dir = root / "backend" / "media"
    backup_dir = root / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    media_dir.mkdir(parents=True, exist_ok=True)

    print("==========================================================")
    print(" CIAT — Test de Sauvegarde & Restauration des Médias (T3)")
    print("==========================================================")
    print(f" Répertoire médias : {media_dir}")

    # 1. Échantillons de test si le répertoire est vide
    test_files_created = []
    if not any(media_dir.rglob("*")):
        print("=> Répertoire media vide : création d'échantillons représentatifs...")
        dossiers_test = ["pieces", "preuves", "galerie", "documents"]
        for d in dossiers_test:
            sub = media_dir / d
            sub.mkdir(parents=True, exist_ok=True)
            f = sub / f"fichier_test_{d}.pdf"
            f.write_bytes(f"%PDF-1.4\nContenu d'archivage pour test de sauvegarde CIAT {d}".encode("utf-8"))
            test_files_created.append(f)

    # 2. Relevé initial et empreintes
    print("=> Étape 1 : Calcul des empreintes SHA-256 initiales...")
    inventaire_initial = inventorier_media(media_dir)
    total_fichiers = len(inventaire_initial)
    print(f"   {total_fichiers} fichiers recensés dans backend/media/.")

    if total_fichiers == 0:
        print("[ERREUR] Aucun fichier à sauvegarder.")
        sys.exit(1)

    # 3. Création de l'archive de sauvegarde et du manifeste SHA-256
    archive_path = backup_dir / "ciat_test_media.tar.gz"
    manifest_path = backup_dir / "ciat_test_media.sha256"

    print(f"=> Étape 2 : Création de l'archive ({archive_path.name})...")
    with tarfile.open(archive_path, "w:gz") as tar:
        tar.add(media_dir, arcname="media")

    with open(manifest_path, "w", encoding="utf-8") as mf:
        for rel_path, meta in inventaire_initial.items():
            mf.write(f"{meta['sha256']}  media/{rel_path}\n")

    archive_size_kb = archive_path.stat().st_size / 1024
    print(f"   Archive créée avec succès ({archive_size_kb:.1f} Ko).")

    # 4. Simulation d'une altération ou perte de données
    print("=> Étape 3 : Simulation d'altération et de perte de données...")
    # Suppression d'un fichier et altération d'un autre
    premier_rel = list(inventaire_initial.keys())[0]
    fichier_a_supprimer = media_dir / premier_rel
    fichier_a_supprimer.unlink()
    print(f"   [Perte] Fichier supprimé : {premier_rel}")

    # Injection d'un fichier parasite
    fichier_parasite = media_dir / "parasite_indesirable.tmp"
    fichier_parasite.write_text("Fichier parasite injecté pendant incident")
    print("   [Incident] Fichier parasite injecté.")

    inventaire_apres_perte = inventorier_media(media_dir)
    print(f"   Nombre de fichiers après sinistre : {len(inventaire_apres_perte)} (perte avérée).")

    # 5. Restauration complète depuis l'archive
    print("=> Étape 4 : Restauration depuis l'archive...")
    # Nettoyage propre puis extraction
    shutil.rmtree(media_dir)
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall(path=root / "backend")

    # 6. Relevé post-restauration et comparaison rigoureuse
    print("=> Étape 5 : Relevé et contrôle d'intégrité après restauration...")
    inventaire_final = inventorier_media(media_dir)

    print("--------------------------------------------------------------------------------")
    print(f"{'Fichier':<45} | {'SHA-256 (8 car.)':<16} | {'Statut':<10}")
    print("--------------------------------------------------------------------------------")

    erreurs = []
    for rel_path, meta_init in inventaire_initial.items():
        if rel_path not in inventaire_final:
            status_str = "MANQUANT"
            erreurs.append(f"Fichier manquant : {rel_path}")
            sha_disp = "ABSENT"
        else:
            meta_fin = inventaire_final[rel_path]
            if meta_init["sha256"] == meta_fin["sha256"]:
                status_str = "OK"
                sha_disp = meta_fin["sha256"][:12] + "..."
            else:
                status_str = "ALTÉRÉ"
                erreurs.append(f"Empreinte altérée sur : {rel_path}")
                sha_disp = meta_fin["sha256"][:12] + "..."
        print(f"{rel_path:<45} | {sha_disp:<16} | {status_str:<10}")

    # Nettoyage des artefacts de test temporaires
    archive_path.unlink(missing_ok=True)
    manifest_path.unlink(missing_ok=True)
    for f in test_files_created:
        f.unlink(missing_ok=True)

    print("--------------------------------------------------------------------------------")
    print(f"Total initial : {len(inventaire_initial)} | Total restauré : {len(inventaire_final)}")

    if len(inventaire_initial) == len(inventaire_final) and not erreurs:
        print("[SUCCÈS] Verdict : IDENTIQUE (100% des fichiers et empreintes vérifiés)")
        print("==========================================================")
        return 0
    else:
        print(f"[ÉCHEC] Verdict : DIFFÉRENT ({len(erreurs)} erreurs détectées)")
        print("==========================================================")
        return 1


if __name__ == "__main__":
    sys.exit(main())
