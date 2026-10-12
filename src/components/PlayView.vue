<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import ToggleSwitch from 'primevue/toggleswitch'; import Button from 'primevue/button'; import Message from 'primevue/message'
import { answers, allowed } from '../lib/words'
import { feedback, patternDigits, filter, ALL_GREEN } from '../lib/wordle'
const answer = ref(''), rows = ref<{ w: string; d: number[] }[]>([]), cur = ref(''), msg = ref(''), hard = ref(false), over = ref(false)
const allowedSet = computed(() => new Set(allowed.value))
const remaining = computed(() => rows.value.reduce((c, r) => filter(c, r.w, r.d.reduce((a, v, i) => a + v * 3 ** i, 0)), answers.value))
function newGame() { answer.value = answers.value[Math.floor(Math.random() * answers.value.length)]; rows.value = []; cur.value = ''; msg.value = ''; over.value = false }
onMounted(newGame)
const keyState = computed(() => { const m: Record<string, number> = {}; for (const r of rows.value) [...r.w].forEach((c, i) => (m[c] = Math.max(m[c] ?? 0, r.d[i]))); return m })
function hardViolation(w: string) {
  for (const r of rows.value) { const p = r.d.reduce((a, v, i) => a + v * 3 ** i, 0); const back = feedback(r.w, w)
    for (let i = 0; i < 5; i++) { if (r.d[i] === 2 && w[i] !== r.w[i]) return `Position ${i + 1} must be ${r.w[i].toUpperCase()}`; if (r.d[i] === 1 && !w.includes(r.w[i])) return `Guess must contain ${r.w[i].toUpperCase()}` }
    void p; void back }
  return ''
}
function press(k: string) {
  if (over.value) return
  msg.value = ''
  if (k === 'enter') {
    if (cur.value.length < 5) return (msg.value = 'Not enough letters')
    if (!allowedSet.value.has(cur.value)) return (msg.value = 'Not in word list')
    if (hard.value) { const v = hardViolation(cur.value); if (v) return (msg.value = v) }
    const p = feedback(cur.value, answer.value); rows.value.push({ w: cur.value, d: patternDigits(p) }); cur.value = ''
    if (p === ALL_GREEN) { over.value = true; msg.value = `Solved in ${rows.value.length}!` }
    else if (rows.value.length >= 6) { over.value = true; msg.value = `Answer: ${answer.value.toUpperCase()}` }
  } else if (k === 'back') cur.value = cur.value.slice(0, -1)
  else if (/^[a-z]$/.test(k) && cur.value.length < 5) cur.value += k
}
onKeyStroke(e => { if (e.ctrlKey || e.metaKey || (e.target as HTMLElement)?.tagName === 'INPUT') return; const k = e.key.toLowerCase(); press(k === 'backspace' ? 'back' : k) })
const kb = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const grid = computed(() => Array.from({ length: 6 }, (_, i) => rows.value[i] ?? (i === rows.value.length ? { w: cur.value.padEnd(5), d: null } : { w: '     ', d: null })))
</script>
<template>
  <div class="flex flex-col md:flex-row gap-6 items-start">
    <div class="flex flex-col items-center gap-3">
      <div class="flex gap-4 items-center"><Button label="New game" size="small" @click="newGame" /><label class="flex items-center gap-2 text-sm"><ToggleSwitch v-model="hard" /> Hard mode</label></div>
      <Message v-if="msg" severity="info" size="small">{{ msg }}</Message>
      <div class="grid gap-1.5">
        <div v-for="(r, i) in grid" :key="i" class="flex gap-1.5"><div v-for="j in 5" :key="j" class="tile" :class="r.d ? 't' + r.d[j - 1] : ''">{{ r.w[j - 1] }}</div></div>
      </div>
      <div class="flex flex-col gap-1.5 items-center mt-2">
        <div v-for="(row, ri) in kb" :key="row" class="flex gap-1">
          <button v-if="ri === 2" class="px-3 h-12 rounded bg-zinc-600 text-xs" @click="press('enter')">ENTER</button>
          <button v-for="c in row" :key="c" class="w-9 h-12 rounded font-bold uppercase" :class="keyState[c] === undefined ? 'bg-zinc-500' : ['bg-zinc-800 text-zinc-500', 'bg-yellow-500', 'bg-green-600'][keyState[c]]" @click="press(c)">{{ c }}</button>
          <button v-if="ri === 2" class="px-3 h-12 rounded bg-zinc-600 text-xs" @click="press('back')">⌫</button>
        </div>
      </div>
    </div>
    <div class="card flex-1 text-sm">
      <div class="font-semibold mb-2">Possible answers remaining: {{ remaining.length }} <span class="text-zinc-400">({{ Math.log2(Math.max(1, remaining.length)).toFixed(2) }} bits of uncertainty)</span></div>
      <div v-if="rows.length && remaining.length <= 60" class="font-mono text-zinc-400 break-words">{{ remaining.join(' ') }}</div>
      <div v-else-if="rows.length" class="text-zinc-500">(too many to list)</div>
    </div>
  </div>
</template>
