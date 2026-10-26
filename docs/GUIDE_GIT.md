# Guide Git : comment travailler sur le dépôt

> Écrit pour toute l'équipe Teranga Labs, y compris pour ceux qui n'ont pas l'habitude de Git.
> Dépôt : https://github.com/lansanacoly7/CIAT

## Le principe en trois lignes

- **`main`** : on n'y touche pas jusqu'à la fin du développement. C'est la version finale.
- **`test`** : la branche de travail commune. Elle contient tout ce qui a été vérifié par Lansana.
- **Ta branche** : tu en crées une par tâche, à partir de `test`. C'est là, et seulement là, que tu travailles.

```
main  ───────────────────────────────────────────►  (version finale)
test  ──●──────────●──────────●─────────────────►  (ce qui est validé)
         \        ↗
          ta branche : feature/portal-annuaire  (ton travail)
```

Quand ta tâche est finie, tu **pousses ta branche** et tu **préviens Lansana**. Il vérifie ta branche :
- si c'est bon, il la fusionne dans `test` et te donne ta tâche suivante ;
- sinon, il te signale l'erreur et tu corriges **sur la même branche**, puis tu le préviens à nouveau.

## Première fois : récupérer le projet

```bash
git clone https://github.com/lansanacoly7/CIAT.git
cd CIAT
git checkout test
```

Ensuite, installe et lance le projet en suivant le `README.md`.

## Pour chaque nouvelle tâche

**1. Se mettre à jour sur `test`**
```bash
git checkout test
git pull origin test
```

**2. Créer ta branche** (le nom est donné dans ta fiche de tâches)
```bash
git checkout -b feature/portal-annuaire
```

**3. Travailler, puis enregistrer régulièrement**
```bash
git add .
git commit -m "Ajoute la page annuaire avec recherche et filtres"
```
Fais de petits commits avec un message clair, en français, qui dit ce que tu as fait. Ne mélange pas plusieurs tâches dans une même branche.

**4. Pousser ta branche**
```bash
git push -u origin feature/portal-annuaire
```
Les fois suivantes, `git push` suffit.

**5. Prévenir Lansana** : « Ma tâche T3 est finie, branche `feature/portal-annuaire` ».

## Si Lansana demande des corrections

Tu restes sur ta branche, tu corriges, tu enregistres et tu pousses :
```bash
git checkout feature/portal-annuaire
# ... corrections ...
git add .
git commit -m "Corrige le filtre par cohorte"
git push
```
Puis tu le préviens. Il revérifie la même branche.

## Si `test` a avancé pendant que tu travaillais

D'autres branches ont été fusionnées dans `test`. Pour récupérer leur travail dans ta branche :
```bash
git checkout test
git pull origin test
git checkout feature/portal-annuaire
git merge test
```
S'il y a un conflit (Git te l'indique), ne le résous pas au hasard : demande de l'aide à Lansana.

## Avant de prévenir Lansana : vérifie ton travail

- **Back-end** : `python manage.py check`, `python manage.py makemigrations --check`, `python manage.py test`
- **Front-end** : `npm run lint` et `npm run build`

Si une commande échoue, corrige avant de prévenir.

## Règles à ne jamais enfreindre

1. **Jamais de travail ni de `git push` sur `main` ou `test`.** Seul Lansana y fusionne.
2. **Jamais de secret dans Git** : pas de fichier `.env`, pas de clé d'API, pas de mot de passe réel. Le fichier `.env` est déjà ignoré : ne force pas son ajout.
3. **Jamais de `git push --force`** et jamais de `git reset --hard` sans en parler à Lansana.
4. **Une tâche, une branche.** Ne réutilise pas une branche pour une autre tâche.
5. **Reste dans ton périmètre.** Si tu dois modifier un fichier d'un autre module (par exemple `apps/core`), préviens Lansana avant.
6. **Les formats d'API sont fixés** dans `taches/CONTRATS_API.md`. Ne les change pas sans prévenir : d'autres codent dessus.

## En cas de problème

| Situation | Que faire |
|---|---|
| J'ai commité sur `test` ou `main` par erreur | Ne pousse pas. Préviens Lansana. |
| J'ai poussé un secret (clé, mot de passe) | Préviens Lansana tout de suite : il faut changer la clé, supprimer le fichier de Git ne suffit pas. |
| Git affiche un conflit que je ne comprends pas | Arrête-toi et demande à Lansana. |
| Je ne sais plus sur quelle branche je suis | `git branch` (la branche active est marquée d'une étoile) |
| Je veux voir ce que j'ai modifié | `git status` puis `git diff` |
