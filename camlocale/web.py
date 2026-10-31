"""Interface web locale : direct, enregistrements, mouvements."""
import datetime
import os
import re
import time
from functools import wraps

from flask import Flask, Response, abort, jsonify, render_template, request, send_from_directory

NOM_VIDEO = re.compile(r"^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})\.mp4$")


def creer_app(cfg, direct, enregistreur):
    app = Flask(__name__)
    dossier = cfg["dossier_enregistrements"]
    dossier_mvt = os.path.join(dossier, "mouvements")

    def protege(vue):
        @wraps(vue)
        def f(*a, **kw):
            if cfg["mot_de_passe_web"]:
                auth = request.authorization
                if not auth or auth.username != cfg["utilisateur_web"] or auth.password != cfg["mot_de_passe_web"]:
                    return Response("Identification requise", 401,
                                    {"WWW-Authenticate": 'Basic realm="Camera"'})
            return vue(*a, **kw)
        return f

    def liste_videos():
        videos = []
        for nom in sorted(os.listdir(dossier), reverse=True):
            m = NOM_VIDEO.match(nom)
            if not m:
                continue
            chemin = os.path.join(dossier, nom)
            videos.append({
                "nom": nom,
                "jour": m.group(1),
                "heure": f"{m.group(2)}:{m.group(3)}:{m.group(4)}",
                "taille_mo": round(os.path.getsize(chemin) / 1024**2, 1),
            })
        if videos and enregistreur.etat == "enregistrement":
            videos[0]["en_cours"] = True  # le plus récent est encore en train d'être écrit
        return videos

    @app.route("/")
    @protege
    def index():
        return render_template("index.html")

    @app.route("/api/etat")
    @protege
    def etat():
        videos = liste_videos()
        jours = {}
        for v in videos:
            jours.setdefault(v["jour"], []).append(v)
        return jsonify({
            "heure": datetime.datetime.now().isoformat(timespec="seconds"),
            "direct_connecte": direct.connecte,
            "enregistrement": enregistreur.etat,
            "erreur": enregistreur.derniere_erreur,
            "jours": jours,
            "mouvements": direct.evenements(),
            "detection": cfg["detection_mouvement"],
        })

    @app.route("/direct.mjpg")
    @protege
    def flux():
        def generer():
            dernier = -1
            while True:
                jpeg, num = direct.image_jpeg()
                if jpeg is not None and num != dernier:
                    dernier = num
                    yield (b"--image\r\nContent-Type: image/jpeg\r\nContent-Length: "
                           + str(len(jpeg)).encode() + b"\r\n\r\n" + jpeg + b"\r\n")
                time.sleep(0.08)
        return Response(generer(), mimetype="multipart/x-mixed-replace; boundary=image")

    @app.route("/photo.jpg")
    @protege
    def photo():
        jpeg, _ = direct.image_jpeg()
        if jpeg is None:
            abort(503)
        nom = datetime.datetime.now().strftime("photo_%Y-%m-%d_%H-%M-%S.jpg")
        return Response(jpeg, mimetype="image/jpeg",
                        headers={"Content-Disposition": f'inline; filename="{nom}"'})

    @app.route("/videos/<nom>")
    @protege
    def video(nom):
        if not NOM_VIDEO.match(nom):
            abort(404)
        return send_from_directory(dossier, nom, conditional=True,
                                   as_attachment=request.args.get("dl") == "1")

    @app.route("/mouvements/<nom>")
    @protege
    def image_mouvement(nom):
        if not nom.endswith(".jpg"):
            abort(404)
        return send_from_directory(dossier_mvt, nom)

    return app
