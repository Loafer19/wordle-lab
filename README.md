# Wordle Lab
Bun + Vue 3 (Vite) + TypeScript + Tailwind v4 + PrimeVue + ECharts (vue-echarts) + VueUse.

- **Play** – Wordle with keyboard, colours, optional hard mode, live candidate count/bits.
- **Solver assistant** – step-by-step suggestions with explanations for any strategy.
- **Simulation** – every strategy over all 2,315 answers (Web Workers), table + charts.
- **Letter frequency** – overall & positional heatmap. **Openers & entropy** – bits per opener, bucket distribution.

```
bun install
bun run dev        # http://localhost:5173
bun run simulate   # CLI results table, writes public/results.json (~1 min)
bun run build
```
Strategies live in `src/lib/wordle.ts`. Dictionaries: see `data/SOURCES.md`.

Strategy                       | Opener |  Avg   | Fail% | Worst |   1    2    3    4    5    6   >6
----------------------------------------------------------------------------------------------------
Max entropy (3b1b)             | SOARE  |  3.465 |  0.00 |     6 |    0   44 1216  991   63    1    0
Min expected size              | ROATE  |  3.481 |  0.00 |     5 |    0   55 1130 1091   39    0    0
Minimax worst bucket           | ARISE  |  3.573 |  0.00 |     6 |    1   53  990 1162  107    2    0
Max entropy (candidates)       | RAISE  |  3.599 |  0.48 |     8 |    1  131  999  919  208   46   11
Ruslan pos-freq (candidates)   | STARE  |  3.622 |  0.65 |     9 |    1  132  955  957  214   41   15
Ruslan freq (candidates)       | ALERT  |  3.684 |  0.95 |     8 |    1  130  912  933  262   55   22
Ruslan pos-freq (any word)     | SOARE  |  3.689 |  0.86 |     8 |    0  111  931  947  245   61   20
Ruslan freq (any word)         | OATER  |  3.747 |  0.00 |     6 |    0   51  756 1246  252   10    0
Random candidate               | QUEST  |  4.091 |  1.30 |     8 |    0   92  582  896  551  164   30

Saved public/results.json
