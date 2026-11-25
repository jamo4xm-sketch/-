"""UAE Union Day keychains, round 2 (ideas: name-outline keychain, burqa keychain, 3D-look '55', date plate).

Each design has its own colour stack (bottom -> top bands Z 0-1.6 / 1.6-2.4 / 2.4-3.0).
AMS slots are the same for every design: 1 = black, 2 = white, 3 = red.

Usage: python3 make_ideas.py --profiles /path/to/BambuStudio/resources/profiles/BBL
"""
import argparse, os, sys
import numpy as np
from shapely.geometry import Polygon, Point, box, LineString
from shapely.ops import unary_union
from shapely import affinity

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "uae-national-day"))
import make_uae as U  # noqa: E402

KUFI, LATIN = U.KUFI, U.LATIN
EMPTY = Polygon()


def outline(g, off=1.8):
    """Smooth sticker-style outline around a shape, internal gaps filled."""
    o = g.buffer(off + 1.0, resolution=24).buffer(-1.0, resolution=24)
    return unary_union([Polygon(p.exterior) for p in getattr(o, "geoms", [o])])


def name_keychain(ar, en):
    a = U.text_shape(ar, KUFI, 15, 0, 6, min_stroke=0.3, max_width=46)
    e = U.text_shape(en, LATIN, 7.5, 0, -8.5, max_width=44)
    txt = unary_union([a, e])
    base = outline(txt, 1.8)
    b = base.bounds
    ring, hole = U.ring_tab(b[2] - 1.0, b[3] - 2.5)
    base = unary_union([base, ring]).difference(hole)
    return base, txt, EMPTY          # white outline, red letters


def burqa():
    half = [(0, 16.8), (12, 17.4), (23.6, 18.8), (25.6, 17.0), (25.2, 4), (24.6, -3.2),
            (21.5, -4.6), (16.5, -6.2), (10.5, -8.6), (5.0, -12.2), (0, -17.5)]
    pts = half + [(-x, y) for x, y in reversed(half[1:-1])]
    shape = Polygon(pts).buffer(0.6, resolution=16).buffer(-0.6, resolution=16)
    eyes = [U.rounded_rect(18.6, 13.0, 2.4, s * 12.0, 7.0) for s in (-1, 1)]
    frame = shape.difference(unary_union(eyes))
    txt = affinity.rotate(U.text_shape("إماراتية", KUFI, 9, 0, 0, min_stroke=0.3, max_width=23), 18)
    txt = affinity.translate(txt, -11.0, 3.2)
    patch = outline(txt, 1.4)
    ring, hole = U.ring_tab(0, 19.2)
    base = unary_union([frame, patch, ring]).difference(hole)
    heart = U.heart(4.2, 13.5, -4.6)
    return base, unary_union([txt, heart]), heart   # black burqa, white text, red heart


def fiftyfive_3d():
    face = U.text_shape("55", LATIN, 22, 0, 0)
    d = np.array([-2.6, 2.6])
    side = unary_union([affinity.translate(face, *(d * t)) for t in np.linspace(0, 1, 14)])
    side = unary_union([side, face]).buffer(0.01)
    base = outline(side, 1.6)
    b = base.bounds
    ring, hole = U.ring_tab(b[2] - 2.0, b[3] - 1.0)
    base = unary_union([base, ring]).difference(hole)
    return base, side, face.buffer(-0.05)      # black outline, red depth, white face


def date_plate():
    W, H = 56, 30
    plate = U.rounded_rect(W, H, 3)
    ring, hole = U.ring_tab(W / 2 + 1.6, 0)
    base = unary_union([plate, ring]).difference(hole)
    frame = plate.buffer(-1.2).difference(plate.buffer(-2.3))
    px0, px1 = -W / 2 + 2.3, -W / 2 + 19.5
    panel = box(px0, -H / 2 + 2.3, px1, H / 2 - 2.3)
    panel_txt = unary_union([U.text_shape("٥٥", KUFI, 9.5, (px0 + px1) / 2, 3.2, min_stroke=0.3, max_width=12),
                             U.heart(5.0, (px0 + px1) / 2, -7.2)])
    cx = (px1 + W / 2 - 2.3) / 2
    divider = box(px1 + 1.2, -0.45, W / 2 - 3.4, 0.45)
    top = U.text_shape("٢ ديسمبر", KUFI, 7.4, cx, 6.6, min_stroke=0.3, max_width=30)
    bottom = U.text_shape("١٩٧١", KUFI, 8.4, cx, -6.6, min_stroke=0.3, max_width=26)
    red = panel.difference(panel_txt.buffer(0.15))
    black = unary_union([frame, divider, top, bottom, red])
    return base, black, red          # white plate, black frame/text, red panel (white shows through the cut-outs)


DESIGNS = {
    "01_emarati_name": (lambda: name_keychain("إماراتي", "Emarati"), ("white", "red")),
    "02_emaratiya_name": (lambda: name_keychain("إماراتية", "Emaratiya"), ("white", "red")),
    "03_burqa_emaratiya": (burqa, ("black", "white", "red")),
    "04_55_3d": (fiftyfive_3d, ("black", "red", "white")),
    "05_date_plate_1971": (date_plate, ("white", "black", "red")),
}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--profiles")
    a = ap.parse_args()
    profs = U.load_profiles(a.profiles) if a.profiles else None
    for name, (fn, stack) in DESIGNS.items():
        od = os.path.join(HERE, "out", name)
        os.makedirs(od, exist_ok=True)
        base, l2, l3 = fn()
        mesh, l2, l3 = U.build_mesh(base, l2, l3)
        mesh.export(os.path.join(od, f"{name}.stl"))
        U.preview(base, l2, l3, os.path.join(od, f"{name}_preview.png"), stack)
        w, d = mesh.extents[:2]
        pos = U.full_bed(w, d)
        if profs:
            for ams in (True, False):
                tag = "AMS" if ams else "noAMS"
                U.write_3mf(mesh, os.path.join(od, f"{name}_single_{tag}.3mf"), profs, ams, [(128.0, 128.0)], stack)
                U.write_3mf(mesh, os.path.join(od, f"{name}_FULLBED_{len(pos)}pcs_{tag}.3mf"), profs, ams, pos, stack)
        grams = mesh.volume / 1000 * 1.24 * 0.8
        print(f"{name}: {w:.1f} x {d:.1f} x {mesh.extents[2]:.1f} mm, ~{grams:.1f} g, bed {len(pos)} pcs, colours {'/'.join(stack)}, watertight={mesh.is_watertight}")
