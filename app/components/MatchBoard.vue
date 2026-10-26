<script setup lang="ts">
import { allShapes, directionVectors, getPieceOptions, isSameCell, markerAt } from '#shared/game'
import type { Cell, Direction, KickKind, MarkerKind } from '#shared/game'
import type { RadialMenuItem, ScreenPoint } from '~/utils/radial-menu'

type Interaction =
  | { mode: 'idle' }
  | { mode: 'pieceMenu'; pieceId: string; anchor: ScreenPoint }
  | { mode: 'chooseMove'; pieceId: string }
  | { mode: 'chooseKick'; pieceId: string; kick: KickKind }
  | { mode: 'markerMenu'; cell: Cell; anchor: ScreenPoint }

const markerKinds: readonly MarkerKind[] = [...allShapes, 'unknown']

const store = useMatchStore()
const { t } = useI18n()
const boardElement = useTemplateRef<HTMLElement>('boardElement')
const interaction = shallowRef<Interaction>({ mode: 'idle' })

const view = computed(() => store.displayedView)
const rules = computed(() => view.value?.rules)
const cells = computed<Cell[]>(() => {
  const currentRules = rules.value
  if (!currentRules) {
    return []
  }
  return Array.from({ length: currentRules.boardLength * currentRules.boardWidth }, (_, index) => ({
    x: index % currentRules.boardLength,
    y: Math.floor(index / currentRules.boardLength),
  }))
})

const displayedBallCell = computed(() => store.ballOverride ?? view.value?.ball.cell ?? null)
const displayedPossession = computed(() => (store.ballOverride ? 'free' : (view.value?.ball.possession ?? 'free')))

const activePieceId = computed(() => (interaction.value.mode === 'idle' || interaction.value.mode === 'markerMenu' ? null : interaction.value.pieceId))
const activePiece = computed(() => view.value?.ownPieces.find((piece) => piece.id === activePieceId.value) ?? null)
const activeOptions = computed(() =>
  view.value && activePieceId.value ? getPieceOptions(view.value, activePieceId.value) : null,
)

const moveTargets = computed(() => (interaction.value.mode === 'chooseMove' ? (activeOptions.value?.moveTargets ?? []) : []))
const kickDirections = computed<Direction[]>(() => {
  if (interaction.value.mode !== 'chooseKick' || !activeOptions.value) {
    return []
  }
  return interaction.value.kick === 'pass' ? activeOptions.value.passDirections : activeOptions.value.shootDirections
})

const helperText = computed(() => {
  if (interaction.value.mode === 'chooseMove') {
    return t('hud.chooseMove')
  }
  if (interaction.value.mode === 'chooseKick') {
    return t('hud.chooseDirection')
  }
  return ''
})

const closeInteraction = () => {
  interaction.value = { mode: 'idle' }
}

watch(
  () => store.isHumanTurn,
  (isHumanTurn) => {
    if (!isHumanTurn && interaction.value.mode !== 'markerMenu') {
      closeInteraction()
    }
  },
)

const anchorForCell = (cell: Cell): ScreenPoint => {
  const bounds = boardElement.value?.getBoundingClientRect()
  if (!bounds) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  }
  const center = cellCenter(cell)
  return {
    x: bounds.left + ((center.x - pitchViewBox.x) / pitchViewBox.width) * bounds.width,
    y: bounds.top + ((center.y - pitchViewBox.y) / pitchViewBox.height) * bounds.height,
  }
}

const onCellClick = (cell: Cell) => {
  if (interaction.value.mode === 'chooseMove' || interaction.value.mode === 'chooseKick') {
    closeInteraction()
    return
  }
  const ownPiece = view.value?.ownPieces.find((piece) => isSameCell(piece.cell, cell))
  if (ownPiece) {
    if (store.isHumanTurn) {
      interaction.value = { mode: 'pieceMenu', pieceId: ownPiece.id, anchor: anchorForCell(cell) }
    }
    return
  }
  interaction.value = { mode: 'markerMenu', cell, anchor: anchorForCell(cell) }
}

const pieceMenuItems = computed<RadialMenuItem[]>(() => {
  const options = activeOptions.value
  return [
    { id: 'move', label: t('actions.move'), icon: 'move', isDisabled: !options?.moveTargets.length },
    { id: 'rotateRight', label: t('actions.rotateRight'), icon: 'rotateRight', isDisabled: !options?.canRotate },
    { id: 'shoot', label: t('actions.shoot'), icon: 'shoot', isDisabled: !options?.shootDirections.length },
    { id: 'pass', label: t('actions.pass'), icon: 'pass', isDisabled: !options?.passDirections.length },
    { id: 'rotateLeft', label: t('actions.rotateLeft'), icon: 'rotateLeft', isDisabled: !options?.canRotate },
  ]
})

