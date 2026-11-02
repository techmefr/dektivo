<script setup lang="ts">
import { allShapes, chooseAiPlacement, defaultFormation, findPlacementError, isInOwnHalf, isSameCell, rotateFacing } from '#shared/game'
import type { Cell, PiecePlacement, RotationSide, Shape } from '#shared/game'

const store = useMatchStore()
const { t } = useI18n()

const rules = computed(() => store.match?.rules)
const team = computed(() => store.humanTeam)
const placements = ref<PiecePlacement[]>(rules.value ? defaultFormation(rules.value, team.value) : [])
const selectedShape = ref<Shape | null>('square')

const ownHalfCells = computed<Cell[]>(() => {
  const currentRules = rules.value
  if (!currentRules) {
    return []
  }
  return Array.from({ length: currentRules.boardLength * currentRules.boardWidth }, (_, index) => ({
    x: index % currentRules.boardLength,
    y: Math.floor(index / currentRules.boardLength),
  })).filter((cell) => isInOwnHalf(currentRules, team.value, cell))
})

const isValid = computed(() => !!rules.value && findPlacementError(rules.value, team.value, placements.value) === null)

const placementAt = (cell: Cell) => placements.value.find((placement) => isSameCell(placement.cell, cell))

const onCellClick = (cell: Cell) => {
  const existing = placementAt(cell)
  if (existing) {
    selectedShape.value = existing.shape
    return
  }
  if (!selectedShape.value) {
    return
  }
  placements.value = placements.value.map((placement) =>
    placement.shape === selectedShape.value ? { ...placement, cell } : placement,
  )
}

const rotateSelected = (side: RotationSide) => {
  placements.value = placements.value.map((placement) =>
    placement.shape === selectedShape.value ? { ...placement, facing: rotateFacing(placement.facing, side) } : placement,
  )
}

const shuffleFormation = () => {
  if (rules.value) {
    placements.value = chooseAiPlacement(rules.value, team.value, Math.random)
  }
}

const cellButtonLabel = (cell: Cell) => {
  const placement = placementAt(cell)
  if (!placement) {
    return t('actions.moveTo', { cell: cellLabel(cell) })
  }
  return t('board.ownPiece', { shape: t(`shapes.${placement.shape}`), facing: t(`directions.${placement.facing}`) })
}

const boardLabel = computed(() =>
  t('board.label', { length: rules.value?.boardLength ?? 0, width: rules.value?.boardWidth ?? 0 }),
)
</script>

<template>
  <section class="placement">
    <header class="placement__header">
      <h1 class="title-display placement__title">{{ t('placement.title') }}</h1>
      <p class="placement__hint">{{ t('placement.hint') }}</p>
    </header>

    <div class="placement__board">
      <PitchSvg :label="boardLabel">
        <rect
          v-for="cell in ownHalfCells"
          :key="`${cell.x}:${cell.y}`"
          class="own-cell"
          :x="cell.x * cellSize + 0.4"
          :y="cell.y * cellSize + 0.4"
          :width="cellSize - 0.8"
          :height="cellSize - 0.8"
          rx="1"
        />
        <PieceGlyph
          v-for="placement in placements"
          :key="placement.shape"
          :shape="placement.shape"
          :team="team"
          :facing="placement.facing"
          :cell="placement.cell"
          :is-selected="placement.shape === selectedShape"
        />
        <BallGlyph v-if="store.match" :cell="store.match.ball.cell" possession="free" />
      </PitchSvg>
      <div class="placement__overlay">
        <button
          v-for="cell in ownHalfCells"
          :key="`button-${cell.x}:${cell.y}`"
          type="button"
          class="placement__cell"
          :style="cellPercentPosition(cell)"
          :aria-label="cellButtonLabel(cell)"
          @click="onCellClick(cell)"
        />
      </div>
    </div>

    <div class="placement__toolbar panel">
      <div class="placement__shapes" role="radiogroup" :aria-label="t('placement.title')">
        <button
          v-for="shape in allShapes"
          :key="shape"
          type="button"
          role="radio"
          class="shape-chip"
          :aria-checked="selectedShape === shape"
          @click="selectedShape = shape"
        >
          <ActionIcon :name="shape" :size="18" />
          {{ t(`shapes.${shape}`) }}
        </button>
      </div>
      <div class="placement__rotate">
        <button type="button" class="icon-button" :aria-label="t('actions.rotateLeft')" :disabled="!selectedShape" @click="rotateSelected('left')">
          <ActionIcon name="rotateLeft" :size="20" />
        </button>
        <button type="button" class="icon-button" :aria-label="t('actions.rotateRight')" :disabled="!selectedShape" @click="rotateSelected('right')">
          <ActionIcon name="rotateRight" :size="20" />
        </button>
      </div>
      <button type="button" class="arcade-button arcade-button--ghost" @click="shuffleFormation">{{ t('placement.shuffle') }}</button>
      <button type="button" class="arcade-button" :disabled="!isValid" @click="store.confirmPlacement(placements)">
        {{ t('placement.confirm') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.placement {
  display: grid;
  grid-template-areas: 'header' 'board' 'toolbar';
  grid-template-rows: auto minmax(0, 1fr) auto;
  justify-items: center;
  gap: 10px;
  height: 100%;
  padding: 8px 12px 12px;
}

.placement__header {
  grid-area: header;
  text-align: center;
}

.placement__title {
  font-size: clamp(1.2rem, 4vmin, 1.8rem);
}

.placement__hint {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.placement__board {
  grid-area: board;
  position: relative;
  height: 100%;
  min-height: 0;
  aspect-ratio: 122 / 98;
  max-width: 100%;
}

.own-cell {
  fill: rgba(255, 255, 255, 0.1);
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 0.3;
  stroke-dasharray: 1 1;
}

.placement__overlay {
  position: absolute;
  inset: 0;
}

.placement__cell {
  position: absolute;
  width: 8.2%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 20%;
  background: transparent;
  cursor: pointer;
}

.placement__cell:hover {
  background: rgba(255, 210, 63, 0.18);
}

.placement__toolbar {
  grid-area: toolbar;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
}

.placement__shapes,
.placement__rotate {
  display: flex;
  gap: 6px;
}

.shape-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.1);
  font-weight: 800;
  cursor: pointer;
}

.shape-chip[aria-checked='true'] {
  background: var(--highlight);
  color: #2b1a00;
}

@media (orientation: landscape) and (max-height: 560px) {
  .placement {
    grid-template-areas: 'board header' 'board toolbar';
    grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
    grid-template-rows: auto minmax(0, 1fr);
    align-items: start;
  }

  .placement__hint {
    font-size: 0.75rem;
  }

  .placement__toolbar {
    align-content: flex-start;
  }

  .placement__shapes {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
