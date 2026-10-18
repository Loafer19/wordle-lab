// Community tab: curated, static links (each URL and title checked by hand when added; YouTube titles via oEmbed,
// Discord names/member counts via the public invite API — counts are a snapshot, shown rounded).
export interface Link { id: string; url: string; title: string; by: string; desc: string; yt?: string; kind?: 'video' | 'article' | 'research' }
export const CHECKED = '2026-10-18'
export const COMPETITIVE: Link[] = [
  { id: 'worldwardle', url: 'https://worldwardle.com/', title: 'World Wardle', by: 'worldwardle.com', desc: 'Daily and weekly Wordle tournaments with global leaderboards.' },
  { id: 'wordledash', url: 'https://wordledash.io/', title: 'Wordle Dash', by: 'wordledash.io', desc: '1v1 speed duels on the same hidden word, or solve one board together in Co-Op.' },
  { id: 'arena', url: 'https://wordleunlimited.me/arena/', title: 'The Arena Cup', by: 'wordleunlimited.me', desc: 'A twice-weekly Wordle tournament: Mondays and Thursdays at 12:00 UTC.' },
]
export const STORIES: Link[] = [
  { id: '3b1b', kind: 'video', yt: 'v68zYyaEmEA', url: 'https://www.youtube.com/watch?v=v68zYyaEmEA', title: 'Solving Wordle using information theory', by: '3Blue1Brown', desc: 'The video that made entropy the standard way to think about Wordle guesses.' },
  { id: '3b1b-fix', kind: 'video', yt: 'fRed0Xmc2Wg', url: 'https://www.youtube.com/watch?v=fRed0Xmc2Wg', title: 'Oh, wait, actually the best Wordle opener is not “crane”…', by: '3Blue1Brown', desc: 'The follow-up: a bug fix, and why the best opener depends on what you optimise.' },
  { id: 'waveform', kind: 'video', yt: '9WLOnz7k9pI', url: 'https://www.youtube.com/watch?v=9WLOnz7k9pI', title: 'How Wordle Was Made', by: 'Waveform Clips', desc: 'Josh Wardle tells the story of how Wordle was made and why it took off.' },
  { id: 'parker', kind: 'video', yt: '_-AfhLQfb6w', url: 'https://www.youtube.com/watch?v=_-AfhLQfb6w', title: 'Can you find: five five-letter words with twenty-five unique letters?', by: 'Stand-up Maths', desc: 'Matt Parker on a Wordle-inspired puzzle, and how viewers made his month-long search run in seconds.' },
  { id: 'hotcyder', kind: 'video', yt: 'j6iKhMrJVDI', url: 'https://www.youtube.com/watch?v=j6iKhMrJVDI', title: 'Wordle: The Joy Of Word Play', by: 'hotcyder', desc: 'A video essay on what makes Wordle so satisfying to play.' },
  { id: 'gjengset', kind: 'video', yt: 'doFowk4xj7Q', url: 'https://www.youtube.com/watch?v=doFowk4xj7Q', title: 'Implementing and Optimizing a Wordle Solver in Rust', by: 'Jon Gjengset', desc: 'A long deep dive: building an entropy-based solver from scratch and making it fast.' },
  { id: 'selby', kind: 'research', url: 'https://sonorouschocolate.com/notes/index.php?title=The_best_strategies_for_Wordle', title: 'The best strategies for Wordle', by: 'Alex Selby', desc: 'The exhaustive search behind our optimal tree: SALET averages 3.4212 guesses, proven optimal.' },
  { id: 'love-story', kind: 'article', url: 'https://www.nytimes.com/2022/01/03/technology/wordle-word-game-creator.html', title: 'Wordle Is a Love Story', by: 'The New York Times', desc: 'Josh Wardle made the game for his partner, Palak Shah, before it went viral.' },
  { id: 'nyt-buys', kind: 'article', url: 'https://www.nytco.com/press/wordle-new-york-times-games/', title: 'Wordle Is Joining The New York Times Games', by: 'The New York Times Company', desc: 'The January 2022 announcement that The Times had acquired Wordle.' },
  { id: 'bbc', kind: 'article', url: 'https://www.bbc.com/news/business-60208463', title: 'Wordle inventor \'overwhelmed\' as New York Times buys game', by: 'BBC News', desc: 'How the sale looked from the outside, and what it meant for players.' },
]
export interface Server { id: string; url: string; name: string; members: number; desc: string }
export const DISCORD: Server[] = [
  { id: 'puzzle-plaza', url: 'https://discord.gg/AEhpTG4z45', name: 'Puzzle Plaza', members: 2637, desc: 'Wordle and its variants, logic puzzles and Sudoku; home of several puzzle YouTube channels.' },
  { id: 'wordle', url: 'https://discord.gg/qnrCZu3Tux', name: 'Wordle', members: 377, desc: 'A small community server for daily Wordle chat and results.' },
]
export const DISCORD_ACTIVITY = { url: 'https://support-apps.discord.com/hc/en-us/articles/31598005086359-Wordle-FAQ', title: 'Wordle FAQ – Discord Apps and Activities' }
/** 2637 → "~2.6k", 377 → "~380". */
export const roughCount = (n: number) => (n >= 1000 ? `~${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : `~${Math.round(n / 10) * 10}`)
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
export interface Notable {
  strategies: number; hardStrategies: number; answers: number
  hardest: { w: string; avg: number; worst: number; fails: number }[]
  hardMode: { w: string; fails: number; avg: number; worst: number }[]
  families: { pattern: string; words: string[]; avg: number }[]
}
