"""Generate a full mid-tower gaming PC as STL files.

Every part is built at real size, in millimetres, in one shared coordinate
system, so the files line up when opened together:

    X = width  (0 = glass side, 220 = motherboard side)
    Y = depth  (0 = front, 460 = rear)
    Z = height (0 = floor of the case)

Run:  python generate.py   (needs manifold3d, trimesh, numpy)
Writes stl/<part>.stl, stl/full_pc.stl and parts.json (colours and the
exploded-view offsets the viewer uses).
"""
import json
import math
import os

import numpy as np
import trimesh
from manifold3d import Manifold, OpType

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stl")

# ---------------------------------------------------------------- helpers

def box(x0, y0, z0, x1, y1, z1):
    return Manifold.cube((x1 - x0, y1 - y0, z1 - z0)).translate((x0, y0, z0))


def cyl(axis, c, r, h0, h1, seg=32):
    """Cylinder along an axis, centred on c (the other two coordinates)."""
    m = Manifold.cylinder(h1 - h0, r, r, seg)
    if axis == "z":
        return m.translate((c[0], c[1], h0))
    if axis == "x":
        return m.rotate((0, 90, 0)).translate((h0, c[0], c[1]))
    return m.rotate((-90, 0, 0)).translate((c[0], h0, c[1]))  # axis y


def union(parts):
    return Manifold.batch_boolean(list(parts), OpType.Add)


def hex_grid(x0, x1, y0, y1, pitch, keep=lambda x, y: True):
    """Points on a honeycomb grid inside a rectangle."""
    pts, row, y = [], 0, y0
    while y <= y1:
        x = x0 + (pitch / 2 if row % 2 else 0)
        while x <= x1:
            if keep(x, y):
                pts.append((x, y))
            x += pitch
        y += pitch * 0.866
        row += 1
    return pts


# ---------------------------------------------------------------- sizes

W, D, H, T = 220.0, 460.0, 500.0, 2.0          # case outside size, wall
BOARD_X = 210.4                                 # motherboard component face
Y0 = D - 15 - 244                               # motherboard front edge (y)
Z0 = H - 25 - 305                               # motherboard bottom edge (z)


def mb(u0, v0, u1, v1, w0, w1):
    """Box in motherboard coordinates: u along the board toward the rear,
    v up the board, w out of the board toward the glass."""
    return box(BOARD_X - w1, Y0 + u0, Z0 + v0, BOARD_X - w0, Y0 + u1, Z0 + v1)


def mb_pt(u, v, w):
    return (BOARD_X - w, Y0 + u, Z0 + v)


# ---------------------------------------------------------------- fans

def fan_rotor(r_hub, r_tip, blades, z0, z1, pitch_deg=35):
    """Hub plus angled blades around the +Z axis, centred on the origin."""
    zc, chord = (z0 + z1) / 2, (z1 - z0) * 0.9
    parts = [cyl("z", (0, 0), r_hub, z0, z1, 40)]
    for i in range(blades):
        b = box(r_hub - 1, -chord / 2, -1.0, r_tip, chord / 2, 1.0)
        b = b.rotate((pitch_deg, 0, 0)).translate((0, 0, zc))
        parts.append(b.rotate((0, 0, i * 360.0 / blades)))
    return union(parts)


def fan_120(thick=25.0):
    """A 120 mm case fan, axis +Z, centred on x = y = 0, z = 0..thick."""
    frame = box(-60, -60, 0, 60, 60, thick) - cyl("z", (0, 0), 57.5, -1, thick + 1, 64)
    for sx in (-52.5, 52.5):
        for sy in (-52.5, 52.5):
            frame = frame - cyl("z", (sx, sy), 2.25, -1, thick + 1, 16)
    struts = [box(18, -1.5, 0, 58.5, 1.5, 3).rotate((0, 0, 45 + 90 * k)) for k in range(4)]
    rotor = fan_rotor(19, 56.5, 7, 2, thick - 1)
    return union([frame, rotor] + struts)


