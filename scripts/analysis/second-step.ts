// Second-step "luck" analysis for EN Wordle. Run: bun scripts/analysis/second-step.ts > scripts/analysis/second-step.out.json
import { readFileSync, writeFileSync } from "fs";
const rd = (f: string) => readFileSync(f, "utf8").split(/\s+/).map(s => s.trim().toLowerCase()).filter(s => /^[a-z]{5}$/.test(s));
const A = rd("data/answers.txt");
const G = [...new Set([...A, ...rd("data/allowed.txt")])];
const NA = A.length, NG = G.length, LOG = Math.log2;
const isAns = new Set(A);
function pat(g: string, a: string): number {
  const r = [0,0,0,0,0], cnt = new Int8Array(26);
  for (let i=0;i<5;i++){ if (g[i]===a[i]) r[i]=2; else cnt[a.charCodeAt(i)-97]++; }
  for (let i=0;i<5;i++){ if (r[i]) continue; const c=g.charCodeAt(i)-97; if (cnt[c]>0){r[i]=1;cnt[c]--;} }
  return r[0]+3*r[1]+9*r[2]+27*r[3]+81*r[4];
}
const P = new Uint8Array(NG*NA);
for (let g=0;g<NG;g++) for (let a=0;a<NA;a++) P[g*NA+a]=pat(G[g],A[a]);
const gi = new Map(G.map((w,i)=>[w,i]));
const cnt = new Int32Array(243);
function entropy(g: number, B: Int32Array|number[]): number {
  cnt.fill(0); const n=B.length; const base=g*NA;
  for (let k=0;k<n;k++) cnt[P[base+B[k]]]++;
  let h=0; for (let p=0;p<243;p++) if (cnt[p]) h-= cnt[p]/n*LOG(cnt[p]/n);
  return h;
}
const all = Int32Array.from({length:NA},(_,i)=>i);
const H1 = new Float64Array(NG); for (let g=0;g<NG;g++) H1[g]=entropy(g,all);
const order = [...Array(NG).keys()].sort((x,y)=>H1[y]-H1[x]);
const topEnt = order.slice(0,10).map(i=>[G[i],+H1[i].toFixed(3)]);
const MAXB = LOG(NA);
const openers = ["salet","soare","crane","trace","roate","raise","arose","stare","adieu"];
const out: any = { NA, NG, maxBits: MAXB, topEntropyOpeners: topEnt, openers: {} };
const winCount = new Map<string,number>();
function letters(w:string){return new Set(w)}
for (const o of openers) {
  const og = gi.get(o)!; const buckets = new Map<number,number[]>();
  for (let a=0;a<NA;a++){ const p=P[og*NA+a]; (buckets.get(p)??buckets.set(p,[]).get(p)!).push(a); }
  const oL = letters(o);
  const realized: number[] = []; // bits after 2 guesses per answer
  const step2real: number[] = []; let solvedBy2=0, singleton=0, sumExp2=0, sumCandOnly=0;
  const fixed = new Float64Array(NG); // sum n*H(g|B) -> best non-adaptive second
  const feat = { cand:0, unseen:0, dbl:0, nonCandBetter:0, nb:0 };
  const corr: number[][] = []; // per (bucket>=20, guess): [entropy, unseen, distinct, cand, splitScore]
  const bucketRows: any[] = [];
  for (const [p,Bl] of buckets) {
    const B = Int32Array.from(Bl), n=B.length;
    let best=-1,bh=-1, bc=-1,bch=-1;
    const doCorr = n>=20 && corr.length<400000;
    // letter frequencies in bucket (presence)
    const pres = new Float64Array(26); for (const a of Bl) for (const c of new Set(A[a])) pres[c.charCodeAt(0)-97]+=1/n;
    for (let g=0;g<NG;g++){
      const h = n===1?0:entropy(g,B); fixed[g]+=n*h;
      const c = n>1 && isAns.has(G[g]) && Bl.includes(gi.get(G[g])!) ;
      const hh = h + (Bl.some(a=>A[a]===G[g])?1e-9:0);
      if (hh>bh){bh=hh;best=g;}
      if (doCorr && (g%4===0)) { const w=G[g]; const L=letters(w); let un=0,sp=0; for(const ch of L){ if(!oL.has(ch))un++; const q=pres[ch.charCodeAt(0)-97]; sp+=Math.min(q,1-q);} corr.push([h,un,L.size,Bl.some(a=>A[a]===w)?1:0,sp]); }
    }
    if (n===1){ best = B[0]; best = gi.get(A[B[0]])!; }
    // best candidate-only
    for (const a of Bl){ const g=gi.get(A[a])!; const h=n===1?0:entropy(g,B); if(h>bch){bch=h;bc=g;} }
    sumExp2+=n*Math.max(bh,0); sumCandOnly+=n*bch;
    const bw=G[best]; winCount.set(bw,(winCount.get(bw)??0)+n);
    const isC = Bl.some(a=>A[a]===bw);
    if (n>1){ feat.nb+=n; if(isC)feat.cand+=n; else if (bh-bch>1e-9) feat.nonCandBetter+=n; feat.unseen+=n*[...letters(bw)].filter(c=>!oL.has(c)).length; if(letters(bw).size<5)feat.dbl+=n; }
    const sub = new Map<number,number>(); for (const a of Bl){ const q=P[best*NA+a]; sub.set(q,(sub.get(q)??0)+1); }
    for (const a of Bl){ const s=sub.get(P[best*NA+a])!; realized.push(LOG(NA/s)); step2real.push(LOG(n/s)); if(s===1)singleton++; if(A[a]===bw)solvedBy2++; }
    bucketRows.push({p, pattern:[0,1,2,3,4].map(i=>"⬜🟨🟩"[Math.floor(p/3**i)%3]).join(""), n, surprisal1:+LOG(NA/n).toFixed(2), best:bw, bestIsCandidate:isC, H2:+Math.max(bh,0).toFixed(3), maxPossibleH2:+LOG(n).toFixed(3), candOnlyH2:+bch.toFixed(3), subBuckets:sub.size});
  }
  // stats
  const hist = (arr:number[], step:number)=>{const m=new Map<number,number>(); for(const x of arr){const k=Math.floor(x/step+1e-9)*step; m.set(k,(m.get(k)??0)+1);} return [...m].sort((a,b)=>a[0]-b[0]).map(([k,v])=>[+k.toFixed(1),+(v/arr.length*100).toFixed(1)]);};
  const mean=(a:number[])=>a.reduce((s,x)=>s+x,0)/a.length;
  const sd=(a:number[])=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)));};
  const pct=(a:number[],q:number)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(q*(s.length-1))];};
  // gain over expected at step2 per answer: step2real - H2(bucket)
  const fb = [...fixed.keys()].sort((x,y)=>fixed[y]-fixed[x]).slice(0,5).map(g=>[G[g], +(fixed[g]/NA).toFixed(3)]);
  // correlations
  const pear=(i:number)=>{const xs=corr.map(r=>r[i]),ys=corr.map(r=>r[0]);const mx=mean(xs),my=mean(ys);let a=0,b=0,c=0;for(let k=0;k<xs.length;k++){a+=(xs[k]-mx)*(ys[k]-my);b+=(xs[k]-mx)**2;c+=(ys[k]-my)**2;}return +(a/Math.sqrt(b*c)).toFixed(3);};
  const big = bucketRows.filter(r=>r.n>1);
  out.openers[o] = {
    H1:+H1[og].toFixed(3), buckets:buckets.size,
    adaptiveExpected2: +(H1[og]+sumExp2/NA).toFixed(3),
    candidateOnlyExpected2: +(H1[og]+sumCandOnly/NA).toFixed(3),
    bestFixedSecond: fb,
    step2RealizedMean:+mean(step2real).toFixed(3), step2RealizedSD:+sd(step2real).toFixed(3),
    step2Hist: hist(step2real,1),
    realized2Mean:+mean(realized).toFixed(3), realized2SD:+sd(realized).toFixed(3),
    realized2P10:+pct(realized,0.1).toFixed(2), realized2P50:+pct(realized,0.5).toFixed(2),
    realized2Hist: hist(realized,1),
    pctSingletonAfter2:+(singleton/NA*100).toFixed(1), pctSolvedBy2:+(solvedBy2/NA*100).toFixed(2),
    bestSecond_pctCandidate:+(feat.cand/feat.nb*100).toFixed(1),
    bestSecond_pctNonCandStrictlyBetter:+(feat.nonCandBetter/feat.nb*100).toFixed(1),
    bestSecond_avgUnseenLetters:+(feat.unseen/feat.nb).toFixed(2), bestSecond_pctRepeatedLetters:+(feat.dbl/feat.nb*100).toFixed(1),
    corrWithH2:{unseenLetters:pear(1), distinctLetters:pear(2), isCandidate:pear(3), splitScore:pear(4), samples:corr.length},
    // luck by surprisal: group answers by first bucket size
    largestBuckets: bucketRows.sort((a,b)=>b.n-a.n).slice(0,8),
    efficiency: +(big.reduce((s,r)=>s+r.n*r.H2,0)/big.reduce((s,r)=>s+r.n*r.maxPossibleH2,0)).toFixed(3),
  };
  console.error("done", o);
}
out.universalSecondWords = [...winCount].sort((a,b)=>b[1]-a[1]).slice(0,15);
// ---- fixed pairs ----
const F = order.slice(0,80), S = order.slice(0,3000);
const pc = new Int32Array(59049); const touched = new Int32Array(NA);
function pairStats(a:number,b:number){ let nt=0; for(let k=0;k<NA;k++){const c=P[a*NA+k]*243+P[b*NA+k]; if(pc[c]++===0)touched[nt++]=c;} let h=0,s1=0; for(let t=0;t<nt;t++){const v=pc[touched[t]]; h-=v/NA*LOG(v/NA); if(v===1)s1++; pc[touched[t]]=0;} return [h,nt,s1]; }
const pairs: [number,number,number,number,number][] = [];
for (const a of F) for (const b of S) { if (b===a) continue; const [h,nt,s1]=pairStats(a,b); pairs.push([h,a,b,nt,s1]); }
pairs.sort((x,y)=>y[0]-x[0]);
const seen=new Set<string>(); const topPairs:any[]=[];
for (const p of pairs){ const k=[p[1],p[2]].sort().join(); if(seen.has(k))continue; seen.add(k); topPairs.push(p); if(topPairs.length>=40)break; }
out.fixedPairs = topPairs.slice(0,15).map(p=>({pair:G[p[1]]+"+"+G[p[2]], bits:+p[0].toFixed(3), classes:p[3], pctSingleton:+(p[4]/NA*100).toFixed(1), distinctLetters:new Set(G[p[1]]+G[p[2]]).size}));
for (const pr of [["salet","courd"],["crane","doilt"],["soare","clint"],["raise","clout"],["arose","unlit"],["stare","doily"]]) { const [h,nt,s1]=pairStats(gi.get(pr[0])!,gi.get(pr[1])!); (out.namedPairs??=[]).push({pair:pr.join("+"),bits:+h.toFixed(3),classes:nt,pctSingleton:+(s1/NA*100).toFixed(1)}); }
// ---- triples: top 25 pairs × all third ----
const tc = new Int32Array(NA*243); const tt = new Int32Array(NA); const cls = new Int32Array(NA);
const trip:any[]=[];
for (const p of topPairs.slice(0,25)) {
  const map=new Map<number,number>(); for(let k=0;k<NA;k++){const c=P[p[1]*NA+k]*243+P[p[2]*NA+k]; if(!map.has(c))map.set(c,map.size); cls[k]=map.get(c)!;}
  for (let g=0; g<NG; g++){ let nt=0; for(let k=0;k<NA;k++){const c=cls[k]*243+P[g*NA+k]; if(tc[c]++===0)tt[nt++]=c;} let h=0,s1=0; for(let t=0;t<nt;t++){const v=tc[tt[t]]; h-=v/NA*LOG(v/NA); if(v===1)s1++; tc[tt[t]]=0;} trip.push([h,p[1],p[2],g,nt,s1]); }
}
trip.sort((x,y)=>y[0]-x[0]); const ts=new Set<string>(); const topT:any[]=[];
for (const t of trip){const k=[t[1],t[2],t[3]].sort().join(); if(ts.has(k))continue; ts.add(k); topT.push(t); if(topT.length>=12)break;}
out.fixedTriples = topT.map(t=>({triple:[G[t[1]],G[t[2]],G[t[3]]].join("+"), bits:+t[0].toFixed(3), classes:t[4], pctSingleton:+(t[5]/NA*100).toFixed(1), distinctLetters:new Set(G[t[1]]+G[t[2]]+G[t[3]]).size}));
writeFileSync("scripts/analysis/second-step.out.json", JSON.stringify(out,null,1));
console.error("ok");
