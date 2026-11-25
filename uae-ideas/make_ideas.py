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
RUQAA_REG = os.path.join(HERE, "fonts", "ArefRuqaa-Regular.ttf")  # lighter weight, closer to the reference sticker
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
    """Emirati burqa, proportions taken from the reference keychain (width : height about 1.6 : 1):
    thick straight forehead band, thin side frames, two big rectangular eye windows split by a thin
    'seif', and a big lower piece whose bottom edge sags down to a point in the middle.
    Black burqa, 'إماراتية' in white across the middle of the lower piece."""
    W, top, side_bot, mid_bot = 56.0, 17.0, -7.5, -18.5
    hw = W / 2
    # bottom edge: quadratic curve from the side corner down to the centre point, sagging below the chord
    t = np.linspace(0, 1, 40)
    p0, c, p1 = np.array([hw, side_bot]), np.array([hw * 0.45, mid_bot + 1.2]), np.array([0, mid_bot])
    curve = ((1 - t) ** 2)[:, None] * p0 + (2 * (1 - t) * t)[:, None] * c + (t ** 2)[:, None] * p1
    right = [(0, top), (hw - 1.0, top + 0.6), (hw, top - 0.4)] + [tuple(q) for q in curve[:-1]]
    left = [(-x, y) for x, y in reversed(right[1:])]
    shape = Polygon(right + [(0, mid_bot)] + left).buffer(0.8, resolution=16).buffer(-0.8, resolution=16)
    band, frame_w, seif = 4.2, 2.2, 0.9                  # forehead band, side frames, half seif width
    win_r = U.rounded_rect(hw - frame_w - seif, (top - band) - (-4.2), 1.6,
                           (seif + hw - frame_w) / 2, ((top - band) + (-4.2)) / 2)
    windows = unary_union([win_r, affinity.scale(win_r, -1, 1, origin=(0, 0))])
    ring, hole = U.ring_tab(0, top + 2.2)
    base = unary_union([shape.difference(windows), ring]).difference(hole)
    txt = U.text_shape("إماراتية", RUQAA, 8.0, 0, -9.8, max_width=26)
    return base, txt, EMPTY          # black burqa, white text


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
    panel_txt = U.text_shape("١٠٤٠م", RUQAA_REG, 8.5, pcx + 2.0, yi1 - 6.6, max_width=24)
    sil, sil_white = stencil_shapes(37.5, pcx - 1.5, yi0)
    sil, sil_white = sil.intersection(panel), sil_white.intersection(panel)
    rcx = (split + xi1) / 2
    divider = box(split, -2.2, xi1 + 0.2, -1.2)
    top = U.text_shape("٢ ديسمبر", RUQAA_REG, 15, rcx, 11.6, max_width=40)
    bottom = U.text_shape("١٩٧١", RUQAA_REG, 17, rcx, -13.4, max_width=36)
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
