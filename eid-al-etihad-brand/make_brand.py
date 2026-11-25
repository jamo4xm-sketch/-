"""3D printable pieces from the official Eid Al Etihad logomark (negative version: white logo on black),
with red accents (frames / rings) - 3 colours as layers: black -> white -> red (same stack as ../uae-national-day).

Sources: src/vertical.png and src/horizontal.png, rendered at 1200 dpi from the brand pack
("Eid Al Etihad_Logo and Variations_RGB.pdf", pages 1 and 2). The logo shape is not altered,
only very thin strokes are thickened slightly so a 0.4 mm nozzle can print them.

Usage: python3 make_brand.py --profiles /path/to/BambuStudio/resources/profiles/BBL
"""
import argparse, os, sys, json
import numpy as np, cv2
from PIL import Image
from shapely.geometry import Point, box
from shapely.ops import unary_union
from shapely import affinity

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "uae-national-day"))
import make_uae as U  # noqa: E402

RES = 40          # px per mm when tracing
MIN_STROKE = 0.5  # mm, thinner white strokes get thickened


def logo(name, width_mm, cx=0.0, cy=0.0):
    img = Image.open(os.path.join(HERE, "src", f"{name}.png")).convert("L")
    a = np.array(img) < 128
    ys, xs = np.nonzero(a)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.uint8) * 255
    h, w = a.shape
    W = int(round(width_mm * RES))
    H = int(round(h * W / w))
    m = cv2.resize(a, (W, H), interpolation=cv2.INTER_AREA)
    m = (m > 127).astype(np.uint8)
    m = cv2.copyMakeBorder(m, 40, 40, 40, 40, cv2.BORDER_CONSTANT, value=0)
    k = int(MIN_STROKE * RES) | 1
    opened = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    thin = m & (1 - opened)
    grow = cv2.dilate(thin, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    m = np.maximum(m, grow & cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))))
    g = U.trace(m)
    g = affinity.scale(g, 1 / RES, -1 / RES, origin=(0, 0))
    b = g.bounds
    g = affinity.translate(g, cx - (b[0] + b[2]) / 2, cy - (b[1] + b[3]) / 2)
    return g.simplify(0.015)


def frame(shape, inset, width):
    return shape.buffer(-inset).difference(shape.buffer(-inset - width))


# ---------------- designs ----------------
def keychain_vertical():
    """Square-ish keychain, vertical lock-up, red frame (like the official framed lock-up)."""
    W, H = 38, 36
    body = U.rounded_rect(W, H, 4)
    ring, hole = U.ring_tab(0, H / 2 + 1.8)
    base = unary_union([body, ring]).difference(hole)
    white = logo("vertical", 26, 0, -0.2)
    red = frame(U.rounded_rect(W, H, 4), 1.5, 1.2)
    return base, white, red


def keychain_horizontal():
    """Long keychain / bag tag, horizontal lock-up, red frame."""
    W, H = 74, 24
    body = U.rounded_rect(W, H, 4)
    ring, hole = U.ring_tab(-W / 2 - 1.8, 0)
    base = unary_union([body, ring]).difference(hole)
    white = logo("horizontal", 62, 1.0, 0)
    red = frame(body, 1.4, 1.1)
    return base, white, red


def badge_round():
    """Round medallion with keyring, vertical lock-up, red ring."""
    R = 24
    disc = Point(0, 0).buffer(R, resolution=96)
    ring, hole = U.ring_tab(0, R + 2.2)
    base = unary_union([disc, ring]).difference(hole)
    white = logo("vertical", 30, 0, -0.5)
    red = frame(disc, 1.5, 1.3)
    return base, white, red


def plaque():
    """Desk / fridge plaque 120 x 56, horizontal lock-up, double frame (white inner, red outer)."""
    W, H = 120, 56
    body = U.rounded_rect(W, H, 6)
    white = unary_union([logo("horizontal", 98, 0, 0), frame(body, 5.0, 0.8)])
    red = frame(body, 2.0, 1.6)
    return body, white, red


DESIGNS = {
    "01_keychain_vertical": keychain_vertical,
    "02_keychain_horizontal": keychain_horizontal,
    "03_badge_round": badge_round,
    "04_plaque_horizontal": plaque,
}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--profiles")
    a = ap.parse_args()
    profs = U.load_profiles(a.profiles) if a.profiles else None
    for name, fn in DESIGNS.items():
        od = os.path.join(HERE, "out", name)
        os.makedirs(od, exist_ok=True)
        base, white, red = fn()
        mesh, white, red = U.build_mesh(base, white, red)
        mesh.export(os.path.join(od, f"{name}.stl"))
        U.preview(base, white, red, os.path.join(od, f"{name}_preview.png"))
        w, d = mesh.extents[:2]
        pos = U.full_bed(w, d)
        if profs:
            for ams in (True, False):
                tag = "AMS" if ams else "noAMS"
                U.write_3mf(mesh, os.path.join(od, f"{name}_single_{tag}.3mf"), profs, ams, [(128.0, 128.0)])
                U.write_3mf(mesh, os.path.join(od, f"{name}_FULLBED_{len(pos)}pcs_{tag}.3mf"), profs, ams, pos)
        grams = mesh.volume / 1000 * 1.24 * 0.8
        print(f"{name}: {w:.1f} x {d:.1f} x {mesh.extents[2]:.1f} mm, ~{grams:.1f} g, full bed {len(pos)} pcs, watertight={mesh.is_watertight}")
