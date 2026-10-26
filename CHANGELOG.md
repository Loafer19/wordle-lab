# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.5.0] - 2026-10-26

Lookahead strategies that look two guesses ahead, a leaderboard grouped by type, and a head-to-head Compare panel.

### Added
- **Lookahead 2-ply** (`lookahead-b`): picks the guess with the lowest expected number of guesses, where every feedback group gets the best possible next guess (over all allowed words) and groups still left with 3+ answers are estimated optimistically plus a 0.25 penalty; the top 50 guesses by Σ 1/group plus all candidates are tried. Precomputed trees: EN SALET 7920 / 2315 = 3.4212 (worst 5, the proven optimum), UA КОТРА 5805 / 1717 = 3.3809 (worst 6, the proven optimum). Normal mode only; off the tree it falls back to Small groups + entropy.
- **Lookahead 2-ply safe** (`lookahead-a`): maximises the answers whose group can be finished within two more guesses. EN 3.4540 with 98.4% of games in ≤ 4 (worst 5), UA 3.4024 with 98.0% in ≤ 4.
- `scripts/lookahead/lookahead.py` (Python + numpy) regenerates the four trees in `data/lookahead/` and `data/ua/lookahead/` in about 10–30 s each; `bun scripts/simulate.ts` verifies them and writes `public/lookahead-tree.json`.
- **Small groups + entropy** (`hybrid-all`): instant greedy rule Σ 1/group + 20 × entropy, no cap, fixed opener SALET / КОТРА. EN 3.4263, UA 3.3885.
- **Max entropy** (`entropy-all`) now always opens with SALET (EN) / КОТРА (UA), the same opener as Small groups, so the comparison is like for like: EN 3.4337 (was 3.4648 with its own opener SOARE), hard 3.5235; UA unchanged (3.3960, it already opened with КОТРА). There is a single max-entropy row; the old "own opener" variant is gone.
- **Strategies › Lookahead**: how the lookahead works (2-ply expected guesses, the penalty x, top-K pruning, why it is precomputed), results next to the optimum and the greedy rules, the safe vs expected-cost trade-off, the opener effect table (SOARE / SALET / TRACE / CRANE), the Small-groups cap sweep and the lookahead parameter sweep. EN and UA.

### Changed
- **Strategies › Leaderboard:** rows are grouped by type (Optimal trees, Lookahead, Greedy heuristics, Letter frequency & staged, Baselines) with the overall rank, a one-line description and the opener; *Ranked* shows the old single list. Equal averages share a rank.
- **Strategies › Compare:** the five KPI tiles are replaced by one head-to-head panel: both strategy names, descriptions and openers, A always amber and B always blue (also in the difference table and histogram), averages with the difference, a stacked bar of words where A is better / the same / B is better with percentages, and worst case, failures and the share of games in ≤ 4 for each side.
- The i18n check also covers `tr(…)` calls and strings translated from data tables (strategy names, descriptions, groups).

### Tests
- Unit: the four lookahead trees are valid (verifyTree, every guess allowed), with the expected totals, worst cases and ≤ 4 counts; the published `lookahead-tree.json` equals them; sim index rows for the new strategies; the hybrid score; names, groups, descriptions and UA translations.
- e2e: leaderboard groups and new rows, the head-to-head panel, and the Lookahead page (EN/UA).

## [1.4.2] - 2026-10-18

Card order that follows what you are doing, and your own starting word in the decision tree.

### Added
- **Explore › Tree: your own starting word.** Type any allowed 5-letter word (Ukrainian letters in UA) and *Build tree*: the first guess is yours and every later move is chosen by max entropy, since the precomputed optimal tree only covers its own opener. The tree is built in a Web Worker with a progress bar, a table compares the default opener with yours (average, worst case, guess distribution), and the word is remembered per language until you *Reset*. Invalid words are explained inline.

### Changed
- **Play:** the right-hand cards follow the game. Before the first guess: stats and fingerprint. While playing: *Words still possible* and *Information per guess* first, then a one-line stats summary. After the game: share card, stats, word meaning, review, optimal replay, fingerprint. On phones the board and keyboard stay on top.
- **Assistant › Help me now:** the how-to steps hide after the first guess, so the suggestion moves up.
- **Assistant › Watch a strategy:** *Every strategy on this word* now comes right after the replay, above the long guess-by-guess review.
- **Strategies › Strategy Lab:** *Save as custom strategy* sits directly under the builder, above the results.
- **Strategies › Compare:** *Biggest differences* comes before the guess-distribution chart.
- **Learn › Top openers:** the *Openers at a glance* table comes before the chart.
- Faster max-entropy picker (byte-encoded feedback with reused buckets), used when building custom-opener trees.
- README: refreshed screenshots (all in `docs/readme/`, taken from the v1.4.2 build with `scripts/readme-shots.ts`) and the feature list.

