<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onKeyStroke, useLocalStorage, useClipboard } from '@vueuse/core'
import { RotateCcw, Copy, Check, Trophy, Share2, ListFilter, CalendarDays, Shuffle } from 'lucide-vue-next'
import ToggleSwitch from 'primevue/toggleswitch'; import SelectButton from 'primevue/selectbutton'
import { answers, allowed } from '../lib/words'
import { feedback, patternDigits, digitsToPattern, filter, ALL_GREEN } from '../lib/wordle'
import { motion } from '../lib/tokens'
import InfoTip from './InfoTip.vue'
import GameKeyboard from './GameKeyboard.vue'
import BitsPanel from './BitsPanel.vue'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'; import CountUp from './ui/CountUp.vue'
import { ANSWERS_HELP } from '../lib/labels'
const mode = ref<'daily' | 'random'>('daily')
const modes = [{ v: 'daily', l: 'Daily', i: CalendarDays }, { v: 'random', l: 'Random', i: Shuffle }]
const answer = ref(''), rows = ref<{ w: string; d: number[] }[]>([]), cur = ref(''), msg = ref(''), hard = useLocalStorage('wl-hard', false), over = ref(false), won = ref(false)
const revealed = ref(0), shake = ref(false), winRow = ref(-1), activeKey = ref('')
const stats = useLocalStorage('wl-stats', { played: 0, wins: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0], last: -1 })
const allowedSet = computed(() => new Set(allowed.value))
const remaining = computed(() => rows.value.slice(0, revealed.value).reduce((c, r) => filter(c, r.w, digitsToPattern(r.d)), answers.value))
const dayIndex = () => Math.floor((Date.now() - new Date(2021, 5, 19).getTime()) / 864e5)
const revealMs = 4 * motion.flipStagger + motion.flip
function newGame() {
  const a = answers.value
  answer.value = mode.value === 'daily' ? a[(dayIndex() * 7919) % a.length] : a[Math.floor(Math.random() * a.length)]
  rows.value = []; cur.value = ''; msg.value = ''; over.value = false; won.value = false; revealed.value = 0; winRow.value = -1
}
onMounted(newGame)
const keyState = computed(() => { const m: Record<string, number> = {}; for (const r of rows.value.slice(0, revealed.value)) [...r.w].forEach((c, i) => (m[c] = Math.max(m[c] ?? 0, r.d[i]))); return m })
let msgTimer: number | undefined
function toast(t: string, sticky = false) { msg.value = t; clearTimeout(msgTimer); if (!sticky) msgTimer = window.setTimeout(() => (msg.value = ''), 1800) }
function invalid(t: string) { toast(t); shake.value = false; requestAnimationFrame(() => (shake.value = true)); setTimeout(() => (shake.value = false), 500) }
function hardViolation(w: string) {
  for (const r of rows.value) for (let i = 0; i < 5; i++) {
    if (r.d[i] === 2 && w[i] !== r.w[i]) return `Hard mode: letter ${i + 1} must be ${r.w[i].toUpperCase()}`
    if (r.d[i] === 1 && !w.includes(r.w[i])) return `Hard mode: guess must contain ${r.w[i].toUpperCase()}`
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
    if (cur.value.length < 5) return invalid('Not enough letters')
    if (!allowedSet.value.has(cur.value)) return invalid(`${cur.value.toUpperCase()} is not in the word list`)
    if (hard.value) { const v = hardViolation(cur.value); if (v) return invalid(v) }
    const p = feedback(cur.value, answer.value); rows.value.push({ w: cur.value, d: patternDigits(p) }); cur.value = ''
    const n = rows.value.length
    setTimeout(() => {
      revealed.value = n
      if (p === ALL_GREEN) { winRow.value = n - 1; finish(true); toast(['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'][n - 1], true) }
      else if (n >= 6) { finish(false); toast(answer.value.toUpperCase(), true) }
    }, revealMs)
  } else if (k === 'back') cur.value = cur.value.slice(0, -1)
  else if (/^[a-z]$/.test(k) && cur.value.length < 5) cur.value += k
}
onKeyStroke(e => { if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement)?.tagName === 'INPUT') return; const k = e.key.toLowerCase(); if (k === 'backspace' || k === 'enter' || /^[a-z]$/.test(k)) press(k === 'backspace' ? 'back' : k) })
const grid = computed(() => Array.from({ length: 6 }, (_, i) => rows.value[i] ? { ...rows.value[i], state: 'done' } : i === rows.value.length ? { w: cur.value.padEnd(5), d: null, state: 'cur' } : { w: '     ', d: null, state: 'empty' }))
const shareText = computed(() => `Wordle Lab ${mode.value === 'daily' ? '#' + dayIndex() : '(random)'} ${won.value ? rows.value.length : 'X'}/6${hard.value ? '*' : ''}\n` + rows.value.map(r => r.d.map(d => ['⬛', '🟨', '🟩'][d]).join('')).join('\n'))
const { copy, copied } = useClipboard()
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
        <UiButton :icon="RotateCcw" label="New game" variant="secondary" @click="newGame" :disabled="mode === 'daily' && !over && rows.length > 0" />
        <label class="flex items-center gap-2 text-body cursor-pointer" v-tooltip.top="'Revealed hints must be used in later guesses'"><ToggleSwitch v-model="hard" /> Hard mode</label>
      </div>
      <div class="relative">
        <Transition name="tab"><div v-if="msg" class="absolute left-1/2 -translate-x-1/2 -top-2 z-10 px-4 py-2 rounded-lg bg-fg text-bg text-body font-semibold shadow-lift whitespace-nowrap" role="status">{{ msg }}</div></Transition>
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
        <UiCard v-if="over" title="Share your result" :icon="Share2">
          <pre class="text-xl leading-tight font-mono">{{ shareText }}</pre>
          <UiButton class="mt-3" :icon="copied ? Check : Copy" :label="copied ? 'Copied' : 'Copy result'" @click="copy(shareText)" />
        </UiCard>
      </Transition>
      <UiCard title="Your stats" :icon="Trophy" subtitle="Saved in this browser">
        <div class="grid grid-cols-4 text-center mb-4">
          <div v-for="s in [{ v: stats.played, l: 'Played' }, { v: winPct, l: 'Win %' }, { v: stats.streak, l: 'Streak' }, { v: stats.best, l: 'Best streak' }]" :key="s.l">
            <div class="text-3xl font-extrabold"><CountUp :value="s.v" /></div><div class="text-caption text-muted">{{ s.l }}</div>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <div v-for="(c, i) in stats.dist" :key="i" class="flex items-center gap-2 text-caption">
            <span class="w-3 font-semibold">{{ i + 1 }}</span>
            <div class="h-5 rounded flex items-center justify-end px-1.5 font-semibold transition-all duration-700 ease-out"
              :class="c === 0 ? 'bg-surface-2 text-muted' : i === stats.last ? 'bg-correct text-white' : 'bg-absent text-white'" :style="{ width: Math.max(7, (c / maxDist) * 100) + '%' }">{{ c }}</div>
          </div>
        </div>
      </UiCard>
      <BitsPanel :rows="rows.slice(0, revealed)" />
      <UiCard title="Words still possible" :icon="ListFilter" :subtitle="`${Math.log2(Math.max(1, remaining.length)).toFixed(2)} bits of uncertainty left`">
        <template #actions><UiBadge tone="brand"><CountUp :value="remaining.length" /></UiBadge><InfoTip :text="ANSWERS_HELP" /></template>
        <div v-if="revealed && remaining.length <= 60" class="font-mono text-muted break-words uppercase text-caption leading-6">{{ remaining.join(' ') }}</div>
        <p v-else-if="revealed" class="text-muted">Too many to list — keep guessing.</p>
        <p v-else class="text-muted">Type a 5-letter word and press <kbd>Enter</kbd>.</p>
      </UiCard>
    </div>
  </div>
</template>
