"""Trouve la caméra sur le réseau local et teste les adresses RTSP courantes.

Usage :
    python decouvrir.py                         -> cherche les caméras (ONVIF + port 554)
    python decouvrir.py 192.168.1.50 admin mdp  -> teste les adresses RTSP sur cette IP
    python decouvrir.py --ports 192.168.1.50    -> scanne TOUS les ports de la caméra
                                                   (pour voir ce qu'elle expose vraiment)
"""
import ipaddress
import re
import socket
import subprocess
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor

# Chemins RTSP fréquemment utilisés par les caméras grand public (Blurams et autres).
CHEMINS = [
    "/live/ch0", "/live/ch1", "/live/ch00_0", "/live/ch00_1", "/ch0", "/ch1",
    "/live", "/live/main", "/live/sub", "/stream1", "/stream2", "/onvif1", "/onvif2",
    "/11", "/12", "/h264", "/h264_stream", "/ch0_0.h264", "/av0_0", "/main", "/sub",
    "/cam/realmonitor?channel=1&subtype=0", "/Streaming/Channels/101", "/",
]
PORTS = [554, 8554, 10554]


def ip_locale():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def onvif_decouverte(attente=3):
    """Envoie une sonde WS-Discovery : les caméras ONVIF répondent avec leur adresse."""
    msg = f"""<?xml version="1.0" encoding="UTF-8"?>
<e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope"
 xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing"
 xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery"
 xmlns:dn="http://www.onvif.org/ver10/network/wsdl">
<e:Header><w:MessageID>uuid:{uuid.uuid4()}</w:MessageID>
<w:To>urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>
<w:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action></e:Header>
<e:Body><d:Probe><d:Types>dn:NetworkVideoTransmitter</d:Types></d:Probe></e:Body>
</e:Envelope>""".encode()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    s.settimeout(attente)
    trouves = {}
    try:
        s.sendto(msg, ("239.255.255.250", 3702))
        while True:
            data, (ip, _) = s.recvfrom(65535)
            xaddrs = re.findall(rb"XAddrs>([^<]+)<", data)
            trouves[ip] = xaddrs[0].decode() if xaddrs else ""
    except (socket.timeout, OSError):
        pass
    finally:
        s.close()
    return trouves


def port_ouvert(ip, port, attente=0.4):
    try:
        with socket.create_connection((ip, port), timeout=attente):
            return True
    except OSError:
        return False


def scanner_reseau(ip):
    reseau = ipaddress.ip_network(ip + "/24", strict=False)
    cibles = [(str(h), p) for h in reseau.hosts() for p in PORTS if str(h) != ip]
    with ThreadPoolExecutor(128) as ex:
        res = ex.map(lambda c: (c, port_ouvert(*c)), cibles)
        return [c for c, ok in res if ok]


def tester_rtsp(url):
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-rtsp_transport", "tcp", "-timeout", "5000000",
             "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height",
             "-of", "csv=p=0", url],
            capture_output=True, text=True, timeout=10,
        )
        return r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None


def tester_ip(ip, utilisateur="", mdp=""):
    auth = f"{utilisateur}:{mdp}@" if utilisateur else ""
    ports = [p for p in PORTS if port_ouvert(ip, p, 1)] or [554]
    print(f"Test des adresses RTSP sur {ip} (ports {ports})…")
    ok = []
    for port in ports:
        for chemin in CHEMINS:
            url = f"rtsp://{auth}{ip}:{port}{chemin}"
            info = tester_rtsp(url)
            if info:
                print(f"  ✔ {url}   -> {info}")
                ok.append(url)
    if ok:
        print("\nCopie l'une de ces adresses dans 'camera_url' de config.json.")
        print("(La plus grande résolution pour l'enregistrement ; tu peux mettre la plus petite")
        print(" dans 'camera_url_live' pour soulager le PC.)")
    else:
        print("\nAucune adresse ne répond. Vérifie que le RTSP/ONVIF est activé dans l'appli")
        print("de la caméra, ainsi que l'identifiant et le mot de passe RTSP.")


CHEMINS_HTTP = ["/video.mjpg", "/video.mjpg?q=30&fps=33&id=0.5", "/mjpeg", "/snapshot.jpg",
                "/snap.jpg", "/image.jpg", "/tmpfs/auto.jpg", "/cgi-bin/snapshot.cgi", "/"]


def scanner_ports(ip):
    """Scanne les 65535 ports TCP de la caméra et essaie de reconnaître ce qui répond."""
    print(f"Scan de tous les ports de {ip} (environ 1 minute)…")
    with ThreadPoolExecutor(400) as ex:
        ouverts = [p for p, ok in ex.map(lambda p: (p, port_ouvert(ip, p, 0.5)), range(1, 65536)) if ok]
    if not ouverts:
        print("Aucun port ouvert : la caméra n'accepte aucune connexion locale.")
        return
    for port in ouverts:
        print(f"\n  Port {port} ouvert")
        # RTSP ?
        try:
            with socket.create_connection((ip, port), timeout=2) as s:
                s.sendall(f"OPTIONS rtsp://{ip}:{port}/ RTSP/1.0\r\nCSeq: 1\r\n\r\n".encode())
                rep = s.recv(512)
            if rep.startswith(b"RTSP/"):
                print("    -> serveur RTSP ! Teste :  python decouvrir.py", ip, "<utilisateur> <mdp>")
                continue
        except OSError:
            rep = b""
        # HTTP ?
        for chemin in CHEMINS_HTTP:
            try:
                with socket.create_connection((ip, port), timeout=2) as s:
                    s.sendall(f"GET {chemin} HTTP/1.0\r\nHost: {ip}\r\n\r\n".encode())
                    rep = s.recv(1024)
            except OSError:
                break
            if not rep.startswith(b"HTTP/"):
                break
            entete = rep.split(b"\r\n\r\n")[0].decode(errors="replace")
            ligne1 = entete.splitlines()[0]
            type_ = next((l for l in entete.splitlines() if l.lower().startswith("content-type")), "")
            print(f"    http://{ip}:{port}{chemin}  -> {ligne1}  {type_}")
            if "image" in type_.lower() or "multipart" in type_.lower():
                print("    ✔ IMAGE/VIDÉO trouvée ! Mets cette adresse dans camera_url.")
        if rep and not rep.startswith((b"HTTP/", b"RTSP/")):
            print(f"    protocole inconnu, début de réponse : {rep[:60]!r}")


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == "--ports":
        scanner_ports(sys.argv[2])
        return
    if len(sys.argv) >= 2:
        tester_ip(sys.argv[1], *(sys.argv[2:4]))
        return
    ip = ip_locale()
    print(f"Ton PC : {ip or 'pas de réseau !'}")
    print("Recherche ONVIF…")
    for cam_ip, adr in onvif_decouverte().items():
        print(f"  Caméra ONVIF : {cam_ip}  {adr}")
    if ip:
        print("Recherche des appareils avec un port vidéo (RTSP) ouvert…")
        for cam_ip, port in scanner_reseau(ip):
            print(f"  Port RTSP ouvert : {cam_ip}:{port}")
    print("\nEnsuite :  python decouvrir.py <IP_CAMERA> <utilisateur> <mot_de_passe>")


if __name__ == "__main__":
    main()
