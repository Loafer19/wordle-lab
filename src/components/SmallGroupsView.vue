<script setup lang="ts">
// Learn › Small groups in your head: the rule, a worked example with live colour patterns, and an honest note on what the app does.
import { ref, computed } from 'vue'
import { Boxes, Lightbulb, Scale, ArrowRight } from 'lucide-vue-next'
import { lang, NV } from '../lib/lang'
import { allowed } from '../lib/words'
import { patternDigits } from '../lib/wordle'
import { groupsOf, tally, bestScouts, EXAMPLE, LESSON_RESULT } from '../lib/smallGroups'
import { href } from '../lib/route'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
const E = EXAMPLE[lang], R = LESSON_RESULT
const cands: string[] = [...E.cands]
const options: string[] = [E.trap, E.scout, ...E.extra]
const guess = ref<string>(E.trap), typed = ref('')
const groups = computed(() => groupsOf(guess.value, cands))
const sum = computed(() => tally(guess.value, cands))
const isCand = computed(() => cands.includes(guess.value))
const best = computed(() => (allowed.value.length ? bestScouts(cands, allowed.value, 2) : []))
const typedOk = computed(() => { const w = typed.value.trim().toLowerCase(); return w.length === 5 && allowed.value.includes(w) })
const tryTyped = () => { if (typedOk.value) { guess.value = typed.value.trim().toLowerCase(); typed.value = '' } }
const tileCls = ['bg-absent', 'bg-present', 'bg-correct']
const U = (w: string) => w.toUpperCase()
// the letters that tell the six apart (the changing spot) and which of them the scout contains; what stays together after the scout
const diff = [...new Set(cands.map(w => [...w].filter((ch, i) => !cands.every(c => c[i] === ch)).join('')))]
const scoutHas = diff.filter(ch => E.scout.includes(ch))
const scoutPair = groupsOf(E.scout, cands).filter(g => g.words.length > 1).flatMap(g => g.words)
</script>
<template>
  <div class="flex flex-col gap-5" data-lesson-small-groups>
    <UiCard :title="$t('How to play Small groups in your head')" :icon="Boxes" :subtitle="$t('The Small groups strategy, done by hand: no bits, no calculator, just counting.')">
      <ol class="list-decimal pl-5 flex flex-col gap-1.5 text-body" data-lesson-rule>
        <li>{{ $t('Pick a guess to test. For each word that can still be the answer, imagine the colours this guess would show.') }}</li>
        <li>{{ $t('Put words that would show exactly the same colours into one group.') }}</li>
        <li>{{ $t('A group of one is a win: if you see those colours, you know the answer next turn.') }}</li>
        <li>{{ $t('Choose the guess with the most groups of one. If two guesses tie, take the one whose largest group is smaller.') }}</li>
      </ol>
    </UiCard>

    <UiCard :title="$t('Worked example: six answers, one letter apart')" :icon="Lightbulb" :subtitle="$t('Possible answers left: {w}. Pick a guess and see how it splits them (colours computed by the game engine).', { w: cands.map(U).join(', ') })">
      <div class="flex flex-wrap items-center gap-2 mb-4" data-lesson-guesses>
        <button v-for="w in options" :key="w" type="button" @click="guess = w" :data-lesson-guess="w"
          class="px-3 py-1.5 rounded-lg border font-mono uppercase font-semibold text-body transition" :class="guess === w ? 'bg-brand-500/15 border-brand-500/50 text-brand-700 dark:text-brand-400' : 'border-line hover:bg-surface-2'">{{ w }}</button>
        <form class="flex items-center gap-1.5" @submit.prevent="tryTyped">
          <input v-model="typed" maxlength="5" :placeholder="$t('your word')" class="w-28 px-2 py-1.5 rounded-lg border border-line bg-surface font-mono uppercase text-body" data-lesson-input :aria-label="$t('Try your own guess')" />
          <button type="submit" :disabled="!typedOk" class="px-2.5 py-1.5 rounded-lg border border-line text-body disabled:opacity-40">{{ $t('Try') }}</button>
        </form>
      </div>
      <div class="flex flex-wrap items-center gap-2 mb-3" data-lesson-summary>
        <span class="font-mono uppercase font-bold text-title">{{ guess }}</span>
        <UiBadge :tone="sum.singletons >= 4 ? 'correct' : sum.singletons >= 2 ? 'present' : 'danger'" data-lesson-singletons>{{ $t('{n} groups of one', { n: sum.singletons }) }}</UiBadge>
        <UiBadge>{{ $t('largest group: {n}', { n: sum.largest }) }}</UiBadge>
        <UiBadge>{{ isCand ? $t('could be the answer') : $t('scout word (not one of the six)') }}</UiBadge>
      </div>
      <ul class="flex flex-col gap-2" data-lesson-groups>
        <li v-for="g in groups" :key="g.p" class="flex flex-wrap items-center gap-3 py-1.5 border-t border-line" data-lesson-group :data-size="g.words.length">
          <span class="inline-flex gap-0.5" :aria-label="patternDigits(g.p).join('')" data-lesson-pattern>
            <i v-for="(d, i) in patternDigits(g.p)" :key="i" class="not-italic grid place-items-center size-7 rounded-[4px] text-white font-mono font-bold text-caption uppercase" :class="tileCls[d]">{{ guess[i] }}</i>
          </span>
          <span class="font-mono uppercase text-body">{{ g.words.join(' · ') }}</span>
          <UiBadge v-if="g.words.length === 1" tone="correct">{{ g.words[0] === guess ? $t('solved now') : $t('solved next turn') }}</UiBadge>
          <UiBadge v-else tone="danger">{{ $t('{n} still mixed up', { n: g.words.length }) }}</UiBadge>
        </li>
      </ul>
      <p class="text-body text-muted mt-4" data-lesson-explain>
        {{ $t('{t} is tempting because it might be right, but the other five all show the same colours: a trap, and you may need up to five more guesses. {s} cannot win this turn, yet it contains {k} of the {n} letters that differ ({l}), so only {pair} stay together: four groups of one and a single pair.', { t: U(E.trap), s: U(E.scout), k: scoutHas.length, n: diff.length, l: U(scoutHas.join(', ')), pair: U(scoutPair.join(' / ')) }) }}
      </p>
      <p v-if="best.length" class="text-caption text-muted mt-2" data-lesson-best>{{ $t('Checked against all {nv} allowed guesses: nothing beats {a} and {b} here (4 groups of one, largest 2).', { nv: NV, a: U(best[0].w), b: U(best[1].w) }) }}</p>
    </UiCard>

    <div class="grid lg:grid-cols-2 gap-5">
      <UiCard :title="$t('Lesson: send a scout')" :icon="ArrowRight">
        <p class="text-body">{{ $t('When a few answers differ in one or two letters, guessing one of them often wastes turns. A word that cannot be the answer, but packs the letters that differ, usually splits them much better.') }}</p>
      </UiCard>
      <UiCard :title="$t('Honest note: what the app does')" :icon="Scale">
        <p class="text-body" data-lesson-note>{{ $t('The app checks all {nv} allowed guesses and scores each by the sum of 1/group size, so big groups still count a little. In your head you try 3–5 likely guesses and count groups of one: an approximation of the same idea. Max entropy (the sum of p·log p) is not something you can do mentally.', { nv: NV }) }}</p>
        <p class="text-body mt-2" data-lesson-result>{{ $t('It costs little: with the same opener, Small groups averages {a} guesses against {b} for max entropy on the English list ({o}), and {c} against {d} on the Ukrainian list ({p}).', { a: R.en.sg.toFixed(3), b: R.en.ent.toFixed(3), o: R.en.opener, c: R.ua.sg.toFixed(3), d: R.ua.ent.toFixed(3), p: R.ua.opener }) }}</p>
        <a :href="href('strategies', 'leaderboard')" class="inline-flex items-center gap-1.5 mt-2 text-body font-semibold text-brand-700 dark:text-brand-400 hover:underline underline-offset-2">{{ $t('See the leaderboard') }}<ArrowRight :size="14" /></a>
      </UiCard>
    </div>
  </div>
</template>
