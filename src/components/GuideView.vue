<script setup lang="ts">
// Learn › Start here: a short guided path (letters → patterns → entropy → trees) for curious players.
import { CaseSensitive, Grid2x2, Sigma, Network, ArrowRight, CircleCheck } from 'lucide-vue-next'
import { href } from '../lib/route'
import { guideSeen } from '../lib/shared'
import { t } from '../lib/i18n'
import UiCard from './ui/UiCard.vue'
const steps = [
  { id: 'letters', icon: CaseSensitive, title: t('1 · Letters'), text: t('Some letters are far more common than others, and they prefer certain spots. A first guess with common letters in their usual places tells you the most.'), link: href('learn', 'letters'), cta: t('See letter frequencies') },
  { id: 'patterns', icon: Grid2x2, title: t('2 · Patterns'), text: t('Every guess sorts the possible answers into up to 243 colour patterns. A good guess spreads them into many small groups, so whatever colours you see, few words are left.'), link: href('learn', 'inspector'), cta: t('Open the Word inspector') },
  { id: 'entropy', icon: Sigma, title: t('3 · Entropy'), text: t('Entropy measures that spread in bits: each bit halves the possible answers on average. The best openers give almost 6 bits; you need about 11 in total.'), link: href('learn', 'openers'), cta: t('Compare top openers') },
  { id: 'trees', icon: Network, title: t('4 · Decision trees'), text: t('A strategy is a tree: the opener, then one planned answer for every colour pattern. The optimal tree minimises the average number of guesses over all answers.'), link: href('explore', 'tree'), cta: t('Explore the optimal tree') },
]
const mark = (id: string) => (guideSeen.value = { ...guideSeen.value, [id]: true })
</script>
<template>
  <div class="flex flex-col gap-5" data-guide>
    <UiCard :title="$t('Start here: how Wordle math works')" :subtitle="$t('Four short steps, about two minutes. Each one links to the view where you can play with it.')" />
    <ol class="grid sm:grid-cols-2 gap-4">
      <li v-for="s in steps" :key="s.id" class="bg-surface border border-line rounded-card shadow-card p-4 sm:p-5 flex flex-col gap-2" data-guide-step>
        <div class="flex items-center gap-2"><span class="grid place-items-center size-8 rounded-lg bg-brand-500/12 text-brand-600 dark:text-brand-400"><component :is="s.icon" :size="16" /></span>
          <h2 class="text-title font-semibold flex-1">{{ s.title }}</h2><CircleCheck v-if="guideSeen[s.id]" :size="16" class="text-correct" :aria-label="$t('visited')" /></div>
        <p class="text-body text-muted flex-1">{{ s.text }}</p>
        <a :href="s.link" @click="mark(s.id)" class="self-start inline-flex items-center gap-1.5 text-body font-semibold text-brand-700 dark:text-brand-400 hover:underline underline-offset-2">{{ s.cta }}<ArrowRight :size="14" /></a>
      </li>
    </ol>
  </div>
</template>
