<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import Popover from 'primevue/popover'; import ToggleSwitch from 'primevue/toggleswitch'; import SelectButton from 'primevue/selectbutton'
import { Settings, Languages, Sun, Moon, Swords, Wind, BookOpen } from 'lucide-vue-next'
import UiButton from './ui/UiButton.vue'
import { isDark } from '../lib/theme'
import { lang, setLang, type Lang } from '../lib/lang'
import { ANSWERS_HELP, ALLOWED_HELP, ANSWERS_LABEL, ALLOWED_LABEL } from '../lib/labels'
const op = ref()
const hard = useLocalStorage('wl-hard', false), reduce = useLocalStorage('wl-reduce-motion', false)
watchEffect(() => document.documentElement.classList.toggle('reduce-motion', reduce.value))
const langs = [{ v: 'en', l: 'EN' }, { v: 'ua', l: 'UA' }]
const theme = ref(isDark.value ? 'dark' : 'light'); watchEffect(() => (isDark.value = theme.value === 'dark'))
const pickLang = (v: Lang) => v !== lang && setLang(v)
</script>
<template>
  <UiButton variant="secondary" :icon="Settings" :ariaLabel="$t('Settings')" v-tooltip.bottom="$t('Settings')" @click="op.toggle($event)" data-settings />
  <Popover ref="op">
    <div class="w-80 max-w-[85vw] flex flex-col gap-4 text-body" data-settings-panel>
      <div class="font-semibold flex items-center gap-2"><Settings :size="16" class="text-brand" />{{ $t('Settings') }}</div>
      <div class="flex items-center justify-between gap-3"><span class="flex items-center gap-2"><Languages :size="16" class="text-muted" />{{ $t('Word list language') }}</span>
        <SelectButton :modelValue="lang" :options="langs" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" @update:modelValue="pickLang" data-lang /></div>
      <label class="flex items-center justify-between gap-3 cursor-pointer"><span class="flex items-center gap-2"><Swords :size="16" class="text-muted" /><span>{{ $t('Hard mode') }}<span class="block text-caption text-muted">{{ $t('Revealed hints must be used') }}</span></span></span><ToggleSwitch v-model="hard" data-hard /></label>
      <div class="flex items-center justify-between gap-3"><span class="flex items-center gap-2"><component :is="isDark ? Moon : Sun" :size="16" class="text-muted" />{{ $t('Theme') }}</span>
        <SelectButton v-model="theme" :options="[{ v: 'light', l: $t('light') }, { v: 'dark', l: $t('dark') }]" optionLabel="l" optionValue="v" :allowEmpty="false" size="small" /></div>
      <label class="flex items-center justify-between gap-3 cursor-pointer"><span class="flex items-center gap-2"><Wind :size="16" class="text-muted" /><span>{{ $t('Reduce animations') }}<span class="block text-caption text-muted">{{ $t('No flips, confetti or bounces') }}</span></span></span><ToggleSwitch v-model="reduce" /></label>
      <details class="text-caption text-muted border-t border-line pt-3"><summary class="flex items-center gap-2 text-body text-fg"><BookOpen :size="16" class="text-muted" />{{ $t('About the word lists') }}</summary>
        <p class="mt-2"><b class="text-fg">{{ ANSWERS_LABEL }}</b> — {{ ANSWERS_HELP }}</p><p class="mt-2"><b class="text-fg">{{ ALLOWED_LABEL }}</b> — {{ ALLOWED_HELP }}</p></details>
    </div>
  </Popover>
</template>
