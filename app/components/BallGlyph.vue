<script setup lang="ts">
import type { BallPossession, Cell } from '#shared/game'

const props = defineProps<{ cell: Cell; possession: BallPossession }>()

const position = computed(() => {
  const center = cellCenter(props.cell)
  const offset = props.possession === 'own' ? 3 : 0
  return `translate(${center.x + offset}px, ${center.y + offset}px)`
})
</script>

<template>
  <g class="ball" :class="`ball--${props.possession}`" :style="{ transform: position }" aria-hidden="true">
    <circle v-if="props.possession === 'opponent'" class="ball__threat" r="4.6" />
    <circle class="ball__body" :r="props.possession === 'own' ? 1.9 : 2.3" />
    <path class="ball__patch" d="M0 -0.9 L0.85 -0.3 L0.55 0.75 L-0.55 0.75 L-0.85 -0.3 Z" />
  </g>
</template>

<style scoped>
.ball {
  transition: transform 0.14s linear;
  pointer-events: none;
}

.ball__body {
  fill: #fff;
  stroke: #1d1d1d;
  stroke-width: 0.35;
  filter: drop-shadow(0 0.6px 0.6px rgba(0, 0, 0, 0.5));
}

.ball__patch {
  fill: #1d1d1d;
}

.ball__threat {
  fill: rgba(232, 139, 66, 0.25);
  stroke: var(--team-orange);
  stroke-width: 0.6;
  stroke-dasharray: 1.4 1;
  animation: threat-spin 4s linear infinite;
}

@keyframes threat-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