### Tests
- Unit: custom-opener trees cover every answer in EN and UA and start with the opener; the fast feedback and fast max entropy agree with the engine; tree strategies fall back to max entropy after a custom opener.
- e2e: Play card order by phase (EN/UA, desktop and phone); the tree opener (validation, worker build, comparison, persistence, reset); the new card order in Watch, Lab, Compare and Top openers (EN/UA). Fixed a race in *Coach tab analyses a pasted game*, which could read the default example's review before the pasted game's.

## [1.4.1] - 2026-10-14

Finishes the two items that v1.4.0 skipped or limited.

### Added
- **Share card as an image.** *Download image* saves a PNG of the share card (grid, score, Skill, Luck, Optimal, site link). It is drawn on a canvas with no new dependency, at 2× resolution, in EN and UA, and follows the dark or light theme. Where the browser supports it, *Share image* sends the PNG through the Web Share API (with files) and downloads it if the browser can't share it.
- **Watch a strategy: side-by-side replay.** An optional *Compare with…* picker shows how a second strategy solves the same word next to the first.

### Changed
- **Watch › Every strategy on this word** now includes two-step entropy and no longer freezes the page. Results are read from the precomputed simulation data when it exists, optimal trees are read directly on the main thread, and the remaining strategies (for example the presets) run in a Web Worker. A progress bar shows how far it has got, and you can cancel or recompute. Results computed in the browser are marked *live*.

### Fixed
- Luck could show as "−0.0" (in red) on the share card and in the share text. It now shows "+0.0".

### Tests
- Unit: share-card layout (tile colours, themes, badges stay inside the card), how *Compute all* chooses where each result comes from, the sim lookup matching live two-step play, and the "−0.0" fix.
- e2e: the PNG download in EN and UA, dark and light (PNG signature, 1200 px wide, background matches the theme); *Compute all* including two-step entropy with the UI staying responsive, cancel, and the side-by-side replay.

## [1.4.0] - 2026-10-14

UX restructure from the round-11 audit: 6 tabs / 13 views → 5 tabs with less repetition, a phone-first layout and new player features.

### Changed
- **Five tabs:** Play · Assistant · Learn · Strategies · Explore. On phones the tabs are a fixed bottom bar; sub-views scroll sideways instead of wrapping off-screen.
- **Assistant** (was Solver + Coach + Explore › Decision paths): *Help me now* (live solver), *Review a game* (paste any game), *Watch a strategy* (pick a word and a strategy, see every guess with its reasoning). All of them, and the Play post-game review, use the same per-guess card (`StepCard`).
- **Learn** (was Analytics): *Start here* guide, Letters (word list, letter and positional frequency), Top openers, and the **Word inspector**, which merges Patterns with the openers' pattern panel. Click an opener bar or row to open it there. There is one entropy explainer instead of two. The opener-pairs heatmap moved into a collapsed *Advanced* section.
- **Strategies:** one **leaderboard** replaces the gap table, the Results table and the average-guesses chart. It has a Normal / Hard / Both toggle (hard columns are hidden by default), inline gap bars, fail % and worst case, and short strategy names with the full name and description in a tooltip. It becomes cards on phones. **Compare** opens when you tick two rows; "Biggest differences" shows the top 15 with a *Show all* button, and the per-word histogram is collapsed. The gap, distribution and candidates-per-turn charts and the Web Worker re-run controls sit in collapsed sections.
- **Explore:** Tree, Flow and Answer map. On phones, Tree becomes an accordion drill-down and Flow becomes a per-guess list; a *Chart* button still shows the full chart.
- One KPI tile component (`UiStat`) and one collapsible section (`UiAdvanced`) across Coach, Compare, Lab and the fingerprint. Casual views round to 2 decimals, with full precision on hover.
- Every view except Play is lazy-loaded (code-split), so ECharts no longer loads on the first Play paint.

