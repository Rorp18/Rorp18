# Passation — projet CENDRES (jeu de survie)

Document pour toute IA ou personne qui reprend le projet. Langue du jeu et des échanges : français.

## 1. Où est quoi
- Dépôt : `rorp18/rorp18`, branche **`claude/exciting-lovelace-rwpgul`** (le code est dans `jeu-apocalypse/`, rien n'est sur `main`).
- `index.html`, `style.css`, `data.js` (cartes, rôles, scénarios, objets), `game.js` (moteur). Site statique, sans dépendance : ouvrir `index.html`.
- Version en ligne, privée (compte de l'utilisateur) : https://claude.ai/artifact/DycEE8srpj5zEM1EmrvDqz (non accessible à une autre IA).
- Le dossier parent du dépôt contient un logiciel de caméra IP sans rapport (`camera.py`, etc.) : à ignorer.

## 2. État actuel (v1, « classique »)
Jeu de survie coopératif à cartes et dés, 2 à 6 joueurs, deux modes (table commune, destins séparés), 4 scénarios, 6 rôles, 27 événements, 12 scènes, 6 destins. Testé avec des bots aléatoires (aucune erreur JS, équilibrage correct). Pas testé avec de vrais joueurs.
Règle de base : jet = 2d6 + caractéristique + objets ≥ difficulté (double 6 = critique, double 1 = fiasco).

## 3. Ce que l'utilisateur veut maintenant
La v1 lui paraît trop classique. Il veut un jeu **solo** où **l'IA génère l'histoire à la volée**, différente à chaque partie, tout en restant stricte (le héros ne doit pas survivre à tout).

### Décisions de conception retenues
**Narration et temps**
- Deux niveaux de tours : **gros tours** (jour, météo, grands déplacements) et **petits tours** (micro-actions horaires : fouille, gestion d'abri). Un budget d'heures par jour ; quand il est épuisé, on passe au gros tour.
- Pas d'arbre figé : l'IA génère à partir de l'état du monde et des règles de la catastrophe.
- Le joueur reçoit des descriptions sensorielles **non triées** (indices vitaux mêlés aux détails triviaux) et doit analyser.
- Aléas (tempêtes, maladies, rencontres, pannes) et **probabilités d'échec progressives** (ex. ne pas monter la garde augmente le risque de vol à chaque tour).

**Modes**
- Démarrage **à l'aveugle** (catastrophe sans contexte, à déduire) ou **scénario connu** (utile à plusieurs).
- Difficulté **bienveillant** (indices implicites, quelques bouées discrètes après de grosses erreurs au début) ou **réaliste** (aucun coup de pouce, oublis d'eau ou de sécurité potentiellement fatals).
- Formats : **Évacuation** (≈10 jours) ; **Survie longue** (après 10 jours, ellipses de mois ou d'années, gestion durable des ressources).
- Apocalypses : panne technologique généralisée, hiver volcanique, crise d'approvisionnement.

**Direction artistique**
- Illustrations stylisées (peint ou dessiné, pas de photoréalisme), générées **uniquement pour la branche choisie**, avec indices visuels exploitables, strictement cohérentes avec le texte.
- Pré-génération de l'image de la prochaine destination pendant un micro-événement.

**Technique**
- Modèle léger et rapide (Claude Haiku) pour la narration courante ; état du monde condensé avec résumés périodiques pour économiser les tokens.

## 4. Architecture recommandée (proposée, à valider)
Principe : **le code est l'arbitre, l'IA est le conteur.**
- Le code possède l'état et les règles : PV, inventaire, ressources, horloge, lieu, jets de dés, **horloges de risque cachées**. L'IA ne modifie rien elle-même.
- L'IA renvoie du **JSON strict** : narration, détails sensoriels étiquetés (vital/trivial), options, effets proposés, niveau de danger estimé. Le code valide, lance les dés, applique, puis l'IA raconte le résultat sans le contredire.
- **Bible secrète de la catastrophe** générée au lancement (règles, chronologie, conséquences) et stockée dans l'état, pour la cohérence et le mode aveugle. Les **faits établis** sont mémorisés et ne peuvent pas être contredits.
- **Variété par le code** : graine de partie tirée au hasard (lieu, déclencheur, trait du héros, secret, fil rouge), contrainte de scène imposée (calme, danger, découverte, dilemme, perte), liste d'interdits (noms, lieux déjà utilisés).
- **Directeur de rythme** en code (courbe de tension) selon la situation du joueur.
- **Mémoire** : état du monde + résumé glissant + 2-3 dernières scènes + fiches des PNJ.
- Bienveillant/réaliste = un seul paramètre (nombre de bouées autorisées, 0 en réaliste).
- État et moteur dans le navigateur (sauvegarde locale). Un **relais Cloudflare Worker** garde les clés API et limite les appels par joueur. Jamais de clé dans la page.
- **Images** : Claude ne génère pas d'images, il faut un service d'images séparé (coût et latence). Méthode : l'IA produit une **liste de faits visuels** qui sert à écrire le texte ET le prompt d'image ; 1 ou 2 indices exploitables par image. Alternative gratuite pour commencer : scènes en SVG composées par l'IA.

## 5. Plan proposé
1. **Prototype texte seul** : horloge heures/jours, bible secrète, horloges de risque, bienveillant/réaliste, narration via Haiku. À construire à côté de la v1 (garder la version cartes).
2. Visuels (SVG, puis vraies illustrations).
3. Survie longue (ellipses saisonnières), puis multijoueur.

## 6. Questions encore ouvertes
- L'utilisateur a-t-il une clé d'API Anthropic ? Sinon, voir si une page hébergée peut appeler Claude sans clé pour le prototype.
- Que veut-il dire par « animation avec Haiku » (modèle, ou animations visuelles) ?
- Saisie libre ou choix uniquement ? Ton visé : sombre et réaliste, ou pulp et décalé ?
- Hébergement : Cloudflare Pages (glisser le dossier) pour le site, un Worker pour le relais. Pas encore déployé.
