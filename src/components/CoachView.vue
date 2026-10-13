<script setup lang="ts">
// Coach tab: paste or type any game (guesses + colours) and get a per-guess analysis.
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import Textarea from 'primevue/textarea'; import ToggleSwitch from 'primevue/toggleswitch'
import { GraduationCap, Wand2, Eraser, ClipboardPaste } from 'lucide-vue-next'
import { isUA } from '../lib/lang'
import { feedback, patternDigits } from '../lib/wordle'
import { parseGame, formatGame, type CoachStep } from '../lib/coach'
import { useCoach } from '../lib/useCoach'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'
import CoachReport from './CoachReport.vue'
const mk = (ws: string[], ans: string) => formatGame(ws.map(w => ({ w, d: patternDigits(feedback(w, ans)) })))
const EXAMPLES = isUA
  ? [{ l: 'КОТРА → СЛОВО', g: mk(['котра', 'сопло', 'слово'], 'слово') }, { l: 'МАСЛО → ВЕСЛО', g: mk(['масло', 'сопло', 'весло'], 'весло') }]
  : [{ l: 'ARISE → STOUT', g: mk(['arise', 'cloth', 'stout'], 'stout') }, { l: 'SLATE → WATCH', g: mk(['slate', 'catch', 'match', 'hatch', 'patch', 'watch'], 'watch') }]
const text = useLocalStorage('wl-coach-text-' + (isUA ? 'ua' : 'en'), EXAMPLES[0].g)
const hard = ref(false)
const parsed = computed(() => parseGame(text.value))
const game = ref<CoachStep[] | null>(null)
const analyse = () => { game.value = parsed.value.steps.length ? parsed.value.steps.map(s => ({ ...s, d: [...s.d] })) : null }
watch(hard, () => game.value && analyse())
analyse()
const { result, busy, progress } = useCoach(game, hard)
const paste = async () => { try { text.value = await navigator.clipboard.readText(); analyse() } catch { /* clipboard blocked */ } }
</script>
<template>
  <div class="flex flex-col gap-5">
    <UiCard :title="$t('Analyse any game')" :icon="GraduationCap" :subtitle="$t('Paste a Wordle result with words, e.g. ARISE(⬜⬜⬜🟨⬜) CLOTH(⬜⬜🟩🟨⬜). Colours can also be typed as 0/1/2 or b/y/g: “arise 00010”.')" data-coach-input>
      <Textarea v-model="text" rows="3" class="w-full font-mono" :placeholder="EXAMPLES[0].g" :aria-label="$t('Game to analyse')" @keydown.ctrl.enter="analyse" @keydown.meta.enter="analyse" data-coach-text />
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <UiButton :icon="Wand2" :label="$t('Analyse')" @click="analyse" :loading="busy" data-coach-run />
        <UiButton :icon="ClipboardPaste" :label="$t('Paste')" variant="secondary" @click="paste" />
        <UiButton :icon="Eraser" :label="$t('Clear')" variant="ghost" @click="text = ''; game = null" />
        <label class="flex items-center gap-2 cursor-pointer text-caption ml-auto"><ToggleSwitch v-model="hard" />{{ $t('Hard mode') }}</label>
      </div>
      <div class="flex flex-wrap items-center gap-2 mt-3 text-caption text-muted">{{ $t('Examples') }}:
        <button v-for="e in EXAMPLES" :key="e.l" type="button" class="chip px-2.5 py-1 rounded-full border border-line bg-surface-2 hover:bg-surface hover:text-fg transition-colors font-mono cursor-pointer" @click="text = e.g; analyse()">{{ e.l }}</button>
      </div>
      <p v-if="parsed.error" class="text-caption text-red-600 dark:text-red-400 mt-2" data-coach-parse-error>{{ $t('Could not read: “{x}”. Use WORD followed by 5 colours.', { x: parsed.error }) }}</p>
      <p v-else-if="parsed.steps.length" class="text-caption text-muted mt-2">{{ $t('Read {n} guess(es).', { n: parsed.steps.length }) }}</p>
    </UiCard>
    <CoachReport v-if="game" :result="result" :busy="busy" :progress="progress" />
  </div>
</template>
