"""UAE 55th Union Day (2 Dec 2026) printable designs - 3 colours as layers: black -> white -> red.

Every design uses the same layer stack, so different designs can share one plate:
  Z 0.0 - 1.6  black  (layers 1-8)   base
  Z 1.6 - 2.4  white  (layers 9-12)  white details
  Z 2.4 - 3.0  red    (layers 13-15) red details (sit on top of a white column)

Usage:
  python3 make_uae.py --profiles /path/to/BambuStudio/resources/profiles/BBL
Outputs in ./out/<design>/ : STL, preview PNG, Bambu Studio projects (single + full bed, AMS + manual swap)
"""
import argparse, json, math, os, sys, uuid, zipfile, datetime
import numpy as np, cv2, trimesh
from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union
from shapely import affinity

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "keychain"))
from make_bambu_3mf import load_profiles, project_config, mesh_xml, APP_VERSION  # noqa: E402

PX = 20  # raster resolution, px per mm
Z_BLACK, Z_WHITE, Z_RED = 1.6, 2.4, 3.0
COLOURS = ["#000000", "#FFFFFF", "#C8102E"]
SLOT = {"black": 1, "white": 2, "red": 3}   # AMS slots - same for every design
KUFI = "/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf"
LATIN = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
RING_OUT, RING_HOLE = 7.4, 3.6


# ---------------- 2D helpers ----------------
def rounded_rect(w, h, r, cx=0, cy=0):
    return box(cx - w / 2 + r, cy - h / 2 + r, cx + w / 2 - r, cy + h / 2 - r).buffer(r, resolution=32)


def heart(width, cx=0, cy=0):
    t = np.linspace(0, 2 * math.pi, 400)
    x = 16 * np.sin(t) ** 3
    y = 13 * np.cos(t) - 5 * np.cos(2 * t) - 2 * np.cos(3 * t) - np.cos(4 * t)
    p = Polygon(np.c_[x, y]).buffer(0)
    s = width / (p.bounds[2] - p.bounds[0])
    p = affinity.scale(p, s, s, origin=(0, 0))
    b = p.bounds
    return affinity.translate(p, cx - (b[0] + b[2]) / 2, cy - (b[1] + b[3]) / 2)


def text_shape(txt, font, height, cx=0, cy=0, min_stroke=0.0, max_width=None):
    """Render text with Pillow (raqm handles Arabic shaping + RTL) and trace it to polygons, scaled to `height` mm."""
    eng = ImageFont.Layout.RAQM  # raqm does Arabic shaping + right-to-left; fine for Latin too
    f = ImageFont.truetype(font, 400, layout_engine=eng)
    l, t, r, b = f.getbbox(txt)
    img = Image.new("L", (r - l + 40, b - t + 40), 0)
    ImageDraw.Draw(img).text((20 - l, 20 - t), txt, font=f, fill=255)
    m = (np.array(img) > 127).astype(np.uint8)
    g = trace(m)
    g = affinity.scale(g, 1, -1, origin=(0, 0))
    bb = g.bounds
    s = height / (bb[3] - bb[1])
    if max_width:
        s = min(s, max_width / (bb[2] - bb[0]))
    g = affinity.scale(g, s, s, origin=(0, 0))
    bb = g.bounds
    g = affinity.translate(g, cx - (bb[0] + bb[2]) / 2, cy - (bb[1] + bb[3]) / 2)
    if min_stroke:
        g = g.buffer(min_stroke / 2).buffer(-min_stroke / 2)  # close tiny gaps
    return g.simplify(0.02)


def trace(mask):
    contours, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    polys = []
    if hier is None:
        return Polygon()
    hier = hier[0]
    for i, c in enumerate(contours):
        if hier[i][3] != -1 or len(c) < 3:
            continue
        holes, j = [], hier[i][2]
        while j != -1:
            if len(contours[j]) >= 3:
                holes.append(contours[j][:, 0, :].astype(float))
            j = hier[j][0]
        polys.append(Polygon(c[:, 0, :].astype(float), holes).buffer(0))
    return unary_union(polys)


def ring_tab(cx, cy):
    return Point(cx, cy).buffer(RING_OUT / 2, resolution=48), Point(cx, cy).buffer(RING_HOLE / 2, resolution=48)


