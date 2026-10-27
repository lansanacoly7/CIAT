# Optimisation des performances des listes et élimination des requêtes N+1 — CIAT

Ce document synthétise les résultats des profils de requêtes SQL, les optimisations architecturales apportées (jointures anticipées `select_related`, préchargements mémoire `prefetch_related`, indexation relationnelle) et le protocole de reproduction sur la plateforme CIAT (Phase 3 — Tâche T3).

---

## 1. Protocole de mesure et environnement de test

### Environnement de référence
- **Framework** : Django 5.2.18, Django REST Framework 3.15
- **Moteurs de base de données testés** :
  - **SQLite 3** (développement local et tests automatisés en mémoire / fichier)
  - **PostgreSQL 16** (cible recommandée pour la recette d'équipe et la production)
- **Suite de tests automatisée** : [`backend/apps/core/tests/test_performance.py`](../backend/apps/core/tests/test_performance.py)
- **Commande de reproduction** :
  ```powershell
  cd backend
  .\.venv\Scripts\python manage.py test apps.core.tests.test_performance
  ```

### Méthodologie et métriques distinguées
1. **Nombre de requêtes SQL (Prouvé formellement)** :
   Vérifié de manière déterministe via `self.assertNumQueries(...)` avec un jeu de données de test de 15 projets, 15 dossiers, 30 pièces jointes, 15 fiches d'innovation, 15 jalons, 15 actualités et 10 documents.
2. **Durée d'exécution SQL et temps de réponse HTTP (Estimations)** :
   Les temps en millisecondes dépendent des capacités matérielles du serveur hôte, de la latence réseau et de la charge concurrente. Les estimations fournies ci-dessous correspondent à un serveur de production standard avec pool de connexions (`conn_max_age=600`).
3. **Différences entre SQLite et PostgreSQL** :
   - SQLite n'engendre aucune latence réseau par requête (appels directs en mémoire C).
   - Sur PostgreSQL, chaque aller-retour SQL (Round-Trip Time) ajoute généralement 0,5 à 2 ms. Par conséquent, passer de 23 requêtes à 2 requêtes sur `/api/projets/` fait gagner plus de 30 ms de latence réseau brute sur PostgreSQL, là où le gain est principalement CPU sur SQLite.

---

## 2. Tableau comparatif Avant / Après

Les mesures comparent une liste contenant $N = 15$ à $20$ éléments par page.

| Endpoint | Nb requêtes Avant (N=20) | Complexité Avant | Nb requêtes Après | Complexité Après | Gain SQL | Temps estimé Après (PG) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/api/projets/` | 23 | $O(N)$ (porteur, domaine, cohorte) | **2** | $O(1)$ constant | **-91 %** | ~15 ms |
| `/api/incubator/dossiers/` | 23 | $O(N)$ (`values_list` sur pièces) | **3** | $O(1)$ constant | **-87 %** | ~20 ms |
| `/api/portal/actualites/` | 2 | $O(1)$ | **2** | $O(1)$ constant | Stable | ~8 ms |
| `/api/portal/projets-incubes/` | 42 | $O(N)$ (domaine, cohorte) | **2** | $O(1)$ constant | **-95 %** | ~12 ms |
| `/api/gallery/fiches/` | 62 | $O(N)$ (projet, domaine, cohorte) | **2** | $O(1)$ constant | **-97 %** | ~14 ms |
| `/api/documents/` | 21 | $O(N)$ (dernière version par doc) | **2** | $O(1)$ constant | **-90 %** | ~16 ms |
| `/api/incubator/alertes/` | 21 | $O(N)$ (projet rattaché) | **1** | $O(1)$ constant | **-95 %** | ~9 ms |
| `/api/analytics/indicateurs/` | 3 | $O(1)$ | **2** | $O(1)$ constant | **-33 %** | ~18 ms |

---

## 3. Détail des optimisations techniques

### A. Élimination des pièges de `values_list()` sur relations préchargées
- **Problème identifié** : Dans le modèle `Dossier`, les propriétés `completude` et `pieces_manquantes` exécutaient `self.pieces.values_list("type", flat=True)`. Même avec `prefetch_related("pieces")`, appeler une méthode QuerySet (`.values_list()`, `.filter()`) sur un `RelatedManager` court-circuite le cache préchargé et émet une requête SQL supplémentaire par dossier sérialisé ($N$ requêtes).
- **Correctif apporté** :
  ```python
  @property
  def pieces_manquantes(self):
      types_deposes = {p.type for p in self.pieces.all()}
      return [p.value for p in PIECES_OBLIGATOIRES if p.value not in types_deposes]
  ```
  L'utilisation de `self.pieces.all()` réutilise intégralement le cache préchargé en mémoire vive sans requête additionnelle, tout en renvoyant un résultat strictement identique lorsqu'aucun prefetch n'a été fait.

### B. Optimisation de la version courante des documents
- **Problème identifié** : La sérialisation de la liste des documents (`/api/documents/`) lisait `document.version_courante`, qui appelait `self.versions.order_by("-numero").first()`, générant une requête SQL distincte pour chaque document.
- **Correctif apporté** :
  - Ajout de `.prefetch_related("versions")` dans `DocumentListView`.
  - Modification de `version_courante` pour inspecter le cache préchargé en priorité :
    ```python
    @property
    def version_courante(self):
        if hasattr(self, "_prefetched_objects_cache") and "versions" in self._prefetched_objects_cache:
            versions = self.versions.all()
            if versions:
                return max(v.numero for v in versions)
            return 1
        dv = self.derniere_version
        return dv.numero if dv else 1
    ```

### C. Jointures relationnelles ForeignKey (`select_related`)
- `/api/projets/` : `select_related("domaine", "cohorte", "porteur")` rassemble les informations indispensables au serializer en une seule jointure `LEFT OUTER JOIN` / `INNER JOIN`.
- `/api/portal/projets-incubes/` : `select_related("domaine", "cohorte")`.
- `/api/gallery/fiches/` : `select_related("projet", "projet__domaine", "projet__cohorte")`.
- `/api/incubator/alertes/` : `select_related("projet")`.

---

## 4. Index de base de données validés

Les index ont été ajoutés de façon ciblée sur les colonnes subissant des tris fréquents (`ORDER BY`) ou des filtres restrictifs (`WHERE`) pour éviter tout surcoût inutile en écriture :

| Modèle | Champ indexé | Migration | Justification métier et impact SQL |
| :--- | :--- | :--- | :--- |
| `core.Projet` | `statut` | `core.0002` | Filtre principal sur l'annuaire, l'incubateur et les analytics. |
| `core.Projet` | `cree_le` | `core.0002` | Tri chronologique par défaut (`ordering = ["-cree_le"]`). |
| `incubator.Dossier` | `statut` | `incubator.0007` | Filtre par statut (brouillon, soumis, en_evaluation, accepte, refuse). |
| `incubator.Dossier` | `cree_le` | `incubator.0007` | Tri chronologique de la file des candidatures. |
| `incubator.Jalon` | `echeance` | `incubator.0007` | Requêtes critiques d'alertes de retard (`echeance < TODAY`). |
| `incubator.Jalon` | `statut` | `incubator.0007` | Exclusion des jalons achevés (`exclude(statut='fait')`). |
| `incubator.Jalon` | `cree_le` | `incubator.0007` | Tri secondaire chronologique des jalons. |
| `incubator.Objectif` | `statut` | `incubator.0007` | Suivi d'avancement des objectifs. |
| `incubator.Objectif` | `echeance` | `incubator.0007` | Planification temporelle des objectifs. |
| `portal.Actualite` | `publie_le` | `portal.0003` | Tri d'affichage antéchronologique du portail public. |
| `portal.Evenement` | `debut` | `portal.0003` | Filtre des événements à venir (`debut >= NOW()`) et tri chronologique. |
| `portal.AppelProjet` | `date_limite` | `portal.0003` | Calcul dynamique du statut ouvert/clos (`date_limite < NOW()`). |
| `gallery.FicheInnovation` | `statut` | `gallery.0002` | Filtrage strict des fiches publiques (`statut = 'publie'`). |
| `gallery.FicheInnovation` | `cree_le` | `gallery.0002` | Tri chronologique des innovations. |
| `documents.Document` | `statut` | `documents.0003` | Workflow de validation et filtres documentaires. |
| `documents.Document` | `cree_le` | `documents.0003` | Tri chronologique de l'espace documentaire. |

---

## 5. Règles architecturales pour prévenir les régressions

1. **Toujours combiner `select_related` pour les ForeignKey directes** :
   Dès qu'un serializer affiche un champ lié (ex: `projet.domaine.nom` ou `user.get_full_name`), le queryset de la vue DOIT inclure `select_related("<relation>")`.
2. **Utiliser `prefetch_related` pour les collections 1-N et N-N** :
   Pour les listes de pièces, de jalons ou de commentaires rattachés, utiliser `prefetch_related("<relation>")`.
3. **Ne jamais appeler de sous-requêtes dans des propriétés Python sérialisées** :
   Dans une méthode `@property` d'un modèle appelée par un serializer, ne jamais écrire `self.relation.filter(...)` ou `self.relation.values(...)`. Privilégier des listes en mémoire (`[x for x in self.relation.all() if ...]`) pour bénéficier du cache Django.
4. **Verrouiller les listes avec `assertNumQueries` dans les tests** :
   Tout nouvel endpoint de liste doit s'accompagner d'un test unitaire `with self.assertNumQueries(...)` pour garantir qu'un ajout ultérieur ne réintroduise pas silencieusement de requêtes N+1.