def place_fan_y(cx, y, cz):
    """Fan with its axis along +Y, front face at y."""
    return fan_120().rotate((-90, 0, 0)).translate((cx, y, cz))


def place_fan_z(cx, cy, z):
    return fan_120().translate((cx, cy, z))


# ---------------------------------------------------------------- case

def case():
    shell = box(0, 0, 0, W, D, H) - box(T, T, T, W - T, D - T, H - T)
    cuts = [box(-1, 15, 15, T + 1, D - 15, H - 15)]            # glass side opening

    # front mesh (honeycomb of round holes)
    for x, z in hex_grid(14, 206, 18, 482, 9):
        cuts.append(cyl("y", (x, z), 3.0, -1, T + 1, 8))
    # top mesh over the two top fans
    for x, y in hex_grid(40, 180, 145, 400, 9):
        cuts.append(cyl("z", (x, y), 3.0, H - T - 1, H + 1, 8))
    # rear: I/O opening, exhaust fan grille, expansion slots, PSU opening
    cuts.append(box(167, D - T - 1, 307, 213, D + 1, 473))
    fan_c = (105, 400)
    for x, z in hex_grid(fan_c[0] - 56, fan_c[0] + 56, fan_c[1] - 56, fan_c[1] + 56, 9,
                         lambda x, z: math.hypot(x - fan_c[0], z - fan_c[1]) < 54):
        cuts.append(cyl("y", (x, z), 3.0, D - T - 1, D + 1, 8))
    for sx in (-52.5, 52.5):
        for sz in (-52.5, 52.5):
            cuts.append(cyl("y", (fan_c[0] + sx, fan_c[1] + sz), 2.25, D - T - 1, D + 1, 12))
    for k in range(7):
        zc = Z0 + 120 - 20.32 * k
        cuts.append(box(92, D - T - 1, zc - 6.5, 206, D + 1, zc + 6.5))
    cuts.append(box(38, D - T - 1, 4, 192, D + 1, 94))
    # floor vents under the PSU fan
    for x, y in hex_grid(70, 160, 335, 420, 9):
        cuts.append(cyl("z", (x, y), 3.0, -1, T + 1, 8))
    # CPU cooler access hole behind the socket
    cuts.append(box(W - T - 1, Y0 + 115, Z0 + 185, W + 1, Y0 + 205, Z0 + 275))
    shell = shell - union(cuts)

    adds = []
    for fx in (12, W - 52):                                       # feet
        for fy in (15, D - 55):
            adds.append(box(fx, fy, -10, fx + 40, fy + 40, 0.5))
    shroud = box(T, 40, 110, W - T, D - T, 112) - box(168, Y0 + 5, 109, 209, Y0 + 50, 113)
    adds += [shroud, box(T, 40, T, W - T, 42, 110)]               # PSU shroud
    for u, v in [(6, 10), (6, 160), (6, 295), (122, 10), (122, 160), (122, 295),
                 (238, 10), (238, 160), (238, 295)]:              # motherboard standoffs
        adds.append(cyl("x", (Y0 + u, Z0 + v), 3.0, 211.5, W - T + 0.5, 16))
    adds.append(box(2, D - 10, 112, 10, D - T, 498))              # rear inside rail
    return union([shell] + adds)


def glass():
    panel = box(-4, 0.5, 0.5, 0, D - 0.5, H - 0.5)
    screws = [cyl("x", (y, z), 6, -8, -3.5, 24) for y in (12, D - 12) for z in (12, H - 12)]
    return union([panel] + screws)


# ---------------------------------------------------------------- motherboard

def motherboard_pcb():
    pcb = box(BOARD_X, Y0, Z0, BOARD_X + 1.6, Y0 + 244, Z0 + 305)
    for u, v in [(6, 10), (6, 160), (6, 295), (122, 10), (122, 160), (122, 295),
                 (238, 10), (238, 160), (238, 295)]:
        pcb = pcb - cyl("x", (Y0 + u, Z0 + v), 1.8, BOARD_X - 1, BOARD_X + 3, 16)
    return pcb