def burj(height, cx=0, base_y=0):
    """Stylised stepped tower silhouette (tiers + spire)."""
    s = height / 34.0
    tiers = [(0, 9.0), (6.0, 7.6), (11.0, 6.2), (15.5, 4.9), (19.5, 3.7), (23.0, 2.6), (26.0, 1.6)]
    parts = []
    for i, (y0, w) in enumerate(tiers):
        y1 = tiers[i + 1][0] if i + 1 < len(tiers) else 28.5
        off = 0.35 if i % 2 else -0.35  # slight asymmetry like the real setbacks
        parts.append(box(-w / 2 + off * (i > 0), y0, w / 2 + off * (i > 0), y1 + 0.01))
    parts.append(Polygon([(-0.55, 28.4), (0.55, 28.4), (0.18, 34.0), (-0.18, 34.0)]))  # spire
    g = unary_union(parts)
    return affinity.translate(affinity.scale(g, s, s, origin=(0, 0)), cx, base_y)


# ---------------- designs (all units mm, origin at centre) ----------------
def design_tag55():
    """Keychain tag: red heart, big white '55', white UAE."""
    W, H = 26, 40
    body = rounded_rect(W, H, 5)
    ring, hole = ring_tab(0, H / 2 - 1.5)
    base = unary_union([body, ring]).difference(hole)
    border = body.difference(body.buffer(-1.0)).difference(Point(0, H / 2 - 1.5).buffer(RING_OUT / 2 + 0.6))
    white = unary_union([text_shape("55", LATIN, 13, 0, -1), text_shape("UAE", LATIN, 4.6, 0, -13.2), border])
    red = heart(9, 0, 10.2)
    return base, white, red


def design_heart():
    """Heart keychain: black heart with white inner heart and red '55'."""
    outer = heart(34)
    b = outer.bounds
    ring, hole = ring_tab(0, b[3] - 4.2)
    base = unary_union([outer, ring]).difference(hole)
    inner = outer.buffer(-1.6).difference(Point(0, b[3] - 4.2).buffer(RING_OUT / 2 + 0.8))
    white = inner.difference(text_shape("55", LATIN, 10, 0, -1.5).buffer(0.9))  # black outline around the red 55
    red = text_shape("55", LATIN, 10, 0, -1.5)
    return base, white, red


def design_burj():
    """Keychain: white Burj Khalifa silhouette with red 55 heart."""
    W, H = 24, 46
    body = rounded_rect(W, H, 5)
    ring, hole = ring_tab(0, H / 2 - 1.5)
    base = unary_union([body, ring]).difference(hole)
    tower = burj(30, 0, -14.5)
    ground = box(-9.5, -16.0, 9.5, -14.5)
    white = unary_union([tower, ground, text_shape("UAE", LATIN, 4.4, 0, -19.3)])
    red = heart(6.5, -6.2, 10.5)
    return base, white, red


def design_plaque():
    """Fridge/desk plaque: Arabic 'عيد الاتحاد' + big red 55 + heart."""
    W, H = 92, 46
    body = rounded_rect(W, H, 6)
    base = body
    frame = body.buffer(-2.0).difference(body.buffer(-3.2))
    title = text_shape("عيد الاتحاد", KUFI, 16, 16, 4.5, min_stroke=0.3, max_width=46)
    sub = text_shape("2 DEC 1971 - 2026", LATIN, 4.6, 16, -12.5, max_width=46)
    white = unary_union([frame, title, sub])
    red = unary_union([text_shape("55", LATIN, 20, -27.5, 3, max_width=24), heart(6.5, -27.5, -12.5)])
    return base, white, red


def design_arabic_tag():
    """Keychain: Arabic 'الإمارات' + red heart."""
    W, H = 50, 20
    body = rounded_rect(W, H, 5)
    ring, hole = ring_tab(-W / 2 + 1.5, 0)
    base = unary_union([body, ring]).difference(hole)
    white = text_shape("الإمارات", KUFI, 11, 0.5, 0.6, min_stroke=0.3, max_width=27)
    red = heart(6, 20.3, 0)
    return base, white, red


DESIGNS = {
    "01_tag_55": design_tag55,
    "02_heart_55": design_heart,
    "03_burj_khalifa": design_burj,
    "04_arabic_emarat": design_arabic_tag,
    "05_plaque_union_day": design_plaque,
}


# ---------------- 3D ----------------
def extrude(g, h):
    ms = [trimesh.creation.extrude_polygon(p, h) for p in getattr(g, "geoms", [g]) if p.area > 0.05]
    return trimesh.util.concatenate(ms)


