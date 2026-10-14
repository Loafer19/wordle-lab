<script setup lang="ts">
import { t } from '../lib/i18n'
import { ref, computed, onMounted } from 'vue'
import { onKeyStroke, useLocalStorage, useClipboard } from '@vueuse/core'
import { RotateCcw, Copy, Check, Trophy, Share2, Clock, CalendarDays, Shuffle, Sparkles, Crown, Star, PartyPopper, ThumbsUp, HeartPulse, Frown, BookOpen, X } from 'lucide-vue-next'
import confetti from 'canvas-confetti'
import { usePreferredReducedMotion } from '@vueuse/core'
import WordMeaning from './WordMeaning.vue'
import CandidatesCard from './CandidatesCard.vue'
import StrategyReplay from './StrategyReplay.vue'
import FingerprintCard from './FingerprintCard.vue'
import { record, shareText as buildShare } from '../lib/history'
import { allStrategies } from '../lib/allStrategies'
import { BEST_ID } from '../lib/lang'
import { watch } from 'vue'
import { lang, isLetter, gameKey } from '../lib/lang'
import { useNow } from '@vueuse/core'
import { tile, brand } from '../lib/tokens'
import SelectButton from 'primevue/selectbutton'
import { answers, allowed } from '../lib/words'
import { feedback, patternDigits, digitsToPattern, filter, ALL_GREEN } from '../lib/wordle'
import { motion } from '../lib/tokens'
const WIN = [{ t: t('Genius'), i: Sparkles }, { t: t('Magnificent'), i: Crown }, { t: t('Impressive'), i: Star }, { t: t('Splendid'), i: PartyPopper }, { t: t('Great'), i: ThumbsUp }, { t: t('Phew'), i: HeartPulse }]
const banner = ref<{ win: boolean; title: string; sub: string; icon: any } | null>(null), justWon = ref(false)
const reduced = usePreferredReducedMotion()
let bannerTimer: number | undefined
function showBanner(b: NonNullable<typeof banner.value>, ms: number) { banner.value = b; clearTimeout(bannerTimer); bannerTimer = window.setTimeout(() => (banner.value = null), ms) }
function celebrate() {
  if (reduced.value === 'reduce') return
  const colors = [tile.correct, tile.present, brand[400], '#ffffff']
  const o = { colors, disableForReducedMotion: true, zIndex: 60, ticks: 220 }
  confetti({ ...o, particleCount: 90, spread: 75, startVelocity: 42, origin: { x: 0.5, y: 0.45 } })
  setTimeout(() => { confetti({ ...o, particleCount: 45, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } }); confetti({ ...o, particleCount: 45, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } }) }, 250)
}
import GameKeyboard from './GameKeyboard.vue'
import CoachReport from './CoachReport.vue'
import { useCoach } from '../lib/useCoach'
import { formatGame } from '../lib/coach'
import { href } from '../lib/route'
import BitsPanel from './BitsPanel.vue'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import CountUp from './ui/CountUp.vue'; import UiBadge from './ui/UiBadge.vue'
const mode = ref<'daily' | 'random'>('daily')
const modes = [{ v: 'daily', l: t('Daily'), i: CalendarDays }, { v: 'random', l: t('Random'), i: Shuffle }]
let gameId = ''
const answer = ref(''), rows = ref<{ w: string; d: number[] }[]>([]), cur = ref(''), msg = ref(''), hard = useLocalStorage('wl-hard', false), over = ref(false), won = ref(false)
const revealed = ref(0), shake = ref(false), winRow = ref(-1), activeKey = ref('')
const stats = useLocalStorage(lang === 'en' ? 'wl-stats' : 'wl-stats-' + lang, { played: 0, wins: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0], last: -1 })
const allowedSet = computed(() => new Set(allowed.value))
const remaining = computed(() => rows.value.slice(0, revealed.value).reduce((c, r) => filter(c, r.w, digitsToPattern(r.d)), answers.value))
const dayIndex = () => Math.floor((Date.now() - new Date(2021, 5, 19).getTime()) / 864e5)
const revealMs = 4 * motion.flipStagger + motion.flip
const dailyKey = () => `wl-daily-${lang}-${dayIndex()}`
function newGame() {
  const a = answers.value
  answer.value = mode.value === 'daily' ? a[(dayIndex() * 7919) % a.length] : a[Math.floor(Math.random() * a.length)]
  gameId = mode.value === 'daily' ? 'd' + dayIndex() : 'r' + Date.now()
  rows.value = []; cur.value = ''; msg.value = ''; banner.value = null; justWon.value = false; over.value = false; won.value = false; revealed.value = 0; winRow.value = -1
  if (mode.value === 'daily') { // restore today's progress (one daily word per day, like Wordle)
    try { const saved: string[] = JSON.parse(localStorage.getItem(dailyKey()) || '[]'); for (const w of saved) rows.value.push({ w, d: patternDigits(feedback(w, answer.value)) }) } catch {}
    revealed.value = rows.value.length
    const last = rows.value.at(-1); if (last && last.w === answer.value) { over.value = won.value = true; winRow.value = rows.value.length - 1 } else if (rows.value.length >= 6) over.value = true
  }
}
const now = useNow()
const countdown = computed(() => { const t = new Date(now.value); const next = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1); const s = Math.max(0, Math.floor((+next - +t) / 1000)); return [s / 3600, (s / 60) % 60, s % 60].map(x => String(Math.floor(x)).padStart(2, '0')).join(':') })
let lastDay = dayIndex()
setInterval(() => { if (mode.value === 'daily' && dayIndex() !== lastDay) { lastDay = dayIndex(); newGame() } }, 5000)
onMounted(newGame)
const keyState = computed(() => { const m: Record<string, number> = {}; for (const r of rows.value.slice(0, revealed.value)) [...r.w].forEach((c, i) => (m[c] = Math.max(m[c] ?? 0, r.d[i]))); return m })
let msgTimer: number | undefined
function toast(t: string, sticky = false) { msg.value = t; clearTimeout(msgTimer); if (!sticky) msgTimer = window.setTimeout(() => (msg.value = ''), 1800) }
function invalid(t: string) { toast(t); shake.value = false; requestAnimationFrame(() => (shake.value = true)); setTimeout(() => (shake.value = false), 500) }
function hardViolation(w: string) {
  for (const r of rows.value) for (let i = 0; i < 5; i++) {
    if (r.d[i] === 2 && w[i] !== r.w[i]) return t('Hard mode: letter {i} must be {l}', { i: i + 1, l: r.w[i].toUpperCase() })
    if (r.d[i] === 1 && !w.includes(r.w[i])) return t('Hard mode: guess must contain {l}', { l: r.w[i].toUpperCase() })
  }
  return ''
}
function finish(win: boolean) {
  over.value = true; won.value = win
  const s = stats.value; s.played++
  if (win) { s.wins++; s.streak++; s.best = Math.max(s.best, s.streak); s.dist[rows.value.length - 1]++; s.last = rows.value.length - 1 } else { s.streak = 0; s.last = -1 }
}
function press(k: string) {
  activeKey.value = k; setTimeout(() => activeKey.value === k && (activeKey.value = ''), 120)
  if (over.value || revealed.value < rows.value.length) return
  if (k === 'enter') {
    if (cur.value.length < 5) return invalid(t('Not enough letters'))
    if (!allowedSet.value.has(cur.value)) return invalid(t('{w} is not in the word list', { w: cur.value.toUpperCase() }))
    if (hard.value) { const v = hardViolation(cur.value); if (v) return invalid(v) }
    const p = feedback(cur.value, answer.value); rows.value.push({ w: cur.value, d: patternDigits(p) }); cur.value = ''
    if (mode.value === 'daily') localStorage.setItem(dailyKey(), JSON.stringify(rows.value.map(r => r.w)))
    const n = rows.value.length
    setTimeout(() => {
      revealed.value = n
      if (p === ALL_GREEN) { winRow.value = n - 1; finish(true); justWon.value = true; showBanner({ win: true, title: WIN[n - 1].t + '!', sub: t('Solved in {n}/6', { n }) + (hard.value ? ' · ' + t('hard mode') : ''), icon: WIN[n - 1].i }, 4200); setTimeout(celebrate, 4 * 90 + 300) }
      else if (n >= 6) { finish(false); showBanner({ win: false, title: t('So close'), sub: t('The word was {w}', { w: answer.value.toUpperCase() }), icon: Frown }, 6000) }
    }, revealMs)
  } else if (k === 'back') cur.value = cur.value.slice(0, -1)
  else if (isLetter(k) && cur.value.length < 5) cur.value += k
}
onKeyStroke(e => { if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement)?.closest?.('input, textarea, [role=dialog]')) return; const k = gameKey(e); if (k) { e.preventDefault(); press(k) } })
const grid = computed(() => Array.from({ length: 6 }, (_, i) => rows.value[i] ? { ...rows.value[i], state: 'done' } : i === rows.value.length ? { w: cur.value.padEnd(5), d: null, state: 'cur' } : { w: '     ', d: null, state: 'empty' }))
const { copy, copied } = useClipboard()
// Coach: analyse the finished game (daily or random) once it is over
const coachGame = computed(() => (over.value && revealed.value === rows.value.length ? rows.value.map(r => ({ w: r.w, d: [...r.d] })) : null))
const { result: coach, busy: coachBusy, progress: coachProgress } = useCoach(coachGame, hard)
const openInCoach = () => { localStorage.setItem('wl-coach-text-' + lang, formatGame(rows.value)); location.hash = href('assistant', 'review') }
// after the game: how the optimal strategy plays the same word, the fingerprint record and the share text
const optId = computed(() => (hard.value && allStrategies.value.some(s => s.id === 'optimal-hard') ? 'optimal-hard' : BEST_ID))
const optN = ref<number | undefined>(undefined)
watch(answer, () => (optN.value = undefined))
watch(coach, r => {
  if (!r || !over.value || r.error || !coachGame.value || r.steps.length !== rows.value.length) return
  record({ id: gameId, t: Date.now(), word: answer.value, n: rows.value.length, won: won.value, hard: hard.value, skill: r.efficiency, luck: r.luck, mode: mode.value })
})
const shareText = computed(() => buildShare({ title: `Wordle Lab ${mode.value === 'daily' ? '#' + dayIndex() : t('(random)')}`, n: won.value ? rows.value.length : 'X', hard: hard.value, rows: rows.value.map(r => r.d),
  skill: coach.value && !coach.value.error ? coach.value.efficiency : undefined, luck: coach.value && !coach.value.error ? coach.value.luck : undefined, optimal: optN.value,
  labels: { skill: t('Skill'), luck: t('Luck'), optimal: t('Optimal'), bits: t('bits') }, url: location.origin }))