def motherboard_heatsinks():
    vrm_top = mb(110, 275, 195, 300, 0, 25)
    vrm_side = mb(203, 165, 220, 272, 0, 25)
    grooves = [mb(112 + i * 6, 274, 114 + i * 6, 301, 12, 26) for i in range(14)]
    grooves += [mb(202, 167 + i * 6, 221, 169 + i * 6, 12, 26) for i in range(17)]
    vrm = union([vrm_top, vrm_side]) - union(grooves)
    chipset = mb(30, 40, 85, 95, 0, 10) - union([mb(33 + i * 5, 39, 35 + i * 5, 96, 6, 11) for i in range(10)])
    m2 = mb(120, 85, 200, 108, 0, 8)
    io = mb(222, 140, 257, 300, 0, 40)
    ports = []
    for v, w, du, dv, dw in [(150, 8, 5, 13, 6), (150, 20, 5, 13, 6), (170, 8, 5, 13, 6),
                             (170, 20, 5, 13, 6), (192, 10, 5, 16, 14), (215, 8, 5, 9, 9),
                             (230, 8, 5, 9, 9), (250, 6, 5, 20, 12), (276, 6, 5, 18, 26)]:
        ports.append(mb(257 - du, v, 258, v + dv, w, w + dw))
    io = io - union(ports)
    battery = cyl("x", (Y0 + 100, Z0 + 20), 10, BOARD_X - 3, BOARD_X, 40)
    return union([vrm, chipset, m2, io, battery])


def motherboard_slots():
    parts = []
    for u in (95, 105, 115, 125):                                  # DIMM slots
        parts.append(mb(u, 160, u + 6, 293, 0, 8))
        parts.append(mb(u - 0.5, 293, u + 6.5, 298, 0, 10))
    for v in (116.5, 56.5):                                        # PCIe x16
        parts.append(mb(130, v, 219, v + 7, 0, 11))
    parts.append(mb(194, 26.5, 219, 33.5, 0, 11))                  # PCIe x1
    parts.append(mb(125, 192.5, 195, 267.5, 0, 3))                 # CPU socket frame
    parts.append(mb(2, 150, 18, 203, 0, 15))                       # 24-pin power
    parts.append(mb(200, 293, 218, 303, 0, 15))                    # 8-pin CPU power
    parts.append(mb(2, 40, 12, 80, 0, 8))                          # SATA ports
    parts.append(mb(2, 100, 10, 112, 0, 9))                        # USB header
    return union(parts)


def cpu():
    ihs = mb(140, 210, 180, 250, 3, 7)
    return ihs - mb(150, 225, 170, 235, 6.6, 7.5)                  # engraved logo mark


def ram():
    sticks = []
    for u in (105, 125):
        stick = mb(u + 0.5, 161, u + 5.5, 292, 8, 45)
        cut = union([mb(u, 165 + i * 11, u + 6, 170 + i * 11, 38, 46) for i in range(12)])
        sticks.append(stick - cut)
    return union(sticks)


# ---------------------------------------------------------------- cpu cooler

FIN_U, FIN_V = (135, 185), (167.5, 292.5)


def cooler_fins():
    fins, w = [], 50.0
    while w + 0.8 <= 162:
        fins.append(mb(FIN_U[0], FIN_V[0], FIN_U[1], FIN_V[1], w, w + 0.8))
        w += 2.6
    fins.append(mb(FIN_U[0], FIN_V[0], FIN_U[1], FIN_V[1], 162, 165))   # top cap
    base = mb(140, 210, 180, 250, 7, 14)
    mount = mb(130, 200, 190, 260, 14, 18)
    return union(fins + [base, mount])


def cooler_heatpipes():
    pipes = []
    for u in (150, 170):
        for v in (205, 220, 240, 255):
            x0, y, z = mb_pt(u, v, 0)
            pipes.append(cyl("x", (y, z), 3.0, BOARD_X - 166, BOARD_X - 14, 20))
    caps = [cyl("x", (Y0 + u, Z0 + v), 3.2, BOARD_X - 168, BOARD_X - 165, 20)
            for u in (150, 170) for v in (205, 220, 240, 255)]
    return union(pipes + caps)


