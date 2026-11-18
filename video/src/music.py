import numpy as np, wave, sys
sr=44100; dur=66.0; bpm=110; beat=60/bpm
t=np.arange(int(sr*dur))/sr
out=np.zeros_like(t)
def note(f): return 440*2**((f-69)/12)
# I–V–vi–IV in C major, warm pad + arp + soft kick/hat
prog=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]]
bar=beat*4
def env(x,a,r,L):
    e=np.minimum(1,x/a)*np.clip((L-x)/r,0,1); return e
n_bars=int(dur/bar)+1
for b in range(n_bars):
    ch=prog[b%4]; st=b*bar; i0=int(st*sr); i1=min(len(t),int((st+bar)*sr))
    x=t[i0:i1]-st
    for m in ch:
        for det in (0.997,1.003):
            out[i0:i1]+=0.035*np.sin(2*np.pi*note(m)*det*x)*env(x,0.4,0.6,bar)
    out[i0:i1]+=0.06*np.sin(2*np.pi*note(ch[0]-24)*x)*env(x,0.02,0.3,bar)
    for k in range(8):  # arp eighths
        s=st+k*beat/2; j0=int(s*sr); j1=min(len(t),j0+int(0.25*sr))
        if j0>=len(t): break
        y=t[j0:j1]-s; f=note(ch[k%3]+12+(12 if k in(3,7) else 0))
        out[j0:j1]+=0.04*np.sin(2*np.pi*f*y)*np.exp(-y*14)
    for k in range(4):  # kick + hat
        s=st+k*beat; j0=int(s*sr); j1=min(len(t),j0+int(0.3*sr))
        if j0>=len(t): break
        y=t[j0:j1]-s; out[j0:j1]+=0.18*np.sin(2*np.pi*(50+90*np.exp(-y*30))*y)*np.exp(-y*12)
        s2=s+beat/2; h0=int(s2*sr); h1=min(len(t),h0+int(0.05*sr))
        if h0<len(t): out[h0:h1]+=0.02*np.random.randn(h1-h0)*np.exp(-np.arange(h1-h0)/sr*80)
fade=np.clip(t/1.5,0,1)*np.clip((dur-t)/2.5,0,1); out*=fade
out=out/np.max(np.abs(out))*0.9
st=np.stack([out,out],1)
w=wave.open(sys.argv[1],'w');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((st*32767).astype(np.int16).tobytes());w.close()
