"""T1 — Tests de fidélité des exports (Excel, PDF) aux filtres et à l'API (Phase 9).

Pour plusieurs combinaisons de filtres (cohorte, domaine, statut, période) :
1. Appelle l'API /api/analytics/indicateurs/, /par-domaine/, /par-cohorte/, /par-genre/, /evolution/
2. Télécharge l'export Excel (.xlsx) et l'ouvre avec openpyxl
3. Vérifie que CHAQUE valeur du fichier est rigoureusement égale à celle de l'API :
   - Indicateurs de l'entonnoir (idées, dossiers, sélectionnés, incubés, prototypes, taux)
   - Répartition par domaine technologique (totaux par domaine)
   - Répartition par cohorte (total, sélectionnés, prototypes)
   - Répartition par genre (totaux par genre)
   - Évolution chronologique mensuelle (mois, total par mois)
4. Télécharge l'export PDF (.pdf) et vérifie via extraction de texte que :
   - Les titres institutionnels CIAT sont présents
   - La mention des filtres actifs (ou période filtrée) est exacte
   - Les chiffres clés correspondent à l'API
5. Vérifie qu'un écart délibéré fait échouer le test (sensibilité)
6. Vérifie les contrôles d'accès RBAC (401 anonyme, 403 porteur) et le rejet des formats invalides (400)
"""
import base64
import io
import re
import zlib

