import re
from pathlib import Path

import yaml
from django.conf import settings
from django.test import SimpleTestCase
from drf_spectacular.generators import SchemaGenerator


class ApiContractConformanceTests(SimpleTestCase):
    """
    Tâche T3 — Vérification de conformité du contrat d'API.
    Vérifie que chaque route documentée dans taches/CONTRATS_API.md
    existe fidèlement dans le schéma OpenAPI avec la bonne méthode HTTP.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Charger le schéma OpenAPI depuis docs/openapi.yaml ou via SchemaGenerator
        yaml_path = settings.BASE_DIR.parent / "docs" / "openapi.yaml"
        if yaml_path.exists():
            with open(yaml_path, "r", encoding="utf-8") as f:
                cls.spec = yaml.safe_load(f)
        else:
            generator = SchemaGenerator()
            cls.spec = generator.get_schema(request=None, public=True)

        cls.openapi_endpoints = set()
        for path, methods in cls.spec.get("paths", {}).items():
            for method in methods.keys():
                if method.lower() in ("get", "post", "put", "patch", "delete"):
                    cls.openapi_endpoints.add((method.upper(), path))

        cls.contrats_path = settings.BASE_DIR.parent / "taches" / "CONTRATS_API.md"
        cls.documented_endpoints = cls._parse_contrats_api(cls.contrats_path)

    @staticmethod
    def _parse_contrats_api(filepath: Path):
        """Extrait toutes les routes et méthodes documentées dans taches/CONTRATS_API.md."""
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()

        section_prefixes = {
            "## Déjà disponible (socle)": "/api",
            "## P2 — Incubateur": "/api/incubator",
            "## P1 — Portail": "/api/portal",
            "## P3 — Analyse": "/api/analytics",
            "## P5 — Documents": "/api/documents",
            "### P5 — Ajouts de la Phase 2": "/api/documents",
            "### P2 — Ajouts de la Phase 2": "/api/incubator",
            "## P4 — Assistant": "/api/assistant",
            "## P6 — Galerie": "/api/gallery",
            "## P1 — Compléments de la Phase 3": "/api/portal",
            "## P3 — Export": "/api/analytics",
            "## P3 — Compléments de la Phase 2": "/api/analytics",
            "## P2 / P1 — Ajouts des Phases 4 et 5": "/api/incubator",
            "### Accusé de réception et export compte-rendu": "/api/incubator",
            "### Calendrier des événements": "/api/portal",
            "### Fiche promotionnelle PDF": "/api/gallery",
        }

        current_prefix = "/api"
        endpoints = []

        for line in lines:
            line_clean = line.strip()
            for sec, pref in section_prefixes.items():
                if sec in line_clean:
                    current_prefix = pref
                    break

            # Format | `METHOD /route` |
            m_row1 = re.match(r"^\|\s*`([A-Z/]+)\s+([^`]+)`\s*\|", line_clean)
            if m_row1:
                methods_str, raw_path = m_row1.group(1), m_row1.group(2)
                methods = [m.strip() for m in methods_str.split("/")]
                clean_path = raw_path.split("?")[0].strip()
                if not clean_path.endswith("/") and not clean_path.endswith(".ics"):
                    clean_path += "/"
                if clean_path.startswith("/api/"):
                    full_path = clean_path
                elif clean_path.startswith("/"):
                    full_path = current_prefix + clean_path
                else:
                    full_path = current_prefix + "/" + clean_path

                for meth in methods:
                    endpoints.append((meth, full_path))

            # Format | `/route` | `METHOD` |
            m_row2 = re.match(r"^\|\s*`([^`]+)`\s*\|\s*`([A-Z/]+)`\s*\|", line_clean)
            if m_row2:
                raw_path, methods_str = m_row2.group(1), m_row2.group(2)
                methods = [m.strip() for m in methods_str.split("/")]
                clean_path = raw_path.split("?")[0].strip()
                if not clean_path.endswith("/") and not clean_path.endswith(".ics"):
                    clean_path += "/"
                if clean_path.startswith("/api/"):
                    full_path = clean_path
                elif clean_path.startswith("/"):
                    full_path = current_prefix + clean_path
                else:
                    full_path = current_prefix + "/" + clean_path

                for meth in methods:
                    endpoints.append((meth, full_path))

        return endpoints

    def test_openapi_schema_file_exists(self):
        """Le schéma OpenAPI exporté existe sous docs/openapi.yaml."""
        yaml_path = settings.BASE_DIR.parent / "docs" / "openapi.yaml"
        self.assertTrue(
            yaml_path.exists(),
            "Le fichier docs/openapi.yaml doit exister (exporté via manage.py spectacular).",
        )
        self.assertGreater(
            len(self.openapi_endpoints),
            50,
            "Le schéma OpenAPI doit contenir l'ensemble des routes CIAT.",
        )

    def test_all_documented_routes_exist_in_openapi_schema(self):
        """
        Chaque route listée dans taches/CONTRATS_API.md existe
        dans le schéma OpenAPI avec la méthode HTTP correspondante.
        """
        self.assertGreater(
            len(self.documented_endpoints),
            40,
            "Au moins 40 endpoints documentés doivent être extraits de CONTRATS_API.md.",
        )

        missing_endpoints = []
        for method, path in self.documented_endpoints:
            # Vérification directe
            if (method, path) in self.openapi_endpoints:
                continue

            # Correspondance par pattern générique sur les identifiants ({id} vs {piece_id} vs {slug})
            pattern = re.sub(r"\{[a-zA-Z0-9_]+\}", r"{[^}]+}", path)
            matched = False
            for o_method, o_path in self.openapi_endpoints:
                if o_method == method:
                    o_pattern = re.sub(r"\{[a-zA-Z0-9_]+\}", r"{[^}]+}", o_path)
                    if o_pattern == pattern:
                        matched = True
                        break

            if not matched:
                missing_endpoints.append(f"{method} {path}")

        self.assertEqual(
            missing_endpoints,
            [],
            f"Écarts détectés : {len(missing_endpoints)} route(s) documentée(s) absente(s) d'OpenAPI : {missing_endpoints}",
        )
