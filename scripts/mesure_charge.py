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

Conformément à la directive de révision de Phase 6 (taches/phase6/pathe_correction.md),
ce script sépare rigoureusement :
- Les mesures de service réelles (HTTP 200) sans être faussées par des refus rapides 429.
- L'analyse du comportement du mécanisme de limitation de débit (Throttling).
- Le support des serveurs WSGI (runserver et waitress).

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
    """Calcule un centile précis (ex: 95e centile) sur une liste de durées."""
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

    def obtain_token(self, email: str, password: str, max_retries: int = 5) -> Optional[str]:
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
        timeout: float = 60.0,
    ) -> Tuple[int, float, Optional[str]]:
        """Exécute une requête HTTP unitaire et mesure sa durée exacte en millisecondes."""
        url = f"{self.base_url}{path}"
        headers = {
            "Accept": "application/json",
            "User-Agent": "CIAT-LoadTest/1.0",
            "Connection": "close",
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
        durations_all: List[float] = []
        durations_ok: List[float] = []
        durations_throttled: List[float] = []
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
                durations_all.append(dur_ms)
                status_counts[status_code] = status_counts.get(status_code, 0) + 1

                if 200 <= status_code < 400:
                    durations_ok.append(dur_ms)
                elif status_code == 429:
                    durations_throttled.append(dur_ms)
                else:
                    error_count += 1

        t_global_end = time.perf_counter()
        total_wall_time = max(t_global_end - t_global_start, 0.001)

        # Métriques calculées sur les requêtes traitées avec succès (vrai temps de service)
        target_durations = durations_ok if durations_ok else durations_all
        median_ms = statistics.median(target_durations) if target_durations else 0.0
        p95_ms = calculate_percentile(target_durations, 95.0)
        mean_ms = statistics.mean(target_durations) if target_durations else 0.0
        throughput = len(durations_ok) / total_wall_time if durations_ok else total_requests / total_wall_time

        return {
            "name": name,
            "path": path,
            "concurrency": concurrency,
            "total_requests": total_requests,
            "count_200": len(durations_ok),
            "count_429": len(durations_throttled),
            "durations_ok": durations_ok,
            "durations_all": durations_all,
            "median_ms": median_ms,
            "p95_ms": p95_ms,
            "mean_ms": mean_ms,
            "min_ms": min(target_durations) if target_durations else 0.0,
            "max_ms": max(target_durations) if target_durations else 0.0,
            "throughput": throughput,
            "status_counts": status_counts,
            "errors": error_count,
            "wall_time": total_wall_time,
        }


def format_table_service(results_by_concurrency: Dict[int, List[Dict]], server_name: str = "Serveur") -> str:
    """Génère le tableau 'Temps de réponse sans limitation de débit' (vraies performances de service)."""
    lines = []
    lines.append(f"### Temps de réponse sous charge (Service réel sans limitation — {server_name})\n")
    lines.append("| Route | Clients | Requêtes | 200 OK | Erreurs | Médiane (ms) | p95 (ms) | Débit effectif (req/s) |")
    lines.append("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |")

    for conc, routes in results_by_concurrency.items():
        for r in routes:
            errs = r["errors"]
            c200 = r["count_200"]
            lines.append(
                f"| {r['name']} | **{conc}** | {r['total_requests']} | {c200} | {errs} | "
                f"{r['median_ms']:.1f} | {r['p95_ms']:.1f} | **{r['throughput']:.1f}** |"
            )

    return "\n".join(lines)


def format_table_throttling(results_by_concurrency: Dict[int, List[Dict]]) -> str:
    """Génère le tableau 'Comportement de la limitation de débit (Throttling)'."""
    lines = []
    lines.append("### Comportement de la limitation de débit (Throttling de production)\n")
    lines.append("| Route | Clients | Requêtes | 200 Traitées | 429 Bloquées | Taux rejet (%) | Seuil théorique prod |")
    lines.append("| :--- | :---: | :---: | :---: | :---: | :---: | :--- |")

    for conc, routes in results_by_concurrency.items():
        for r in routes:
            c200 = r["count_200"]
            c429 = r["count_429"]
            total = r["total_requests"]
            taux = (c429 / total * 100.0) if total > 0 else 0.0

            # Détermination du seuil configuré
            if "Connexion" in r["name"]:
                seuil = "5 / minute (`auth`)"
            elif "Dossiers" in r["name"] or "Indicateurs" in r["name"]:
                seuil = "300 / minute (`user`)"
            else:
                seuil = "60 / minute (`anon`)"

            lines.append(
                f"| {r['name']} | **{conc}** | {total} | {c200} | **{c429}** | {taux:.1f} % | {seuil} |"
            )

    return "\n".join(lines)


def run_benchmark(
    base_url: str = "http://127.0.0.1:8000",
    concurrencies: List[int] = None,
    requests_per_test: int = 200,
    server_name: str = "Waitress WSGI",
    output_md: Optional[str] = None,
    output_throttling_md: Optional[str] = None,
    routes: Optional[List[str]] = None,
) -> Dict[int, List[Dict]]:
    """Exécute la campagne complète de mesure de charge sur les 6 routes."""
    if concurrencies is None:
        concurrencies = [5, 20, 50]

    bench = Benchmarker(base_url)
    bench.initialize()

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

    if routes:
        mots = [r.lower() for r in routes]
        routes_def = [r for r in routes_def if any(m in r["name"].lower() for m in mots)]

    all_results: Dict[int, List[Dict]] = {}

    print("\n" + "=" * 70)
    print(f" CAMPAGNE DE CHARGE CIAT : {requests_per_test} req/test sur {server_name}")
    print("=" * 70)

    for conc in concurrencies:
        print(f"\n>>> Palier : {conc} clients simultanés ({requests_per_test} requêtes par route)...")
        all_results[conc] = []

        for rdef in routes_def:
            # Renouvellement systématique des jetons d'accès pour éviter l'expiration (durée 30 min)
            token = rdef["token"]
            if token:
                if "porteur" in rdef["name"]:
                    token = bench.obtain_token("porteur@ciat.sn", "Ciat2026!") or token
                elif "coordonnateur" in rdef["name"]:
                    token = bench.obtain_token("coordo@ciat.sn", "Ciat2026!") or token

            print(f"  - Test de {rdef['name']:<28} ... ", end="", flush=True)
            res = bench.benchmark_route(
                name=rdef["name"],
                method=rdef["method"],
                path=rdef["path"],
                token=token,
                data=rdef["data"],
                concurrency=conc,
                total_requests=requests_per_test,
            )
            all_results[conc].append(res)
            c200 = res["count_200"]
            c429 = res["count_429"]
            errs = res["errors"]
            print(
                f"Médiane: {res['median_ms']:>6.1f} ms | p95: {res['p95_ms']:>6.1f} ms | "
                f"Débit: {res['throughput']:>5.1f} req/s | [200: {c200}, 429: {c429}, err: {errs}]"
            )

    print("\n" + "=" * 70)
    print(" RÉSULTATS SYNTHÉTIQUES DE CHARGE")
    print("=" * 70)
    table_service = format_table_service(all_results, server_name=server_name)
    print(table_service)

    if output_md:
        try:
            with open(output_md, "w", encoding="utf-8") as f:
                f.write(table_service + "\n")
            print(f"\nRésultats de service enregistrés dans {output_md}")
        except Exception as exc:
            print(f"Erreur lors de l'enregistrement de {output_md}: {exc}")

    if output_throttling_md:
        try:
            table_throttling = format_table_throttling(all_results)
            with open(output_throttling_md, "w", encoding="utf-8") as f:
                f.write(table_throttling + "\n")
            print(f"Résultats de limitation enregistrés dans {output_throttling_md}")
        except Exception as exc:
            print(f"Erreur lors de l'enregistrement de {output_throttling_md}: {exc}")

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
        "--server",
        default="Waitress WSGI",
        help="Nom descriptif du serveur testé (défaut: Waitress WSGI)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Fichier de sortie Markdown pour stocker le tableau de temps de service",
    )
    parser.add_argument(
        "--output-throttling",
        default=None,
        help="Fichier de sortie Markdown pour stocker le tableau de limitation de débit",
    )
    parser.add_argument(
        "--routes",
        default=None,
        help="Routes à tester, séparées par des virgules (ex: dossiers,indicateurs)",
    )
    args = parser.parse_args()

    run_benchmark(
        base_url=args.base_url,
        concurrencies=args.concurrency,
        requests_per_test=args.requests,
        server_name=args.server,
        output_md=args.output,
        output_throttling_md=args.output_throttling,
        routes=[r.strip() for r in args.routes.split(",") if r.strip()] if args.routes else None,
    )


if __name__ == "__main__":
    main()
