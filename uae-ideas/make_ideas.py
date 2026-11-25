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
# closest free fonts to the reference keychain: rounded bold Arabic + bouncy Latin script
AR_ROUND = "/usr/share/fonts/truetype/kacst-one/KacstOne-Bold.ttf"
SCRIPT = "/usr/share/fonts/opentype/dancingscript/DancingScript-Bold.otf"
RUQAA = os.path.join(HERE, "fonts", "ArefRuqaa-Bold.ttf")   # OFL, github.com/google/fonts
EMPTY = Polygon()


def outline(g, off=1.8):
    """Smooth sticker-style outline around a shape, internal gaps filled."""
    o = g.buffer(off + 1.0, resolution=24).buffer(-1.0, resolution=24)
    return unary_union([Polygon(p.exterior) for p in getattr(o, "geoms", [o])])


def name_keychain(ar, en):
    a = U.text_shape(ar, AR_ROUND, 19, 0, 7.5, min_stroke=0.3, max_width=48)
    e = U.text_shape(en, SCRIPT, 12, 0.5, -8.0, max_width=46).buffer(0.12)   # thicken script hairlines a little
    txt = unary_union([a, e])
    base = outline(txt, 1.8)
    b = base.bounds
    ring, hole = U.ring_tab(b[2] - 0.8, b[3] - 1.2)
    base = unary_union([base, ring]).difference(hole)
    return base, txt, EMPTY          # white outline, coloured letters


def chaikin(pts, n=4, closed=True):
    """Smooth a polyline into a curve (Chaikin corner cutting)."""
    p = np.asarray(pts, float)
    for _ in range(n):
        q = np.roll(p, -1, axis=0) if closed else p[1:]
        a = p if closed else p[:-1]
        new = np.empty((len(a) * 2, 2))
        new[0::2] = 0.75 * a + 0.25 * q
        new[1::2] = 0.25 * a + 0.75 * q
        p = new if closed else np.vstack([pts[0], new, pts[-1]])
    return p


def burqa():
    """Emirati burqa (batoola): forehead band, curved eye openings either side of the 'seif'
    (nose stick), concave cheek pieces flaring out, pointed lip piece.
    Black burqa, thin white edge trim (like the stitched edge), 'إماراتية' across the middle."""
    half = [(0, 20.0), (8, 20.0), (18, 20.4), (26.5, 21.2), (29.2, 20.4), (29.0, 15.5), (28.0, 9.5),
            (27.6, 3.5), (28.4, -1.2), (29.2, -3.4), (26.0, -4.0), (21.5, -5.6), (16.5, -8.0),
            (11.5, -11.4), (7.2, -15.2), (3.6, -19.0), (1.2, -22.0), (0, -23.4)]
    pts = half + [(-x, y) for x, y in reversed(half[1:-1])]
    shape = Polygon(chaikin(pts, 3)).buffer(0)
    eye_r = [(2.0, 15.4), (8.0, 16.4), (15.0, 16.9), (21.5, 16.4), (25.2, 15.0), (25.6, 10.5), (25.0, 6.0),
             (22.0, 4.6), (16.5, 3.4), (10.5, 1.6), (5.6, -0.8), (2.8, -2.8)]
    eye_r = Polygon(chaikin(eye_r, 3)).buffer(0)
    eye_l = affinity.scale(eye_r, -1, 1, origin=(0, 0))
    eyes = unary_union([eye_l, eye_r])
    ring, hole = U.ring_tab(0, 22.4)
    base = unary_union([shape.difference(eyes), ring]).difference(hole)
    txt = U.text_shape("إماراتية", RUQAA, 8.2, 0, -8.6, max_width=23)
    trim = shape.buffer(-1.0).difference(shape.buffer(-1.8)).difference(txt.buffer(1.0))
    white = unary_union([trim, txt])
    return base, white, EMPTY          # black burqa, white trim + text


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


def stencil_shapes(height_mm, cx, bottom_y):
    """Sheikh Zayed stencil (src/zayed_stencil.png: 128 = black, 255 = white) -> (silhouette, white) in mm."""
    from PIL import Image
    import cv2
    a = np.array(Image.open(os.path.join(HERE, "src", "zayed_stencil.png")))
    ys, xs = np.nonzero(a)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    sc = height_mm / a.shape[0]
    pad = lambda m: cv2.copyMakeBorder(m.astype(np.uint8), 4, 4, 4, 4, cv2.BORDER_CONSTANT, value=0)
    out = []
    for m in (a > 0, a == 255):
        g = U.trace(pad(m))
        g = affinity.scale(affinity.translate(g, -4, -4), sc, -sc, origin=(0, 0))
        out.append(g)
    sil, white = out
    b = sil.bounds
    dx, dy = cx - (b[0] + b[2]) / 2, bottom_y - b[1]
    return [affinity.translate(g, dx, dy).simplify(0.03) for g in (sil, white)]


def date_plate():
    """'2 December 1971' plate with Sheikh Zayed in the red panel (layout after the reference sticker)."""
    W, H = 90, 56
    plate = U.rounded_rect(W, H, 4)
    frame = plate.buffer(-2.2).difference(plate.buffer(-3.2))
    inner = plate.buffer(-3.2)
    xi0, yi0, xi1, yi1 = inner.bounds
    split = xi0 + 34.0
    panel = inner.intersection(box(xi0 - 1, yi0 - 1, split, yi1 + 1))
    pcx = (xi0 + split) / 2
    panel_txt = U.text_shape("١٠٤٠م", RUQAA, 8.5, pcx + 2.0, yi1 - 6.6, max_width=24)
    sil, sil_white = stencil_shapes(37.5, pcx - 1.5, yi0)
    sil, sil_white = sil.intersection(panel), sil_white.intersection(panel)
    rcx = (split + xi1) / 2
    divider = box(split, -2.2, xi1 + 0.2, -1.2)
    top = U.text_shape("٢ ديسمبر", RUQAA, 15, rcx, 11.6, max_width=40)
    bottom = U.text_shape("١٩٧١", RUQAA, 17, rcx, -13.4, max_width=36)
    holes = unary_union([panel_txt, sil_white])
    black = unary_union([frame, divider, top, bottom, panel.difference(holes)])
    red = panel.difference(unary_union([panel_txt, sil]))
    return plate, black, red          # white plate, black lines/text/portrait, red panel


DESIGNS = {
    "01_emarati_name": (lambda: name_keychain("إماراتي", "Emarati"), ("white", "red")),
    "02_emaratiya_name": (lambda: name_keychain("إماراتية", "Emaratiya"), ("white", "red")),
    "01b_emarati_name_black": (lambda: name_keychain("إماراتي", "Emarati"), ("white", "black")),
    "02b_emaratiya_name_black": (lambda: name_keychain("إماراتية", "Emaratiya"), ("white", "black")),
    "03_burqa_emaratiya": (burqa, ("black", "white")),
    "04_55_3d": (fiftyfive_3d, ("black", "red", "white")),
    "05_date_plate_zayed_1971": (date_plate, ("white", "black", "red")),
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
