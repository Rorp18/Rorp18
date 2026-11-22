# ☢️ CENDRES — jeu de survie coopératif

Jeu d'apocalypse au tour par tour, à jouer entre amis (2 à 6 joueurs), dans l'esprit de *60 Seconds* : ressources à gérer, cartes événement, rôles complémentaires, dés.

## Lancer
Ouvre simplement `index.html` dans un navigateur (aucune installation). Sur téléphone : `python3 -m http.server` dans ce dossier, puis ouvre l'adresse depuis le réseau local.

## Deux modes
- **🪑 Table commune** — un seul écran pour tout le groupe. Chaque matin : une carte Événement, on débat et on choisit. Puis chacun joue une action (fouiller, chasser, puiser, renforcer, soigner, rassurer, explorer, se reposer). Puis la nuit.
- **🧭 Destins séparés** — chacun vit une scène privée par jour (l'appareil circule) et poursuit un destin personnel en 3 étapes lié à son rôle. Le soir : rapport du camp, événement commun, puis la nuit.

## Contenu
- 4 scénarios : ❄️ L'Hiver Éternel, 🧟 La Horde, 🌊 La Grande Marée, 📡 Le Grand Silence (cartes événement spécifiques)
- 6 rôles avec caractéristiques et pouvoir : Médecin, Mécano, Chasseur, Éclaireur, Cuisinier, Ancien militaire
- 12 objets (équipement avec bonus et usages limités)
- 27 cartes événement, 12 scènes personnelles, 6 destins, butin aléatoire
- 3 durées : 8 / 12 / 16 jours

## Règles en bref
Jet = **2d6 + caractéristique + objets ≥ difficulté**. Double 6 = critique, double 1 = fiasco.
Chaque nuit : 1 🥫 + 1 💧 par survivant, froid (Hiver), puis une menace contre la 🛡️ Défense du camp.
Victoire : jauge d'objectif pleine. Défaite : tous morts ou 🕊️ Espoir à 0.

## Modifier le jeu
Tout le contenu (cartes, rôles, scénarios, objets) est dans `data.js`. Le moteur est dans `game.js`.