def cooler_fan():
    return place_fan_y(BOARD_X - 107.5, Y0 + 108, Z0 + 230)


# ---------------------------------------------------------------- graphics card

GPU_FANS_U = (0, 97, 194)


def gpu_body():
    pcb = mb(-50, 118, 250, 119.6, 5, 130)
    fingers = mb(140, 118, 205, 119.6, 0, 6)
    shroud = mb(-48, 72, 245, 118, 12, 128)
    holes = []
    for u in GPU_FANS_U:
        holes.append(cyl("z", (BOARD_X - 70, Y0 + u), 45, Z0 + 71, Z0 + 92, 64))
    vents = [mb(-40 + i * 9, 92, -36 + i * 9, 117, 125, 129) for i in range(31)]   # top-edge fin look
    shroud = shroud - union(holes + vents)
    accent = mb(-45, 96, 120, 100, 128, 130)                          # light bar
    backplate = mb(-50, 119.6, 250, 122.6, 5, 130)
    backplate = backplate - union([mb(-30 + i * 25, 121.5, -14 + i * 25, 123, 30, 105) for i in range(10)])
    power = mb(100, 98, 126, 118, 128, 137)
    bridge = mb(245, 70, 255, 124, 10, 125)
    bracket = mb(255, 68, 257, 124, -2, 128)
    outs = [mb(254, v, 258, v + 9, w, w + 18) for v, w in [(80, 15), (80, 40), (80, 65), (80, 90)]]
    outs += [mb(254, 96, 258, 105, w, w + 18) for w in (15, 40)]
    bracket = bracket - union(outs)
    return union([pcb, fingers, shroud, accent, backplate, power, bridge, bracket])


def gpu_fans():
    rotors = []
    for u in GPU_FANS_U:
        r = fan_rotor(14, 43, 9, 0, 16, 32).translate((BOARD_X - 70, Y0 + u, Z0 + 74))
        rotors.append(r)
    return union(rotors)


# ---------------------------------------------------------------- power supply, drive

def psu():
    body = box(40, 298, 6, 190, 458, 92)
    fan_c = (115, 378)
    cuts = [cyl("z", (x, y), 2.6, 5, 8, 8)
            for x, y in hex_grid(fan_c[0] - 58, fan_c[0] + 58, fan_c[1] - 58, fan_c[1] + 58, 7,
                                 lambda x, y: math.hypot(x - fan_c[0], y - fan_c[1]) < 57)]
    cuts += [cyl("y", (x, z), 2.4, 456, 459, 8)
             for x, z in hex_grid(48, 128, 14, 84, 7)]                    # rear honeycomb
    cuts.append(box(140, 455, 30, 170, 459, 54))                          # power socket
    cuts.append(box(148, 455, 64, 162, 459, 78))                          # switch
    cuts.append(box(60, 330, 91, 170, 430, 93))                           # label recess
    cuts += [box(45 + i * 22, 297, 20, 60 + i * 22, 304, 80) for i in range(6)]   # modular sockets
    body = body - union(cuts)
    rocker = box(151, 457, 67, 159, 460, 75)
    pads = [box(x, y, 2, x + 15, y + 15, 6.5) for x in (45, 170) for y in (303, 438)]
    return union([body, rocker] + pads)


def drives():
    hdd = box(60, 45, 4, 161.6, 192, 30.1)
    hdd = hdd - box(70, 60, 29, 150, 170, 31)                            # label recess
    hdd = hdd - box(80, 191, 8, 130, 193, 16)                            # SATA port
    ssd = box(60, 230, 112, 129.85, 330, 119)                            # 2.5" SSD on the shroud
    return union([hdd, ssd])


def fans_front():
    return union([place_fan_y(110, 3, zc) for zc in (178, 303, 428)])


def fans_top():
    return union([place_fan_z(110, cy, H - T - 26) for cy in (210, 335)])


def fan_rear():
    return place_fan_y(105, D - T - 26, 400)


# ---------------------------------------------------------------- export

