# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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

[1.1.0]: https://github.com/Loafer19/wordle-lab/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Loafer19/wordle-lab/releases/tag/v1.0.0