def build_mesh(base, white, red):
    white = white.intersection(base.buffer(-0.6))
    red = red.intersection(base.buffer(-0.6))
    parts = [extrude(base, Z_BLACK)] + [extrude(g, z) for g, z in ((white, Z_WHITE), (red, Z_RED)) if not g.is_empty and g.area > 0.05]
    m = trimesh.boolean.union(parts, engine="manifold", check_volume=False)
    m.apply_translation([-m.bounds[0][0], -m.bounds[0][1], 0])
    return m, white, red


RGB = {"black": (26, 26, 26), "white": (245, 245, 245), "red": (200, 16, 46)}


def preview(base, white, red, path, stack=("black", "white", "red")):
    """Top-view render: each colour layer rasterised as its own mask (holes respected), then composited."""
    b = base.bounds
    s = 24
    W, H = int((b[2] - b[0] + 4) * s), int((b[3] - b[1] + 4) * s)
    tf = lambda xy: [((x - b[0] + 2) * s, (b[3] + 2 - y) * s) for x, y in xy]

    def mask(g, dx=0, dy=0):
        m = np.zeros((H, W), np.uint8)
        for p in getattr(g, "geoms", [g]):
            if p.is_empty:
                continue
            one = Image.new("L", (W, H), 0)
            d = ImageDraw.Draw(one)
            d.polygon([(x + dx, y + dy) for x, y in tf(p.exterior.coords)], fill=255)
            for i in p.interiors:
                d.polygon([(x + dx, y + dy) for x, y in tf(i.coords)], fill=0)
            m = np.maximum(m, np.array(one))
        return Image.fromarray(m)
    img = Image.new("RGB", (W, H), (205, 214, 224))
    img.paste((150, 158, 168), (0, 0), mask(base, 3, 4))
    for g, c in zip((base, white, red), stack):
        img.paste(RGB[c], (0, 0), mask(g))
    img.save(path)


# ---------------- Bambu project ----------------
def write_3mf(mesh, out_path, profiles, ams, positions, stack=("black", "white", "red")):
    """stack = colour of each layer band from the bottom: Z 0-1.6, 1.6-2.4, 2.4-3.0 (2 or 3 bands)."""
    m = mesh.copy()
    m.apply_translation(-m.bounds.mean(axis=0))
    hz = m.extents[2] / 2
    U = lambda: str(uuid.uuid4())
    now = datetime.date.today().isoformat()
    n_fil = 3 if ams else 1
    cfg = project_config(profiles, n_fil, COLOURS if ams else [COLOURS[SLOT[stack[0]] - 1]])
    if ams:
        # purge volumes (mm3) row = from, col = to : black, white, red
        cfg["flush_volumes_matrix"] = ["0", "500", "300", "150", "0", "200", "200", "450", "0"]
        cfg["flush_volumes_vector"] = ["140"] * 6
    nf = len(m.faces)
    items = "\n".join(f'  <item objectid="2" p:UUID="{U()}" transform="1 0 0 0 1 0 0 0 1 {x:.4f} {y:.4f} {hz:.5f}" printable="1"/>' for x, y in positions)
    inst = "\n".join(f'    <model_instance>\n      <metadata key="object_id" value="2"/>\n      <metadata key="instance_id" value="{i}"/>\n      <metadata key="identify_id" value="{101 + i}"/>\n    </model_instance>' for i in range(len(positions)))
    asm = "\n".join(f'   <assemble_item object_id="2" instance_id="{i}" transform="1 0 0 0 1 0 0 0 1 {x:.4f} {y:.4f} {hz:.5f}" offset="0 0 0" />' for i, (x, y) in enumerate(positions))
    ns = 'unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p"'
    main = f'''<?xml version="1.0" encoding="UTF-8"?>
<model {ns}>
 <metadata name="Application">BambuStudio-{APP_VERSION}</metadata>
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <metadata name="Title">UAE Union Day 55</metadata>
 <metadata name="CreationDate">{now}</metadata>
 <metadata name="ModificationDate">{now}</metadata>
 <resources>
  <object id="2" p:UUID="{U()}" type="model">
   <components>
    <component p:path="/3D/Objects/object_1.model" objectid="1" p:UUID="{U()}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
   </components>
  </object>
 </resources>
 <build p:UUID="{U()}">
{items}
 </build>
</model>
'''
    obj = f'''<?xml version="1.0" encoding="UTF-8"?>
<model {ns}>
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <resources>
  <object id="1" p:UUID="{U()}" type="model">
{mesh_xml(m)}  </object>
 </resources>
 <build/>
</model>
'''
    settings = f'''<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="2">
    <metadata key="name" value="uae55"/>
    <metadata key="extruder" value="{SLOT[stack[0]] if ams else 1}"/>
    <metadata face_count="{nf}"/>
    <part id="1" subtype="normal_part">
      <metadata key="name" value="uae55"/>
      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <metadata key="extruder" value="{SLOT[stack[0]] if ams else 1}"/>
      <mesh_stat face_count="{nf}" edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value=""/>
    <metadata key="locked" value="false"/>
{inst}
  </plate>
  <assemble>
{asm}
  </assemble>
</config>
'''
    changes = list(zip((1.8, 2.6), stack[1:]))
    if ams:
        layers = "\n".join(f'<layer top_z="{z}" type="2" extruder="{SLOT[c]}" color="{COLOURS[SLOT[c] - 1]}" extra="" gcode="tool_change"/>' for z, c in changes)
        mode = "MultiAsSingle"
    else:
        layers = "\n".join(f'<layer top_z="{z}" type="1" extruder="1" color="" extra="Load {c.upper()} filament" gcode="M400 U1"/>' for z, c in changes)
        mode = "SingleExtruder"
    custom = f'<?xml version="1.0" encoding="utf-8"?>\n<custom_gcodes_per_layer>\n<plate>\n<plate_info id="1"/>\n{layers}\n<mode value="{mode}"/>\n</plate>\n</custom_gcodes_per_layer>\n'
    ct = '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n <Default Extension="png" ContentType="image/png"/>\n</Types>\n'
    rel = lambda t: f'<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n <Relationship Target="{t}" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n</Relationships>\n'
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", ct)
        z.writestr("_rels/.rels", rel("/3D/3dmodel.model"))
        z.writestr("3D/3dmodel.model", main)
        z.writestr("3D/_rels/3dmodel.model.rels", rel("/3D/Objects/object_1.model"))
        z.writestr("3D/Objects/object_1.model", obj)
        z.writestr("Metadata/model_settings.config", settings)
        z.writestr("Metadata/project_settings.config", json.dumps(cfg, indent=4, ensure_ascii=False))
        z.writestr("Metadata/custom_gcode_per_layer.xml", custom)


