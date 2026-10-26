import { allShapes, centerCell, isInOwnHalf, isInsideBoard, isSameCell } from './board'
import { PlacementRejectedError } from './errors'
import { cloneState, recordEvent } from './events'
import { defaultRules } from './rules'
import type { MatchSettings, MatchState, Piece, PiecePlacement, Rules, Shape, Team } from './types'

export const pieceIdFor = (team: Team, shape: Shape): string => `${team}-${shape}`

export const createMatch = (settings: MatchSettings, startingTeam: Team = 'teal', rules: Rules = defaultRules): MatchState => ({
  rules: structuredClone(rules),
  settings: { ...settings },
  phase: 'placement',
  pieces: [],
  kickoffPieces: [],
  placedTeams: [],
  ball: { cell: centerCell(rules), holderId: null },
  tackleProtectedTurn: null,
  score: { teal: 0, orange: 0 },
  startingTeam,
  activeTeam: startingTeam,
  actionsLeft: settings.actionsPerTurn,
  turnNumber: 1,
  result: null,
  events: [],
  nextEventId: 1,
})

export const findPlacementError = (
  rules: Rules,
  team: Team,
  placements: readonly PiecePlacement[],
): PlacementRejectedError | null => {
  const shapes = placements.map((placement) => placement.shape)
  const hasEveryShapeOnce = placements.length === allShapes.length && allShapes.every((shape) => shapes.includes(shape))
  if (!hasEveryShapeOnce) {
    return new PlacementRejectedError('wrongPieceSet')
  }
  const isEveryCellInOwnHalf = placements.every(
    (placement) => isInsideBoard(rules, placement.cell) && isInOwnHalf(rules, team, placement.cell),
  )
  if (!isEveryCellInOwnHalf) {
    return new PlacementRejectedError('outsideOwnHalf')
  }
  const isAnyCellShared = placements.some((placement, index) =>
    placements.slice(index + 1).some((other) => isSameCell(other.cell, placement.cell)),
  )
  if (isAnyCellShared) {
    return new PlacementRejectedError('sharedCell')
  }
  return null
}

export const placeTeam = (state: MatchState, team: Team, placements: readonly PiecePlacement[]): MatchState => {
  if (state.phase !== 'placement') {
    throw new PlacementRejectedError('notPlacementPhase')
  }
  if (state.placedTeams.includes(team)) {
    throw new PlacementRejectedError('alreadyPlaced')
  }
  const placementError = findPlacementError(state.rules, team, placements)
  if (placementError) {
    throw placementError
  }
  const draft = cloneState(state)
  const pieces: Piece[] = placements.map((placement) => ({
    id: pieceIdFor(team, placement.shape),
    team,
    shape: placement.shape,
    cell: { ...placement.cell },
    facing: placement.facing,
  }))
  draft.pieces.push(...pieces)
  draft.kickoffPieces.push(...structuredClone(pieces))
  draft.placedTeams.push(team)
  recordEvent(draft, 'all', { type: 'placed', team })
  if (draft.placedTeams.length === 2) {
    draft.phase = 'playing'
  }
  return draft
}
