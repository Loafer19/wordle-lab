<script setup lang="ts">
// Clickable word → popover with its meaning.
import { ref } from 'vue'
import Popover from 'primevue/popover'
import WordMeaning from './WordMeaning.vue'
const props = defineProps<{ word: string }>()
const op = ref(), shown = ref(false)
const toggle = (e: Event) => { shown.value = true; op.value.toggle(e) }
void props
</script>
<template>
  <button type="button" class="word-link" :title="`What does ${word.toUpperCase()} mean?`" @click.stop="toggle"><slot>{{ word.toUpperCase() }}</slot></button>
  <Popover ref="op"><WordMeaning v-if="shown" :word="word" compact /></Popover>
</template>
<style scoped>
.word-link { font: inherit; color: inherit; cursor: help; text-decoration: underline dotted; text-underline-offset: 3px; text-decoration-color: color-mix(in oklab, currentColor 40%, transparent); }
.word-link:hover { color: var(--color-brand); }
</style>
