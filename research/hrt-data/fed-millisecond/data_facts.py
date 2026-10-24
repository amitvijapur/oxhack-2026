# Usage: curl -sS "https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/S121025-v50.txt.gz" | python3 data_facts.py
# Quick exploratory script (stops after a time budget). Reference only.
import sys, zlib, time, collections, bisect
W={"NVDA","AAPL","TSLA","QQQ"}
src=sys.stdin.buffer; d=zlib.decompressobj(16+zlib.MAX_WBITS); buf=b''
loc={}; st=collections.defaultdict(collections.Counter); live={}; life=collections.defaultdict(list)
permsg=collections.Counter(); tot=0; t0=time.time(); T=0; sysev=[]
B=lambda m,o,n:int.from_bytes(m[o:o+n],'big')
while time.time()-t0<150:
    c=src.read(1<<20)
    if not c: break
    buf+=d.decompress(c); i=0; n=len(buf)
    while i+2<=n:
        L=(buf[i]<<8)|buf[i+1]
        if i+2+L>n: break
        m=buf[i+2:i+2+L]; i+=2+L; t=m[0]; T=B(m,5,6); tot+=1
        if T>34200e9: permsg[T//1000000]+=1
        if t==83: sysev.append((chr(m[11]),round(T/3.6e12,3)))
        elif t==82:
            s=m[11:19].decode().strip()
            if s in W: loc[B(m,1,2)]=s
        if t in (65,70):
            s=loc.get(B(m,1,2))
            if not s: continue
            sh=B(m,20,4); px=B(m,32,4); k=st[s]; k['adds']+=1
            if sh<100: k['odd_lot']+=1
            if px%100==50: k['half_cent']+=1
            elif px%100: k['subpenny']+=1
            if t==70: k['attributed']+=1
            if T>34200e9: live[m[11:19]]=(T,s)
        elif t in (68,85):
            a=live.pop(m[11:19],None)
            if a: life[a[1]].append(T-a[0])
        elif t in (69,67):
            s=loc.get(B(m,1,2))
            if s:
                st[s]['vis_exec_sh']+=B(m,19,4); live.pop(m[11:19],None)
                if t==67 and m[31:32]==b'N': st[s]['nonprint_exec']+=1
        elif t==80:
            s=loc.get(B(m,1,2))
            if s:
                st[s]['hidden_exec_sh']+=B(m,20,4); st[s]['hidden_trades']+=1
                if B(m,32,4)%100==50: st[s]['hidden_halfcent']+=1
    buf=buf[i:]
h=T/3.6e12; print(f"reached {int(h)}:{int(h%1*60):02d} ET; total msgs {tot:,}"); print("system events",sysev)
for s,k in st.items():
    a=k['adds']; ls=sorted(life[s]); f=lambda x:100*bisect.bisect_left(ls,x)/max(len(ls),1)
    print(s,dict(k)); print(f"   odd-lot {100*k['odd_lot']/a:.1f}%  half-cent px {100*k['half_cent']/a:.1f}%  attributed {100*k['attributed']/a:.2f}%  hidden share of exec volume {100*k['hidden_exec_sh']/max(1,k['hidden_exec_sh']+k['vis_exec_sh']):.1f}%  cancelled<1ms {f(1e6):.1f}% <10ms {f(1e7):.1f}% (of cancels after open)")
if permsg: pk=permsg.most_common(1)[0]; print("peak msgs in one millisecond:",pk[1],"at",round(pk[0]/3.6e6,4),"h; median per ms",sorted(permsg.values())[len(permsg)//2])
