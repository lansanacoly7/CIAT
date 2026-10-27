#!/usr/bin/env python3
"""Script de mesure des temps de réponse sous charge légère — CIAT (Phase 6 Pathé).

Ce script évalue les performances réelles de l'API CIAT sur 6 routes clés
sous différents paliers de concurrence (5, 20 et 50 clients simultanés, 200 requêtes chacun) :
1. Liste publique des actualités (/api/portal/actualites/)
2. Galerie publique des innovations (/api/gallery/fiches/)
3. Détail public d'une fiche d'innovation (/api/gallery/fiches/{slug}/)
4. Connexion et délivrance de token JWT (/api/auth/token/) — protégée par AuthRateThrottle
5. Liste des dossiers de candidature (/api/incubator/dossiers/) — porteur authentifié
6. Indicateurs statistiques du tableau de bord (/api/analytics/indicateurs/) — coordonnateur authentifié

Métriques calculées par route et par palier :
- Nombre total de requêtes
- Codes de statut et erreurs (200 OK, 429 Throttle, erreurs réseau/5xx)
- Temps médian (p50 en millisecondes)
- 95e centile (p95 en millisecondes)
- Débit réel mesuré (requêtes par seconde : req/s)

Usage :
    python scripts/mesure_charge.py [--base-url http://127.0.0.1:8000] [--requests 200] [--concurrency 5 20 50]
"""
import argparse
import concurrent.futures
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.request
from typing import Dict, List, Optional, Tuple


def calculate_percentile(data: List[float], percentile: float) -> float:
    """Calcule un centile précis (ex: 95e centile) sur une liste de durées triée."""
    if not data:
        return 0.0
    sorted_data = sorted(data)
    if len(sorted_data) == 1:
        return sorted_data[0]
    index = (percentile / 100.0) * (len(sorted_data) - 1)
    lower = int(index)
    upper = min(lower + 1, len(sorted_data) - 1)
    weight = index - lower
    return sorted_data[lower] * (1.0 - weight) + sorted_data[upper] * weight