### Added
- **Player fingerprint** (Play): skill and luck of every finished game are stored in `localStorage` per language. It shows games played, average skill (with the trend over the last 10 games), average luck, average guesses and win rate, skill and luck sparklines, and the strategy whose average is closest to yours.
- **"How the optimal strategy solves WORD"** after every game (the hard-mode tree in hard mode), with "you beat it / tied / N fewer than you".
- **Share card**: a mini grid plus Skill, Luck and the optimum's count; the share text includes them too. Native *Share* button where supported.
- **Guided Learn path:** four short steps (letters → patterns → entropy → decision trees), each linking to its view.
- Simulation re-runs are cached in IndexedDB and replace the precomputed numbers in the leaderboard (marked ↻).
- `scripts/i18n-check.ts` (fails if any `t('…')` string lacks a Ukrainian translation) and `scripts/shots.ts` (screenshots of every view in EN/UA, desktop/390 px, with checks for console errors and horizontal overflow).
- Tests: unit tests for routes and redirects, fingerprint maths and the share text; e2e tests for 390 px overflow on every view (EN + UA), leaderboard → compare, opener → inspector, the guide, Watch a strategy, the post-game optimal replay, share card and fingerprint, the tree/flow phone fallbacks and the Answer map hint.

### Fixed
- Loading and empty states: Lab KPIs show skeletons instead of "0.000" and "…"; there is no hidden "No results found" on load in the word pickers; the Answer map hint is muted text rather than a heading; and the leaderboard, tree, flow and map show skeletons while loading.
- Horizontal overflow at 390 px in Compare and Answer map (long strategy names in the picker, cells scaled on hover).
- Untranslated strings: "… is not in the word list", "kept", "N guesses" on the map, and "Loading … dictionaries".

### Redirects
Old links keep working: `#tab=solver`/`assist` → Assistant › Help me now, `#tab=coach` → Review a game, `#tab=explore&view=paths` → Watch a strategy, `#tab=strategies&view=simulation` → Leaderboard, `#tab=analytics&view=letters|patterns|openers` → Learn › Letters | Word inspector | Top openers, plus all older v1.0–v1.2 hashes.

## [1.3.0] - 2026-10-13

