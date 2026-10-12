<script setup lang="ts">
// Logo: three tiles. Idle: every few seconds one tile gently flips. Hover: a wave flips all tiles in sequence and cycles colours.
import { ref, onMounted, onUnmounted } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
const reduced = usePreferredReducedMotion()
const idle = ref(-1), hovering = ref(false)
let t: number | undefined
onMounted(() => { t = window.setInterval(() => { if (reduced.value === 'reduce' || hovering.value || document.documentElement.classList.contains('reduce-motion')) return; idle.value = Math.floor(Math.random() * 3); setTimeout(() => (idle.value = -1), 900) }, 6500) })
onUnmounted(() => clearInterval(t))
const tiles = ['bg-correct', 'bg-present', 'bg-absent']
</script>
<template>
  <span class="logo flex gap-0.5 [perspective:200px]" aria-hidden="true" @mouseenter="hovering = true" @mouseleave="hovering = false">
    <span v-for="(c, i) in tiles" :key="i" class="lt size-5 rounded" :class="[c, idle === i && 'idle']" :style="{ '--i': i }"></span>
  </span>
</template>
<style>
.logo .lt { display: inline-block; transform-origin: 50% 50%; box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.18); }
.logo .lt.idle { animation: idle-flip 900ms cubic-bezier(.4, 0, .2, 1); }
a:hover > .logo .lt, a:focus-visible > .logo .lt { animation: wave 900ms cubic-bezier(.34, 1.56, .64, 1) both; animation-delay: calc(var(--i) * 110ms); }
@keyframes idle-flip { 0%, 100% { transform: rotateX(0) } 50% { transform: rotateX(180deg) scale(.92); filter: brightness(1.25) } }
@keyframes wave {
  0% { transform: translateY(0) rotateX(0) }
  30% { transform: translateY(-5px) rotateX(90deg); filter: hue-rotate(60deg) brightness(1.3) }
  60% { transform: translateY(-2px) rotateX(270deg); filter: hue-rotate(-40deg) brightness(1.15) }
  100% { transform: translateY(0) rotateX(360deg) }
}
@media (prefers-reduced-motion: reduce) { .logo .lt, .logo .lt.idle { animation: none !important; } }
</style>
