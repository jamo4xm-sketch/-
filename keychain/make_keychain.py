"""Generate a two-colour (black base + white logo) layered keychain from the UTAS logo emblem.

Usage: python3 make_keychain.py
Outputs STL files in ./out
"""
import os
import numpy as np
import cv2
from PIL import Image
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union
import trimesh

# ---------------- parameters (mm) ----------------
EMBLEM_HEIGHT = 26.0      # height of the logo emblem itself
BASE_MARGIN = 1.2         # black border around the logo
BASE_THICK = 1.6          # black layers (8 x 0.2mm)
LOGO_THICK = 0.8          # white layers on top (4 x 0.2mm) - 4 layers so black does not show through
RING_OUTER_D = 7.4
RING_HOLE_D = 3.6
UPSCALE = 8               # upscale factor before tracing (smooths pixel edges)

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "logo_source.png")
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

# ---------------- 1. extract emblem mask ----------------
img = Image.open(SRC).convert("RGBA")
X0, X1 = 545, 731          # emblem region (right part of the image, no text)
crop = img.crop((X0, 0, X1, img.height))
alpha = np.array(crop)[..., 3]
big = cv2.resize(alpha, None, fx=UPSCALE, fy=UPSCALE, interpolation=cv2.INTER_CUBIC)
big = cv2.GaussianBlur(big, (0, 0), UPSCALE * 0.6)
mask = (big > 128).astype(np.uint8)

ys, xs = np.nonzero(mask)
px_h = ys.max() - ys.min()
scale = EMBLEM_HEIGHT / px_h   # mm per (upscaled) pixel

contours, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
hier = hier[0]
polys = []
for i, c in enumerate(contours):
    if hier[i][3] != -1:
        continue  # holes handled below
    if cv2.contourArea(c) < 200:
        continue
    shell = c[:, 0, :].astype(float)
    holes = []
    j = hier[i][2]
    while j != -1:
        if cv2.contourArea(contours[j]) > 200:
            holes.append(contours[j][:, 0, :].astype(float))
        j = hier[j][0]
    polys.append(Polygon(shell, holes))


def to_mm(p):
    from shapely import affinity
    p = affinity.scale(p, xfact=scale, yfact=-scale, origin=(0, 0))  # flip Y (image -> CAD)
    return p


logo = unary_union([to_mm(p).buffer(0) for p in polys]).simplify(0.02)
minx, miny, maxx, maxy = logo.bounds
from shapely import affinity
logo = affinity.translate(logo, -minx, -miny)
minx, miny, maxx, maxy = logo.bounds
print(f"logo: {maxx:.1f} x {maxy:.1f} mm, parts={len(getattr(logo, 'geoms', [logo]))}")

# ---------------- 2. ring tab (top-left, above the orange part) ----------------
parts = sorted(getattr(logo, "geoms", [logo]), key=lambda g: g.bounds[0])
left = parts[0]                                    # orange "U" part
lminx, lminy, lmaxx, lmaxy = left.bounds
ring_c = Point((lminx + lmaxx) / 2 - 0.3, lmaxy + RING_OUTER_D / 2 - 0.6)
ring = ring_c.buffer(RING_OUTER_D / 2, resolution=48)
hole = ring_c.buffer(RING_HOLE_D / 2, resolution=48)

# ---------------- 3. base silhouette ----------------
base = unary_union([logo.buffer(BASE_MARGIN, resolution=24), ring])
base = Polygon(base.exterior)                      # fill any internal gaps
# connect ring smoothly to body (fillet by closing)
base = base.buffer(0.8, resolution=24).buffer(-0.8, resolution=24)
base = Polygon(base.exterior).difference(hole)
# keep white logo away from the hole
logo = logo.difference(hole.buffer(0.8))

bx0, by0, bx1, by1 = base.bounds
print(f"keychain outline: {bx1-bx0:.1f} x {by1-by0:.1f} mm")


# ---------------- 4. extrude ----------------
def extrude(geom, h, z0=0.0):
    meshes = []
    for g in getattr(geom, "geoms", [geom]):
        m = trimesh.creation.extrude_polygon(g, h)
        m.apply_translation([0, 0, z0])
        meshes.append(m)
    return trimesh.util.concatenate(meshes)


base_m = extrude(base, BASE_THICK)
logo_m = extrude(logo, LOGO_THICK, BASE_THICK)
for m in (base_m, logo_m):
    m.apply_translation([-bx0, -by0, 0])

combined = trimesh.boolean.union([base_m, logo_m], engine="manifold")

base_m.export(os.path.join(OUT, "keychain_base_black.stl"))
logo_m.export(os.path.join(OUT, "keychain_logo_white.stl"))
combined.export(os.path.join(OUT, "keychain_single.stl"))

vol = combined.volume
print(f"volume: {vol:.0f} mm3 -> ~{vol/1000*1.24:.2f} g PLA (solid)")
print(f"base: {base_m.volume:.0f} mm3, logo: {logo_m.volume:.0f} mm3")
print(f"total height {BASE_THICK+LOGO_THICK} mm, colour change at Z={BASE_THICK} mm")