class Benchmarker:
    """Gestionnaire de banc d'essai de charge HTTP sur l'API CIAT."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.porteur_token: Optional[str] = None
        self.coordo_token: Optional[str] = None
        self.sample_slug: str = "agrisol-irrigation-intelligente"

    def obtain_token(self, email: str, password: str, max_retries: int = 3) -> Optional[str]:
        """Obtient un token JWT Bearer pour un utilisateur donné avec nouvelle tentative."""
        url = f"{self.base_url}/api/auth/token/"
        payload = json.dumps({"email": email, "password": password}).encode("utf-8")
        for attempt in range(1, max_retries + 1):
            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data.get("access")
            except Exception as exc:
                if attempt == max_retries:
                    print(f"[AVERTISSEMENT] Impossible d'obtenir le token pour {email}: {exc}")
                    return None
                time.sleep(1.0)
        return None

    def fetch_sample_slug(self) -> str:
        """Récupère dynamiquement le slug de la première fiche de la galerie."""
        url = f"{self.base_url}/api/gallery/fiches/"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("results") if isinstance(data, dict) else data
                if results and len(results) > 0:
                    slug = results[0].get("slug")
                    if slug:
                        return slug
        except Exception:
            pass
        return self.sample_slug

    def initialize(self):
        """Initialise les tokens d'authentification et les métadonnées de test."""
        print(f"Connexion au serveur CIAT sur {self.base_url}...")
        self.porteur_token = self.obtain_token("porteur@ciat.sn", "Ciat2026!")
        self.coordo_token = self.obtain_token("coordo@ciat.sn", "Ciat2026!")
        self.sample_slug = self.fetch_sample_slug()
        print(f"  + Token porteur      : {'OK' if self.porteur_token else 'ÉCHEC'}")
        print(f"  + Token coordonnateur: {'OK' if self.coordo_token else 'ÉCHEC'}")
        print(f"  + Fiche échantillon  : {self.sample_slug}")

    def execute_request(
        self,
        method: str,
        path: str,
        token: Optional[str] = None,
        data: Optional[bytes] = None,
        timeout: float = 15.0,
    ) -> Tuple[int, float, Optional[str]]:
        """Exécute une requête HTTP unitaire et mesure sa durée exacte en millisecondes."""
        url = f"{self.base_url}{path}"
        headers = {
            "Accept": "application/json",
            "User-Agent": "CIAT-LoadTest/1.0",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if data:
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        t_start = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                _ = response.read()
                duration_ms = (time.perf_counter() - t_start) * 1000.0
                return response.status, duration_ms, None
        except urllib.error.HTTPError as http_err:
            duration_ms = (time.perf_counter() - t_start) * 1000.0
            return http_err.code, duration_ms, None
        except Exception as exc:
            duration_ms = (time.perf_counter() - t_start) * 1000.0
            return 0, duration_ms, str(exc)

    def benchmark_route(
        self,
        name: str,
        method: str,
        path: str,
        token: Optional[str] = None,
        data: Optional[bytes] = None,
        concurrency: int = 5,
        total_requests: int = 200,
    ) -> Dict:
        """Lance une campagne de charge sur une route pour un niveau de concurrence donné."""
        durations: List[float] = []
        status_counts: Dict[int, int] = {}
        error_count = 0

        t_global_start = time.perf_counter()

        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [
                executor.submit(self.execute_request, method, path, token, data)
                for _ in range(total_requests)
            ]
            for future in concurrent.futures.as_completed(futures):
                status_code, dur_ms, err = future.result()
                durations.append(dur_ms)
                status_counts[status_code] = status_counts.get(status_code, 0) + 1
                if status_code >= 500 or status_code == 0:
                    error_count += 1

        t_global_end = time.perf_counter()
        total_wall_time = max(t_global_end - t_global_start, 0.001)

        median_ms = statistics.median(durations) if durations else 0.0
        p95_ms = calculate_percentile(durations, 95.0)
        mean_ms = statistics.mean(durations) if durations else 0.0
        throughput = total_requests / total_wall_time

        return {
            "name": name,
            "path": path,
            "concurrency": concurrency,
            "total_requests": total_requests,
            "durations": durations,
            "median_ms": median_ms,
            "p95_ms": p95_ms,
            "mean_ms": mean_ms,
            "min_ms": min(durations) if durations else 0.0,
            "max_ms": max(durations) if durations else 0.0,
            "throughput": throughput,
            "status_counts": status_counts,
            "errors": error_count,
            "wall_time": total_wall_time,
        }


def format_table(results_by_concurrency: Dict[int, List[Dict]]) -> str:
    """Génère un tableau comparatif formaté en Markdown clair et lisible."""
    lines = []
    lines.append("| Route | Clients | Req. | Erreurs / 429 | Médiane (ms) | p95 (ms) | Débit (req/s) |")
    lines.append("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |")

    for conc, routes in results_by_concurrency.items():
        for r in routes:
            # Affichage des erreurs ou status 429
            status_summary = []
            c429 = r["status_counts"].get(429, 0)
            if c429 > 0:
                status_summary.append(f"{c429} lim.")
            errs = r["errors"]
            if errs > 0:
                status_summary.append(f"{errs} err.")
            status_str = ", ".join(status_summary) if status_summary else "0"

            lines.append(
                f"| {r['name']} | **{conc}** | {r['total_requests']} | {status_str} | "
                f"{r['median_ms']:.1f} | {r['p95_ms']:.1f} | **{r['throughput']:.1f}** |"
            )

    return "\n".join(lines)


def run_benchmark(
    base_url: str = "http://127.0.0.1:8000",
    concurrencies: List[int] = None,
    requests_per_test: int = 200,
    output_md: Optional[str] = None,
) -> Dict[int, List[Dict]]:
    """Exécute la campagne complète de mesure de charge sur les 6 routes."""
    if concurrencies is None:
        concurrencies = [5, 20, 50]

    bench = Benchmarker(base_url)
    bench.initialize()

    # Définition des 6 routes du protocole de test
    routes_def = [
        {
            "name": "Actualités (public)",
            "method": "GET",
            "path": "/api/portal/actualites/",
            "token": None,
            "data": None,
        },
        {
            "name": "Galerie (public)",
            "method": "GET",
            "path": "/api/gallery/fiches/",
            "token": None,
            "data": None,
        },
        {
            "name": "Détail Fiche (public)",
            "method": "GET",
            "path": f"/api/gallery/fiches/{bench.sample_slug}/",
            "token": None,
            "data": None,
        },
        {
            "name": "Connexion (auth throttle)",
            "method": "POST",
            "path": "/api/auth/token/",
            "token": None,
            "data": json.dumps({"email": "porteur@ciat.sn", "password": "Ciat2026!"}).encode("utf-8"),
        },
        {
            "name": "Dossiers (porteur)",
            "method": "GET",
            "path": "/api/incubator/dossiers/",
            "token": bench.porteur_token,
            "data": None,
        },
        {
            "name": "Indicateurs (coordonnateur)",
            "method": "GET",
            "path": "/api/analytics/indicateurs/",
            "token": bench.coordo_token,
            "data": None,
        },
    ]

    all_results: Dict[int, List[Dict]] = {}

    print("\n" + "=" * 70)
    print(f" DÉBUT DE LA CAMPAGNE DE CHARGE CIAT ({requests_per_test} req. par palier)")
    print("=" * 70)

    for conc in concurrencies:
        print(f"\n>>> Palier : {conc} clients simultanés ({requests_per_test} requêtes par route)...")
        all_results[conc] = []

        for rdef in routes_def:
            print(f"  - Test de {rdef['name']:<28} ... ", end="", flush=True)
            res = bench.benchmark_route(
                name=rdef["name"],
                method=rdef["method"],
                path=rdef["path"],
                token=rdef["token"],
                data=rdef["data"],
                concurrency=conc,
                total_requests=requests_per_test,
            )
            all_results[conc].append(res)
            c200 = res["status_counts"].get(200, 0)
            c429 = res["status_counts"].get(429, 0)
            print(
                f"Médiane: {res['median_ms']:>6.1f} ms | p95: {res['p95_ms']:>6.1f} ms | "
                f"Débit: {res['throughput']:>5.1f} req/s | Statuts: [200: {c200}, 429: {c429}]"
            )

    print("\n" + "=" * 70)
    print(" RÉSULTATS SYNTHÉTIQUES (FORMAT TABLEAU MARKDOWN)")
    print("=" * 70)
    table_str = format_table(all_results)
    print(table_str)

    if output_md:
        try:
            with open(output_md, "w", encoding="utf-8") as f:
                f.write(table_str + "\n")
            print(f"\nRésultats enregistrés dans {output_md}")
        except Exception as exc:
            print(f"Erreur lors de l'enregistrement de {output_md}: {exc}")

    return all_results


def main():
    parser = argparse.ArgumentParser(
        description="Mesure des performances sous charge légère sur l'API CIAT."
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="URL de base du backend Django (défaut: http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--concurrency",
        nargs="+",
        type=int,
        default=[5, 20, 50],
        help="Niveaux de concurrence (clients simultanés, défaut: 5 20 50)",
    )
    parser.add_argument(
        "--requests",
        type=int,
        default=200,
        help="Nombre total de requêtes par palier et par route (défaut: 200)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Fichier de sortie Markdown pour stocker le tableau de résultats",
    )
    args = parser.parse_args()

    run_benchmark(
        base_url=args.base_url,
        concurrencies=args.concurrency,
        requests_per_test=args.requests,
        output_md=args.output,
    )


if __name__ == "__main__":
    main()
