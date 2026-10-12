<script setup lang="ts">
import { ref } from 'vue'
import Tabs from 'primevue/tabs'; import TabList from 'primevue/tablist'; import Tab from 'primevue/tab'
import Button from 'primevue/button'
import { ready } from './lib/words'
import { isDark, toggleDark } from './lib/theme'
import { ANSWERS_HELP, ALLOWED_HELP, ANSWERS_LABEL, ALLOWED_LABEL } from './lib/labels'
import PlayView from './components/PlayView.vue'
import AssistantView from './components/AssistantView.vue'
import SimView from './components/SimView.vue'
import PathView from './components/PathView.vue'
import LettersView from './components/LettersView.vue'
import OpenersView from './components/OpenersView.vue'
const loaded = ref(false); ready.then(() => (loaded.value = true))
const tab = ref(location.hash.match(/tab=(\w+)/)?.[1] || 'play')
const setTab = (v: string | number) => { tab.value = String(v); history.replaceState(null, '', '#tab=' + v) }
const showWords = ref(false)
</script>
<template>
  <div class="max-w-6xl mx-auto p-3 sm:p-4">
    <header class="flex items-center gap-3 mb-3 flex-wrap">
      <h1 class="text-2xl sm:text-3xl font-bold">🟩 Wordle Lab</h1>
      <div class="flex-1"></div>
      <Button size="small" text :label="showWords ? 'Hide word lists info' : 'What are the word lists?'" icon="" @click="showWords = !showWords" />
      <Button size="small" severity="secondary" :label="isDark ? '☀️ Light' : '🌙 Dark'" @click="toggleDark()" />
    </header>
    <div v-if="showWords" class="card text-sm mb-3 grid sm:grid-cols-2 gap-3">
      <div><b>{{ ANSWERS_LABEL }}</b><p class="muted">{{ ANSWERS_HELP }}</p></div>
      <div><b>{{ ALLOWED_LABEL }}</b><p class="muted">{{ ALLOWED_HELP }}</p></div>
    </div>
    <div v-if="!loaded">Loading dictionaries…</div>
    <Tabs v-else :value="tab" @update:value="setTab" scrollable>
      <TabList>
        <Tab value="play">🎮 Play</Tab><Tab value="assist">🧠 Solver assistant</Tab><Tab value="sim">📊 Simulation</Tab>
        <Tab value="path">🧭 Decision paths</Tab><Tab value="letters">🔤 Letter frequency</Tab><Tab value="openers">🚀 Openers</Tab>
      </TabList>
    </Tabs>
    <main v-if="loaded" class="mt-4">
      <PlayView v-if="tab === 'play'" /><AssistantView v-else-if="tab === 'assist'" /><SimView v-else-if="tab === 'sim'" />
      <PathView v-else-if="tab === 'path'" /><LettersView v-else-if="tab === 'letters'" /><OpenersView v-else-if="tab === 'openers'" />
    </main>
  </div>
</template>
