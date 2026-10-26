import { canAct, getPieceOptions, listLegalActions } from '../actions'
import { resolveKick } from '../ball'
import {
  attackFacing,
  attackStepX,
  cellKey,
  centerCell,
  directionVectors,
  goalRows,
  isSameCell,
  manhattanDistance,
  rotationToward,
} from '../board'
import type { Cell, Direction, GameAction, KickKind, Piece, RandomSource, Team } from '../types'
import type { PlayerView } from '../visibility'

export type AiLevel = 'easy' | 'medium'

type AiProfile = {
  randomActionChance: number
  minimumShotChance: number
  keepsGoalkeeper: boolean
  avoidsBlockedCells: boolean
  minimumForwardPassChance: number
}

const profiles: Record<AiLevel, AiProfile> = {
  easy: {
    randomActionChance: 0.2,
    minimumShotChance: 0.01,
    keepsGoalkeeper: false,
    avoidsBlockedCells: false,
    minimumForwardPassChance: 0.5,
  },
  medium: {
    randomActionChance: 0.05,
    minimumShotChance: 0.33,
    keepsGoalkeeper: true,
    avoidsBlockedCells: true,
    minimumForwardPassChance: 0.33,
  },
}

const recentTurnWindow = 2

const pickRandom = <Item>(items: readonly Item[], random: RandomSource): Item | null =>
  items[Math.floor(random() * items.length)] ?? null

const opponentGoalCell = (view: PlayerView): Cell => ({
  x: view.team === 'teal' ? view.rules.boardLength : -1,
  y: centerCell(view.rules).y,
})

const ownGoalLineColumn = (view: PlayerView): number => (view.team === 'teal' ? 0 : view.rules.boardLength - 1)

const forwardProgress = (team: Team, cell: Cell): number => (team === 'teal' ? cell.x : -cell.x)

const recentlyBlockedCells = (view: PlayerView): Set<string> =>
  new Set(
    view.events
      .filter((event) => view.turnNumber - event.turnNumber <= recentTurnWindow)
      .flatMap((event) => (event.payload.type === 'blocked' ? [cellKey(event.payload.at)] : [])),
  )

const kickSuccessChance = (
  view: PlayerView,
  kicker: Piece,
  kick: KickKind,
  direction: Direction,
  isSuccess: (outcome: ReturnType<typeof resolveKick>['outcome']) => boolean,
): number => {
  const faces = view.rules.dieFaces
  const successes = faces.filter((face) => {
    const distance = kick === 'shoot' ? face + view.rules.shootBonus : face
    const resolution = resolveKick({ rules: view.rules, pieces: view.ownPieces, kicker, direction, distance })
    return isSuccess(resolution.outcome)
  })
  return faces.length === 0 ? 0 : successes.length / faces.length
}

const bestShot = (view: PlayerView, carrier: Piece): { direction: Direction; chance: number } | null => {
  const shots = getPieceOptions(view, carrier.id).shootDirections.map((direction) => ({
    direction,
    chance: kickSuccessChance(view, carrier, 'shoot', direction, (outcome) =>
      outcome.type === 'goal' && outcome.scoringTeam === view.team,
    ),
  }))
  return shots.reduce<{ direction: Direction; chance: number } | null>(
    (best, shot) => (best === null || shot.chance > best.chance ? shot : best),
    null,
  )
}

const bestForwardPass = (view: PlayerView, carrier: Piece, minimumChance: number): Direction | null => {
  const passes = getPieceOptions(view, carrier.id).passDirections.map((direction) => ({
    direction,
    chance: kickSuccessChance(view, carrier, 'pass', direction, (outcome) =>
      outcome.type === 'caught' &&
      outcome.holder.team === view.team &&
      outcome.holder.id !== carrier.id &&
      forwardProgress(view.team, outcome.holder.cell) > forwardProgress(view.team, carrier.cell),
    ),
  }))
  const best = passes.reduce<{ direction: Direction; chance: number } | null>(
    (current, pass) => (current === null || pass.chance > current.chance ? pass : current),
    null,
  )
  return best && best.chance >= minimumChance ? best.direction : null
}

const clearanceKick = (view: PlayerView, carrier: Piece): GameAction | null => {
  const options = getPieceOptions(view, carrier.id)
  const direction = [...options.passDirections].sort(
    (first, second) => directionVectors[second].dx * attackStepX(view.team) - directionVectors[first].dx * attackStepX(view.team),
  )[0]
  return direction ? { kind: 'pass', pieceId: carrier.id, direction } : null
}

