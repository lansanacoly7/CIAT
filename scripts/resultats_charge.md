| Route | Clients | Req. | Erreurs / 429 | Médiane (ms) | p95 (ms) | Débit (req/s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Actualités (public) | **5** | 200 | 141 lim. | 311.6 | 679.2 | **12.4** |
| Galerie (public) | **5** | 200 | 200 lim. | 174.4 | 371.4 | **25.9** |
| Détail Fiche (public) | **5** | 200 | 200 lim. | 235.1 | 375.8 | **20.5** |
| Connexion (auth throttle) | **5** | 200 | 197 lim. | 230.2 | 415.3 | **16.5** |
| Dossiers (porteur) | **5** | 200 | 0 | 246.0 | 399.3 | **20.4** |
| Indicateurs (coordonnateur) | **5** | 200 | 0 | 234.3 | 340.3 | **22.2** |
| Actualités (public) | **20** | 200 | 139 lim., 1 err. | 457.6 | 1774.0 | **29.1** |
| Galerie (public) | **20** | 200 | 200 lim. | 478.1 | 1791.1 | **25.9** |
| Détail Fiche (public) | **20** | 200 | 198 lim., 2 err. | 555.6 | 2039.2 | **24.7** |
| Connexion (auth throttle) | **20** | 200 | 182 lim., 13 err. | 1548.0 | 3769.9 | **10.2** |
| Dossiers (porteur) | **20** | 200 | 18 err. | 1446.4 | 3598.8 | **11.6** |
| Indicateurs (coordonnateur) | **20** | 200 | 4 err. | 1040.8 | 2512.6 | **13.7** |
| Actualités (public) | **50** | 200 | 122 lim., 18 err. | 1170.1 | 2626.9 | **30.2** |
| Galerie (public) | **50** | 200 | 186 lim., 14 err. | 703.6 | 2632.2 | **32.9** |
| Détail Fiche (public) | **50** | 200 | 179 lim., 21 err. | 1069.3 | 2495.6 | **26.8** |
| Connexion (auth throttle) | **50** | 200 | 179 lim., 16 err. | 1532.0 | 3282.6 | **14.4** |
| Dossiers (porteur) | **50** | 200 | 36 err. | 1233.1 | 2680.5 | **24.1** |
| Indicateurs (coordonnateur) | **50** | 200 | 31 lim., 28 err. | 1648.1 | 3116.4 | **21.9** |