const onPieceMenuSelect = (itemId: string) => {
  if (interaction.value.mode !== 'pieceMenu') {
    return
  }
  const pieceId = interaction.value.pieceId
  if (itemId === 'move') {
    interaction.value = { mode: 'chooseMove', pieceId }
    return
  }
  if (itemId === 'pass' || itemId === 'shoot') {
    interaction.value = { mode: 'chooseKick', pieceId, kick: itemId }
    return
  }
  closeInteraction()
  void store.play({ kind: 'rotate', pieceId, side: itemId === 'rotateLeft' ? 'left' : 'right' })
}

const playMove = (to: Cell) => {
  if (interaction.value.mode !== 'chooseMove') {
    return
  }
  const pieceId = interaction.value.pieceId
  closeInteraction()
  void store.play({ kind: 'move', pieceId, to })
}

const playKick = (direction: Direction) => {
  if (interaction.value.mode !== 'chooseKick') {
    return
  }
  const { pieceId, kick } = interaction.value
  closeInteraction()
  void store.play({ kind: kick, pieceId, direction })
}

const markerMenuCell = computed(() => (interaction.value.mode === 'markerMenu' ? interaction.value.cell : null))
const markerOnMenuCell = computed(() => (markerMenuCell.value ? markerAt(store.markers, markerMenuCell.value) : undefined))

const markerMenuItems = computed<RadialMenuItem[]>(() => {
  const items: RadialMenuItem[] = markerKinds.map((kind) => ({ id: kind, label: t(`shapes.${kind}`), icon: kind }))
  if (markerOnMenuCell.value && markerOnMenuCell.value.kind !== 'unknown') {
    items.push({ id: 'rotate', label: t('markers.rotate'), icon: 'rotate' })
  }
  if (markerOnMenuCell.value) {
    items.push({ id: 'remove', label: t('markers.remove'), icon: 'remove' })
  }
  return items
})

const onMarkerMenuSelect = (itemId: string) => {
  const cell = markerMenuCell.value
  if (!cell) {
    return
  }
  if (itemId === 'remove') {
    store.clearMarker(cell)
    closeInteraction()
    return
  }
  if (itemId === 'rotate') {
    store.turnMarker(cell, 'right')
    return
  }
  const kind = markerKinds.find((candidate) => candidate === itemId)
  if (kind) {
    store.setMarker(cell, kind)
  }
  closeInteraction()
}

const kickButtonStyle = (direction: Direction) => {
  const piece = activePiece.value
  if (!piece) {
    return {}
  }
  const vector = directionVectors[direction]
  const center = cellCenter(piece.cell)
  return {
    left: `${((center.x + vector.dx * cellSize - pitchViewBox.x) / pitchViewBox.width) * 100}%`,
    top: `${((center.y + vector.dy * cellSize - pitchViewBox.y) / pitchViewBox.height) * 100}%`,
    '--arrow-angle': `${directionAngles[direction]}deg`,
  }
}

const pieceLabel = (pieceId: string) => {
  const piece = view.value?.ownPieces.find((ownPiece) => ownPiece.id === pieceId)
  if (!piece) {
    return ''
  }
  const parameters = { shape: t(`shapes.${piece.shape}`), facing: t(`directions.${piece.facing}`) }
  return view.value?.ball.holderId === piece.id ? t('board.ownPieceWithBall', parameters) : t('board.ownPiece', parameters)
}

const boardLabel = computed(() =>
  t('board.label', { length: rules.value?.boardLength ?? 0, width: rules.value?.boardWidth ?? 0 }),
)

const ballLabel = computed(() => {
  if (!view.value || view.value.ball.possession === 'own') {
    return ''
  }
  const cell = cellLabel(view.value.ball.cell)
  return view.value.ball.possession === 'opponent' ? t('board.ballOpponent', { cell }) : t('board.ballFree', { cell })
})
</script>

