<script setup lang="ts">
// Strategies › Lookahead: how the 2-ply lookahead strategies work, their results next to the optimum and the greedy rules,
// the safe (A) vs expected-cost (B) trade-off, and the experiments behind them (opener effect, group-size cap, parameters).
import { computed } from 'vue'
import { Telescope, Table2, Scale, FlaskRound, GitCompare } from 'lucide-vue-next'
import { lang, isUA, NA } from '../lib/lang'
import { simIndex, type Summary } from '../lib/simdata'
import { shortName, blurb } from '../lib/names'
import { OPENER_EFFECT, CAP_SWEEP, LOOK_SWEEP, LOOK_PARAMS } from '../lib/lookahead'
import { compareSel } from '../lib/shared'
import { go } from '../lib/route'
import { guessScale, ruslanColor, otherColor } from '../lib/tokens'
import { t } from '../lib/i18n'
import Skeleton from 'primevue/skeleton'
import UiCard from './ui/UiCard.vue'; import UiButton from './ui/UiButton.vue'; import UiBadge from './ui/UiBadge.vue'
const IDS = lang === 'en' ? ['optimal', 'lookahead-b', 'lookahead-a', 'hybrid-all', 'entropy-fixed', 'singleton-all', 'entropy2-all', 'entropy-all'] : ['optimal', 'optimal-max5', 'lookahead-b', 'lookahead-a', 'hybrid-all', 'singleton-all', 'entropy-all', 'entropy2-all']
const cnt = (s: Summary) => s.dist.reduce((a, b) => a + (b ?? 0), 0)
const total = (s: Summary) => Math.round(s.avg * cnt(s))
const share = (s: Summary, k: number) => (100 * s.dist.slice(0, k + 1).reduce((a, b) => a + (b ?? 0), 0)) / cnt(s)
const rows = computed(() => IDS.map(id => simIndex.value.find(s => s.id === id && s.mode === 'normal')).filter((s): s is Summary => !!s).sort((a, b) => a.avg - b.avg).map(s => ({ s, name: shortName(s.id, t(s.name)), blurb: blurb(s.id), look: s.id.startsWith('lookahead-') })))
const best = computed(() => Math.min(...rows.value.map(r => total(r.s))))
const bins = (s: Summary) => [1, 2, 3, 4, 5, 6].map(i => ({ g: i, n: s.dist[i] ?? 0 })).concat([{ g: 7, n: s.dist.slice(7).reduce((a, b) => a + b, 0) }]).filter(b => b.n)
const ab = computed(() => ['lookahead-a', 'lookahead-b'].map(id => rows.value.find(r => r.s.id === id)).filter(Boolean) as typeof rows.value)
function compareAB() { compareSel.value = { a: 'lookahead-a', b: 'lookahead-b', hardA: false, hardB: false }; go('strategies', 'compare') }
const OPENERS = ['soare', 'salet', 'trace', 'crane']
const ruleRows = [...new Set(OPENER_EFFECT.map(r => r[0]))].map(rule => ({ rule, cells: OPENERS.map(o => OPENER_EFFECT.find(r => r[0] === rule && r[1] === o)!) }))
const rowMin = (cells: [string, string, number, number][]) => Math.min(...cells.map(c => c[2]))
const avg = (tot: number) => (tot / 2315).toFixed(3)
</script>
<template>
  <div class="flex flex-col gap-5" data-lookahead>
    <UiCard :title="$t('Lookahead: thinking two guesses ahead')" :icon="Telescope" :subtitle="$t('Two new strategies that look one guess further than the greedy rules, precomputed as decision trees so they play instantly.')">
      <div class="flex flex-col gap-3 max-w-3xl leading-relaxed" data-lookahead-intro>
        <p>{{ $t('The greedy rules (max entropy, Small groups…) score a guess only by the feedback groups it creates right now. Lookahead also asks: for each group, how good is the best next guess? It estimates the expected number of guesses still needed and picks the guess with the smallest one.') }}</p>
        <ul class="list-disc pl-5 flex flex-col gap-1.5">
          <li><b>{{ $t('Expected guesses, 2 ply.') }}</b> {{ $t('A group of 1 answer costs 1 more guess, a group of 2 costs 1.5 on average. For a bigger group, every allowed word is tried as the next guess, and the groups it leaves are costed the same way.') }}</li>
          <li><b>{{ $t('Penalty x.') }}</b> {{ $t('Groups with 3+ answers after the second guess are not searched further: they get the best case for k answers, (2k − 1)/k, plus a penalty x = {x}. Without the penalty (x = 0) the estimate is too optimistic and one EN word needs 7 guesses; any x from 0.1 to 0.5 gives the same total.', { x: LOOK_PARAMS.x }) }}</li>
          <li><b>{{ $t('Top-K pruning.') }}</b> {{ $t('At each position only the top K = {k} guesses by Σ 1/group, plus every possible answer, are evaluated with the full lookahead. The second guess inside the lookahead still searches all allowed words. K = 10 or 20 loses only 1–2 guesses in total.', { k: LOOK_PARAMS.K }) }}</li>
          <li><b>{{ $t('Why precomputed.') }}</b> {{ $t('One lookahead move over hundreds of possible answers takes about a minute; choosing the opener this way takes many minutes. So the opener is fixed (SALET / КОТРА) and the whole tree is computed once by scripts/lookahead/lookahead.py; in the app every move is a tree lookup. If your own guesses leave the tree, the next moves come from Small groups + entropy.') }}</li>
        </ul>
        <p class="text-caption text-muted">{{ $t('This is a heuristic, not a proof: the optimal trees come from exhaustive search. That lookahead reaches the same total here is an empirical result.') }}</p>
      </div>
    </UiCard>
    <UiCard :title="$t('Results ({n} answers, normal mode)', { n: NA })" :icon="Table2" :subtitle="$t('Lookahead next to the optimal tree and the instant greedy rules')">
      <div v-if="!rows.length" class="flex flex-col gap-2"><Skeleton v-for="i in 6" :key="i" height="1.6rem" /></div>
      <div v-else class="overflow-x-auto"><table class="text-caption w-full" data-lookahead-table>
        <thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">{{ $t('Strategy') }}</th><th class="pr-3 font-medium">{{ $t('Opener') }}</th><th class="pr-3 font-medium">{{ $t('Avg') }}</th><th class="pr-3 font-medium">{{ $t('total') }}</th><th class="pr-3 font-medium">{{ $t('in ≤3') }}</th><th class="pr-3 font-medium">{{ $t('in ≤4') }}</th><th class="pr-3 font-medium">{{ $t('worst') }}</th><th class="font-medium min-w-40">{{ $t('Guess-count distribution') }}</th></tr></thead>
        <tbody><tr v-for="r in rows" :key="r.s.id" class="border-t border-line" :class="r.look && 'bg-brand-500/6'" :data-id="r.s.id">
          <td class="py-1.5 pr-3"><span class="font-medium">{{ r.name }}</span><UiBadge v-if="r.look" tone="brand" class="ml-1.5">{{ $t('new') }}</UiBadge><span class="block text-muted leading-snug max-w-sm">{{ r.blurb }}</span></td>
          <td class="pr-3 font-mono uppercase font-semibold">{{ r.s.opener }}</td>
          <td class="pr-3 tabular-nums font-semibold">{{ r.s.avg.toFixed(4) }}</td>
          <td class="pr-3 tabular-nums">{{ total(r.s) }}<span v-if="total(r.s) > best" class="text-muted"> +{{ total(r.s) - best }}</span></td>
          <td class="pr-3 tabular-nums">{{ share(r.s, 3).toFixed(1) }}%</td><td class="pr-3 tabular-nums">{{ share(r.s, 4).toFixed(1) }}%</td><td class="pr-3">{{ r.s.worst }}</td>
          <td><div class="flex h-3 rounded-full overflow-hidden w-40" v-tooltip.top="bins(r.s).map(b => `${b.g === 7 ? '7+' : b.g}: ${b.n}`).join(' · ')"><span v-for="b in bins(r.s)" :key="b.g" :style="{ width: (100 * b.n) / cnt(r.s) + '%', background: guessScale[b.g] }"></span></div></td>
        </tr></tbody>
      </table></div>
      <p class="text-caption text-muted mt-3">{{ $t('total = guesses summed over all answers; +n = more than the best row.') }} {{ isUA ? $t('UA: lookahead matches the optimal КОТРА tree (5805), but it needs 6 guesses for two words; the ≤5-guess optimal tree costs one guess more.') : $t('EN: lookahead matches the proven optimum (7920, SALET) with at most 5 guesses.') }}</p>
    </UiCard>
    <UiCard :title="$t('Safe (A) vs expected guesses (B)')" :icon="Scale" :subtitle="$t('Fewer long games or a lower average: you cannot have both')">
      <div class="grid md:grid-cols-2 gap-3" data-lookahead-ab>
        <div v-for="(r, i) in ab" :key="r.s.id" class="rounded-card border-2 p-3 flex flex-col gap-1.5" :style="{ borderColor: (i ? otherColor : ruslanColor) + '66', background: (i ? otherColor : ruslanColor) + '0d' }">
          <b class="text-title">{{ r.name }}</b><span class="text-caption text-muted">{{ r.blurb }}</span>
          <div class="flex flex-wrap gap-x-4 text-caption"><span>{{ $t('Avg') }} <b class="tabular-nums">{{ r.s.avg.toFixed(3) }}</b></span><span>{{ $t('in ≤4') }} <b class="tabular-nums">{{ share(r.s, 4).toFixed(1) }}%</b></span><span>{{ $t('5+ guesses') }} <b class="tabular-nums">{{ cnt(r.s) - r.s.dist.slice(0, 5).reduce((a, b) => a + (b ?? 0), 0) }}</b></span><span>{{ $t('worst') }} <b>{{ r.s.worst }}</b></span></div>
        </div>
      </div>
      <p class="text-caption text-muted mt-3 max-w-3xl">{{ $t('A gives up some 3-guess wins to make sure more groups can be finished within two more guesses: its 5-guess games drop by about half, while the average rises by 0.02–0.03.') }}</p>
      <UiButton class="mt-3" :icon="GitCompare" variant="secondary" :label="$t('Compare A and B word by word')" @click="compareAB" data-lookahead-compare />
    </UiCard>
    <UiCard :title="$t('The experiments behind it')" :icon="FlaskRound" :subtitle="$t('English list, normal mode, all 2,315 answers; numbers are total guesses (average in brackets)')">
      <div class="grid lg:grid-cols-2 gap-5">
        <div class="overflow-x-auto" data-lookahead-openers>
          <h4 class="font-semibold mb-1">{{ $t('Opener effect: same rule, different first word') }}</h4>
          <table class="text-caption w-full"><thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">{{ $t('Rule') }}</th><th v-for="o in OPENERS" :key="o" class="pr-3 font-mono uppercase font-semibold">{{ o }}</th></tr></thead>
            <tbody><tr v-for="r in ruleRows" :key="r.rule" class="border-t border-line"><td class="py-1.5 pr-3 whitespace-nowrap">{{ $t(r.rule) }}</td>
              <td v-for="c in r.cells" :key="c[1]" class="pr-3 tabular-nums whitespace-nowrap" :class="c[2] === rowMin(r.cells) && 'font-bold text-correct'">{{ c[2] }} <span class="text-muted font-normal">({{ avg(c[2]) }})</span><sup v-if="c[3] < 6" class="text-muted" v-tooltip.top="$t('worst case 5')">≤5</sup></td></tr></tbody></table>
          <p class="text-caption text-muted mt-2">{{ $t('SOARE is the max-entropy opener, but after it every rule does worse: about 50–80 guesses more than SALET. Compare strategies with the same opener.') }}</p>
        </div>
        <div class="overflow-x-auto" data-lookahead-cap>
          <h4 class="font-semibold mb-1">{{ $t('Small groups: cap on the largest group (SALET)') }}</h4>
          <table class="text-caption w-full"><thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">{{ $t('Largest group allowed') }}</th><th class="pr-3 font-medium">{{ $t('total') }}</th><th class="font-medium">{{ $t('worst') }}</th></tr></thead>
            <tbody><tr v-for="c in CAP_SWEEP" :key="c[0]" class="border-t border-line" :class="c[0].includes('current') && 'bg-brand-500/6'"><td class="py-1 pr-3">{{ $t(c[0]) }}</td><td class="pr-3 tabular-nums">{{ c[1] }} <span class="text-muted">({{ avg(c[1]) }})</span></td><td>{{ c[2] }}</td></tr></tbody></table>
          <p class="text-caption text-muted mt-2">{{ $t('Any cap stays 36–77 guesses above the optimum; adding 20 × entropy instead (Small groups + entropy) gets within 12.') }}</p>
        </div>
        <div class="overflow-x-auto lg:col-span-2" data-lookahead-sweep>
          <h4 class="font-semibold mb-1">{{ $t('Lookahead parameters (SALET)') }}</h4>
          <table class="text-caption w-full"><thead><tr class="text-muted text-left"><th class="py-1 pr-3 font-medium">{{ $t('Variant') }}</th><th class="pr-3 font-medium">K</th><th class="pr-3 font-medium">x</th><th class="pr-3 font-medium">{{ $t('total') }}</th><th class="pr-3 font-medium">{{ $t('worst') }}</th><th class="font-medium">{{ $t('in ≤4') }}</th></tr></thead>
            <tbody><tr v-for="c in LOOK_SWEEP" :key="c.join()" class="border-t border-line"><td class="py-1 pr-3">{{ $t(c[0]) }}</td><td class="pr-3 tabular-nums">{{ c[1] }}</td><td class="pr-3">{{ $t(c[2]) }}</td><td class="pr-3 tabular-nums" :class="c[3] === 7920 && 'font-bold text-correct'">{{ c[3] }} <span class="text-muted font-normal">({{ avg(c[3]) }})</span></td><td class="pr-3" :class="c[4] > 6 && 'text-red-600 dark:text-red-400 font-semibold'">{{ c[4] }}</td><td class="tabular-nums">{{ c[5] }}%</td></tr></tbody></table>
        </div>
      </div>
    </UiCard>
  </div>
</template>
