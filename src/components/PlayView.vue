<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onKeyStroke, useLocalStorage, useClipboard } from '@vueuse/core'
import ToggleSwitch from 'primevue/toggleswitch'; import Button from 'primevue/button'; import Message from 'primevue/message'; import SelectButton from 'primevue/selectbutton'
import { answers, allowed } from '../lib/words'
import { feedback, patternDigits, digitsToPattern, filter, ALL_GREEN } from '../lib/wordle'
import InfoTip from './InfoTip.vue'
import { ANSWERS_HELP } from '../lib/labels'
const mode = ref<'Daily' | 'Random'>('Daily')
const answer = ref(''), rows = ref<{ w: string; d: number[] }[]>([]), cur = ref(''), msg = ref(''), hard = useLocalStorage('wl-hard', false), over = ref(false), won = ref(false)
const stats = useLocalStorage('wl-stats', { played: 0, wins: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0] })
const allowedSet = computed(() => new Set(allowed.value))
const remaining = computed(() => rows.value.reduce((c, r) => filter(c, r.w, digitsToPattern(r.d)), answers.value))
const dayIndex = () => Math.floor((Date.now() - new Date(2021, 5, 19).getTime()) / 864e5)
function newGame() {
  const a = answers.value
  answer.value = mode.value === 'Daily' ? a[(dayIndex() * 7919) % a.length] : a[Math.floor(Math.random() * a.length)]
  rows.value = []; cur.value = ''; msg.value = ''; over.value = false; won.value = false
}
onMounted(newGame)
const keyState = computed(() => { const m: Record<string, number> = {}; for (const r of rows.value) [...r.w].forEach((c, i) => (m[c] = Math.max(m[c] ?? 0, r.d[i]))); return m })
function hardViolation(w: string) {
  for (const r of rows.value) for (let i = 0; i < 5; i++) {
    if (r.d[i] === 2 && w[i] !== r.w[i]) return `Hard mode: position ${i + 1} must be ${r.w[i].toUpperCase()}`
    if (r.d[i] === 1 && !w.includes(r.w[i])) return `Hard mode: guess must contain ${r.w[i].toUpperCase()}`
  }
  return ''
}
function finish(win: boolean) {
  over.value = true; won.value = win
  const s = stats.value; s.played++
  if (win) { s.wins++; s.streak++; s.best = Math.max(s.best, s.streak); s.dist[rows.value.length - 1]++ } else s.streak = 0
}
function press(k: string) {
  if (over.value) return
  msg.value = ''
  if (k === 'enter') {
    if (cur.value.length < 5) return (msg.value = 'Not enough letters')
    if (!allowedSet.value.has(cur.value)) return (msg.value = `"${cur.value.toUpperCase()}" is not a valid guess`)
    if (hard.value) { const v = hardViolation(cur.value); if (v) return (msg.value = v) }
    const p = feedback(cur.value, answer.value); rows.value.push({ w: cur.value, d: patternDigits(p) }); cur.value = ''
    if (p === ALL_GREEN) { finish(true); msg.value = `🎉 Solved in ${rows.value.length}!` }
    else if (rows.value.length >= 6) { finish(false); msg.value = `The word was ${answer.value.toUpperCase()}` }
  } else if (k === 'back') cur.value = cur.value.slice(0, -1)
  else if (/^[a-z]$/.test(k) && cur.value.length < 5) cur.value += k
}
onKeyStroke(e => { if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement)?.tagName === 'INPUT') return; const k = e.key.toLowerCase(); press(k === 'backspace' ? 'back' : k) })
const kb = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const grid = computed(() => Array.from({ length: 6 }, (_, i) => rows.value[i] ?? (i === rows.value.length ? { w: cur.value.padEnd(5), d: null } : { w: '     ', d: null })))
const shareText = computed(() => `Wordle Lab ${mode.value === 'Daily' ? '#' + dayIndex() : '(random)'} ${won.value ? rows.value.length : 'X'}/6${hard.value ? '*' : ''}\n` + rows.value.map(r => r.d.map(d => ['⬛', '🟨', '🟩'][d]).join('')).join('\n'))
const { copy, copied } = useClipboard()
const maxDist = computed(() => Math.max(1, ...stats.value.dist))
</script>
<template>
  <div class="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
    <div class="flex flex-col items-center gap-3">
      <div class="flex gap-3 items-center flex-wrap justify-center">
        <SelectButton v-model="mode" :options="['Daily', 'Random']" :allowEmpty="false" size="small" @change="newGame" />
        <Button label="New game" size="small" @click="newGame" :disabled="mode === 'Daily' && !over && rows.length > 0" />
        <label class="flex items-center gap-2 text-sm" v-tooltip.top="'Hard mode: any revealed hints must be used in later guesses'"><ToggleSwitch v-model="hard" /> Hard mode</label>
      </div>
      <Message v-if="msg" :severity="won ? 'success' : 'info'" size="small">{{ msg }}</Message>
      <div class="grid gap-1.5">
        <div v-for="(r, i) in grid" :key="i" class="flex gap-1.5"><div v-for="j in 5" :key="j" class="tile" :class="r.d ? 't' + r.d[j - 1] : ''">{{ r.w[j - 1] }}</div></div>
      </div>
      <div class="flex flex-col gap-1.5 items-center mt-2 w-full max-w-md">
        <div v-for="(row, ri) in kb" :key="row" class="flex gap-1 w-full justify-center">
          <button v-if="ri === 2" class="px-2 sm:px-3 h-12 rounded key text-xs font-bold" @click="press('enter')">ENTER</button>
          <button v-for="c in row" :key="c" class="flex-1 max-w-10 h-12 rounded font-bold uppercase" :class="keyState[c] === undefined ? 'key' : ['bg-zinc-800 text-zinc-500', 'bg-yellow-500 text-white', 'bg-green-600 text-white'][keyState[c]]" @click="press(c)">{{ c }}</button>
          <button v-if="ri === 2" class="px-2 sm:px-3 h-12 rounded key text-sm" @click="press('back')">⌫</button>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-4 flex-1 w-full">
      <div v-if="over" class="card">
        <div class="font-semibold mb-2">Share</div>
        <pre class="text-lg leading-tight">{{ shareText }}</pre>
        <Button size="small" class="mt-2" :label="copied ? 'Copied!' : 'Copy result'" @click="copy(shareText)" />
      </div>
      <div class="card text-sm">
        <div class="font-semibold mb-2">Your stats</div>
        <div class="grid grid-cols-4 text-center mb-3">
          <div><div class="text-2xl font-bold">{{ stats.played }}</div><div class="muted text-xs">Played</div></div>
          <div><div class="text-2xl font-bold">{{ stats.played ? Math.round((100 * stats.wins) / stats.played) : 0 }}</div><div class="muted text-xs">Win %</div></div>
          <div><div class="text-2xl font-bold">{{ stats.streak }}</div><div class="muted text-xs">Streak</div></div>
          <div><div class="text-2xl font-bold">{{ stats.best }}</div><div class="muted text-xs">Best streak</div></div>
        </div>
        <div v-for="(c, i) in stats.dist" :key="i" class="flex items-center gap-2 mb-1"><span class="w-3">{{ i + 1 }}</span><div class="bg-green-600 text-white text-xs px-1 text-right" :style="{ width: Math.max(6, (c / maxDist) * 100) + '%' }">{{ c }}</div></div>
      </div>
      <div class="card text-sm">
        <div class="font-semibold mb-1">Words still possible: {{ remaining.length }}<InfoTip :text="ANSWERS_HELP" /> <span class="muted font-normal">({{ Math.log2(Math.max(1, remaining.length)).toFixed(2) }} bits of uncertainty left)</span></div>
        <div v-if="rows.length && remaining.length <= 60" class="font-mono muted break-words">{{ remaining.join(' ') }}</div>
        <div v-else-if="rows.length" class="muted">(too many to list, keep guessing)</div>
        <div v-else class="muted">Type a 5-letter word and press Enter.</div>
      </div>
    </div>
  </div>
</template>
