"""Chargement de la configuration (config.json)."""
import json
import os
import shutil
import sys

DEFAUTS = {
    "camera_url": "",
    "camera_url_live": "",
    "dossier_enregistrements": "enregistrements",
    "duree_segment_minutes": 10,
    "enregistrer_audio": True,
    "conservation_jours": 7,
    "espace_disque_min_go": 5,
    "detection_mouvement": True,
    "seuil_mouvement_pourcent": 1.5,
    "pause_entre_alertes_secondes": 20,
    "port_web": 8080,
    "utilisateur_web": "",
    "mot_de_passe_web": "",
    "ffmpeg": "ffmpeg",
}


def charger(chemin="config.json"):
    if not os.path.exists(chemin):
        if os.path.exists("config.exemple.json"):
            shutil.copy("config.exemple.json", chemin)
            print(f"[config] {chemin} créé à partir de config.exemple.json.")
            print("[config] Ouvre-le et mets l'adresse RTSP de ta caméra dans 'camera_url'.")
        sys.exit(1)
    with open(chemin, encoding="utf-8") as f:
        cfg = {**DEFAUTS, **json.load(f)}
    if not cfg["camera_url"] or "UTILISATEUR:MOTDEPASSE" in cfg["camera_url"]:
        print("[config] 'camera_url' n'est pas configuré dans config.json.")
        print("[config] Lance d'abord :  python decouvrir.py  pour trouver ta caméra.")
        sys.exit(1)
    if not cfg["camera_url_live"]:
        cfg["camera_url_live"] = cfg["camera_url"]
    cfg["dossier_enregistrements"] = os.path.abspath(cfg["dossier_enregistrements"])
    os.makedirs(cfg["dossier_enregistrements"], exist_ok=True)
    os.makedirs(os.path.join(cfg["dossier_enregistrements"], "mouvements"), exist_ok=True)
    return cfg
