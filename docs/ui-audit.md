# UI/UX audit — Wordle Lab (v2, 2026-10-12)

Screens walked in headless Chrome: 6 tabs × desktop (1400×900) / mobile (390×844) × dark / light → `docs/screenshots/before/`.
Console: 0 errors / 0 warnings. Fixed versions: `docs/screenshots/after/`.

| # | Area | Finding | Severity | Fix |
|---|------|---------|----------|-----|
| 1 | Navigation | `#tab=…` deep links don't react to `hashchange` (in-page hash navigation always showed Play). | High | Tab state syncs both ways with `location.hash` (listens to `hashchange`). |
| 2 | Iconography | Emoji used as UI icons (tabs, theme button, ▶, ⌫, ⏎, 🎉, ⓘ); render differently per OS/font, misaligned baselines. | Med | lucide-vue-next icons via `UiIcon`; emoji kept only in share-grid text. |
| 3 | Color / states | "Absent" color inconsistent: tiles zinc-500, keys near-black zinc-800 (light) – absent keys looked *more* prominent than unused keys in light mode. | High | Single `absent` token for tiles + keys; unused keys use `key` token. |
| 4 | Color | Ad-hoc palette (`green-600`, `yellow-500`, `sky-500`, `#f59e0b`, hex in charts) not tied to PrimeVue primary (Aura emerald) → two different greens. | Med | `@theme` tokens; PrimeVue preset primary = same `brand` scale; charts read `chartPalette`. |
| 5 | Layout shift | Validation message ("Not enough letters") pushes board down ~40 px. | Med | Toast-like floating message + row shake; no reflow. |
| 6 | Feedback | No motion feedback on typing, invalid word, reveal or win. | Med | pop / shake / flip / bounce animations (reduced-motion aware). |
| 7 | Keyboard | Flat keys, text "ENTER", unicode ⌫, fixed widths, no hover/press state, tiny on mobile. | Med | Redesigned keys: icons, depth, press scale, hover, responsive height/width. |
| 8 | Typography | No type scale: card titles vary (`font-semibold`, `text-sm font-semibold`, chart titles 14 px). | Med | Scale tokens + `SectionHeader` component used for every card title. |
| 9 | Components | Cards/buttons styled ad hoc (`.card` class, raw `<button>`, PrimeVue Buttons with mixed severities: secondary/help/text). | Med | `UiCard`, `UiButton`, `UiBadge`, `SectionHeader`; severities limited to primary / secondary / ghost. |
| 10 | Header | Header actions inconsistent (text link vs filled button), wraps awkwardly on mobile; brand is an emoji. | Low | Icon buttons with tooltips, logo mark from tiles, single row on mobile. |
| 11 | Stats | Zero-count distribution bars still show solid green blocks; numbers static. | Low | Neutral bars for 0, highlight last result, count-up numbers. |
| 12 | Spacing | Mixed gaps (gap-1.5/2/3/4/6) and paddings (p-3/p-4) between similar elements. | Low | Spacing via tokens: cards `p-5`, section gap `gap-5`, inner `gap-3`. |
| 13 | States | No hover affordance on cards/buttons; disabled "New game" (daily, in progress) looks like a light-green enabled button in light mode. | Low | Hover lift on interactive cards/buttons, explicit disabled style. |
| 14 | Mobile | Tab bar truncates labels with no hint; desktop empty space right of board. | Low | Compact icon+label tabs, scroll hint; board column + side column balanced. |
| 15 | Motion | Tab switches are instant/jarring; list updates (candidates/steps) jump. | Low | Fade/slide tab transition, TransitionGroup for lists. |
