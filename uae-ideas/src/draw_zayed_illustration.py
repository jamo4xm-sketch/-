"""Hand-placed flat illustration of Sheikh Zayed (3/4 view, smiling), drawn over the reference photo
zayed_ABr_AntonioMilena.jpg (Antonio Milena / Agencia Brasil, Wikimedia Commons, attribution licence).

Output: zayed_stencil.png  (0 = background / red panel, 128 = black, 255 = white)
        zayed_overlay.png  (check image: the drawing on top of the photo)
Coordinates are in the photo scaled 3x (966 x 1692 px). Lines are ~0.55 mm wide at the plate size.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 966, 1692
LW = 17          # line width in px (~0.55 mm when the portrait is ~38 mm tall)


def smooth(pts, n=3, closed=True):
    p = np.asarray(pts, float)
    for _ in range(n):
        q = np.roll(p, -1, axis=0) if closed else p[1:]
        a = p if closed else p[:-1]
        new = np.empty((len(a) * 2, 2))
        new[0::2] = 0.75 * a + 0.25 * q
        new[1::2] = 0.25 * a + 0.75 * q
        p = new if closed else np.vstack([p[0], new, p[-1]])
    return [tuple(x) for x in p]


# ---- shapes (x, y) ----
GHUTRA = [(300, 372), (400, 345), (510, 338), (610, 350), (690, 392), (745, 450), (775, 520), (810, 600),
          (850, 690), (885, 790), (900, 890), (890, 990), (870, 1100), (860, 1230), (870, 1380), (880, 1500),
          (190, 1500), (195, 1350), (185, 1200), (165, 1050), (148, 900), (135, 760), (130, 640), (145, 545),
          (185, 470), (235, 425)]
AGAL = [(238, 470), (262, 418), (320, 392), (420, 398), (530, 418), (640, 440), (730, 458), (768, 482),
        (770, 525), (730, 538), (640, 525), (530, 500), (420, 478), (330, 470), (272, 490)]
FACE = [(212, 565), (262, 530), (330, 516), (410, 520), (470, 556), (505, 625), (535, 705), (565, 790),
        (600, 880), (622, 955), (600, 1010), (530, 1048), (430, 1066), (335, 1052), (262, 1012), (226, 950),
        (214, 895), (238, 858), (222, 835), (236, 815), (226, 795), (246, 745), (236, 690), (214, 640),
        (206, 600)]
BEARD = [(236, 818), (300, 812), (360, 826), (420, 800), (470, 776), (500, 735), (530, 790), (565, 870),
         (595, 950), (600, 1005), (528, 1046), (430, 1064), (336, 1050), (264, 1010), (228, 948), (215, 895),
         (238, 860)]
TEETH = [(270, 860), (320, 842), (378, 846), (398, 866), (365, 890), (310, 896), (276, 884)]
BROW_R = [(318, 612), (365, 600), (420, 612), (450, 632), (420, 630), (370, 622), (322, 628)]
BROW_L = [(216, 600), (250, 596), (285, 606), (280, 618), (248, 612), (218, 614)]
EYE_R = [(345, 662), (375, 648), (410, 652), (428, 668), (402, 676), (368, 676)]
EYE_L = [(232, 650), (256, 644), (276, 652), (262, 662), (240, 662)]
NOSE = [(300, 690), (296, 740), (282, 785), (300, 806), (330, 804)]
SMILE = [(430, 760), (448, 800), (446, 840)]
RIM = [(205, 600), (214, 560), (262, 528), (330, 514), (410, 518), (472, 555), (506, 625), (536, 705),
       (566, 790), (602, 880), (624, 955), (604, 1012)]
FOLDS = [[(780, 640), (820, 760), (840, 880), (835, 990)],
         [(175, 620), (170, 760), (185, 900), (205, 1050)],
         [(650, 1120), (700, 1250), (720, 1400)]]
COLLAR = [[(430, 1066), (440, 1160), (446, 1260)], [(530, 1048), (500, 1110), (460, 1180)]]


def draw():
    lab = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lab)
    d.polygon(smooth(GHUTRA), fill=255)
    d.polygon(smooth(FACE), fill=255)
    d.line(smooth(GHUTRA) + [smooth(GHUTRA)[0]], fill=128, width=LW, joint="curve")   # outline
    d.polygon(smooth(AGAL), fill=128)
    d.polygon(smooth(BEARD), fill=128)
    d.polygon(smooth(TEETH), fill=255)
    for poly in (BROW_R, BROW_L, EYE_R, EYE_L):
        d.polygon(smooth(poly, 2), fill=128)
    for line in [NOSE, SMILE, RIM] + FOLDS + COLLAR:
        d.line(smooth(line, 3, closed=False), fill=128, width=LW, joint="curve")
    a = np.array(lab)
    a[1500:] = 0
    # clean jaggies: smooth each class a little
    out = np.zeros_like(a)
    for v in (128, 255):
        m = Image.fromarray(((a >= v) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
        out[np.array(m) > 127] = v
    return out


if __name__ == "__main__":
    st = draw()
    Image.fromarray(st).save(os.path.join(HERE, "zayed_stencil.png"))
    photo = Image.open(os.path.join(HERE, "zayed_ABr_AntonioMilena.jpg")).convert("RGB").resize((W, H))
    col = np.array(photo) // 2
    col[st == 128] = (20, 20, 20)
    col[st == 255] = (245, 245, 245)
    Image.fromarray(col.astype(np.uint8)).save(os.path.join(HERE, "zayed_overlay.png"))
    print("ok")