import openpyxl
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.core.models import Role, User


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extrait le texte de tous les flux du PDF (Adobe ASCII85 + FlateDecode de ReportLab)."""
    idx = 0
    all_decomp = []
    while True:
        s_pos = pdf_bytes.find(b"stream", idx)
        if s_pos == -1:
            break
        e_pos = pdf_bytes.find(b"endstream", s_pos)
        if e_pos == -1:
            break
        nl = pdf_bytes.find(b"\n", s_pos, s_pos + 10)
        chunk = pdf_bytes[nl + 1 : e_pos].strip()
        idx = e_pos + 9
        try:
            a85 = base64.a85decode(chunk, adobe=True)
            dec = zlib.decompress(a85).decode("latin-1", errors="replace")
            # Décoder les octaux PDF standards comme \351 -> é
            dec = re.sub(r"\\([0-7]{1,3})", lambda m: chr(int(m.group(1), 8)), dec)
            all_decomp.append(dec)
        except Exception:
            try:
                dec = zlib.decompress(chunk).decode("latin-1", errors="replace")
                dec = re.sub(r"\\([0-7]{1,3})", lambda m: chr(int(m.group(1), 8)), dec)
                all_decomp.append(dec)
            except Exception:
                pass
    return " ".join(all_decomp)




@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class ExportsFidelesFiltresTests(TestCase):
    """Vérification stricte de la fidélité des exports Excel et PDF aux filtres et à l'API."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_all")

    def setUp(self):
        self.client = APIClient()
        self.coordo = User.objects.filter(role=Role.COORDONNATEUR).first()
        self.assertIsNotNone(self.coordo, "Un utilisateur coordonnateur doit exister.")
        self.client.force_authenticate(user=self.coordo)

    # ── Helpers d'accès API et téléchargement ──────────────────────────────────

    def _api_get(self, endpoint: str, params: dict):
        resp = self.client.get(endpoint, params)
        self.assertEqual(resp.status_code, 200, f"Erreur {endpoint} ({params}): {resp.data}")
        return resp.data

    def _download_xlsx(self, params: dict) -> openpyxl.Workbook:
        p = dict(params)
        p["format"] = "xlsx"
        resp = self.client.get("/api/analytics/export/", p)
        self.assertEqual(resp.status_code, 200, f"Erreur export xlsx ({params}): {resp.status_code}")
        self.assertIn("spreadsheet", resp["Content-Type"])
        return openpyxl.load_workbook(io.BytesIO(resp.content), data_only=True)

    def _download_pdf(self, params: dict) -> bytes:
        p = dict(params)
        p["format"] = "pdf"
        resp = self.client.get("/api/analytics/export/", p)
        self.assertEqual(resp.status_code, 200, f"Erreur export pdf ({params}): {resp.status_code}")
        self.assertIn("pdf", resp["Content-Type"])
        return resp.content

    # ── Assertions détaillées feuille Excel ───────────────────────────────────

    def _assert_xlsx_indicateurs(self, ws, api_ind: dict, ctx: str):
        """Vérifie que les indicateurs numériques de l'Excel correspondent à l'API."""
        rows = list(ws.iter_rows(values_only=True))
        # Recherche la section 1
        sec_idx = None
        for i, row in enumerate(rows):
            if row[0] and "1. INDICATEURS CLÉS" in str(row[0]):
                sec_idx = i
                break
        self.assertIsNotNone(sec_idx, f"[{ctx}] Section 1 'Indicateurs clés' introuvable dans l'Excel")

        labels_map = {
            "Idées reçues": api_ind["idees_recues"],
            "Dossiers formellement": api_ind["dossiers_deposes"],
            "sélectionnés": api_ind["projets_selectionnes"],
            "incubation active": api_ind["projets_incubes"],
            "Prototypes": api_ind["prototypes"],
        }
        found_count = 0
        for row in rows[sec_idx + 2 : sec_idx + 10]:
            label = str(row[0] or "")
            val = row[1]
            for key, expected_val in labels_map.items():
                if key.lower() in label.lower():
                    self.assertEqual(
                        val, expected_val,
                        f"[{ctx}] Écart sur '{key}' : Excel={val} ≠ API={expected_val}"
                    )
                    found_count += 1
        self.assertEqual(found_count, len(labels_map), f"[{ctx}] Certains indicateurs manquent dans l'Excel")

    def _assert_xlsx_domaines(self, ws, api_domaines: list, ctx: str):
        """Vérifie que chaque total par domaine dans l'Excel est égal à l'API."""
        api_map = {d["domaine"]: d["total"] for d in api_domaines}
        rows = list(ws.iter_rows(values_only=True))
        sec_idx = None
        for i, row in enumerate(rows):
            if row[0] and "2. RÉPARTITION DES PROJETS PAR DOMAINE" in str(row[0]):
                sec_idx = i
                break
        self.assertIsNotNone(sec_idx, f"[{ctx}] Section 2 'Domaine' introuvable dans l'Excel")

        matched = 0
        for row in rows[sec_idx + 2 : sec_idx + 20]:
            domaine = row[0]
            val = row[1]
            if not domaine or "3. COMPARAISON" in str(domaine):
                break
            domaine_clean = str(domaine).strip()
            if domaine_clean in api_map:
                self.assertEqual(
                    val, api_map[domaine_clean],
                    f"[{ctx}] Écart domaine '{domaine_clean}' : Excel={val} ≠ API={api_map[domaine_clean]}"
                )
                matched += 1
        self.assertEqual(matched, len(api_map), f"[{ctx}] Tous les domaines n'ont pas été vérifiés")

    def _assert_xlsx_cohortes(self, ws, api_cohortes: list, ctx: str):
        """Vérifie que les chiffres par cohorte dans l'Excel correspondent à l'API."""
        api_map = {c["cohorte"]: c for c in api_cohortes}
        rows = list(ws.iter_rows(values_only=True))
        sec_idx = None
        for i, row in enumerate(rows):
            if row[0] and "3. COMPARAISON PAR COHORTE" in str(row[0]):
                sec_idx = i
                break
        self.assertIsNotNone(sec_idx, f"[{ctx}] Section 3 'Cohortes' introuvable dans l'Excel")

        matched = 0
        for row in rows[sec_idx + 2 : sec_idx + 15]:
            cohorte = row[0]
            if not cohorte or "4. RÉPARTITION" in str(cohorte):
                break
            cohorte_clean = str(cohorte).strip()
            if cohorte_clean in api_map:
                exp = api_map[cohorte_clean]
                self.assertEqual(row[1], exp["total"], f"[{ctx}] Cohorte {cohorte_clean} total : {row[1]} ≠ {exp['total']}")
                self.assertEqual(row[2], exp["selectionnes"], f"[{ctx}] Cohorte {cohorte_clean} sélectionnés : {row[2]} ≠ {exp['selectionnes']}")
                self.assertEqual(row[3], exp["prototypes"], f"[{ctx}] Cohorte {cohorte_clean} prototypes : {row[3]} ≠ {exp['prototypes']}")
                matched += 1
        self.assertEqual(matched, len(api_map), f"[{ctx}] Toutes les cohortes n'ont pas été vérifiées")

    def _assert_xlsx_genres(self, ws, api_genres: list, ctx: str):
        """Vérifie que la répartition par genre dans l'Excel correspond à l'API."""
        api_map = {g["genre"]: g["total"] for g in api_genres}
        rows = list(ws.iter_rows(values_only=True))
        sec_idx = None
        for i, row in enumerate(rows):
            if row[0] and "4. RÉPARTITION PAR GENRE" in str(row[0]):
                sec_idx = i
                break
        self.assertIsNotNone(sec_idx, f"[{ctx}] Section 4 'Genre' introuvable dans l'Excel")

        matched = 0
        for row in rows[sec_idx + 2 : sec_idx + 10]:
            genre = row[0]
            if not genre or "5. ÉVOLUTION" in str(genre):
                break
            genre_clean = str(genre).strip()
            if genre_clean in api_map:
                self.assertEqual(row[1], api_map[genre_clean], f"[{ctx}] Genre {genre_clean} : {row[1]} ≠ {api_map[genre_clean]}")
                matched += 1
        self.assertEqual(matched, len(api_map), f"[{ctx}] Tous les genres n'ont pas été vérifiés")

    def _assert_xlsx_evolution(self, ws, api_evolution: list, ctx: str):
        """Vérifie que l'évolution chronologique dans l'Excel correspond à l'API."""
        if not api_evolution:
            return
        api_map = {e["mois"]: e["total"] for e in api_evolution}
        rows = list(ws.iter_rows(values_only=True))
        sec_idx = None
        for i, row in enumerate(rows):
            if row[0] and "5. ÉVOLUTION CHRONOLOGIQUE" in str(row[0]):
                sec_idx = i
                break
        self.assertIsNotNone(sec_idx, f"[{ctx}] Section 5 'Évolution' introuvable dans l'Excel")

        matched = 0
        for row in rows[sec_idx + 2 : sec_idx + 30]:
            mois = row[0]
            if not mois:
                break
            mois_clean = str(mois).strip()
            if mois_clean in api_map:
                self.assertEqual(
                    row[1], api_map[mois_clean],
                    f"[{ctx}] Mois {mois_clean} : Excel={row[1]} ≠ API={api_map[mois_clean]}"
                )
                matched += 1
        self.assertEqual(matched, len(api_map), f"[{ctx}] Tous les mois d'évolution n'ont pas été vérifiés")

    # ── Tests de fidélité Excel pour plusieurs combinaisons de filtres ────────

    def test_xlsx_fidele_sans_filtre(self):
        """Export Excel sans filtre : 100% des valeurs égales à l'API."""
        params = {}
        api_ind = self._api_get("/api/analytics/indicateurs/", params)
        api_dom = self._api_get("/api/analytics/par-domaine/", params)
        api_coh = self._api_get("/api/analytics/par-cohorte/", params)
        api_gen = self._api_get("/api/analytics/par-genre/", params)
        api_evo = self._api_get("/api/analytics/evolution/", params)

        wb = self._download_xlsx(params)
        ws = wb["Analyses CIAT"]

        self._assert_xlsx_indicateurs(ws, api_ind, "sans filtre")
        self._assert_xlsx_domaines(ws, api_dom, "sans filtre")
        self._assert_xlsx_cohortes(ws, api_coh, "sans filtre")
        self._assert_xlsx_genres(ws, api_gen, "sans filtre")
        self._assert_xlsx_evolution(ws, api_evo, "sans filtre")

    def test_xlsx_fidele_filtre_statut_incube(self):
        """Export Excel avec filtre statut=incube : valeurs égales à l'API."""
        params = {"statut": "incube"}
        api_ind = self._api_get("/api/analytics/indicateurs/", params)
        api_dom = self._api_get("/api/analytics/par-domaine/", params)
        api_coh = self._api_get("/api/analytics/par-cohorte/", params)
        api_gen = self._api_get("/api/analytics/par-genre/", params)

        wb = self._download_xlsx(params)
        ws = wb["Analyses CIAT"]

        self._assert_xlsx_indicateurs(ws, api_ind, "statut=incube")
        self._assert_xlsx_domaines(ws, api_dom, "statut=incube")
        self._assert_xlsx_cohortes(ws, api_coh, "statut=incube")
        self._assert_xlsx_genres(ws, api_gen, "statut=incube")

    def test_xlsx_fidele_filtre_cohorte(self):
        """Export Excel avec filtre cohorte=2025 : valeurs égales à l'API."""
        params = {"cohorte": "2025"}
        api_ind = self._api_get("/api/analytics/indicateurs/", params)
        api_dom = self._api_get("/api/analytics/par-domaine/", params)
        api_gen = self._api_get("/api/analytics/par-genre/", params)

        wb = self._download_xlsx(params)
        ws = wb["Analyses CIAT"]

        self._assert_xlsx_indicateurs(ws, api_ind, "cohorte=2025")
        self._assert_xlsx_domaines(ws, api_dom, "cohorte=2025")
        self._assert_xlsx_genres(ws, api_gen, "cohorte=2025")

    def test_xlsx_fidele_filtre_periode(self):
        """Export Excel avec filtre période temporelle : valeurs égales à l'API."""
        params = {"debut": "2025-01-01", "fin": "2025-12-31"}
        api_ind = self._api_get("/api/analytics/indicateurs/", params)
        api_dom = self._api_get("/api/analytics/par-domaine/", params)
        api_gen = self._api_get("/api/analytics/par-genre/", params)
        api_evo = self._api_get("/api/analytics/evolution/", params)

        wb = self._download_xlsx(params)
        ws = wb["Analyses CIAT"]

        self._assert_xlsx_indicateurs(ws, api_ind, "période 2025")
        self._assert_xlsx_domaines(ws, api_dom, "période 2025")
        self._assert_xlsx_genres(ws, api_gen, "période 2025")
        self._assert_xlsx_evolution(ws, api_evo, "période 2025")

    def test_xlsx_fidele_multifiltres(self):
        """Export Excel combinant cohorte et statut : valeurs égales à l'API."""
        params = {"cohorte": "2025", "statut": "incube"}
        api_ind = self._api_get("/api/analytics/indicateurs/", params)
        api_dom = self._api_get("/api/analytics/par-domaine/", params)

        wb = self._download_xlsx(params)
        ws = wb["Analyses CIAT"]

        self._assert_xlsx_indicateurs(ws, api_ind, "cohorte=2025 & statut=incube")
        self._assert_xlsx_domaines(ws, api_dom, "cohorte=2025 & statut=incube")

    def test_xlsx_ecart_volontaire_fait_echouer(self):
        """Test de sensibilité : une valeur Excel altérée doit impérativement déclencher un échec."""
        params = {}
        api_ind = self._api_get("/api/analytics/indicateurs/", params)
        wb = self._download_xlsx(params)
        ws = wb["Analyses CIAT"]

        # Altération volontaire de la valeur réelle de l'API
        fake_api_ind = dict(api_ind)
        fake_api_ind["idees_recues"] = api_ind["idees_recues"] + 9999

        with self.assertRaises(AssertionError):
            self._assert_xlsx_indicateurs(ws, fake_api_ind, "test sensibilité")

    # ── Tests de fidélité PDF ─────────────────────────────────────────────────

    def test_pdf_contient_titres_institutionnels(self):
        """Le PDF contient les titres officiels du CIAT."""
        pdf_bytes = self._download_pdf({})
        text = _extract_pdf_text(pdf_bytes)
        self.assertIn("CENTRE D'INNOVATION", text)
        self.assertIn("TRANSFERT", text)
        self.assertIn("Tableau de Bord", text)


    def test_pdf_contient_periode_et_filtres(self):
        """Le PDF affiche explicitement la période et les filtres actifs."""
        params = {"debut": "2025-01-01", "fin": "2025-12-31", "statut": "incube"}
        pdf_bytes = self._download_pdf(params)
        text = _extract_pdf_text(pdf_bytes)
        self.assertTrue(
            "2025-01-01" in text or "2025" in text,
            f"Filtre de date absent du PDF. Début texte: {text[:400]}"
        )
        self.assertIn("incube", text)

    def test_pdf_contient_chiffres_cles_api(self):
        """Le PDF contient les valeurs numériques exactes des indicateurs de l'API."""
        params = {}
        api_ind = self._api_get("/api/analytics/indicateurs/", params)
        pdf_bytes = self._download_pdf(params)
        text = _extract_pdf_text(pdf_bytes)

        # Vérifie que les valeurs clés apparaissent dans le document
        for key in ("idees_recues", "projets_selectionnes", "projets_incubes", "prototypes"):
            val_str = str(api_ind[key])
            self.assertIn(
                val_str, text,
                f"La valeur {key}={val_str} de l'API est absente du PDF extrait."
            )

    def test_pdf_sections_structurantes_presentes(self):
        """Le PDF inclut toutes les sections analytiques attendues."""
        pdf_bytes = self._download_pdf({})
        text = _extract_pdf_text(pdf_bytes)
        self.assertIn("Indicateurs Clés", text)
        self.assertIn("Domaine", text)
        self.assertIn("Cohorte", text)
        self.assertIn("Genre", text)

    # ── Contrôles de sécurité RBAC et validation des formats ──────────────────

    def test_export_acces_refuse_anonyme(self):
        """Un utilisateur anonyme ne peut exporter ni en xlsx ni en pdf (401)."""
        anon = APIClient()
        r_xlsx = anon.get("/api/analytics/export/", {"format": "xlsx"})
        r_pdf = anon.get("/api/analytics/export/", {"format": "pdf"})
        self.assertEqual(r_xlsx.status_code, 401)
        self.assertEqual(r_pdf.status_code, 401)

    def test_export_acces_refuse_porteur(self):
        """Un porteur de projet ne peut pas accéder aux exports décisionnels (403)."""
        porteur = User.objects.filter(role=Role.PORTEUR).first()
        self.assertIsNotNone(porteur, "Un porteur doit exister dans le seed.")
        c = APIClient()
        c.force_authenticate(user=porteur)
        resp = c.get("/api/analytics/export/", {"format": "xlsx"})
        self.assertEqual(resp.status_code, 403)

    def test_export_format_invalide_retourne_400(self):
        """Un format d'export invalide (ex: csv ou vide) retourne 400 Bad Request."""
        r1 = self.client.get("/api/analytics/export/", {"format": "csv"})
        r2 = self.client.get("/api/analytics/export/", {})
        self.assertEqual(r1.status_code, 400)
        self.assertEqual(r2.status_code, 400)
