# Guide Git : comment travailler sur le dépôt

> Écrit pour toute l'équipe Teranga Labs, y compris pour ceux qui n'ont pas l'habitude de Git.
> Dépôt : https://github.com/lansanacoly7/CIAT

## Le principe : une branche par personne

- **`main`** : on n'y touche pas jusqu'à la fin du développement. C'est la version finale.
- **`test`** : la branche commune. Elle contient ce que Lansana a vérifié.
- **Ta branche personnelle** : une seule, à ton nom, créée une fois à partir de `test`. **Tout ton travail va sur cette branche**, tâche après tâche. Pas de branche par fonctionnalité : on ne pollue pas le dépôt.

| Personne | Branche personnelle |
|---|---|
| Lansana | `dev-lansana-coly` |
| Ibrahima | `Kalz` |
| Pathé | `pathe` |
| Maimouna | `dev-maimouna` |
| Alioune | `Alioune` |
| Massogui | `dev-massogui` |

**Le circuit :**
1. Tu travailles sur ta branche personnelle et tu pousses.
2. Tu préviens Lansana : « Ma tâche T2 est finie, sur ma branche ».
3. Il vérifie. Si c'est bon, il fusionne ta branche dans `test` et te donne ta tâche suivante.
4. Sinon, il te signale l'erreur : tu corriges **sur ta même branche**, tu pousses et tu le préviens à nouveau.

Un commit par tâche (ou plusieurs petits commits), avec un message clair qui nomme la tâche : c'est ce qui permet de retrouver qui a fait quoi.

## Première fois : récupérer le projet

```bash
git clone https://github.com/lansanacoly7/CIAT.git
cd CIAT
git checkout test
git checkout -b dev-maimouna          # remplace par le nom de ta branche personnelle
git push -u origin dev-maimouna
```
Si ta branche personnelle existe déjà (Ibrahima, Pathé, Alioune, Massogui…), fais seulement `git checkout <ta-branche>` puis `git pull`.

Ensuite, installe et lance le projet en suivant le `README.md`.

## Au quotidien

**Au début de chaque tâche, récupère le travail validé des autres :**
```bash
git checkout <ta-branche>
git pull origin <ta-branche>
git merge origin/test
```

**Pendant le travail, enregistre régulièrement :**
```bash
git add .
git commit -m "T2 : ajoute les endpoints d'indicateurs par domaine"
git push
```

**Quand la tâche est finie, vérifie puis préviens Lansana :**
- Back-end : `python manage.py check`, `python manage.py makemigrations --check`, `python manage.py test`
- Front-end : `npm run lint` et `npm run build`

Si une commande échoue, corrige avant de prévenir.

## Règles à ne jamais enfreindre

1. **Jamais de `git push` sur `main`, `test` ni sur la branche personnelle d'un autre.** Tu pousses sur ta branche, et seul Lansana fusionne dans `test`.
2. **Jamais de secret dans Git** : pas de fichier `.env`, pas de clé d'API, pas de mot de passe réel. Le fichier `.env` est déjà ignoré : ne force pas son ajout.
3. **Jamais de `git push --force`**, jamais de `git reset --hard` et jamais de suppression de branche sans en parler à Lansana.
4. **Ne crée pas d'autres branches** que ta branche personnelle.
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
