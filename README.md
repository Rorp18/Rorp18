# 🐾 Ma caméra : logiciel local pour caméra de surveillance

Ce logiciel remplace le cloud de la caméra (Blurams ou toute caméra **RTSP/ONVIF**).
Tout reste chez toi, sans abonnement et sans internet :

- 📺 **direct** dans le navigateur (PC ou téléphone sur le même réseau)
- 💾 **enregistrement en continu** sur le PC, en fichiers MP4 de 10 min (sans ré-encodage, donc peu de charge pour le PC)
- 🐕 **détection de mouvement** avec photo et accès direct au bon moment de la vidéo
- 🧹 **suppression automatique** des vieux fichiers (au bout de X jours ou quand le disque est presque plein)
- 📷 photo instantanée, lecture accélérée (x2, x4, x8), téléchargement des vidéos

## 1. Relier la caméra au PC sans internet

La caméra doit être sur le **même réseau local** que le PC, mais ce réseau n'a **pas besoin d'internet**. Trois solutions :

1. **Un vieux routeur ou une box sans abonnement** : branche le PC en câble (ou en Wi-Fi) et connecte la caméra au Wi-Fi du routeur. C'est la solution la plus fiable.
2. **Point d'accès Wi-Fi du PC** (Windows : *Paramètres → Réseau → Point d'accès mobile*). La caméra se connecte au Wi-Fi créé par le PC.
3. **Câble Ethernet** directement entre la caméra et le PC, si ta caméra a une prise réseau.

> ⚠️ La **première configuration** (choix du Wi-Fi, activation du RTSP) se fait avec l'appli Blurams sur le téléphone. Si ton téléphone a des données mobiles, il pourra faire cette étape même si le réseau Wi-Fi n'a pas internet. Ensuite on n'a plus besoin de l'appli.

## 2. Activer le RTSP / ONVIF sur la caméra

Dans l'appli Blurams, va dans les **paramètres de la caméra** et cherche une option **RTSP** ou **ONVIF** (souvent dans *Paramètres avancés*). Active-la et choisis un **identifiant et un mot de passe RTSP**.
Selon le modèle et la version du firmware, cette option n'existe pas toujours : mets la caméra à jour depuis l'appli si tu ne la vois pas. **Sans RTSP/ONVIF, aucun logiciel tiers ne peut lire la caméra** (le flux est alors chiffré vers les serveurs Blurams).

### Cas particulier des caméras Blurams

D'après l'aide officielle de Blurams, leurs caméras **ne proposent pas de RTSP** et ne fonctionnent qu'avec l'appli et le cloud. Ce qu'on peut tenter :

1. **Voir ce que ta caméra expose en local.** Relie-la à un réseau sans internet (voir étape 1), puis lance :
   `decouvrir.bat --ports <IP_CAMERA>`
   Le scan teste les 65 535 ports et reconnaît les flux RTSP ou les images HTTP/MJPEG. Si une adresse marquée ✔ apparaît, mets-la dans `camera_url`.
2. **Carte microSD.** La caméra peut enregistrer sur une carte microSD. On peut ensuite la lire sur le PC, à condition que la caméra enregistre bien sans connexion et que ses fichiers soient lisibles.
3. **Partage de connexion du téléphone (4G).** L'appli Blurams fonctionne alors normalement, mais ça consomme des données et reste dépendant du cloud.
4. **Caméra compatible RTSP/ONVIF.** Si rien de ce qui précède ne marche, c'est la solution fiable : par exemple TP-Link Tapo C200/C210 (RTSP à activer dans l'appli) ou les caméras Reolink. Ce logiciel fonctionne directement avec elles.

## 3. Installer (Windows)

1. Installe **Python 3** : <https://www.python.org/downloads/> (coche *« Add Python to PATH »*).
2. Installe **ffmpeg** : dans un terminal, `winget install ffmpeg` (ou télécharge-le sur <https://www.gyan.dev/ffmpeg/builds/> et indique le chemin de `ffmpeg.exe` dans `config.json`).
3. Télécharge ce dossier.

(Sur Mac/Linux : `pip install -r requirements.txt` et installe ffmpeg avec ton gestionnaire de paquets.)

## 4. Trouver l'adresse de la caméra

Double-clique sur **`decouvrir.bat`** (ou `python decouvrir.py`) : il affiche les caméras trouvées sur le réseau.
Puis teste les adresses vidéo avec l'IP trouvée et l'identifiant RTSP :

```
decouvrir.bat 192.168.1.50 admin monmotdepasse
```

Il affiche les adresses qui marchent, par exemple `rtsp://admin:monmotdepasse@192.168.1.50:554/live/ch0`.

## 5. Configurer et lancer

1. Copie `config.exemple.json` en `config.json` (c'est fait automatiquement au premier lancement).
2. Mets l'adresse trouvée dans `camera_url`.
3. Double-clique sur **`demarrer.bat`**, puis ouvre <http://localhost:8080>.

Pour qu'il démarre tout seul avec Windows : mets un raccourci de `demarrer.bat` dans le dossier `shell:startup` (touche Windows + R, tape `shell:startup`).

## Réglages (`config.json`)

| Réglage | Rôle |
|---|---|
| `camera_url` | Adresse RTSP du flux principal (enregistré) |
| `camera_url_live` | Adresse pour le direct et la détection (mets le flux « sub », plus léger). Vide = même que `camera_url` |
| `dossier_enregistrements` | Où ranger les vidéos (ex : `D:/Camera`) |
| `duree_segment_minutes` | Durée de chaque fichier vidéo |
| `enregistrer_audio` | Enregistrer le son |
| `conservation_jours` | Les vidéos plus vieilles sont supprimées |
| `espace_disque_min_go` | Supprime les plus vieilles vidéos si le disque descend sous cette limite |
| `detection_mouvement` | Activer la détection de mouvement |
| `seuil_mouvement_pourcent` | % de l'image qui doit changer pour déclencher (plus petit = plus sensible ; monte-le si les changements de lumière déclenchent trop) |
| `pause_entre_alertes_secondes` | Délai minimum entre deux alertes |
| `port_web` | Port de l'interface |
| `utilisateur_web` / `mot_de_passe_web` | Protège l'interface par mot de passe (conseillé si d'autres personnes utilisent le réseau) |
| `ffmpeg` | Chemin de ffmpeg s'il n'est pas dans le PATH |

## Problèmes fréquents

- **« Caméra déconnectée »** : vérifie l'adresse avec `decouvrir.py`, que la caméra et le PC sont sur le même réseau, et l'identifiant/mot de passe RTSP.
- **La vidéo ne se lit pas dans le navigateur** : si la caméra filme en **H.265**, certains navigateurs ne savent pas le lire. Le fichier est bon : ouvre-le avec **VLC** (bouton « Télécharger »), ou choisis H.264 dans les réglages de la caméra.
- **Le direct a quelques secondes de retard** : c'est normal avec le RTSP.
- **Trop d'alertes** : augmente `seuil_mouvement_pourcent` (ex : 3).
