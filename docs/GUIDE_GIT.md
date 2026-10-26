# Guide Git : comment travailler sur le dépôt

> Écrit pour toute l'équipe Teranga Labs, y compris pour ceux qui n'ont pas l'habitude de Git.
> Dépôt : https://github.com/lansanacoly7/CIAT

## Le principe

- **`main`** : on n'y touche pas jusqu'à la fin du développement. C'est la version finale.
- **`test`** : la branche commune. Elle contient ce que Lansana a vérifié.
- **Ta branche personnelle** : une branche à ton nom, créée une seule fois à partir de `test`. Elle contient tout ton travail.
- **Tes branches de fonctionnalité** : une par tâche, créées **à partir de ta branche personnelle**. C'est là que tu écris le code.

| Personne | Branche personnelle |
|---|---|
| Lansana | `dev-lansana-coly` |
| Ibrahima | `Kalz` |
| Pathé | `pathe` |
| Maimouna | `dev-maimouna` |
| Alioune | `Alioune` |
| Massogui | `dev-massogui` |

```
main
test
 ├─ Alioune                    (ta branche personnelle)
 │    ├─ feature/analytics-api     (une tâche)
 │    └─ feature/analytics-graphiques   (une autre tâche)
 └─ dev-massogui
      └─ feature/portal-annuaire-ui
```

**Le circuit :**
1. Tu travailles et tu pousses ta branche de fonctionnalité.
2. Tu préviens Lansana : « Ma tâche est finie, branche `feature/...` ».
3. Il la vérifie. Si c'est bon, il la fusionne dans **ta branche personnelle**, puis ta branche personnelle dans `test`.
4. Sinon, il te signale l'erreur : tu corriges **sur la même branche** de fonctionnalité et tu le préviens à nouveau.
5. Ta branche de fonctionnalité **n'est jamais supprimée** après la fusion : elle reste sur GitHub comme preuve de ce que tu as développé, et permet de retrouver ton travail pour le mettre sous `test`.

## Première fois : récupérer le projet et créer ta branche personnelle

```bash
git clone https://github.com/lansanacoly7/CIAT.git
cd CIAT
git checkout test
git checkout -b Alioune          # remplace par le nom de ta branche personnelle
git push -u origin Alioune
```
Si ta branche personnelle existe déjà (Ibrahima, Pathé), fais seulement `git checkout Kalz` ou `git checkout pathe`, puis `git pull`.

Ensuite, installe et lance le projet en suivant le `README.md`.

## Pour chaque nouvelle tâche

**1. Mettre ta branche personnelle à jour**
```bash
git checkout Alioune
git pull origin Alioune
git merge origin/test        # récupère le travail validé des autres
```

**2. Créer ta branche de fonctionnalité** (le nom est donné dans ta fiche de tâches)
```bash
git checkout -b feature/analytics-api
```

**3. Travailler, puis enregistrer régulièrement**
```bash
git add .
git commit -m "Ajoute les endpoints d'indicateurs par domaine"
```
Fais de petits commits avec un message clair en français. Une tâche = une branche de fonctionnalité.

**4. Pousser**
```bash
git push -u origin feature/analytics-api
```
Les fois suivantes, `git push` suffit.

**5. Prévenir Lansana** : « Ma tâche T2 est finie, branche `feature/analytics-api` ».

## Si Lansana demande des corrections

Tu restes sur ta branche de fonctionnalité :
```bash
git checkout feature/analytics-api
# ... corrections ...
git add .
git commit -m "Corrige le filtre par cohorte"
git push
```
Puis tu le préviens. Il revérifie la même branche.

## Avant de prévenir Lansana : vérifie ton travail

- **Back-end** : `python manage.py check`, `python manage.py makemigrations --check`, `python manage.py test`
- **Front-end** : `npm run lint` et `npm run build`

Si une commande échoue, corrige avant de prévenir.

## Règles à ne jamais enfreindre

1. **Jamais de `git push` sur `main`, `test` ni sur la branche personnelle d'un autre.** Tu pousses sur tes branches de fonctionnalité, et seul Lansana fusionne.
2. **Jamais de secret dans Git** : pas de fichier `.env`, pas de clé d'API, pas de mot de passe réel. Le fichier `.env` est déjà ignoré : ne force pas son ajout.
3. **Jamais de `git push --force`** et jamais de `git reset --hard` sans en parler à Lansana.
4. **Une tâche, une branche de fonctionnalité.** Ne réutilise pas une branche pour une autre tâche.
5. **Reste dans ton périmètre.** Si tu dois modifier un fichier d'un autre module (par exemple `apps/core`) ou un réglage (`config/settings.py`), préviens Lansana avant.
6. **Les formats d'API sont fixés** dans `taches/CONTRATS_API.md`. Ne les change pas sans prévenir.
7. **Ne reformate pas les fichiers existants** (fins de ligne, indentation) : le dépôt est géré par `.gitattributes`.

## En cas de problème

| Situation | Que faire |
|---|---|
| J'ai commité sur `test` ou `main` par erreur | Ne pousse pas. Préviens Lansana. |
| J'ai poussé un secret (clé, mot de passe) | Préviens Lansana tout de suite : il faut changer la clé. Supprimer le fichier de Git ne suffit pas. |
| Git affiche un conflit que je ne comprends pas | Arrête-toi et demande à Lansana. |
| Je ne sais plus sur quelle branche je suis | `git branch` (la branche active est marquée d'une étoile) |
| Je veux voir ce que j'ai modifié | `git status` puis `git diff` |
