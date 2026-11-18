import sys, numpy as np
from PIL import Image, ImageFilter
from collections import deque
src,dst=sys.argv[1],sys.argv[2]; tol=float(sys.argv[3]) if len(sys.argv)>3 else 22
im=np.array(Image.open(src).convert('RGB')).astype(np.int16); H,W,_=im.shape
# background colour = median of border
border=np.concatenate([im[0],im[-1],im[:,0],im[:,-1]]); bg=np.median(border,0)
diff=np.abs(im-bg).max(2); sat=im.max(2)-im.min(2)
cand=(diff<tol)&(sat<14)
mask=np.zeros((H,W),bool); q=deque()
for x in range(W):
  for y in (0,H-1):
    if cand[y,x] and not mask[y,x]: mask[y,x]=1;q.append((y,x))
for y in range(H):
  for x in (0,W-1):
    if cand[y,x] and not mask[y,x]: mask[y,x]=1;q.append((y,x))
while q:
  y,x=q.popleft()
  for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
    ny,nx=y+dy,x+dx
    if 0<=ny<H and 0<=nx<W and cand[ny,nx] and not mask[ny,nx]: mask[ny,nx]=1;q.append((ny,nx))
a=Image.fromarray(((~mask)*255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
out=Image.open(src).convert('RGBA'); out.putalpha(a)
bb=out.getbbox(); out=out.crop(bb); out.save(dst); print(dst,out.size)
