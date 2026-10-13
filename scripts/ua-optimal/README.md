# UA optimal decision tree (normal mode)

Exact Selby-style solver: minimise total guesses over the 1,717 UA answers, guesses from all 7,158 allowed words.

```sh
bun scripts/ua-optimal/matrix.ts ua                     # /tmp/wl-ua.{mat,words,ansidx}  (feedback() of the app)
gcc -O3 -march=native -fopenmp scripts/ua-optimal/solver.c -o /tmp/wlsolver -lm
S="/tmp/wlsolver /tmp/wl-ua.mat /tmp/wl-ua.words /tmp/wl-ua.ansidx"
$S rank                                     # entropy + one-level bound for every opener
$S lb2 w1,w2,...                            # two-level lower bound per opener (all 7158: ~20 s on 12 cores)
OMP_STACKSIZE=64M $S solve 8 0 0 5806 w1,...   # exact DFS (K=0 → no guess restriction), prune at total 5806
$S tree 8 0 0 котра out.json                # write the tree   (DEPTH=5 → best tree with ≤5 guesses)
```

Algorithm: DFS over candidate sets, memo (64-bit hash of sorted set + depth) per thread, lower bound f(S) ≥ 2|S|−1
(one answer may cost 1, the rest ≥2), node bound = min over guesses of |S| + Σ lb(parts), alpha-beta style cut
against the best total so far, immediate return 2n−1 for an in-set perfect splitter / 2n for an out-of-set one,
all 7,158 guesses considered at every node (no heuristic restriction).

## Result (proven, modulo 64-bit hash collisions in the memo)
* `lb2` ≥ 5806 for 7,070 of 7,158 openers → cannot beat 5805.
* The remaining 88 were solved exactly with cut 5806 (`proof-log.txt`): only **КОТРА** reaches 5805; every other is ≥ 5806.
* **Optimum: КОТРА, 5805/1717 = 3.38090**, distribution 2:82 3:949 4:638 5:46 6:2 (worst 6).
* With a 5-guess cap: КОТРА 5806/1717 = 3.38148 (2:82 3:945 4:643 5:47) — optimal under the cap (every other opener is ≥ 5806 even uncapped; ties possible).
* **4-guess guarantee is impossible**: DEPTH=4 search is infeasible for all 7,158 openers (`d4-log.txt`, ~8 min on 12 cores). So 5 is the minimum worst case.

## Hard mode (v1.3.0)

`WL_HARD=1 WL_CODES=/tmp/wl-ua.codes` switches the same solver to hard mode with the app's rules (`hardValid` in `src/lib/advanced.ts`, used by
simulations and `verifyTree`): greens stay in place and every revealed letter (yellow or green) must be reused at least as many times as revealed.
The node state is (candidate set, constraint); the constraint (greens + minimum letter counts) is hashed into the memo key, and only legal
guesses are tried at each node. `matrix.ts` also writes `/tmp/wl-ua.codes` (letter codes per word).

```sh
export WL_HARD=1 WL_CODES=/tmp/wl-ua.codes OMP_STACKSIZE=64M
$S lb2 $(paste -sd, /tmp/wl-ua.words) > lb2-hard-openers.txt   # hard two-level bound (legal 2nd guesses only), ~10 s
$S solve 8 0 0 5931 <676 openers with lb2 < 5931>              # 13.5 min on 8 cores → hard-proof-log.txt
$S tree 8 0 0 карст data/ua/optimal/karst.hard.json
```

Result (proven, modulo 64-bit hash collisions):
* every opener has hard `lb2` ≥ 5931 except 676; those 676 were searched exactly with cut 5931: **КАРСТ = 5930** exact, all others ≥ 5930.
* **Hard-mode optimum: 5930/1717 = 3.45370** (КАРСТ), distribution 2:110 3:825 4:690 5:79 6:11 7:2 — the min-average hard tree needs 7 guesses for 2 words.
  117 other openers reached the cut (≥ 5930), so ties with КАРСТ are possible but nothing is better.
* With a 6-guess cap (DEPTH=6) КАРСТ costs 5962 (3.4723, worst 6); a bounded 10-min run over 48 of the best openers (`hard6-log.txt`, 47 finished)
  found nothing below 5962 (АКТОР, КАРЕЛ, ЛОБНА can at best tie) — a best-found bound, not a proof over all openers.
