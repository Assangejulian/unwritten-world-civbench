import numpy as np, colorsys, json, random, itertools
random.seed(7)
def hex2rgb(h): h=h.lstrip('#'); return np.array([int(h[i:i+2],16) for i in (0,2,4)])/255
def rgb2hex(c): return '#'+''.join(f'{int(round(max(0,min(1,v))*255)):02x}' for v in c)
def mix(a,b,t): return a*(1-t)+b*t
DARK=hex2rgb('#0a0d0f'); RING_T=.38
def lin(c): return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
def delin(c): return np.where(c<=.0031308,c*12.92,1.055*np.clip(c,0,1)**(1/2.4)-.055)
M=np.array([[.4124,.3576,.1805],[.2126,.7152,.0722],[.0193,.1192,.9505]])
def lab(c):
  x=M@lin(c)/np.array([.95047,1,1.08883]); f=np.where(x>.008856,np.cbrt(x),7.787*x+16/116)
  return np.array([116*f[1]-16,500*(f[0]-f[1]),200*(f[1]-f[2])])
# Machado 2009 severity 1.0
DEU=np.array([[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]])
PRO=np.array([[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]])
def cvd(c,Mx): return delin(np.clip(Mx@lin(c),0,1))
def de2000(l1,l2):
  L1,a1,b1=l1;L2,a2,b2=l2;C1=np.hypot(a1,b1);C2=np.hypot(a2,b2);Cb=(C1+C2)/2;G=.5*(1-np.sqrt(Cb**7/(Cb**7+25**7)))
  a1p=(1+G)*a1;a2p=(1+G)*a2;C1p=np.hypot(a1p,b1);C2p=np.hypot(a2p,b2)
  h1=np.degrees(np.arctan2(b1,a1p))%360;h2=np.degrees(np.arctan2(b2,a2p))%360
  dL=L2-L1;dC=C2p-C1p;dh=h2-h1
  if C1p*C2p==0: dh=0
  elif dh>180: dh-=360
  elif dh<-180: dh+=360
  dH=2*np.sqrt(C1p*C2p)*np.sin(np.radians(dh/2));Lb=(L1+L2)/2;Cbp=(C1p+C2p)/2
  hs=h1+h2
  if C1p*C2p==0: hb=hs
  elif abs(h1-h2)<=180: hb=hs/2
  else: hb=(hs+360)/2 if hs<360 else (hs-360)/2
  T=1-.17*np.cos(np.radians(hb-30))+.24*np.cos(np.radians(2*hb))+.32*np.cos(np.radians(3*hb+6))-.2*np.cos(np.radians(4*hb-63))
  dth=30*np.exp(-((hb-275)/25)**2);RC=2*np.sqrt(Cbp**7/(Cbp**7+25**7))
  SL=1+.015*(Lb-50)**2/np.sqrt(20+(Lb-50)**2);SC=1+.045*Cbp;SH=1+.015*Cbp*T;RT=-np.sin(np.radians(2*dth))*RC
  return np.sqrt((dL/SL)**2+(dC/SC)**2+(dH/SH)**2+RT*(dC/SC)*(dH/SH))
def views(c):  # badge-darkened ring colour under normal / deutan / protan
  r=mix(c,DARK,RING_T); return [lab(r),lab(cvd(r,DEU)),lab(cvd(r,PRO))]
def dpair(va,vb,w=(1,.7,.7)): return min(de2000(x,y)/wi for x,y,wi in zip(va,vb,w))
def minde(cols,sec=None):
  V=[views(c) for c in cols]; S=[views(c) for c in sec] if sec else None; best=(1e9,None)
  for i,j in itertools.combinations(range(len(cols)),2):
    d=dpair(V[i],V[j])
    if S: d=np.hypot(d,.6*dpair(S[i],S[j]))
    best=min(best,(d,(i,j)))
  return best
old=['#6fc1d0','#dd806e','#9dc47f','#dfba69','#b09bd5','#78adcf','#dfd8bb','#c39264','#bb627c','#59bea8','#a79bc8','#bdb780','#7997df','#ddad7f','#aececa','#cfaace']
oldc=[hex2rgb(h) for h in old]
# candidate pool: dark-friendly (after 38% darkening still saturated, not neon)
pool=[]
for h in range(0,360,10):
  for s in (.45,.6,.75):
    for l in (.42,.55,.68,.8):
      pool.append(np.array(colorsys.hls_to_rgb(h/360,l,s)))
PV=[views(c) for c in pool]
N=len(pool);D=np.zeros((N,N))
for a in range(N):
  for b in range(a+1,N): D[a,b]=D[b,a]=dpair(PV[a],PV[b])
def setmin(idx):
  sub=D[np.ix_(idx,idx)]+np.eye(len(idx))*1e9;return sub.min()
idx=random.sample(range(len(pool)),16); cur=setmin(idx)
for it in range(40000):
  k=random.randrange(16); cand=random.randrange(len(pool))
  if cand in idx: continue
  t=idx[:];t[k]=cand;v=setmin(t)
  if v>=cur: idx,cur=t,v
prim=[pool[i] for i in idx]
# secondary: lighter enamel/flag tone, pick to maximise combined distance (greedy hill-climb from pool of light tones)
spool=[np.array(colorsys.hls_to_rgb(h/360,l,s)) for h in range(0,360,10) for s in (.35,.55) for l in (.72,.84)]
sidx=random.sample(range(len(spool)),16)
PRV=[views(c) for c in prim];SV=[views(c) for c in spool];NS=len(spool)
DP=np.array([[dpair(PRV[i],PRV[j]) if i!=j else 1e9 for j in range(16)] for i in range(16)])
DS=np.array([[dpair(SV[a],SV[b]) if a!=b else 0 for b in range(NS)] for a in range(NS)])
def score(si):
  si=np.array(si);return (np.hypot(DP,.6*DS[np.ix_(si,si)])).min()
cs=score(sidx)
for it in range(20000):
  k=random.randrange(16);c=random.randrange(len(spool));t=sidx[:];t[k]=c;v=score(t)
  if v>=cs: sidx,cs=t,v
sec=[spool[i] for i in sidx]
# order by hue for readability
order=sorted(range(16),key=lambda i:colorsys.rgb_to_hls(*prim[i])[0])
P=[rgb2hex(prim[i]) for i in order];S=[rgb2hex(sec[i]) for i in order]
res={'old':old,'old_min_ring':float(minde(oldc)[0]),'old_min_pair':[old[i] for i in minde(oldc)[1]],
 'new_primary':P,'new_secondary':S,'new_min_ring':float(minde([hex2rgb(h) for h in P])[0]),
 'new_min_twotone':float(minde([hex2rgb(h) for h in P],[hex2rgb(h) for h in S])[0])}
# old normal-vision-only too
def minN(cols):
  return min(de2000(lab(mix(a,DARK,RING_T)),lab(mix(b,DARK,RING_T))) for a,b in itertools.combinations(cols,2))
res['old_min_normal_only']=float(minN(oldc));res['new_min_normal_only']=float(minN([hex2rgb(h) for h in P]))
json.dump(res,open('palette-v6.json','w'),indent=1);print(json.dumps(res,indent=1))
