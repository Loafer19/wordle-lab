// Exact Wordle decision-tree solver (normal or hard mode: WL_HARD=1 + codes file as argv[ANSIDX+..] via WL_CODES), min total guesses, Selby-style DFS with memo + bounds.
// gcc -O3 -march=native -fopenmp solver.c -o solver
// ./solver MAT WORDS ANSIDX mode args...
//   rank                      : print entropy / one-level bound for every guess
//   solve DEPTH K T BETA w1,w2,..   : solve each opener (parallel); DEPTH = max guesses (incl. opener) ; K/T: at nodes with n>T keep top-K guesses by bound (K=0: all = exact)
//                                    BETA: global prune bound on total (0 = none). Prints "RES word total exact|lb"
//   tree DEPTH K T word OUT   : solve one opener and write JSON tree
//   lb2 w1,w2,..              : two-level lower bound per opener
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <math.h>
#include <omp.h>
#include <time.h>
#define INF (1<<28)
#define GREEN 242
typedef uint16_t u16;
static int NG, NA; static uint8_t *M; static char (*W)[16]; static int *ansIdx; static int *isAnsOf; // isAnsOf[g] = answer idx or -1
static int K_TOP = 0, T_SIZE = 1 << 30;
// ---- hard mode (NYT rules as the app's hardValid): greens stay in place, revealed letters reused with multiplicity ----
#define NLET 64
static int HARD = 0; static uint8_t (*CODE)[5]; static uint8_t (*LC)[NLET];
typedef struct { uint8_t gr[5]; uint8_t mn[NLET]; } Cons;
static Cons C0;
static inline int hvalid(const Cons *k, int g) { if (!HARD) return 1; for (int i = 0; i < 5; i++) if (k->gr[i] != 255 && CODE[g][i] != k->gr[i]) return 0; for (int c = 0; c < NLET; c++) if (k->mn[c] > LC[g][c]) return 0; return 1; }
static inline void hchild(const Cons *k, int g, int p, Cons *o) { *o = *k; if (!HARD) return; uint8_t need[NLET] = {0}; for (int i = 0; i < 5; i++) { int d = p % 3; p /= 3; if (d == 2) o->gr[i] = CODE[g][i]; if (d) need[CODE[g][i]]++; } for (int c = 0; c < NLET; c++) if (need[c] > o->mn[c]) o->mn[c] = need[c]; }
static inline uint64_t hcons(const Cons *k) { if (!HARD) return 0; uint64_t h = 0xcbf29ce484222325ULL; for (int i = 0; i < 5; i++) { h ^= k->gr[i]; h *= 0x100000001B3ULL; } for (int c = 0; c < NLET; c++) if (k->mn[c]) { h ^= (uint64_t)(c * 16 + k->mn[c]); h *= 0x100000001B3ULL; } return h; }
static inline int lbk(int k, int d) { if (k == 0) return 0; if (d <= 0) return INF; if (k == 1) return 1; if (d == 1) return INF; return 2 * k - 1; }
typedef struct { uint64_t h; int32_t val; int16_t best; uint8_t d, exact; } Ent;
#define MEMO_BITS 22
typedef struct { Ent *t; long nodes, hits; } Ctx;
static uint64_t hset(const u16 *S, int n, int d) { uint64_t h = 1469598103934665603ULL ^ (uint64_t)d * 0x9E3779B97F4A7C15ULL; for (int i = 0; i < n; i++) { h ^= S[i] + 0x9E37ULL * (i + 1); h *= 0x100000001B3ULL; h ^= h >> 29; } return h | 1; }
static Ent *mlook(Ctx *c, uint64_t h) { return &c->t[h & ((1ULL << MEMO_BITS) - 1)]; }
typedef struct { int lb; int g; } GC;
static int cmpgc(const void *a, const void *b) { const GC *x = a, *y = b; return x->lb != y->lb ? x->lb - y->lb : x->g - y->g; }
static int cmpint_desc(const void *a, const void *b) { return *(const int *)b - *(const int *)a; }
int solve(Ctx *c, const u16 *S, int n, int d, int beta, int *bestg, const Cons *k);
// evaluate guess g on S fully with bound beta; returns cost (exact if < beta)
static int evalg(Ctx *c, const u16 *S, int n, int d, int g, int lbg, int beta, const Cons *k0) {
  const uint8_t *row = M + (size_t)g * NA;
  int cnt[243] = {0}; for (int i = 0; i < n; i++) cnt[row[S[i]]]++;
  int start[244]; start[0] = 0; for (int p = 0; p < 243; p++) start[p + 1] = start[p] + cnt[p];
  u16 *buf = malloc(sizeof(u16) * n); int pos[243]; memcpy(pos, start, sizeof pos);
  for (int i = 0; i < n; i++) buf[pos[row[S[i]]]++] = S[i];
  int order[243], no = 0; for (int p = 0; p < GREEN; p++) if (cnt[p] >= 2) order[no++] = cnt[p] * 256 + p;
  qsort(order, no, sizeof(int), cmpint_desc);
  int cost = lbg;
  for (int i = 0; i < no && cost < beta; i++) {
    int p = order[i] & 255, k = cnt[p], lk = lbk(k, d - 1), bg;
    Cons ck; hchild(k0, g, p, &ck);
    int sub = solve(c, buf + start[p], k, d - 1, beta - cost + lk, &bg, &ck);
    cost += sub - lk;
  }
  free(buf); return cost;
}
int solve(Ctx *c, const u16 *S, int n, int d, int beta, int *bestg, const Cons *k) {
  *bestg = -1;
  if (n == 0) return 0;
  if (d <= 0) return INF;
  if (n == 1) { *bestg = ansIdx[S[0]]; return 1; }
  if (d == 1) return INF;
  c->nodes++;
  // in-set perfect splitter → 2n-1 (optimal)
  for (int i = 0; i < n; i++) { int g = ansIdx[S[i]]; const uint8_t *row = M + (size_t)g * NA; uint8_t seen[243] = {0}; int ok = 1; for (int j = 0; j < n; j++) { if (seen[row[S[j]]]++) { ok = 0; break; } } if (ok) { *bestg = g; return 2 * n - 1; } }
  if (n == 2) { *bestg = ansIdx[S[0]]; return 3; }
  uint64_t h = hset(S, n, d) ^ hcons(k); h |= 1; Ent *e = mlook(c, h); int memlb = 0;
  if (e->h == h && e->d == d) { c->hits++; if (e->exact) { *bestg = e->best; return e->val; } if (e->val >= beta) return e->val; memlb = e->val; }
  GC *gl = malloc(sizeof(GC) * NG); int ng = 0; int perfectOut = -1;
  for (int g = 0; g < NG; g++) {
    if (HARD && !hvalid(k, g)) continue;
    const uint8_t *row = M + (size_t)g * NA; int cnt[243] = {0}; int mx = 0;
    if (d == 2) { int bad = 0; for (int i = 0; i < n; i++) if (++cnt[row[S[i]]] > 1) { bad = 1; break; } if (bad) continue; mx = 1; } // d=2: only perfect splitters can work
    else for (int i = 0; i < n; i++) { int v = ++cnt[row[S[i]]]; if (v > mx) mx = v; }
    if (mx == n && cnt[GREEN] == 0) continue;           // no information
    int lb = n; for (int p = 0; p < GREEN && lb < INF; p++) if (cnt[p]) lb += lbk(cnt[p], d - 1);
    if (lb >= INF) continue;
    if (mx == 1) { perfectOut = g; break; }        // perfect out-of-set splitter: 2n is optimal (no in-set one exists)
    gl[ng].lb = lb; gl[ng].g = g; ng++;
  }
  if (perfectOut >= 0) { free(gl); *bestg = perfectOut; return 2 * n; } // no in-set perfect splitter, so 2n is optimal
  if (!ng) { free(gl); e->h = h; e->d = d; e->val = INF; e->exact = 1; e->best = -1; return INF; }
  qsort(gl, ng, sizeof(GC), cmpgc);
  // dedup equivalent partitions (same canonical labelling) among top
  int lim = ng; if (K_TOP && n > T_SIZE && lim > K_TOP) lim = K_TOP;
  int nodeLB = gl[0].lb > memlb ? gl[0].lb : memlb;
  int best = INF, bg = -1, lbmin = INF;
  if (nodeLB >= beta) { free(gl); goto store_lb_nodelb; }
  for (int i = 0; i < lim; i++) {
    int ub = best < beta ? best : beta;
    if (gl[i].lb >= ub) { if (gl[i].lb < lbmin) lbmin = gl[i].lb; break; }
    int cst = evalg(c, S, n, d, gl[i].g, gl[i].lb, ub, k);
    if (cst < best && cst < beta) { best = cst; bg = gl[i].g; if (best <= nodeLB) break; }
    else if (cst < lbmin) lbmin = cst;
  }
  free(gl);
  if (best < beta) { e->h = h; e->d = d; e->val = best; e->exact = (K_TOP == 0 || n <= T_SIZE) ? 1 : 1; e->best = bg; *bestg = bg; return best; }
  { int lbv = lbmin < beta ? beta : lbmin; if (lbv < nodeLB) lbv = nodeLB; if (K_TOP && n > T_SIZE) return lbv; e->h = h; e->d = d; e->val = lbv; e->exact = 0; e->best = -1; return lbv; }
store_lb_nodelb:
  e->h = h; e->d = d; e->val = nodeLB; e->exact = 0; e->best = -1; return nodeLB;
}
static int findw(const char *w) { for (int g = 0; g < NG; g++) if (!strcmp(W[g], w)) return g; return -1; }
static Ctx *newctx(void) { Ctx *c = calloc(1, sizeof(Ctx)); c->t = calloc(1ULL << MEMO_BITS, sizeof(Ent)); return c; }
static int dist[16];
static void tree(Ctx *c, FILE *f, const u16 *S, int n, int d, int g, int depth, const Cons *k) {
  if (g < 0) { int r = solve(c, S, n, d, INF, &g, k); (void)r; }
  fprintf(f, "{\"g\":\"%s\",\"n\":%d", W[g], n);
  const uint8_t *row = M + (size_t)g * NA; u16 *buf = malloc(sizeof(u16) * n); int first = 1;
  for (int i = 0; i < n; i++) if (row[S[i]] == GREEN) dist[depth]++;
  for (int p = 0; p < GREEN; p++) { int kk = 0; for (int i = 0; i < n; i++) if (row[S[i]] == p) buf[kk++] = S[i]; if (!kk) continue;
    fprintf(f, "%s\"%d\":", first ? ",\"c\":{" : ",", p); first = 0; Cons ck; hchild(k, g, p, &ck); tree(c, f, buf, kk, d - 1, -1, depth + 1, &ck); }
  if (!first) fprintf(f, "}");
  fprintf(f, "}"); free(buf);
}
int main(int argc, char **argv) {
  FILE *f = fopen(argv[1], "rb"); uint32_t hd[2]; fread(hd, 4, 2, f); NG = hd[0]; NA = hd[1];
  M = malloc((size_t)NG * NA); fread(M, 1, (size_t)NG * NA, f); fclose(f);
  W = malloc(16 * NG); f = fopen(argv[2], "r"); for (int g = 0; g < NG; g++) { fscanf(f, "%15s", W[g]); } fclose(f);
  ansIdx = malloc(sizeof(int) * NA); f = fopen(argv[3], "r"); for (int a = 0; a < NA; a++) fscanf(f, "%d", &ansIdx[a]); fclose(f);
  const char *mode = argv[4];
  memset(&C0, 0, sizeof C0); memset(C0.gr, 255, 5);
  if (getenv("WL_HARD") && atoi(getenv("WL_HARD"))) { HARD = 1; CODE = malloc(5 * NG); LC = calloc(NG, NLET); f = fopen(getenv("WL_CODES"), "r");
    for (int g = 0; g < NG; g++) for (int i = 0; i < 5; i++) { int x; fscanf(f, "%d", &x); CODE[g][i] = x; LC[g][x]++; } fclose(f); fprintf(stderr, "hard mode on\n"); }
  u16 *ALL = malloc(sizeof(u16) * NA); for (int a = 0; a < NA; a++) ALL[a] = a;
  if (!strcmp(mode, "rank")) {
    for (int g = 0; g < NG; g++) { const uint8_t *row = M + (size_t)g * NA; int cnt[243] = {0}; for (int a = 0; a < NA; a++) cnt[row[a]]++;
      double H = 0; int lb = NA, mx = 0, np = 0; for (int p = 0; p < 243; p++) if (cnt[p]) { double q = (double)cnt[p] / NA; H -= q * log2(q); np++; if (cnt[p] > mx) mx = cnt[p]; if (p != GREEN) lb += lbk(cnt[p], 9); }
      printf("%s %.4f %d %d %d\n", W[g], H, lb, mx, np); }
    return 0;
  }
  if (!strcmp(mode, "lb2")) {
    // list of openers; for each: NA + sum over parts of min_g (one-level bound of part)
    char *list = strdup(argv[5]); char *ws[8000]; int nw = 0; for (char *t = strtok(list, ","); t; t = strtok(NULL, ",")) ws[nw++] = t;
    #pragma omp parallel for schedule(dynamic,1)
    for (int wi = 0; wi < nw; wi++) {
      int g0 = findw(ws[wi]); const uint8_t *r0 = M + (size_t)g0 * NA; long tot = NA; u16 *buf = malloc(2 * NA);
      for (int p = 0; p < GREEN; p++) { int k = 0; for (int a = 0; a < NA; a++) if (r0[a] == p) buf[k++] = a; if (!k) continue; if (k <= 2) { tot += 2 * k - 1; continue; }
        Cons ck; hchild(&C0, g0, p, &ck);
        int best = INF; for (int g = 0; g < NG; g++) { if (!hvalid(&ck, g)) continue; const uint8_t *row = M + (size_t)g * NA; int cnt[243] = {0}; for (int i = 0; i < k; i++) cnt[row[buf[i]]]++; int lb = k; for (int q = 0; q < GREEN; q++) if (cnt[q]) lb += (cnt[q] == 1 ? 1 : 2 * cnt[q] - 1); if (lb < best) best = lb; }
        tot += best; }
      printf("LB2 %s %ld\n", ws[wi], tot); fflush(stdout); free(buf);
    }
    return 0;
  }
  if (!strcmp(mode, "solve") || !strcmp(mode, "tree")) {
    int D = atoi(argv[5]); K_TOP = atoi(argv[6]); T_SIZE = atoi(argv[7]);
    if (!strcmp(mode, "tree")) {
      int g0 = findw(argv[8]); Ctx *c = newctx(); int bg; const uint8_t *r0 = M + (size_t)g0 * NA;
      int cnt[243] = {0}; for (int a = 0; a < NA; a++) cnt[r0[a]]++; int lb = NA; for (int p = 0; p < GREEN; p++) lb += lbk(cnt[p], D - 1);
      int tot = evalg(c, ALL, NA, D, g0, lb, INF, &C0); (void)bg;
      FILE *o = fopen(argv[9], "w"); memset(dist, 0, sizeof dist); tree(c, o, ALL, NA, D, g0, 1, &C0); fclose(o);
      int wst = 0; long s = 0; for (int i = 0; i < 16; i++) if (dist[i]) { wst = i; s += (long)i * dist[i]; }
      printf("TREE %s total %d (check %ld) avg %.5f worst %d dist", argv[8], tot, s, (double)tot / NA, wst); for (int i = 1; i <= wst; i++) printf(" %d", dist[i]); printf("\n");
      return 0;
    }
    int BETA = atoi(argv[8]); if (!BETA) BETA = INF;
    char *list = strdup(argv[9]); char *ws[8000]; int nw = 0; for (char *t = strtok(list, ","); t; t = strtok(NULL, ",")) ws[nw++] = t;
    volatile int gbest = BETA;
    #pragma omp parallel
    { Ctx *c = newctx();
      #pragma omp for schedule(dynamic,1)
      for (int wi = 0; wi < nw; wi++) {
        int g0 = findw(ws[wi]); if (g0 < 0) { printf("NOWORD %s\n", ws[wi]); continue; }
        struct timespec t0, t1; clock_gettime(CLOCK_MONOTONIC, &t0);
        const uint8_t *r0 = M + (size_t)g0 * NA; int cnt[243] = {0}; for (int a = 0; a < NA; a++) cnt[r0[a]]++; int lb = NA; for (int p = 0; p < GREEN; p++) lb += lbk(cnt[p], D - 1);
        int b = gbest; long n0 = c->nodes;
        int tot = evalg(c, ALL, NA, D, g0, lb, b, &C0);
        clock_gettime(CLOCK_MONOTONIC, &t1);
        #pragma omp critical
        { if (tot < gbest) gbest = tot; printf("RES %s %d %s lb1=%d avg=%.5f nodes=%ld t=%.1fs\n", ws[wi], tot, tot < b ? "exact" : "lb", lb, (double)tot / NA, c->nodes - n0, (t1.tv_sec - t0.tv_sec) + (t1.tv_nsec - t0.tv_nsec) / 1e9); fflush(stdout); }
      }
    }
    return 0;
  }
  return 1;
}
