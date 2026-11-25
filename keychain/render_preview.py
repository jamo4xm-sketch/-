"""Render a top-down + 3D preview PNG of the keychain."""
import os, trimesh, numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,"out")
b=trimesh.load(os.path.join(OUT,"keychain_base_black.stl")); w=trimesh.load(os.path.join(OUT,"keychain_logo_white.stl"))
fig=plt.figure(figsize=(10,5),dpi=150)
ax=fig.add_subplot(1,2,1)
for m,c in ((b,"#1a1a1a"),(w,"#f4f4f4")):
    tri=m.triangles[m.face_normals[:,2]>0.9]
    for t in tri: ax.fill(t[:,0],t[:,1],color=c,lw=0)
ax.set_aspect("equal"); ax.set_facecolor("#9fb3c8"); ax.set_title("Top view (mm)")
ax3=fig.add_subplot(1,2,2,projection="3d")
for m,c in ((b,"#222222"),(w,"#ffffff")):
    pc=Poly3DCollection(m.triangles,facecolor=c,edgecolor="none"); 
    n=m.face_normals; shade=0.55+0.45*np.clip(n@np.array([0.3,-0.5,0.8]),0,1)
    base=np.array(matplotlib.colors.to_rgb(c)); pc.set_facecolor(np.clip(np.outer(shade,np.maximum(base,0.15)),0,1)); ax3.add_collection3d(pc)
ax3.set_xlim(0,21);ax3.set_ylim(0,29);ax3.set_zlim(0,2.4);ax3.set_box_aspect((21,29,4));ax3.view_init(55,-60);ax3.set_axis_off();ax3.set_title("3D")
plt.tight_layout(); plt.savefig(os.path.join(OUT,"preview.png"))
