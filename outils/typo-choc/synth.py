import numpy as np, wave
sr=44100; D=8.0; n=int(sr*D); L=np.zeros(n); rng=np.random.default_rng(7)
def add(sig,t0,amp=1.0):
    i=int(t0*sr); j=min(n,i+len(sig)); L[i:j]+=amp*sig[:j-i]
def kick():
    t=np.arange(int(.4*sr))/sr; f=48+110*np.exp(-t*32); ph=2*np.pi*np.cumsum(f)/sr
    return np.sin(ph)*np.exp(-t*8)
def snare():
    t=np.arange(int(.25*sr))/sr; no=np.diff(rng.standard_normal(len(t)+1))
    return .6*no*np.exp(-t*22)+.5*np.sin(2*np.pi*190*t)*np.exp(-t*30)
def hat():
    t=np.arange(int(.06*sr))/sr; return np.diff(np.diff(rng.standard_normal(len(t)+2)))*np.exp(-t*90)
def boom():
    t=np.arange(int(1.2*sr))/sr; return np.sin(2*np.pi*42*t)*np.exp(-t*3)+.4*rng.standard_normal(len(t))*np.exp(-t*14)
for k in range(16):
    b=k*.5; add(kick(),b,.9)
    if k%2==1: add(snare(),b,.55)
    add(hat(),b+.25,.18)
    if b>=2: add(hat(),b+.125,.08); add(hat(),b+.375,.08)
# riser before the cuts at 2 s
t=np.arange(int(1.0*sr))/sr; r=(rng.standard_normal(len(t))*.25+np.sin(2*np.pi*np.cumsum(200+900*t**2)/sr)*.3)*(t**2); add(r,1.0,.6)
for b in (2.0,4.0): add(boom(),b,.7)
# bass from 2 s, pumping offbeat
for k in range(4,16):
    b=k*.5; t=np.arange(int(.45*sr))/sr; f=55 if (k//4)%2==0 else 49
    add(np.sin(2*np.pi*f*t)*np.minimum(1,t*40)*np.exp(-t*4),b+.06,.45)
fade=np.ones(n); fi=int(7.5*sr); fade[fi:]=np.linspace(1,0,n-fi); L*=fade
L=np.tanh(L*1.2); L=L/np.max(np.abs(L))*.89
pcm=(np.stack([L,L],1)*32767).astype('<i2')
with wave.open('typo_audio.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
print('audio ok')
