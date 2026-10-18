<script setup lang="ts">
// Community: competitive Wordle, videos & stories, Discord servers (curated, static) and notable words computed from our own simulations.
import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Users, Trophy, Swords, Medal, PlayCircle, Newspaper, BookOpen, MessagesSquare, ExternalLink, Skull, TriangleAlert, Puzzle, Eye, ScanSearch } from 'lucide-vue-next'
import { COMPETITIVE, STORIES, DISCORD, DISCORD_ACTIVITY, CHECKED, roughCount, ytThumb, type Notable } from '../lib/community'
import { base, lang } from '../lib/lang'
import { href, go } from '../lib/route'
import { inspectWord } from '../lib/shared'
import UiCard from './ui/UiCard.vue'; import UiBadge from './ui/UiBadge.vue'
const compIcon: Record<string, any> = { worldwardle: Trophy, wordledash: Swords, arena: Medal }
const storyIcon = { video: PlayCircle, article: Newspaper, research: BookOpen }
const notable = ref<Notable | null>(null), failed = ref(false)
fetch(base + 'notable.json').then(r => (r.ok ? r.json() : Promise.reject())).then(j => (notable.value = j)).catch(() => (failed.value = true))
const watchWord = useLocalStorage('wl-watch-word-' + lang, '')
const watch = (w: string) => { watchWord.value = w; go('assistant', 'watch') }
const inspect = (w: string) => { inspectWord.value = w; go('learn', 'inspector') }
const up = (w: string) => w.toUpperCase()
</script>
<template>
  <div class="flex flex-col gap-5" data-community>
    <UiCard :title="$t('Community')" :icon="Users" :subtitle="$t('Where people play Wordle competitively, the videos and stories worth knowing, places to chat, and the words our strategies find hardest.')" />

    <section class="flex flex-col gap-3" data-community-section="competitive">
      <h2 class="text-title font-semibold flex items-center gap-2 px-1"><Trophy :size="16" class="text-brand" />{{ $t('Competitive Wordle') }}</h2>
      <div class="grid sm:grid-cols-3 gap-4">
        <a v-for="l in COMPETITIVE" :key="l.id" :href="l.url" target="_blank" rel="noopener" class="group bg-surface border border-line rounded-card shadow-card p-4 flex flex-col gap-2 lift hover:border-brand-500/40 transition-colors" data-community-link :data-id="l.id">
          <div class="flex items-center gap-2"><span class="grid place-items-center size-8 rounded-lg bg-brand-500/12 text-brand-600 dark:text-brand-400 shrink-0"><component :is="compIcon[l.id]" :size="16" /></span>
            <span class="font-semibold text-body flex-1 min-w-0 truncate group-hover:text-brand-700 dark:group-hover:text-brand-400">{{ l.title }}</span><ExternalLink :size="14" class="text-muted shrink-0" /></div>
          <p class="text-caption text-muted">{{ $t(l.desc) }}</p>
          <span class="text-caption text-muted font-mono mt-auto">{{ l.by }}</span>
        </a>
      </div>
    </section>

    <section class="flex flex-col gap-3" data-community-section="stories">
      <h2 class="text-title font-semibold flex items-center gap-2 px-1"><PlayCircle :size="16" class="text-brand" />{{ $t('Videos & stories') }}</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a v-for="l in STORIES" :key="l.id" :href="l.url" target="_blank" rel="noopener" class="group bg-surface border border-line rounded-card shadow-card overflow-hidden flex flex-col lift hover:border-brand-500/40 transition-colors" data-community-link :data-id="l.id">
          <img v-if="l.yt" :src="ytThumb(l.yt)" :alt="l.title" loading="lazy" decoding="async" width="320" height="180" class="w-full aspect-video object-cover bg-surface-2" />
          <div class="p-4 flex flex-col gap-1.5 flex-1">
            <div class="flex items-center gap-1.5 text-caption text-muted"><component :is="storyIcon[l.kind!]" :size="13" class="shrink-0" />{{ l.by }}<span v-if="l.kind === 'video'">· YouTube</span></div>
            <span class="font-semibold text-body group-hover:text-brand-700 dark:group-hover:text-brand-400">{{ l.title }}</span>
            <p class="text-caption text-muted">{{ $t(l.desc) }}</p>
          </div>
        </a>
      </div>
    </section>

    <section class="flex flex-col gap-3" data-community-section="discord">
      <h2 class="text-title font-semibold flex items-center gap-2 px-1"><MessagesSquare :size="16" class="text-brand" />{{ $t('Discord') }}</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <a v-for="s in DISCORD" :key="s.id" :href="s.url" target="_blank" rel="noopener" class="group bg-surface border border-line rounded-card shadow-card p-4 flex flex-col gap-2 lift hover:border-brand-500/40 transition-colors" data-community-link :data-id="s.id">
          <div class="flex items-center gap-2"><span class="grid place-items-center size-8 rounded-lg bg-brand-500/12 text-brand-600 dark:text-brand-400 shrink-0"><MessagesSquare :size="16" /></span>
            <span class="font-semibold text-body flex-1 min-w-0 truncate group-hover:text-brand-700 dark:group-hover:text-brand-400">{{ s.name }}</span>
            <UiBadge v-tooltip.top="$t('Members when checked on {d}', { d: CHECKED })">{{ $t('{n} members', { n: roughCount(s.members) }) }}</UiBadge></div>
          <p class="text-caption text-muted">{{ $t(s.desc) }}</p>
        </a>
      </div>
      <p class="text-caption text-muted px-1">{{ $t('Or play the official NYT Wordle inside Discord: type /wordle in any chat.') }}
        <a :href="DISCORD_ACTIVITY.url" target="_blank" rel="noopener" class="font-semibold text-brand-700 dark:text-brand-400 hover:underline underline-offset-2" data-community-link data-id="discord-activity">{{ DISCORD_ACTIVITY.title }}</a></p>
    </section>

    <section class="flex flex-col gap-3" data-community-section="lab">
      <h2 class="text-title font-semibold flex items-center gap-2 px-1"><Puzzle :size="16" class="text-brand" />{{ $t('From Wordle Lab: notable words') }}</h2>
      <p v-if="failed" class="text-caption text-muted px-1">{{ $t('Could not load the notable words.') }}</p>
      <div v-else-if="notable" class="grid lg:grid-cols-3 gap-4">
        <UiCard :title="$t('Hardest answers')" :icon="Skull" :subtitle="$t('Highest average guesses over {n} built-in strategies (normal mode, Random excluded)', { n: notable.strategies })">
          <ol class="flex flex-col" data-notable="hardest">
            <li v-for="(r, i) in notable.hardest" :key="r.w" class="flex items-center gap-2 border-t border-line first:border-t-0 py-1.5 text-body">
              <span class="w-5 text-caption text-muted tabular-nums">{{ i + 1 }}</span>
              <span class="font-mono font-semibold flex-1">{{ up(r.w) }}</span>
              <span class="text-caption text-muted tabular-nums" v-tooltip.top="$t('worst {k} · {f} strategies need more than 6', { k: r.worst, f: r.fails })">{{ r.avg.toFixed(2) }}</span>
              <a :href="href('assistant', 'watch')" @click.prevent="watch(r.w)" class="text-muted hover:text-brand-700 dark:hover:text-brand-400" :aria-label="$t('Watch a strategy solve {w}', { w: up(r.w) })" v-tooltip.top="$t('Watch a strategy solve {w}', { w: up(r.w) })" data-notable-watch><Eye :size="15" /></a>
              <a :href="href('learn', 'inspector')" @click.prevent="inspect(r.w)" class="text-muted hover:text-brand-700 dark:hover:text-brand-400" :aria-label="$t('Open {w} in the Word inspector', { w: up(r.w) })" v-tooltip.top="$t('Open {w} in the Word inspector', { w: up(r.w) })"><ScanSearch :size="15" /></a>
            </li>
          </ol>
        </UiCard>
        <UiCard :title="$t('Hard-mode traps')" :icon="TriangleAlert" :subtitle="$t('Answers that most strategies fail (more than 6 guesses) in hard mode, out of {n}', { n: notable.hardStrategies })">
          <ol class="flex flex-col" data-notable="hard">
            <li v-for="r in notable.hardMode" :key="r.w" class="flex items-center gap-2 border-t border-line first:border-t-0 py-1.5 text-body">
              <span class="font-mono font-semibold flex-1">{{ up(r.w) }}</span>
              <UiBadge :tone="r.fails >= notable.hardStrategies / 2 ? 'danger' : 'present'">{{ $t('{f} of {n} fail', { f: r.fails, n: notable.hardStrategies }) }}</UiBadge>
              <a :href="href('assistant', 'watch')" @click.prevent="watch(r.w)" class="text-muted hover:text-brand-700 dark:hover:text-brand-400" :aria-label="$t('Watch a strategy solve {w}', { w: up(r.w) })" v-tooltip.top="$t('Watch a strategy solve {w}', { w: up(r.w) })"><Eye :size="15" /></a>
            </li>
          </ol>
        </UiCard>
        <UiCard :title="$t('Word families')" :icon="Puzzle" :subtitle="$t('Answers that differ in one letter only: the classic traps, where luck decides')">
          <ul class="flex flex-col gap-3" data-notable="families">
            <li v-for="f in notable.families" :key="f.pattern" class="flex flex-col gap-1">
              <div class="flex items-center gap-2"><span class="font-mono font-bold tracking-widest">{{ up(f.pattern) }}</span><UiBadge>{{ f.words.length }}</UiBadge><span class="flex-1" /><span class="text-caption text-muted tabular-nums" v-tooltip.top="$t('Average guesses over the strategies for these words')">{{ f.avg.toFixed(2) }}</span></div>
              <div class="flex flex-wrap gap-1"><a v-for="w in f.words" :key="w" :href="href('assistant', 'watch')" @click.prevent="watch(w)" class="font-mono text-caption px-1.5 py-0.5 rounded border border-line bg-surface-2 hover:border-brand-500/40 hover:text-brand-700 dark:hover:text-brand-400 transition-colors" v-tooltip.top="$t('Watch a strategy solve {w}', { w: up(w) })">{{ up(w) }}</a></div>
            </li>
          </ul>
        </UiCard>
      </div>
      <div v-else class="text-caption text-muted px-1">{{ $t('Loading…') }}</div>
    </section>
  </div>
</template>
