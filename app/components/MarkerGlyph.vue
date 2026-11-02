<script setup lang="ts">
import type { Marker, Team } from '#shared/game'

const props = defineProps<{ marker: Marker; team: Team }>()

const unknownOrigin = computed(() => ({
  x: props.marker.cell.x * cellSize + 1,
  y: props.marker.cell.y * cellSize + 1,
}))
</script>

<template>
  <g v-if="props.marker.kind === 'unknown'" class="marker-unknown" :class="`marker-unknown--${props.team}`" aria-hidden="true">
    <rect :x="unknownOrigin.x" :y="unknownOrigin.y" :width="cellSize - 2" :height="cellSize - 2" rx="1.5" />
    <text :x="unknownOrigin.x + (cellSize - 2) / 2" :y="unknownOrigin.y + (cellSize - 2) / 2 + 2.2">?</text>
  </g>
  <PieceGlyph
    v-else
    :shape="props.marker.kind"
    :team="props.team"
    :facing="props.marker.facing"
    :cell="props.marker.cell"
    is-ghost
  />
</template>

<style scoped>
.marker-unknown {
  pointer-events: none;
}

.marker-unknown rect {
  fill-opacity: 0.6;
  stroke-width: 0.5;
  stroke-dasharray: 1.2 0.8;
  stroke: #fff;
}

.marker-unknown--orange rect {
  fill: var(--team-orange);
}

.marker-unknown--teal rect {
  fill: var(--team-teal);
}

.marker-unknown text {
  fill: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 6px;
  text-anchor: middle;
}
</style>
