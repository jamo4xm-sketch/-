"""Arrange many keychains on a Bambu Lab P2S plate (256x256 mm) as one STL."""
import os, sys, trimesh
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,"out")
one=trimesh.load(os.path.join(OUT,"keychain_single.stl"))
w,d=one.extents[:2]; GAP=4.0
for name,cols,rows in (("plate_30pcs",6,5),("plate_70pcs_full",10,7)):
    W=cols*w+(cols-1)*GAP; D=rows*d+(rows-1)*GAP
    assert W<=245 and D<=245, (W,D)
    ms=[]
    for i in range(cols):
        for j in range(rows):
            m=one.copy(); m.apply_translation([128-W/2+i*(w+GAP)-one.bounds[0][0],128-D/2+j*(d+GAP)-one.bounds[0][1],0]); ms.append(m)
    trimesh.util.concatenate(ms).export(os.path.join(OUT,name+".stl"))
    print(name, cols*rows, f"{W:.0f}x{D:.0f} mm")