### Added
- **Coach mode:** after every Play game (daily and random, EN and UA) a per-guess review: candidates before → after, actual vs expected bits, the best guess by entropy (hard-mode legal in hard mode) and the optimal-tree move while on the tree, each with expected bits and answers left, a luck indicator (Δ bits and the share of outcomes that would have left more), a skill score, and plain-language tips (reused grey letters, a yellow letter in the same spot, leaving a known green, cluster traps, when a non-candidate would help, guess a candidate when ≤2 remain). Runs in a Web Worker.
- **Coach tab:** paste or type any game, e.g. `ARISE(⬜⬜⬜🟨⬜) CLOTH(⬜⬜🟩🟨⬜)`, `arise 00010` or `arise bbbyb`, with examples and a hard-mode switch. Fully translated in UA, mobile friendly.
- **UA proven-optimal trees** (exact Selby-style search, `scripts/ua-optimal/`): opener КОТРА, 5805/1717 = 3.3809 (worst 6); best with ≤5 guesses 5806/1717 = 3.3815; a 4-guess guarantee is impossible. Strategies 'Optimal tree (UA)' and 'Optimal tree (UA, ≤5 guesses)'; the UA default best strategy is now the optimal tree.
- **UA hard-mode optimal tree:** the solver now supports hard mode (`WL_HARD=1`, the app's hard rules). Proven optimum 5930/1717 = 3.4537 with opener КАРСТ (2 words need 7 guesses). New strategy 'Optimal tree (UA, hard)', simulated as `optimal@hard`.
- **Ruslan staged letter strategies** (coverage → cluster splitter → candidates), with sweeps and EN/UA simulations.
- Second-step information analysis: `docs/analysis-second-step.md`, `scripts/analysis/`.
- Tests: unit tests for coach analysis/parsing, the UA hard tree and per-language gaps; e2e tests for the Coach tab and the post-game coach (EN/UA, mobile), Solver tree explanations and the UA gap table.

### Fixed
- Solver: an optimal-tree strategy's first guess (КОТРА, КАРСТ, SALET) now shows the optimal-tree explanation instead of the generic "best first word (precomputed)" text (EN + UA).
- Gap tables and the "Average guesses" optimum line compare UA strategies with the UA optimum (3.3809 normal / 3.4537 hard) instead of the EN one (3.4212); the gap table is now shown in UA too, and gaps are never negative.
- Untranslated "lucky/unlucky" badges in the information panel.

## [1.2.0] - 2026-10-12

### Added
- **Strategy Lab** (replaces the Tuner): compose a strategy from blocks: a computed or fixed opener; K explore turns (any valid word); the explore and exploit scores (frequency, positional, balanced, entropy, min-expected, minimax); and a tie-breaker. It re-simulates live on a sample, can run all answers, and shows the gap to the best known strategy, the guess distribution and the hardest words. Save it as a custom strategy (stored in your browser) and pick it in Solver, Compare, Tree, Flow and Answer map.
- **Explore-then-exploit presets**, simulated in EN and UA in normal and hard mode. "Explore 2 → candidates" scores 3.515 in EN (3.433 in UA) and "Explore 1 → candidates" 3.618 (3.493 in UA).
- **Full Ukrainian interface:** when UA is selected, every label, tooltip, explanation, banner, chart axis and the footer are in Ukrainian, and `<html lang>` follows the language.
- **Footer pills:** a version pill that links to the release, and an "updated" pill that links to the deployed commit.
- Unit tests for the alphabet mapping (EN/UA letter frequencies add up and every letter is present). New e2e tests cover UA analytics, the UA UI, the footer and the Strategy Lab.

### Changed
- "Letters & Patterns" is renamed **Analytics** (UA: «Аналітика»). Old `#tab=letters…` and `#tab=…tuner` links redirect.

### Fixed
- **UA letter-frequency chart and heatmap** showed only 7 letters (Ц Я Ш Ю Ч Щ Ь), because they were indexed by position in the alphabet string instead of the engine's letter code. The engine and simulations were not affected, and the regenerated UA results are unchanged.

## [1.1.0] - 2026-10-12

### Added
- **Ukrainian word lists (EN/UA switch in Settings):** 1,717 common nouns as answers and 7,158 valid guesses, a ЙЦУКЕН on-screen keyboard (with ґ, є, і, ї), and typing Ukrainian from a Latin QWERTY layout. Simulations are precomputed for every strategy in UA. Definitions link out to Горох, СУМ-20 and sum.in.ua.
- **Settings popover** (gear icon): word-list language, hard mode, theme, reduce animations, and an "About the word lists" note.
- **Daily countdown:** "Next word in HH:MM:SS"; today's daily progress survives a reload, and New game only appears in Random mode.
- **Animated logo:** tiles gently flip now and then while idle, and a colour wave runs on hover. Respects reduced motion.
- **Version in the footer** (version, build date, commit) linking to the GitHub release. Versions are injected at build time.
- **End-to-end tests** for navigation links, legacy redirects, the daily countdown, Settings, and a playable UA game.

### Changed
- **12 tabs → 5:** Play, Solver, Strategies (Simulation, Compare, Tuner), Explore (Decision paths, Tree, Flow, Answer map), Letters & Patterns (Letters, Patterns, Openers).
- **Real links:** tabs, sub-views and the logo are `<a href>` links (`#tab=…&view=…`), so middle-click and Ctrl-click open new tabs and back/forward work. Old `#tab=sim` style links redirect.
- **Ruslan's letter-frequency strategies trimmed from 6 to 3:** plain, positional, and balanced f·(n−f), all guessing from the remaining candidates.
- **Shared components:** candidate word lists are now a single component with wrapped, clickable chips and a count (fixes words running together); Play and Solver share it.
- **Cursor affordances:** clickable elements show a pointer and disabled ones show not-allowed.
- **Per-language stats:** stats are kept separately for each language.

### Removed
- The "any word" versions of Ruslan's strategies (freq-all, freqpos-all, freqbal-all), from both the simulation data and the UI.

## [1.0.0] - 2026-10-12

### Added
- First public release: Play (daily and random, hard mode, stats, share grid, win banner with confetti, word meanings), and a Solver with 14 strategies including two-step entropy and the proven-optimal SALET tree.
- Simulation of all 2,315 answers, Compare, the live Tuner, decision Tree, Flow, Patterns, Answer map, Decision paths, Letters, and Openers with a pair heatmap.
- Playwright tests, Dockerfile and MIT license.

[1.2.0]: https://github.com/Loafer19/wordle-lab/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Loafer19/wordle-lab/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Loafer19/wordle-lab/releases/tag/v1.0.0
