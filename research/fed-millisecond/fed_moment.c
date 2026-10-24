// Build: gcc -O2 -o fed_moment fed_moment.c -lz
// Run:   curl -sS "https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/S121025-v50.txt.gz" | ./fed_moment
// Scratch reference to check your own engine against. Write your own for the hand-made prize.
// Stream Nasdaq ITCH 5.0 (gz on stdin); measure reaction around FOMC 14:00:00 ET.
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <zlib.h>
#define NS 18
static const char *SYM[NS]={"SPY","QQQ","IWM","NVDA","AAPL","MSFT","JPM","XLF","TLT","IEF","SHY","GLD","SLV","USO","UUP","TQQQ","SQQQ","KRE"};
static int locsym[65536];
#define HB 24
#define HM ((1u<<HB)-1)
typedef struct{uint64_t k;uint32_t px;uint8_t side,sym;}E;
static E *H;
static inline uint32_t hh(uint64_t k){return (uint32_t)((k*0x9E3779B97F4A7C15ull)>>(64-HB));}
static E* find(uint64_t k){uint32_t i=hh(k);while(H[i].k){if(H[i].k==k)return &H[i];i=(i+1)&HM;}return 0;}
static void ins(uint64_t k,uint32_t px,uint8_t s,uint8_t y){uint32_t i=hh(k);while(H[i].k&&H[i].k!=k)i=(i+1)&HM;H[i].k=k;H[i].px=px;H[i].side=s;H[i].sym=y;}
static void del(E*e){uint32_t i=e-H,j=i;for(;;){j=(j+1)&HM;if(!H[j].k)break;uint32_t k=hh(H[j].k);
 if((j>i&&(k<=i||k>j))||(j<i&&(k<=i&&k>j))){H[i]=H[j];i=j;}}H[i].k=0;}
static inline uint64_t be(const uint8_t*p,int n){uint64_t v=0;for(int i=0;i<n;i++)v=(v<<8)|p[i];return v;}
const uint64_t T0=14ull*3600*1000000000ull; // 14:00:00 ET in ns
// stats
static uint64_t lastpx_pre[NS],firstev[NS],firsttr[NS],firsttrpx[NS];static int firstevtype[NS];
static double vw1[NS],vv1[NS],vw10[NS],vv10[NS];static uint64_t cnt[NS][4];
static uint64_t bucket[400]; // global msgs per 50us, from T0-10ms to T0+10ms
static uint64_t symbucket[NS][40]; // per sym msgs per 250us from T0-1ms to T0+9ms
int main(){
 H=calloc((size_t)1<<HB,sizeof(E));memset(locsym,-1,sizeof locsym);
 gzFile g=gzdopen(0,"rb");gzbuffer(g,1<<22);uint8_t m[256],lb[2];uint64_t n=0,ts=0;
 while(gzread(g,lb,2)==2){int L=(lb[0]<<8)|lb[1];if(gzread(g,m,L)!=L)break;n++;
  uint8_t t=m[0];int loc=be(m+1,2);ts=be(m+5,6);
  if(ts>T0+30000000000ull)break;
  if(ts>=T0-10000000&&ts<T0+10000000)bucket[(ts-(T0-10000000))/50000]++;
  if(t=='R'){char s[9];memcpy(s,m+11,8);s[8]=0;for(int k=7;k>=0&&s[k]==' ';k--)s[k]=0;
    for(int k=0;k<NS;k++)if(!strcmp(s,SYM[k]))locsym[loc]=k;continue;}
  int y=locsym[loc];if(y<0)continue;
  if(ts>=T0-1000000&&ts<T0+9000000)symbucket[y][(ts-(T0-1000000))/250000]++;
  if(ts>=T0&&!firstev[y]){firstev[y]=ts;firstevtype[y]=t;}
  if(ts>=T0){uint64_t d=ts-T0;int b=d<1000000?0:d<10000000?1:d<100000000?2:3;cnt[y][b]++;}
  uint64_t px=0,sh=0;int trade=0;
  switch(t){
   case 'A':case 'F':ins(be(m+11,8),be(m+32,4),m[19],y);break;
   case 'U':{E*e=find(be(m+11,8));if(e){uint8_t s=e->side;del(e);ins(be(m+19,8),be(m+31,4),s,y);}break;}
   case 'D':{E*e=find(be(m+11,8));if(e)del(e);break;}
   case 'E':{E*e=find(be(m+11,8));if(e){px=e->px;sh=be(m+19,4);trade=1;}break;}
   case 'C':{if(m[31]=='Y'){px=be(m+32,4);sh=be(m+19,4);trade=1;}break;}
   case 'P':px=be(m+32,4);sh=be(m+20,4);trade=1;break;}
  if(trade&&px){
   if(ts<T0)lastpx_pre[y]=px;
   else{ if(!firsttr[y]){firsttr[y]=ts;firsttrpx[y]=px;}
     if(ts<T0+1000000000ull){vw1[y]+=px*(double)sh;vv1[y]+=sh;}
     if(ts<T0+10000000000ull){vw10[y]+=px*(double)sh;vv10[y]+=sh;}}}
 }
 printf("messages read %llu, stopped at %.6f h\n",(unsigned long long)n,ts/3.6e12);
 printf("%-5s %10s %12s %12s %9s %9s %9s %9s %8s %8s\n","sym","pre_px","first_ev_us","first_tr_us","tr1_px","vwap1s","vwap10s","ret10s_bp","msg<1ms","msg<10ms");
 for(int k=0;k<NS;k++){double p0=lastpx_pre[k]/1e4,v1=vv1[k]?vw1[k]/vv1[k]/1e4:0,v10=vv10[k]?vw10[k]/vv10[k]/1e4:0;
  printf("%-5s %10.4f %12.1f %12.1f %9.4f %9.4f %9.4f %9.1f %8llu %8llu  firsttype=%c\n",SYM[k],p0,firstev[k]?(firstev[k]-T0)/1e3:-1,firsttr[k]?(firsttr[k]-T0)/1e3:-1,
   firsttrpx[k]/1e4,v1,v10,p0&&v10?1e4*(v10/p0-1):0,(unsigned long long)cnt[k][0],(unsigned long long)(cnt[k][0]+cnt[k][1]),firstevtype[k]?firstevtype[k]:'-');}
 printf("\nGLOBAL msgs per 50us from -10ms to +10ms (around 14:00:00):\n");
 for(int i=0;i<400;i++){if(i%20==0)printf("\n%+6.2fms: ",(i*50-10000)/1000.0);printf("%llu ",(unsigned long long)bucket[i]);}
 printf("\n\nPER-SYMBOL msgs per 250us from -1ms to +9ms:\n");
 for(int k=0;k<NS;k++){printf("%-5s",SYM[k]);for(int i=0;i<40;i++)printf(" %llu",(unsigned long long)symbucket[k][i]);printf("\n");}
}
