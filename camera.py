"""Ma caméra — logiciel local pour caméra IP (Blurams ou autre caméra RTSP/ONVIF).

Lancement :  python camera.py
Puis ouvre  http://localhost:8080  dans ton navigateur.
"""
import signal
import socket
import sys

from camlocale import config
from camlocale.direct import Direct
from camlocale.enregistreur import Enregistreur, Nettoyeur
from camlocale.web import creer_app


def ip_locale():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def main():
    chemin = sys.argv[1] if len(sys.argv) > 1 else "config.json"
    cfg = config.charger(chemin)

    enregistreur = Enregistreur(cfg)
    nettoyeur = Nettoyeur(cfg)
    direct = Direct(cfg)
    for t in (enregistreur, nettoyeur, direct):
        t.start()

    def quitter(*_):
        print("\nArrêt en cours…")
        for t in (direct, nettoyeur, enregistreur):
            t.arreter()
        sys.exit(0)

    signal.signal(signal.SIGINT, quitter)
    signal.signal(signal.SIGTERM, quitter)

    port = cfg["port_web"]
    print("=" * 60)
    print(f" Enregistrements : {cfg['dossier_enregistrements']}")
    print(f" Interface       : http://localhost:{port}")
    print(f" Depuis un téléphone sur le même réseau : http://{ip_locale()}:{port}")
    print(" Ctrl+C pour arrêter.")
    print("=" * 60)
    app = creer_app(cfg, direct, enregistreur)
    app.run(host="0.0.0.0", port=port, threaded=True, use_reloader=False)


if __name__ == "__main__":
    main()
