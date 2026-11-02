<script setup lang="ts">
import { defaultRules, goalRows } from '#shared/game'

const props = defineProps<{ label: string }>()

const length = defaultRules.boardLength
const width = defaultRules.boardWidth
const rows = goalRows(defaultRules)
const goalTop = rows.first * cellSize
const goalHeight = defaultRules.goalWidth * cellSize
const pitchWidth = length * cellSize
const pitchHeight = width * cellSize
const viewBox = `${pitchViewBox.x} ${pitchViewBox.y} ${pitchViewBox.width} ${pitchViewBox.height}`
const columns = Array.from({ length }, (_, column) => column)
const penaltyDepth = 2 * cellSize
const penaltyTop = Math.max(0, goalTop - cellSize)
const penaltyHeight = Math.min(pitchHeight, goalHeight + 2 * cellSize)
</script>

<template>
  <svg class="pitch" :viewBox="viewBox" role="img" :aria-label="props.label" preserveAspectRatio="xMidYMid meet">
    <defs>
      <pattern id="crowd" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="var(--stand)" />
        <circle cx="1" cy="1" r="0.9" fill="#ef6f6c" />
        <circle cx="3" cy="3" r="0.9" fill="#f7d06b" />
        <circle cx="3" cy="1" r="0.7" fill="#7cc6fe" />
        <circle cx="1" cy="3" r="0.7" fill="#c3f0ca" />
      </pattern>
      <pattern id="net" width="1.6" height="1.6" patternUnits="userSpaceOnUse">
        <path d="M0 0L1.6 1.6M1.6 0L0 1.6" stroke="rgba(255,255,255,0.55)" stroke-width="0.18" />
      </pattern>
      <filter id="piece-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0.4" dy="0.8" stdDeviation="0.5" flood-color="#000" flood-opacity="0.45" />
      </filter>
    </defs>

    <rect
      :x="pitchViewBox.x"
      :y="pitchViewBox.y"
      :width="pitchViewBox.width"
      :height="pitchViewBox.height"
      rx="6"
      fill="url(#crowd)"
    />
    <rect x="-10" y="-8" :width="pitchWidth + 20" :height="pitchHeight + 16" rx="2" fill="var(--stand-edge)" />
    <rect x="-8.5" y="-6.5" :width="pitchWidth + 17" :height="pitchHeight + 13" fill="var(--grass-apron)" />

    <rect
      v-for="column in columns"
      :key="column"
      :x="column * cellSize"
      y="0"
      :width="cellSize"
      :height="pitchHeight"
      :fill="column % 2 === 0 ? 'var(--grass-light)' : 'var(--grass-dark)'"
    />

    <g fill="none" stroke="var(--pitch-line)" stroke-width="0.5">
      <rect x="0" y="0" :width="pitchWidth" :height="pitchHeight" />
      <line :x1="pitchWidth / 2" y1="0" :x2="pitchWidth / 2" :y2="pitchHeight" />
      <circle :cx="pitchWidth / 2" :cy="pitchHeight / 2" r="8" />
      <rect x="0" :y="penaltyTop" :width="penaltyDepth" :height="penaltyHeight" />
      <rect :x="pitchWidth - penaltyDepth" :y="penaltyTop" :width="penaltyDepth" :height="penaltyHeight" />
    </g>
    <g stroke="rgba(0,0,0,0.08)" stroke-width="0.15">
      <line v-for="row in width - 1" :key="`row-${row}`" x1="0" :y1="row * cellSize" :x2="pitchWidth" :y2="row * cellSize" />
      <line v-for="column in length - 1" :key="`column-${column}`" :x1="column * cellSize" y1="0" :x2="column * cellSize" :y2="pitchHeight" />
    </g>

    <g>
      <rect x="-6" :y="goalTop" width="6" :height="goalHeight" fill="url(#net)" stroke="#fff" stroke-width="0.6" />
      <rect :x="pitchWidth" :y="goalTop" width="6" :height="goalHeight" fill="url(#net)" stroke="#fff" stroke-width="0.6" />
      <rect x="-1" :y="goalTop" width="1" :height="goalHeight" fill="var(--team-teal)" opacity="0.6" />
      <rect :x="pitchWidth" :y="goalTop" width="1" :height="goalHeight" fill="var(--team-orange)" opacity="0.6" />
    </g>

    <slot />
  </svg>
</template>

<style scoped>
.pitch {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  touch-action: manipulation;
}
</style>
