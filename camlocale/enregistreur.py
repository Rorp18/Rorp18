"""Enregistrement continu du flux de la caméra en fichiers MP4 découpés.

On utilise ffmpeg en mode "copie" : la vidéo n'est pas ré-encodée, donc le PC
ne travaille presque pas, et la qualité est celle d'origine de la caméra.
"""
import os
import shutil
import subprocess
import threading
import time


class Enregistreur(threading.Thread):
    def __init__(self, cfg):
        super().__init__(daemon=True, name="enregistreur")
        self.cfg = cfg
        self.dossier = cfg["dossier_enregistrements"]
        self._stop = threading.Event()
        self._proc = None
        self.etat = "démarrage"
        self.derniere_erreur = ""

    def _commande(self):
        url = self.cfg["camera_url"]
        cmd = [self.cfg["ffmpeg"], "-hide_banner", "-loglevel", "error", "-nostdin"]
        if url.startswith("rtsp://"):
            cmd += ["-rtsp_transport", "tcp", "-timeout", "10000000"]
        cmd += ["-i", url, "-map", "0:v:0"]
        if self.cfg["enregistrer_audio"]:
            # L'audio des caméras (souvent G.711) n'est pas compatible MP4 : on le convertit en AAC.
            cmd += ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "64k"]
        cmd += [
            "-c:v", "copy",
            "-f", "segment",
            "-segment_time", str(int(self.cfg["duree_segment_minutes"] * 60)),
            "-segment_format", "mp4",
            "-segment_format_options", "movflags=+faststart",
            "-reset_timestamps", "1",
            "-strftime", "1",
            os.path.join(self.dossier, "%Y-%m-%d_%H-%M-%S.mp4"),
        ]
        return cmd

    def run(self):
        attente = 2
        while not self._stop.is_set():
            debut = time.time()
            self.etat = "connexion"
            try:
                self._proc = subprocess.Popen(
                    self._commande(), stderr=subprocess.PIPE, stdout=subprocess.DEVNULL
                )
            except FileNotFoundError:
                self.etat = "erreur"
                self.derniere_erreur = (
                    "ffmpeg introuvable. Installe-le ou indique son chemin dans config.json."
                )
                print("[enregistreur]", self.derniere_erreur)
                return
            self.etat = "enregistrement"
            print("[enregistreur] Enregistrement démarré.")
            _, err = self._proc.communicate()
            if self._stop.is_set():
                break
            self.etat = "reconnexion"
            self.derniere_erreur = (err or b"").decode(errors="replace").strip()[-500:]
            print(f"[enregistreur] Flux coupé, nouvelle tentative dans {attente}s. {self.derniere_erreur}")
            # Si ça a tourné longtemps, on repart d'un délai court ; sinon on espace les essais.
            attente = 2 if time.time() - debut > 60 else min(attente * 2, 60)
            self._stop.wait(attente)
        self.etat = "arrêté"

    def arreter(self):
        self._stop.set()
        if self._proc and self._proc.poll() is None:
            self._proc.terminate()
            try:
                self._proc.wait(10)
            except subprocess.TimeoutExpired:
                self._proc.kill()


class Nettoyeur(threading.Thread):
    """Supprime les vieux enregistrements (âge maximum + espace disque minimum)."""

    def __init__(self, cfg):
        super().__init__(daemon=True, name="nettoyeur")
        self.cfg = cfg
        self._stop = threading.Event()

    def _fichiers(self):
        d = self.cfg["dossier_enregistrements"]
        fichiers = []
        for sous in ("", "mouvements"):
            base = os.path.join(d, sous)
            for nom in os.listdir(base):
                chemin = os.path.join(base, nom)
                if os.path.isfile(chemin) and nom.endswith((".mp4", ".jpg")):
                    fichiers.append((os.path.getmtime(chemin), chemin))
        return sorted(fichiers)

    def nettoyer(self):
        limite = time.time() - self.cfg["conservation_jours"] * 86400
        fichiers = self._fichiers()
        for mtime, chemin in list(fichiers):
            if mtime < limite:
                os.remove(chemin)
                fichiers.remove((mtime, chemin))
        min_libre = self.cfg["espace_disque_min_go"] * 1024**3
        # On garde toujours les 2 plus récents (dont celui en cours d'écriture).
        while len(fichiers) > 2 and shutil.disk_usage(self.cfg["dossier_enregistrements"]).free < min_libre:
            _, chemin = fichiers.pop(0)
            print(f"[nettoyeur] Disque presque plein, suppression de {os.path.basename(chemin)}")
            os.remove(chemin)

    def run(self):
        while not self._stop.is_set():
            try:
                self.nettoyer()
            except OSError as e:
                print("[nettoyeur]", e)
            self._stop.wait(300)

    def arreter(self):
        self._stop.set()