const canShare = typeof navigator !== 'undefined' && 'share' in navigator
const shareNative = () => navigator.share?.({ text: shareText.value }).catch(() => {})
const maxDist = computed(() => Math.max(1, ...stats.value.dist))
const winPct = computed(() => (stats.value.played ? Math.round((100 * stats.value.wins) / stats.value.played) : 0))
</script>
<template>
  <div class="grid lg:grid-cols-[auto_1fr] gap-5 lg:gap-8 items-start">
    <div class="flex flex-col items-center gap-4 mx-auto">
      <div class="flex gap-3 items-center flex-wrap justify-center">
        <SelectButton v-model="mode" :options="modes" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" @change="newGame">
          <template #option="{ option }"><component :is="option.i" :size="14" /><span>{{ option.l }}</span></template>
        </SelectButton>
        <UiButton v-if="mode === 'random'" :icon="RotateCcw" :label="$t('New game')" variant="secondary" @click="newGame" data-newgame />
        <span v-else class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface-2 text-caption text-muted tabular-nums" data-countdown v-tooltip.bottom="$t('A new daily word every midnight (your local time)')"><Clock :size="14" />{{ $t('Next word in') }} <b class="text-fg">{{ countdown }}</b></span>
        <span v-if="hard" class="text-caption font-semibold px-2 py-1 rounded-md bg-present/15 text-present" v-tooltip.bottom="$t('Hard mode is on (change it in Settings)')">{{ $t('Hard') }}</span>
      </div>
      <div class="h-14 w-full flex items-center justify-center" aria-live="polite">
        <Transition name="banner" mode="out-in">
          <div v-if="banner" :key="banner.title" data-banner class="flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl shadow-lift border text-white"
            :class="banner.win ? 'bg-correct border-correct' : 'bg-absent border-absent'" role="status">
            <span class="grid place-items-center size-8 rounded-lg bg-white/20"><component :is="banner.icon" :size="18" /></span>
            <span class="flex flex-col leading-tight"><b class="text-body">{{ banner.title }}</b><span class="text-caption opacity-90">{{ banner.sub }}</span></span>
            <button class="p-1 rounded-md hover:bg-white/20" :aria-label="$t('Dismiss')" @click="banner = null"><X :size="14" /></button>
          </div>
          <div v-else-if="msg" :key="msg" class="px-4 py-2 rounded-lg bg-fg text-bg text-body font-semibold shadow-lift whitespace-nowrap" role="status">{{ msg }}</div>
        </Transition>
      </div>
      <div class="relative">
        <div class="grid gap-1.5 [perspective:600px]">
          <div v-for="(r, i) in grid" :key="i" class="flex gap-1.5" :class="r.state === 'cur' && shake && 'animate-shake'">
            <div v-for="j in 5" :key="j" class="tile" :style="{ '--i': j - 1 }"
              :class="[r.d ? ['s' + r.d[j - 1], 'reveal'] : r.w[j - 1] !== ' ' && 'filled', winRow === i && 'win']">{{ r.w[j - 1] }}</div>
          </div>
        </div>
      </div>
      <GameKeyboard :states="keyState" :active="activeKey" @press="press" />
    </div>
    <div class="flex flex-col gap-5 w-full">
      <Transition name="tab">
        <UiCard v-if="over" :title="$t('Word meaning')" :icon="BookOpen" :subtitle="won ? $t('You found it — here is what it means') : $t('Today’s answer')"><WordMeaning :word="answer" /></UiCard>
      </Transition>
      <Transition name="tab">
        <UiCard v-if="over" :title="$t('Share your result')" :icon="Share2" data-share>
          <div class="flex flex-wrap items-start gap-4">
            <div class="rounded-card border border-line bg-surface-2 p-3 flex flex-col items-center gap-2 min-w-[11rem]" data-share-card>
              <div class="text-caption font-bold tracking-wide">Wordle Lab <span class="text-muted font-medium">{{ mode === 'daily' ? '#' + dayIndex() : $t('(random)') }}</span></div>
              <div class="flex flex-col gap-0.5"><div v-for="(r, i) in rows" :key="i" class="flex gap-0.5"><i v-for="(d, j) in r.d" :key="j" class="size-4 rounded-[3px]" :class="['bg-absent', 'bg-present', 'bg-correct'][d]"></i></div></div>
              <div class="text-title font-extrabold">{{ won ? rows.length : 'X' }}/6<span v-if="hard">*</span></div>
              <div v-if="coach && !coach.error" class="flex gap-2 text-caption"><UiBadge tone="brand">{{ $t('Skill') }} {{ Math.round(coach.efficiency * 100) }}%</UiBadge><UiBadge :tone="coach.luck >= 0 ? 'correct' : 'danger'">{{ $t('Luck') }} {{ coach.luck >= 0 ? '+' : '−' }}{{ Math.abs(coach.luck).toFixed(1) }}</UiBadge></div>
              <div v-if="optN" class="text-caption text-muted">{{ $t('Optimal') }}: {{ optN }}</div>
            </div>
            <div class="flex-1 min-w-0 flex flex-col gap-2">
              <pre class="text-caption leading-snug font-mono whitespace-pre-wrap break-words bg-surface-2 rounded-lg p-2" data-share-text>{{ shareText }}</pre>
              <div class="flex flex-wrap gap-2"><UiButton :icon="copied ? Check : Copy" :label="copied ? $t('Copied') : $t('Copy result')" @click="copy(shareText)" data-share-copy />
                <UiButton v-if="canShare" :icon="Share2" :label="$t('Share')" variant="secondary" @click="shareNative" /></div>
            </div>
          </div>
        </UiCard>
      </Transition>
      <Transition name="tab">
        <div v-if="over" class="flex flex-col gap-2" data-play-coach>
          <CoachReport :result="coach" :busy="coachBusy" :progress="coachProgress" :title="$t('Your game, reviewed')" />
          <button type="button" class="self-end text-caption text-muted hover:text-fg underline underline-offset-2 cursor-pointer" @click="openInCoach">{{ $t('Open in Assistant › Review a game') }}</button>
        </div>
      </Transition>
      <Transition name="tab">
        <StrategyReplay v-if="over && answer" :word="answer" :stratId="optId" :yours="won ? rows.length : 7" :title="$t('How the optimal strategy solves {w}', { w: answer.toUpperCase() })" :showWhy="false" @steps="s => (optN = s.length)" data-play-optimal />
      </Transition>
      <UiCard :title="$t('Your stats')" :icon="Trophy" :subtitle="$t('Saved in this browser')">
        <div class="grid grid-cols-4 text-center mb-4">
          <div v-for="s in [{ v: stats.played, l: $t('Played') }, { v: winPct, l: $t('Win %') }, { v: stats.streak, l: $t('Streak') }, { v: stats.best, l: $t('Best streak') }]" :key="s.l">
            <div class="text-3xl font-extrabold"><CountUp :value="s.v" /></div><div class="text-caption text-muted">{{ s.l }}</div>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <div v-for="(c, i) in stats.dist" :key="i" class="flex items-center gap-2 text-caption">
            <span class="w-3 font-semibold">{{ i + 1 }}</span>
            <div class="h-5 rounded flex items-center justify-end px-1.5 font-semibold transition-all duration-700 ease-out"
              :class="c === 0 ? 'bg-surface-2 text-muted' : i === stats.last ? ['bg-correct text-white', justWon && 'bar-new'] : 'bg-absent text-white'" :style="{ width: Math.max(7, (c / maxDist) * 100) + '%' }">{{ c }}</div>
          </div>
        </div>
      </UiCard>
      <FingerprintCard />
      <BitsPanel v-if="!over" :rows="rows.slice(0, revealed)" />
      <CandidatesCard :title="$t('Words still possible')" :words="remaining" :started="revealed > 0" :max="80">
        <template #empty><p class="text-muted">{{ $t('Type a 5-letter word and press') }} <kbd>{{ $t('Enter') }}</kbd>.</p></template>
      </CandidatesCard>
    </div>
  </div>
</template>
