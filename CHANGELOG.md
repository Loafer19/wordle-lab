# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