PARTS = [
    # name, builder, colour, explode offset (mm), label
    ("case", case, "#2a2e35", (0, 0, 0), "Mid-tower case"),
    ("glass_panel", glass, "#9fb7c9", (-260, 0, 0), "Tempered glass side panel"),
    ("motherboard", motherboard_pcb, "#1b2420", (-25, 0, 0), "ATX motherboard (PCB)"),
    ("motherboard_heatsinks", motherboard_heatsinks, "#8d949e", (-45, 0, 0), "VRM, chipset and M.2 heatsinks, I/O"),
    ("motherboard_slots", motherboard_slots, "#3c424b", (-35, 0, 0), "DIMM, PCIe, power and SATA connectors"),
    ("cpu", cpu, "#c7ccd3", (-80, 0, 0), "CPU"),
    ("ram", ram, "#d9dde2", (-120, 0, 0), "2x DDR5 memory"),
    ("cooler_fins", cooler_fins, "#b9bec6", (-230, 0, 0), "Tower cooler fin stack"),
    ("cooler_heatpipes", cooler_heatpipes, "#b87333", (-230, 0, 0), "Copper heatpipes"),
    ("cooler_fan", cooler_fan, "#e9ebee", (-230, -90, 0), "Cooler fan 120 mm"),
    ("gpu", gpu_body, "#30353c", (-200, 0, -120), "Graphics card"),
    ("gpu_fans", gpu_fans, "#121417", (-200, 0, -170), "Graphics card fans"),
    ("psu", psu, "#16181b", (0, 230, -60), "ATX power supply"),
    ("drives", drives, "#6f7782", (0, -180, -40), "3.5\" hard drive and 2.5\" SSD"),
    ("fans_front", fans_front, "#e9ebee", (0, -160, 0), "3x 120 mm front intake fans"),
    ("fans_top", fans_top, "#e9ebee", (0, 0, 160), "2x 120 mm top exhaust fans"),
    ("fan_rear", fan_rear, "#e9ebee", (0, 160, 0), "120 mm rear exhaust fan"),
]


def to_trimesh(m):
    mesh = m.to_mesh()
    verts = np.asarray(mesh.vert_properties)[:, :3]
    return trimesh.Trimesh(vertices=verts, faces=np.asarray(mesh.tri_verts), process=False)


def main():
    os.makedirs(OUT, exist_ok=True)
    meta, everything = [], []
    for name, build, colour, explode, label in PARTS:
        m = build()
        tm = to_trimesh(m)
        path = os.path.join(OUT, f"{name}.stl")
        tm.export(path)
        everything.append(tm)
        # Web copy for the viewer: shared vertices as integers in 0.05 mm, plus triangle indices.
        web = os.path.join(os.path.dirname(OUT), "web")
        os.makedirs(web, exist_ok=True)
        q = np.round(tm.vertices * 20).astype(np.int64)
        uniq, inv = np.unique(q, axis=0, return_inverse=True)
        faces = inv.reshape(-1)[tm.faces]
        with open(os.path.join(web, f"{name}.json"), "w") as fh:
            json.dump({"scale": 0.05, "p": uniq.reshape(-1).tolist(), "i": faces.reshape(-1).tolist()},
                      fh, separators=(",", ":"))
        b = tm.bounds
        meta.append({"name": name, "label": label, "file": f"stl/{name}.stl", "web": f"web/{name}.json", "color": colour,
                     "explode": explode, "triangles": int(len(tm.faces)),
                     "size_mm": [round(float(x), 1) for x in (b[1] - b[0])],
                     "watertight": bool(tm.is_watertight)})
        print(f"{name:24s} {len(tm.faces):>8d} tris  size {meta[-1]['size_mm']}  watertight={tm.is_watertight}")
    full = trimesh.util.concatenate(everything)
    full.export(os.path.join(OUT, "full_pc.stl"))
    print(f"{'full_pc':24s} {len(full.faces):>8d} tris")
    with open(os.path.join(os.path.dirname(OUT), "parts.json"), "w") as fh:
        json.dump(meta, fh, indent=1)


if __name__ == "__main__":
    main()
