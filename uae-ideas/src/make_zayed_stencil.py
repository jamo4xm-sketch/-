"""Turn the Sheikh Zayed photo (Antonio Milena / Agencia Brasil, Wikimedia Commons, attribution licence)
into a 3-tone stencil: 0 = background (red panel), 128 = black, 255 = white. Writes zayed_stencil.png.
Usage: python3 make_zayed_stencil.py   (needs opencv, scipy)"""
import cv2, numpy as np, sys, os
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__))
big=cv2.resize(cv2.imread(os.path.join(HERE,'zayed_ABr_AntonioMilena.jpg')),None,fx=3,fy=3,interpolation=cv2.INTER_CUBIC)
# 1) person mask with GrabCut, gaps closed, largest component
mask=np.zeros(big.shape[:2],np.uint8); hh,ww=mask.shape
bgm=np.zeros((1,65)); fgm=np.zeros((1,65))
cv2.grabCut(big,mask,(int(0.07*ww),int(0.18*hh),int(0.86*ww),int(0.82*hh)-1),bgm,fgm,8,cv2.GC_INIT_WITH_RECT)
m=((mask==1)|(mask==3)).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(61,61)))
m=ndimage.binary_fill_holes(m).astype(np.uint8)
n,lab=cv2.connectedComponents(m); m=(lab==1+int(np.argmax([(lab==i).sum() for i in range(1,n)]))).astype(np.uint8)
H,W=m.shape
hsv=cv2.cvtColor(big,cv2.COLOR_BGR2HSV); h,s,v=[hsv[...,i].astype(int) for i in range(3)]
pxmm=W/34.0
K=lambda mm: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(max(3,int(mm*pxmm))|1,)*2)
# agal: dark pixels near top of silhouette
near=cv2.dilate(m,K(4.0)); dk=((v<70)&(near>0)).astype(np.uint8); dk[700:]=0
dk=cv2.morphologyEx(dk,cv2.MORPH_OPEN,K(0.5))
n,lab=cv2.connectedComponents(dk); keep=np.zeros_like(dk)
for i in range(1,n):
    c=(lab==i); 
    if c.sum()>3000: keep|=c.astype(np.uint8)
sil=np.maximum(m,keep)
sil=cv2.morphologyEx(sil,cv2.MORPH_CLOSE,K(1.5)); sil=ndimage.binary_fill_holes(sil).astype(np.uint8)
sil=cv2.morphologyEx(sil,cv2.MORPH_OPEN,K(1.0)); sil[1500:]=0
gray=cv2.cvtColor(big,cv2.COLOR_BGR2GRAY)
skin=((h<25)&(s>70)&(v>70)&(sil>0)).astype(np.uint8)
skin=cv2.morphologyEx(skin,cv2.MORPH_CLOSE,K(2.0)); skin=cv2.morphologyEx(skin,cv2.MORPH_OPEN,K(1.0))
n,lab=cv2.connectedComponents(skin); sz=[(lab==i).sum() for i in range(1,n)]; skin=(lab==1+int(np.argmax(sz))).astype(np.uint8)
beard=((v<90)&(sil>0)).astype(np.uint8)
face=ndimage.binary_fill_holes(np.maximum(skin,beard&cv2.dilate(skin,K(3.0)))).astype(np.uint8)
face=cv2.morphologyEx(face,cv2.MORPH_OPEN,K(1.0))
# inside face: local threshold for features
loc=cv2.adaptiveThreshold(gray,1,cv2.ADAPTIVE_THRESH_MEAN_C,cv2.THRESH_BINARY_INV,int(3*pxmm)|1,18)
feat=((loc>0)|(v<80)).astype(np.uint8)&face
feat=cv2.morphologyEx(feat,cv2.MORPH_OPEN,K(0.45))
outside=((v<70)&(sil>0)&(face==0)).astype(np.uint8)
outside=cv2.morphologyEx(outside,cv2.MORPH_OPEN,K(0.6))
edge=cv2.morphologyEx(face,cv2.MORPH_GRADIENT,K(0.5))&cv2.erode(sil,K(0.3))
black=np.maximum.reduce([feat,outside,edge])
white=((sil>0)&(black==0)).astype(np.uint8)
white=cv2.morphologyEx(white,cv2.MORPH_OPEN,K(0.45))
out=np.zeros(sil.shape,np.uint8); out[sil>0]=128; out[white>0]=255
cv2.imwrite(os.path.join(HERE,'zayed_stencil.png'),out)
