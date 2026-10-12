<script setup lang="ts">
import { ref } from 'vue'
import Tabs from 'primevue/tabs'; import TabList from 'primevue/tablist'; import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'; import TabPanel from 'primevue/tabpanel'
import { ready } from './lib/words'
import PlayView from './components/PlayView.vue'
import AssistantView from './components/AssistantView.vue'
import SimView from './components/SimView.vue'
import LettersView from './components/LettersView.vue'
import OpenersView from './components/OpenersView.vue'
const loaded = ref(false); ready.then(() => (loaded.value = true))
const tab = ref('play')
</script>
<template>
  <div class="max-w-6xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-1">Wordle Lab</h1>
    <p class="text-zinc-400 mb-4 text-sm">Play Wordle, compare solvers (Ruslan's letter-frequency recount vs entropy vs minimax), and explore the information theory.</p>
    <div v-if="!loaded">Loading dictionaries…</div>
    <Tabs v-else v-model:value="tab">
      <TabList><Tab value="play">Play</Tab><Tab value="assist">Solver assistant</Tab><Tab value="sim">Simulation</Tab><Tab value="letters">Letter frequency</Tab><Tab value="openers">Openers & entropy</Tab></TabList>
      <TabPanels>
        <TabPanel value="play"><PlayView /></TabPanel>
        <TabPanel value="assist"><AssistantView /></TabPanel>
        <TabPanel value="sim"><SimView /></TabPanel>
        <TabPanel value="letters"><LettersView /></TabPanel>
        <TabPanel value="openers"><OpenersView /></TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
