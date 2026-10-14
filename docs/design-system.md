# Wordle Lab design system

Small and pragmatic: one token source in CSS, a JS mirror for libraries that can't read CSS, and five base components.

## Tokens (`src/style.css` → Tailwind v4 `@theme`)
| Group | Tokens → utilities | Notes |
|---|---|---|
| Brand | `brand-400…700` → `bg-brand-600`, `text-brand-500` | Emerald. Same scale is PrimeVue `primary` (`src/lib/preset.ts`). |
| Tile/key states | `correct` `#16a34a`, `present` `#ca8a04`, `absent` `#52525b` → `bg-correct`… | Fixed across themes; used by tiles, keys, legends, badges, charts. |
| Surfaces (themed) | `bg`, `surface`, `surface-2`, `line`, `line-strong`, `fg`, `muted`, `key`, `key-fg` | Defined as `--c-*` vars on `:root` / `.dark`, exposed via `@theme inline`. |
| Type scale | `text-caption` 12, `text-body` 14, `text-title` 16, `text-display` 44 px | Card titles always `text-title font-semibold` (via `SectionHeader`). |
| Radii | `rounded-tile` 6, `rounded-key` 8, `rounded-card` 16 px | PrimeVue radii set to matching sm/md/xl. |
| Shadows | `shadow-card`, `shadow-lift` | `lift` utility = hover translate + `shadow-lift`. |
| Motion | `--duration-fast/base/slow` 120/200/450 ms, `--ease-out`, `--ease-spring`; `animate-pop`, `animate-shake`, `animate-flip`, `animate-bounce-win`, `animate-fade-up` | All disabled under `prefers-reduced-motion` (global media query + `CountUp` duration 0). |
| Spacing | Tailwind default scale; conventions: page sections `gap-5`, card padding `p-4 sm:p-5`, inner groups `gap-2/3` | |

JS mirror: `src/lib/tokens.ts` (`tile`, `brand`, `chartPalette`, strategy colours, `motion` ms) — used by ECharts and the PrimeVue preset. Keep it in sync with the CSS.

## Base components (`src/components/ui/`)
| Component | Use |
|---|---|
| `UiIcon` | Wraps a lucide-vue-next icon with sizes `xs/sm/md/lg` (14/16/20/28). No emoji in UI. |
| `UiButton` | PrimeVue Button with `variant` = `primary` / `secondary` / `ghost`, optional `icon`, hover lift + press scale. Icon-only buttons need `ariaLabel`. |
| `UiCard` | Surface card; optional `title`/`icon`/`subtitle` render a `SectionHeader`; `#actions` slot; `interactive` adds hover lift. |
| `SectionHeader` | Icon chip + title + subtitle + actions slot. |
| `UiBadge` | Pill with tones `neutral/brand/correct/present/danger`. |
| `CountUp` | Animated number (VueUse `useTransition`). |
| `UiStat` | KPI tile: label, big value, small note, tone, tooltip; `value=null` or `loading` renders a skeleton (never a fake 0). |
| `UiAdvanced` | Collapsed "Advanced" section (dashed border); its content renders only after the first open. |

Shared analysis pieces: `StepCard` (one analysed guess) inside `CoachReport` (summary + steps) is used by Play, Assistant › Help me now / Review / Watch; `StrategyReplay` shows how a strategy solves a word (Play post-game, Watch).

Game-specific: `GameKeyboard` (state-coloured keys, icons for Enter/Backspace, press/hover animation, responsive), tile classes `.tile` + `.s0/.s1/.s2`, `.filled` (pop), `.reveal` (staggered flip via `--i`), `.win` (bounce), sizes `.tile-sm`, `.tile-xs`.

## Rules of thumb
- Colours only from tokens; no raw hex in components (charts use `tokens.ts`).
- Every card title through `UiCard`/`SectionHeader`; every action through `UiButton`.
- Lists that change use `<TransitionGroup name="list">`; view switches use `<Transition name="tab">`.
- Emoji only in the share-grid text output. The share PNG (`src/lib/shareImage.ts`) is drawn from `tokens.ts` plus the `CARD_THEME` mirror of the surface colours.
- Numbers: casual views round to 2 decimals (bits, luck) with the full value on hover; leaderboard/compare averages keep 3.
- Phones (<640 px): bottom tab bar, tables become cards (or drop secondary columns), no element may widen the page — `scripts/shots.ts` and the round-11 e2e test check `scrollWidth` on every view.
- Cursor: pointer on everything clickable, not-allowed on disabled (global rule in `style.css`).
