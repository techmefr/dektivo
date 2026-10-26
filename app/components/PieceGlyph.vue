<script setup lang="ts">
import type { Cell, Facing, Shape, Team } from '#shared/game'

const props = withDefaults(
  defineProps<{
    shape: Shape
    team: Team
    facing: Facing
    cell: Cell
    isGhost?: boolean
    isSelected?: boolean
  }>(),
  { isGhost: false, isSelected: false },
)

const outlines: Record<Shape, string> = {
  square: 'M-3.4 -3.4 H3.4 V3.4 H-3.4 Z',
  triangle: 'M4.2 0 L-3.4 -3.9 L-3.4 3.9 Z',
  diamond: 'M4.2 0 L0 -4.2 L-4.2 0 L0 4.2 Z',
}

const placement = computed(() => {
  const center = cellCenter(props.cell)
  return `translate(${center.x}px, ${center.y}px) rotate(${facingAngles[props.facing]}deg)`
})
</script>

<template>
  <g
    class="piece"
    :class="[`piece--${props.team}`, { 'piece--ghost': props.isGhost, 'piece--selected': props.isSelected }]"
    :style="{ transform: placement }"
    aria-hidden="true"
  >
    <circle v-if="props.isSelected" class="piece__halo" r="5.2" />
    <path
      class="piece__body"
      :d="outlines[props.shape]"
      stroke-linejoin="round"
      :filter="props.isGhost ? undefined : 'url(#piece-shadow)'"
    />
    <path class="piece__nose" d="M1.2 -1.4 L3 0 L1.2 1.4" />
  </g>
</template>

<style scoped>
.piece {
  transition: transform 0.25s ease;
  pointer-events: none;
}

.piece__body {
  stroke: #fff;
  stroke-width: 0.7;
}

.piece--teal .piece__body {
  fill: var(--team-teal);
}

.piece--orange .piece__body {
  fill: var(--team-orange);
}

.piece__nose {
  fill: none;
  stroke: #fff;
  stroke-width: 0.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.piece--ghost .piece__body {
  fill-opacity: 0.6;
  stroke-dasharray: 1.2 0.8;
}

.piece--ghost .piece__nose {
  opacity: 0.7;
}

.piece__halo {
  fill: rgba(255, 210, 63, 0.25);
  stroke: var(--highlight);
  stroke-width: 0.6;
  animation: halo-pulse 1s ease-in-out infinite alternate;
}

@keyframes halo-pulse {
  from {
    opacity: 0.55;
  }
  to {
    opacity: 1;
  }
}
</style>
