# 2-ply lookahead trees

`lookahead.py` builds the decision trees behind the **Lookahead 2-ply** (`lookahead-b`) and **Lookahead 2-ply safe** (`lookahead-a`)
strategies (normal mode). The trees are committed, so the site and `bun scripts/simulate.ts` never run the search:

| file | strategy | total / answers | worst |
|---|---|---|---|
| `data/lookahead/salet.b.json` | Lookahead 2-ply, EN, opener SALET | 7920 / 2315 = 3.4212 | 5 |
| `data/lookahead/salet.a.json` | Lookahead 2-ply safe, EN, opener SALET | 7996 / 2315 = 3.4540 (98.4 % in ≤ 4) | 5 |
| `data/ua/lookahead/kotra.b.json` | Lookahead 2-ply, UA, opener КОТРА | 5805 / 1717 = 3.3809 | 6 |
| `data/ua/lookahead/kotra.a.json` | Lookahead 2-ply safe, UA, opener КОТРА | 5842 / 1717 = 3.4025 (98.0 % in ≤ 4) | 6 |

## Regenerate

Python 3 + numpy (`pip install numpy`). Each run takes about 10–30 s on 6 cores (the full feedback table is ~30 MB per language
and is rebuilt in a few seconds; set `PATTERN_CACHE=<dir>` to keep it as `patterns_<lang>.npy`).

```sh
python3 scripts/lookahead/lookahead.py --lang en --mode B   # data/lookahead/salet.b.json
python3 scripts/lookahead/lookahead.py --lang en --mode A   # data/lookahead/salet.a.json
python3 scripts/lookahead/lookahead.py --lang ua --mode B   # data/ua/lookahead/kotra.b.json
python3 scripts/lookahead/lookahead.py --lang ua --mode A   # data/ua/lookahead/kotra.a.json
bun scripts/simulate.ts --no-hard --no-pairs --merge lookahead-b lookahead-a             # verifies the trees, writes public/sim/
bun scripts/simulate.ts --lang ua --no-hard --no-pairs --merge lookahead-b lookahead-a
```

Options: `--K 50` (how many top guesses by Σ 1/group are tried, plus every possible answer), `--x 0.25` (penalty for a group
not finished within 2 more guesses; B only), `--opener`, `--procs`, `--out`.

## How a move is chosen

* **B — min expected guesses.** For a guess *w* and each of its feedback groups *g*: 0 if *w* is the answer, 1 if |g| = 1, 1.5 if
  |g| = 2, else 1 + the best next guess *v* (searched over **all** allowed words) of the mean cost of *v*'s groups, where a group
  of k ≥ 3 answers left after *v* is estimated as (2k − 1)/k + x — the best case for k answers plus a penalty. Pick the *w* with
  the lowest expected total. Exact over two guesses, an optimistic estimate below that; it is not an exhaustive proof, but here
  it reaches the proven optimum in both languages (7920 EN, 5805 UA).
* **A — safe.** Maximise the number of answers whose group can be finished within 2 more guesses (|g| ≤ 2 or some next guess
  splits it into single answers); ties: larger Σ 1/group, possible answer, lower B cost. Fewer 5-guess games, higher average.
* The root is fixed (SALET / КОТРА): searching it too takes minutes per language. Live in the browser the strategies are read from
  the tree; once the player's guesses leave the tree they fall back to the instant **Small groups + entropy** (`hybrid-all`).

Experiment numbers (opener effect, cap sweep, parameter sweep) are in Strategies › Lookahead on the site (`src/lib/lookahead.ts`).