const blockedCellsOf = (view: PlayerView, pieceId: string): Set<string> =>
  new Set(
    view.events
      .filter((event) => view.turnNumber - event.turnNumber <= recentTurnWindow)
      .flatMap((event) =>
        event.payload.type === 'blocked' && event.payload.pieceId === pieceId ? [cellKey(event.payload.at)] : [],
      ),
  )

const moveDistance = (first: Cell, second: Cell): number =>
  Math.max(Math.abs(first.x - second.x), Math.abs(first.y - second.y))

const stepToward = (
  view: PlayerView,
  piece: Piece,
  target: Cell,
  avoidedCells: Set<string>,
  random: RandomSource,
): GameAction | null => {
  const distanceTo = (cell: Cell) => moveDistance(cell, target) * 10 + manhattanDistance(cell, target)
  const currentDistance = distanceTo(piece.cell)
  const candidates = getPieceOptions(view, piece.id).moveTargets.filter(
    (cell) => isSameCell(cell, target) || !avoidedCells.has(cellKey(cell)),
  )
  const closestDistance = Math.min(...candidates.map(distanceTo))
  if (!Number.isFinite(closestDistance) || closestDistance >= currentDistance) {
    return null
  }
  const closest = candidates.filter((cell) => distanceTo(cell) === closestDistance)
  const destination = pickRandom(closest, random)
  return destination ? { kind: 'move', pieceId: piece.id, to: destination } : null
}

const goalkeeperGuardCell = (view: PlayerView): Cell => {
  const rows = goalRows(view.rules)
  return { x: ownGoalLineColumn(view), y: Math.min(rows.last, Math.max(rows.first, view.ball.cell.y)) }
}

const planWithBall = (view: PlayerView, profile: AiProfile, avoidedCells: Set<string>, random: RandomSource): GameAction | null => {
  const carrier = view.ownPieces.find((piece) => piece.id === view.ball.holderId)
  if (!carrier) {
    return null
  }
  const shot = bestShot(view, carrier)
  if (shot && shot.chance >= profile.minimumShotChance) {
    return { kind: 'shoot', pieceId: carrier.id, direction: shot.direction }
  }
  const maxShotDistance = Math.max(...view.rules.dieFaces) + view.rules.shootBonus
  const goalDistance = Math.abs(opponentGoalCell(view).x - carrier.cell.x)
  const rotation = rotationToward(carrier.facing, attackFacing(view.team))
  if (rotation && goalDistance <= maxShotDistance) {
    return { kind: 'rotate', pieceId: carrier.id, side: rotation }
  }
  const passDirection = bestForwardPass(view, carrier, profile.minimumForwardPassChance)
  if (passDirection) {
    return { kind: 'pass', pieceId: carrier.id, direction: passDirection }
  }
  const carrierAvoidedCells = new Set([...avoidedCells, ...blockedCellsOf(view, carrier.id)])
  return (
    stepToward(view, carrier, opponentGoalCell(view), carrierAvoidedCells, random) ?? clearanceKick(view, carrier)
  )
}

const planWithoutBall = (view: PlayerView, profile: AiProfile, avoidedCells: Set<string>, random: RandomSource): GameAction | null => {
  const goalkeeper = profile.keepsGoalkeeper ? view.ownPieces.find((piece) => piece.shape === 'square') : undefined
  const isBallNearOwnGoal = Math.abs(view.ball.cell.x - ownGoalLineColumn(view)) <= 2

  if (goalkeeper && view.ball.possession === 'opponent' && !isBallNearOwnGoal) {
    const guardStep = stepToward(view, goalkeeper, goalkeeperGuardCell(view), avoidedCells, random)
    if (guardStep) {
      return guardStep
    }
  }

  const chasers = view.ownPieces
    .filter((piece) => piece !== goalkeeper || isBallNearOwnGoal)
    .sort((first, second) => manhattanDistance(first.cell, view.ball.cell) - manhattanDistance(second.cell, view.ball.cell))

  for (const chaser of chasers) {
    const step = stepToward(view, chaser, view.ball.cell, avoidedCells, random)
    if (step) {
      return step
    }
  }
  return null
}

export const chooseAiAction = (view: PlayerView, level: AiLevel, random: RandomSource): GameAction | null => {
  if (!canAct(view)) {
    return null
  }
  const legalActions = listLegalActions(view)
  const profile = profiles[level]
  if (random() < profile.randomActionChance) {
    return pickRandom(legalActions, random)
  }
  const avoidedCells = profile.avoidsBlockedCells ? recentlyBlockedCells(view) : new Set<string>()
  const planned =
    view.ball.possession === 'own'
      ? planWithBall(view, profile, avoidedCells, random)
      : planWithoutBall(view, profile, avoidedCells, random)
  return planned ?? pickRandom(legalActions, random)
}
