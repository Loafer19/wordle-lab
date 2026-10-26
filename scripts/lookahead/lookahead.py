#!/usr/bin/env python3
"""2-ply lookahead decision trees (strategies 'lookahead-b' and 'lookahead-a'), normal mode.

  python3 scripts/lookahead/lookahead.py --lang en --mode B        # → data/lookahead/salet.b.json   (EN 7920 / 2315, worst 5)
  python3 scripts/lookahead/lookahead.py --lang ua --mode A        # → data/ua/lookahead/kotra.a.json (UA 5842 / 1717)

Needs Python 3 + numpy. Uses the same feedback as src/lib/wordle.ts (base-3, digit i = position i, 2 green / 1 yellow / 0 grey,
greens first, then yellows left to right while the answer still has that letter). Output = TreeNode JSON {g, n, c: {pattern: node}}
(solved branch 242 omitted), the same shape as data/ua/optimal/*.json; check with verifyTree (tests/unit/lookahead.test.ts).

Mode B (expected cost, 2-ply): at a node with candidate set S (n ≥ 3) try every guess w in the top-K allowed words by Σ1/|group|
plus every remaining answer. For each feedback group g of w: cost 0 if w is the answer, 1 if |g| = 1, 1.5 if |g| = 2, otherwise
E(g) = 1 + min over ALL allowed v of (1/|g|)·Σ over v's groups h of c(h), with c = 0 for the solved h, 1 for |h| = 1, 1.5 for |h| = 2
and (2k−1)/k + x for |h| = k ≥ 3 (the best case for k answers plus a penalty x for a group that is not finished within 2 more guesses).
Pick the w with the smallest 1 + Σ|g|·E(g)/n; ties: possible answer, then larger Σ1/|g|. Then recurse into every group.
Mode A (safe): maximise the number of answers whose group can be finished within 2 more guesses (|g| ≤ 2, or some next guess splits g
into singletons); ties: larger Σ1/|g|, possible answer, smaller B cost.  n ≤ 2: guess the first candidate (answers.txt order).
"""
import argparse, json, math, os, sys, time
from multiprocessing import Pool
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GREEN, EPS = 242, 1e-9
A = G = P = A2G = ROWOFF = None
NG = NA = 0

def patterns(A, G, cache):
    if cache and os.path.exists(cache): return np.load(cache)
    alpha = {c: i for i, c in enumerate(sorted(set(''.join(G + A))))}
    a = np.array([[alpha[c] for c in w] for w in A], dtype=np.int16)
    P = np.zeros((len(G), len(A)), dtype=np.uint8); rows = np.arange(len(A)); w3 = np.array([1, 3, 9, 27, 81])
    for gi, g in enumerate(G):
        gv = np.array([alpha[c] for c in g]); green = a == gv
        res = green.astype(np.int64) * 2; cnt = np.zeros((len(A), len(alpha)), dtype=np.int16)
        for i in range(5): np.add.at(cnt, (rows[~green[:, i]], a[~green[:, i], i]), 1)
        for i in range(5):
            c = gv[i]; m = (~green[:, i]) & (cnt[:, c] > 0); res[m, i] = 1; cnt[m, c] -= 1
        P[gi] = res @ w3
    if cache: np.save(cache, P)
    return P

def init(lang):
    global A, G, P, A2G, ROWOFF, NG, NA
    d = os.path.join(ROOT, 'data' if lang == 'en' else f'data/{lang}')
    A, G = open(os.path.join(d, 'answers.txt')).read().split(), open(os.path.join(d, 'allowed.txt')).read().split()
    gi = {w: i for i, w in enumerate(G)}
    A2G = np.array([gi[w] for w in A]); NG, NA = len(G), len(A)
    P = patterns(A, G, os.environ.get('PATTERN_CACHE') and os.path.join(os.environ['PATTERN_CACHE'], f'patterns_{lang}.npy'))
    ROWOFF = (np.arange(NG, dtype=np.int64) * 243)[:, None]

def counts(S):
    return np.bincount((P[:, S].astype(np.int64) + ROWOFF).ravel(), minlength=NG * 243).reshape(NG, 243)

def inv_score(C):
    return np.where(C > 0, 1.0 / np.maximum(C, 1), 0).sum(1)

