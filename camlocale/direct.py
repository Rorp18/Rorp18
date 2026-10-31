"""Lecture du flux en direct (pour l'affichage) + détection de mouvement."""
import datetime
import json
import os
import threading
import time

os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")
import cv2  # noqa: E402


class Direct(threading.Thread):
    def __init__(self, cfg):
        super().__init__(daemon=True, name="direct")
        self.cfg = cfg
        self.dossier_mvt = os.path.join(cfg["dossier_enregistrements"], "mouvements")
        self.journal = os.path.join(self.dossier_mvt, "journal.jsonl")
        self._stop = threading.Event()
        self._verrou = threading.Lock()
        self._jpeg = None
        self.num_image = 0
        self.connecte = False
        self.dernier_mouvement = None
        self._fond = None
        self._derniere_alerte = 0.0

    # --- accès à la dernière image -------------------------------------------------
    def image_jpeg(self):
        with self._verrou:
            return self._jpeg, self.num_image

    # --- détection de mouvement ----------------------------------------------------
    def _analyser(self, image):
        petite = cv2.resize(image, (320, int(320 * image.shape[0] / image.shape[1])))
        gris = cv2.GaussianBlur(cv2.cvtColor(petite, cv2.COLOR_BGR2GRAY), (21, 21), 0)
        if self._fond is None:
            self._fond = gris.astype("float")
            return
        diff = cv2.absdiff(gris, cv2.convertScaleAbs(self._fond))
        cv2.accumulateWeighted(gris, self._fond, 0.05)
        _, masque = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        pourcent = 100.0 * cv2.countNonZero(masque) / masque.size
        maintenant = time.time()
        if (
            pourcent >= self.cfg["seuil_mouvement_pourcent"]
            and maintenant - self._derniere_alerte >= self.cfg["pause_entre_alertes_secondes"]
        ):
            self._derniere_alerte = maintenant
            self._enregistrer_mouvement(image, pourcent)

    def _enregistrer_mouvement(self, image, pourcent):
        horodatage = datetime.datetime.now()
        nom = horodatage.strftime("%Y-%m-%d_%H-%M-%S") + ".jpg"
        cv2.imwrite(os.path.join(self.dossier_mvt, nom), image, [cv2.IMWRITE_JPEG_QUALITY, 85])
        evt = {"heure": horodatage.isoformat(timespec="seconds"), "image": nom,
               "intensite": round(pourcent, 1)}
        with open(self.journal, "a", encoding="utf-8") as f:
            f.write(json.dumps(evt) + "\n")
        self.dernier_mouvement = evt
        print(f"[mouvement] {evt['heure']} ({evt['intensite']} % de l'image)")

    def evenements(self, limite=200):
        if not os.path.exists(self.journal):
            return []
        with open(self.journal, encoding="utf-8") as f:
            lignes = f.readlines()[-limite:]
        evts = []
        for l in reversed(lignes):
            try:
                e = json.loads(l)
            except ValueError:
                continue
            if os.path.exists(os.path.join(self.dossier_mvt, e["image"])):
                evts.append(e)
        return evts

    # --- boucle principale ---------------------------------------------------------
    def run(self):
        url = self.cfg["camera_url_live"]
        while not self._stop.is_set():
            cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
            if not cap.isOpened():
                self.connecte = False
                print("[direct] Impossible d'ouvrir le flux, nouvel essai dans 5 s.")
                self._stop.wait(5)
                continue
            self.connecte = True
            print("[direct] Connecté au flux.")
            n = 0
            while not self._stop.is_set():
                ok, image = cap.read()
                if not ok:
                    break
                n += 1
                ok, jpeg = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 75])
                if ok:
                    with self._verrou:
                        self._jpeg = jpeg.tobytes()
                        self.num_image += 1
                # Analyse 1 image sur 3 : largement suffisant et léger pour le PC.
                if self.cfg["detection_mouvement"] and n % 3 == 0:
                    self._analyser(image)
            cap.release()
            self.connecte = False
            self._fond = None
            if not self._stop.is_set():
                print("[direct] Flux perdu, reconnexion…")
                self._stop.wait(3)

    def arreter(self):
        self._stop.set()
