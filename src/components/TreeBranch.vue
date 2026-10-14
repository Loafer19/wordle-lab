<script setup lang="ts">
// Accordion drill-down of a decision tree (phone fallback for the ECharts tree): tap a branch to open its children.
import { ref, computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import type { TreeNode } from '../lib/advanced'
import PatternSquares from './PatternSquares.vue'
defineOptions({ name: 'TreeBranch' })
const p = withDefaults(defineProps<{ node: TreeNode; pattern?: number | null; depth?: number; open?: boolean }>(), { pattern: null, depth: 0, open: false })
const isOpen = ref(p.open), limit = ref(20)
const kids = computed(() => Object.entries(p.node.c ?? {}).map(([k, v]) => ({ k: +k, v })).sort((a, b) => b.v.n - a.v.n))
</script>
<template>
  <li class="min-w-0" data-tree-branch>
    <button type="button" class="w-full flex items-center gap-2 py-1.5 px-1 rounded-lg text-left hover:bg-surface-2 transition-colors" :class="kids.length ? 'cursor-pointer' : 'cursor-default'" :aria-expanded="kids.length ? isOpen : undefined" @click="kids.length && (isOpen = !isOpen)">
      <ChevronRight v-if="kids.length" :size="14" class="shrink-0 transition-transform duration-200" :class="isOpen && 'rotate-90'" /><span v-else class="w-3.5 shrink-0"></span>
      <PatternSquares v-if="pattern !== null" :p="pattern" :size="10" />
      <b class="font-mono uppercase">{{ node.g }}</b>
      <span class="text-caption text-muted ml-auto tabular-nums">{{ $t('{n} answers', { n: node.n }) }}</span>
    </button>
    <ul v-if="isOpen && kids.length" class="pl-3 ml-2 border-l border-line">
      <TreeBranch v-for="c in kids.slice(0, limit)" :key="c.k" :node="c.v" :pattern="c.k" :depth="depth + 1" />
      <li v-if="kids.length > limit"><button type="button" class="text-caption text-brand-700 dark:text-brand-400 py-1 px-1 cursor-pointer hover:underline" @click="limit += 40">{{ $t('+{n} more', { n: kids.length - limit }) }}</button></li>
    </ul>
  </li>
</template>