class Picker:
    def __init__(self, mode, K, x):
        self.mode, self.K = mode, K
        c = np.array([0.0, 1.0, 1.5] + [(2 * k - 1) / k + x for k in range(3, NA + 1)])
        self.T = np.arange(NA + 1) * c       # k·c(k): cost of a whole group of size k
        self.cache = {}
    def group(self, g):  # (E(g), finishable within 2 more guesses) for a sorted group of ≥ 3 answers
        key = g.tobytes(); r = self.cache.get(key)
        if r is None:
            Cg = counts(g)
            tot = self.T[Cg].sum(1) - (Cg[:, GREEN] == 1)  # the guessed answer itself costs 0, not 1
            r = self.cache[key] = (1.0 + tot.min() / len(g), bool((Cg.max(1) == 1).any()))
        return r
    def score(self, w, S):
        pw = P[w, S]; tot, good = 0.0, 0
        for p in np.unique(pw):
            grp = S[pw == p]; m = len(grp)
            if p == GREEN: good += 1
            elif m <= 2: tot += m * (1 if m == 1 else 1.5); good += m
            else:
                e, ds = self.group(grp); tot += m * e; good += m if ds else 0
        return 1.0 + tot / len(S), good
    def __call__(self, S):
        inv = inv_score(counts(S))
        pool = list(dict.fromkeys(np.argsort(-inv, kind='stable')[:self.K].tolist() + A2G[S].tolist()))
        cs = set(A2G[S].tolist()); best = bkey = None
        for w in pool:
            cost, good = self.score(w, S)
            key = (round(cost, 9), -(w in cs), -inv[w]) if self.mode == 'B' else (-good, -round(inv[w], 9), -(w in cs), cost)
            if bkey is None or key < bkey: best, bkey = w, key
        return best

def play(S, turn, pick):
    w = A2G[S[0]] if len(S) <= 2 else pick(S)
    node = {'g': G[w], 'n': int(len(S))}; pw = P[w, S]
    for p in np.unique(pw):
        if p != GREEN:
            if turn >= 12: raise RuntimeError('no progress')
            node.setdefault('c', {})[str(int(p))] = play(S[pw == p], turn + 1, pick)
    return node

def job(a):
    lang, mode, K, x, sub = a
    return play(np.array(sub), 2, Picker(mode, K, x))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lang', default='en'); ap.add_argument('--mode', default='B', choices=['A', 'B'])
    ap.add_argument('--K', type=int, default=50); ap.add_argument('--x', type=float, help='penalty for a group not finished within 2 more guesses (default 0.25 for B, 0 for A)')
    ap.add_argument('--opener'); ap.add_argument('--procs', type=int, default=os.cpu_count()); ap.add_argument('--out')
    o = ap.parse_args(); init(o.lang)
    if o.x is None: o.x = 0.25 if o.mode == 'B' else 0.0
    opener = o.opener or ('salet' if o.lang == 'en' else 'котра')
    out = o.out or os.path.join(ROOT, 'data/lookahead' if o.lang == 'en' else f'data/{o.lang}/lookahead', f"{ {'котра': 'kotra'}.get(opener, opener)}.{o.mode.lower()}.json")
    t0 = time.time(); S = np.arange(NA); w0 = G.index(opener); pw = P[w0, S]
    subs = sorted(([int(p), S[pw == p].tolist()] for p in np.unique(pw) if p != GREEN), key=lambda t: -len(t[1]))
    with Pool(o.procs, initializer=init, initargs=(o.lang,)) as pool:
        kids = pool.map(job, [(o.lang, o.mode, o.K, o.x, s) for _, s in subs], chunksize=1)
    tree = {'g': opener, 'n': NA, 'c': {str(p): k for (p, _), k in sorted(zip(subs, kids))}}
    depth = []
    def walk(n, d, S):
        pw = P[G.index(n['g']), S]
        for p in np.unique(pw):
            if p == GREEN: depth.append(d)
            else: walk(n['c'][str(int(p))], d + 1, S[pw == p])
    walk(tree, 1, np.arange(NA))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(tree, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'{out}: total {sum(depth)} / {NA} = {sum(depth) / NA:.5f}, worst {max(depth)}, {time.time() - t0:.0f}s ({o.mode}, K={o.K}, x={o.x})')

if __name__ == '__main__':
    main()