<template>
  <div v-if="view" ref="boardElement" class="match-board">
    <PitchSvg :label="boardLabel">
      <rect
        v-for="cell in cells"
        :key="`${cell.x}:${cell.y}`"
        class="cell-hit"
        :x="cell.x * cellSize"
        :y="cell.y * cellSize"
        :width="cellSize"
        :height="cellSize"
        @click="onCellClick(cell)"
      />
      <rect
        v-for="target in moveTargets"
        :key="`target-${target.x}:${target.y}`"
        class="cell-target"
        :x="target.x * cellSize + 0.8"
        :y="target.y * cellSize + 0.8"
        :width="cellSize - 1.6"
        :height="cellSize - 1.6"
        rx="1.6"
      />
      <MarkerGlyph
        v-for="marker in store.markers"
        :key="`marker-${marker.cell.x}:${marker.cell.y}`"
        :marker="marker"
        :team="store.aiTeam"
      />
      <PieceGlyph
        v-for="piece in view.ownPieces"
        :key="piece.id"
        :shape="piece.shape"
        :team="piece.team"
        :facing="piece.facing"
        :cell="piece.cell"
        :is-selected="piece.id === activePieceId"
      />
      <BallGlyph v-if="displayedBallCell" :cell="displayedBallCell" :possession="displayedPossession" />
    </PitchSvg>

    <div class="board-overlay">
      <button
        v-for="piece in view.ownPieces"
        :key="`button-${piece.id}`"
        type="button"
        class="cell-button"
        :style="cellPercentPosition(piece.cell)"
        :aria-label="pieceLabel(piece.id)"
        :aria-disabled="!store.isHumanTurn"
        @click="onCellClick(piece.cell)"
      />
      <button
        v-for="target in moveTargets"
        :key="`move-${target.x}:${target.y}`"
        type="button"
        class="cell-button cell-button--target"
        :style="cellPercentPosition(target)"
        :aria-label="t('actions.moveTo', { cell: cellLabel(target) })"
        @click="playMove(target)"
      />
      <button
        v-for="direction in kickDirections"
        :key="`kick-${direction}`"
        type="button"
        class="kick-button"
        :class="{ 'kick-button--shoot': interaction.mode === 'chooseKick' && interaction.kick === 'shoot' }"
        :style="kickButtonStyle(direction)"
        :aria-label="
          t('actions.kickToward', {
            kick: t(interaction.mode === 'chooseKick' && interaction.kick === 'shoot' ? 'actions.shoot' : 'actions.pass'),
            direction: t(`directions.${direction}`),
          })
        "
        @click="playKick(direction)"
      >
        <ActionIcon name="arrow" :size="20" />
      </button>
      <p v-if="helperText" class="board-helper" aria-live="polite">
        {{ helperText }}
        <button type="button" class="board-helper__cancel" @click="closeInteraction">{{ t('actions.cancel') }}</button>
      </p>
      <p v-if="ballLabel" class="visually-hidden" aria-live="polite">{{ ballLabel }}</p>
    </div>

    <RadialMenu
      v-if="interaction.mode === 'pieceMenu'"
      :anchor="interaction.anchor"
      :items="pieceMenuItems"
      :label="pieceLabel(interaction.pieceId)"
      @select="onPieceMenuSelect"
      @close="closeInteraction"
    />
    <RadialMenu
      v-if="interaction.mode === 'markerMenu'"
      :anchor="interaction.anchor"
      :items="markerMenuItems"
      :label="t('markers.menuLabel', { cell: cellLabel(interaction.cell) })"
      @select="onMarkerMenuSelect"
      @close="closeInteraction"
    />
  </div>
</template>

<style scoped>
.match-board {
  position: relative;
  width: 100%;
  aspect-ratio: 122 / 98;
}

.cell-hit {
  fill: transparent;
  cursor: pointer;
}

.cell-hit:hover {
  fill: rgba(255, 255, 255, 0.12);
}

.cell-target {
  fill: rgba(255, 210, 63, 0.3);
  stroke: var(--highlight);
  stroke-width: 0.6;
  pointer-events: none;
  animation: target-pulse 0.8s ease-in-out infinite alternate;
}

@keyframes target-pulse {
  from {
    fill-opacity: 0.25;
  }
  to {
    fill-opacity: 0.6;
  }
}

.board-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cell-button {
  position: absolute;
  width: 8.2%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 20%;
  background: transparent;
  pointer-events: auto;
  cursor: pointer;
}

.cell-button--target:hover {
  background: rgba(255, 210, 63, 0.25);
}

.kick-button {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(32px, 7.4%, 48px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffffff, #dfe9e6);
  color: #0f2b2e;
  box-shadow: var(--shadow-pop);
  pointer-events: auto;
  cursor: pointer;
  animation: kick-pop 0.18s ease-out both;
}

.kick-button :deep(svg) {
  transform: rotate(var(--arrow-angle));
}

.kick-button--shoot {
  background: linear-gradient(180deg, #ffe066, #ff8a1f);
}

.kick-button:hover {
  filter: brightness(1.1);
}

@keyframes kick-pop {
  from {
    opacity: 0;
    scale: 0.4;
  }
}

.board-helper {
  position: fixed;
  z-index: 20;
  left: 50%;
  bottom: max(10px, env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 6px 8px 6px 16px;
  transform: translateX(-50%);
  border-radius: var(--radius-pill);
  background: var(--panel);
  font-weight: 800;
  white-space: nowrap;
  pointer-events: auto;
}

.board-helper__cancel {
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.16);
  font-weight: 700;
  cursor: pointer;
}
</style>
