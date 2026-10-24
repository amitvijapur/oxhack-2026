# Usage: curl -sS "https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/S121025-v50.txt.gz" | python3 order_lifetimes.py
# Quick exploratory script (stops after a time budget). Reference only.
import sys, struct, zlib, time, collections, bisect
src=sys.stdin.buffer; d=zlib.decompressobj(16+zlib.MAX_WBITS)
buf=b''; live={}; life=[]; execd=0; adds=0; tmax=0; t0=time.time(); names={}
fills=collections.Counter()
def ts(b,o): return int.from_bytes(b[o:o+6],'big')
while time.time()-t0<170:
    chunk=src.read(1<<20)
    if not chunk: break
    buf+=d.decompress(chunk); i=0; n=len(buf)
    while i+2<=n:
        L=(buf[i]<<8)|buf[i+1]
        if i+2+L>n: break
        m=buf[i+2:i+2+L]; t=m[0]; i+=2+L
        if t==65 or t==70:  # A/F
            T=ts(m,5); live[m[11:19]]=T; adds+=1; tmax=T
        elif t==68:  # delete
            T=ts(m,5); a=live.pop(m[11:19],None)
            if a is not None: life.append(T-a)
        elif t==69 or t==67:  # executed
            if m[11:19] in live: execd+=1; live.pop(m[11:19])
        elif t==85:  # replace = cancel old + add new
            T=ts(m,5); a=live.pop(m[11:19],None)
            if a is not None: life.append(T-a)
            live[m[19:27]]=T; adds+=1
    buf=buf[i:]
life.sort(); N=len(life)
f=lambda x: 100*bisect.bisect_left(life,x)/max(adds,1)
h=tmax/3.6e12
print(f"reached {int(h)}:{int((h%1)*60):02d} ET | orders added {adds:,} | cancelled {N:,} | executed {execd:,} ({100*execd/adds:.2f}%)")
for lab,x in [("1 µs",1e3),("100 µs",1e5),("1 ms",1e6),("10 ms",1e7),("100 ms",1e8),("1 s",1e9)]:
    print(f"  cancelled within {lab}: {f(x):.1f}% of all orders")
print("median life of cancelled order (ms):", life[N//2]/1e6 if N else None)