def full_bed(w, d, gap=4.0, x0=8.0, x1=248.0, y0=16.0, y1=248.0):
    cols = int((x1 - x0 + gap) // (w + gap))
    rows = int((y1 - y0 + gap) // (d + gap))
    W, D = cols * w + (cols - 1) * gap, rows * d + (rows - 1) * gap
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return [(cx - W / 2 + w / 2 + i * (w + gap), cy - D / 2 + d / 2 + j * (d + gap)) for j in range(rows) for i in range(cols)]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--profiles")
    a = ap.parse_args()
    profs = load_profiles(a.profiles) if a.profiles else None
    summary = []
    for name, fn in DESIGNS.items():
        od = os.path.join(HERE, "out", name)
        os.makedirs(od, exist_ok=True)
        base, white, red = fn()
        mesh, white, red = build_mesh(base, white, red)
        mesh.export(os.path.join(od, f"{name}.stl"))
        preview(base, white, red, os.path.join(od, f"{name}_preview.png"))
        w, d = mesh.extents[:2]
        grams = mesh.volume / 1000 * 1.24 * 0.8  # ~solid thin parts; 0.8 factor for infill
        pos = full_bed(w, d)
        if profs:
            for ams in (True, False):
                tag = "AMS" if ams else "noAMS"
                write_3mf(mesh, os.path.join(od, f"{name}_single_{tag}.3mf"), profs, ams, [(128.0, 128.0)])
                write_3mf(mesh, os.path.join(od, f"{name}_FULLBED_{len(pos)}pcs_{tag}.3mf"), profs, ams, pos)
        summary.append((name, w, d, grams, len(pos)))
        print(f"{name}: {w:.1f} x {d:.1f} x {mesh.extents[2]:.1f} mm, ~{grams:.1f} g, full bed {len(pos)} pcs, watertight={mesh.is_watertight}")
    with open(os.path.join(HERE, "out", "summary.json"), "w") as f:
        json.dump(summary, f, indent=1)
