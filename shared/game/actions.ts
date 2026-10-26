import { resolveKick } from './ball'
import { allDirections, attackStepX, directionVectors, isSameCell, kickCones, orthogonalNeighbors, rotateFacing } from './board'
import { rollDie } from './dice'
import { IllegalActionError } from './errors'
import { cloneState, recordEvent } from './events'
import { endTurnInPlace, scoreGoalInPlace } from './turns'
import { buildView } from './visibility'
import type { PlayerView } from './visibility'
import type { Cell, Direction, GameAction, KickAction, MatchState, MoveAction, Piece, RandomSource, Team } from './types'

export type PieceOptions = {
  moveTargets: Cell[]
  canRotate: boolean
  passDirections: Direction[]
  shootDirections: Direction[]
}

const noOptions: PieceOptions = { moveTargets: [], canRotate: false, passDirections: [], shootDirections: [] }

export const canAct = (view: PlayerView): boolean =>
  view.phase === 'playing' && view.activeTeam === view.team && view.actionsLeft > 0

export const getPieceOptions = (view: PlayerView, pieceId: string): PieceOptions => {
  const piece = view.ownPieces.find((ownPiece) => ownPiece.id === pieceId)
  if (!piece || !canAct(view)) {
    return noOptions
  }
  const moveTargets = orthogonalNeighbors(view.rules, piece.cell).filter(
    (target) => !view.ownPieces.some((ownPiece) => isSameCell(ownPiece.cell, target)),
  )
  const isHoldingBall = view.ball.holderId === piece.id
  const kickDirections = isHoldingBall ? (view.rules.kickConeOnly ? [...kickCones[piece.facing]] : [...allDirections]) : []
  const shootDirections = view.rules.shootTowardGoalOnly
    ? kickDirections.filter((direction) => directionVectors[direction].dx === attackStepX(view.team))
    : kickDirections
  return { moveTargets, canRotate: true, passDirections: kickDirections, shootDirections }
}

export const listLegalActions = (view: PlayerView): GameAction[] =>
  view.ownPieces.flatMap((piece) => {
    const options = getPieceOptions(view, piece.id)
    return [
      ...options.moveTargets.map((to): GameAction => ({ kind: 'move', pieceId: piece.id, to })),
      ...(options.canRotate
        ? (['left', 'right'] as const).map((side): GameAction => ({ kind: 'rotate', pieceId: piece.id, side }))
        : []),
      ...options.passDirections.map((direction): GameAction => ({ kind: 'pass', pieceId: piece.id, direction })),
      ...options.shootDirections.map((direction): GameAction => ({ kind: 'shoot', pieceId: piece.id, direction })),
    ]
  })

const isActionAllowed = (options: PieceOptions, action: GameAction): boolean => {
  if (action.kind === 'move') {
    return options.moveTargets.some((target) => isSameCell(target, action.to))
  }
  if (action.kind === 'rotate') {
    return options.canRotate
  }
  const directions = action.kind === 'pass' ? options.passDirections : options.shootDirections
  return directions.includes(action.direction)
}

const findPiece = (draft: MatchState, pieceId: string): Piece => {
  const piece = draft.pieces.find((candidate) => candidate.id === pieceId)
  if (!piece) {
    throw new IllegalActionError('unknownPiece')
  }
  return piece
}

const applyMove = (draft: MatchState, action: MoveAction): void => {
  const mover = findPiece(draft, action.pieceId)
  const occupant = draft.pieces.find((piece) => isSameCell(piece.cell, action.to))

  if (occupant) {
    if (draft.rules.tackleEnabled && draft.ball.holderId === occupant.id) {
      draft.ball = { cell: { ...mover.cell }, holderId: mover.id }
      recordEvent(draft, 'all', { type: 'tackled', team: mover.team, at: { ...action.to } })
      return
    }
    recordEvent(draft, mover.team, { type: 'blocked', pieceId: mover.id, at: { ...action.to } })
    return
  }

  const from = { ...mover.cell }
  mover.cell = { ...action.to }
  recordEvent(draft, mover.team, { type: 'moved', pieceId: mover.id, from, to: { ...action.to } })

  if (draft.ball.holderId === mover.id) {
    draft.ball.cell = { ...action.to }
    recordEvent(draft, 'all', { type: 'ballCarried', team: mover.team, from, to: { ...action.to } })
    return
  }
  if (draft.ball.holderId === null && isSameCell(draft.ball.cell, action.to)) {
    draft.ball.holderId = mover.id
    recordEvent(draft, 'all', { type: 'ballPickedUp', team: mover.team, at: { ...action.to } })
  }
}

const applyKick = (draft: MatchState, action: KickAction, random: RandomSource): boolean => {
  const kicker = findPiece(draft, action.pieceId)
  const value = rollDie(draft.rules.dieFaces, random)
  const distance = action.kind === 'shoot' ? value + draft.rules.shootBonus : value
  recordEvent(draft, 'all', { type: 'dieRolled', team: kicker.team, kick: action.kind, value })

  const resolution = resolveKick({ rules: draft.rules, pieces: draft.pieces, kicker, direction: action.direction, distance })
  recordEvent(draft, 'all', {
    type: 'ballKicked',
    team: kicker.team,
    kick: action.kind,
    from: { ...kicker.cell },
    direction: action.direction,
    distance,
    path: resolution.path,
  })
  resolution.steps.forEach((step) => recordEvent(draft, 'all', step))

  const { outcome } = resolution
  if (outcome.type === 'goal') {
    scoreGoalInPlace(draft, outcome.scoringTeam)
    return true
  }
  if (outcome.type === 'caught') {
    draft.ball = { cell: { ...outcome.holder.cell }, holderId: outcome.holder.id }
    recordEvent(draft, 'all', {
      type: 'ballCaught',
      team: outcome.holder.team,
      at: { ...outcome.holder.cell },
      intercepted: outcome.intercepted,
    })
    return false
  }
  draft.ball = { cell: { ...outcome.cell }, holderId: null }
  recordEvent(draft, 'all', { type: 'ballStopped', at: { ...outcome.cell } })
  return false
}

export const applyAction = (state: MatchState, team: Team, action: GameAction, random: RandomSource): MatchState => {
  if (state.phase !== 'playing') {
    throw new IllegalActionError('notPlaying')
  }
  if (state.activeTeam !== team) {
    throw new IllegalActionError('notYourTurn')
  }
  if (state.actionsLeft <= 0) {
    throw new IllegalActionError('noActionsLeft')
  }
  const view = buildView(state, team)
  if (!view.ownPieces.some((piece) => piece.id === action.pieceId)) {
    throw new IllegalActionError('unknownPiece')
  }
  if (!isActionAllowed(getPieceOptions(view, action.pieceId), action)) {
    throw new IllegalActionError(action.kind === 'move' || action.kind === 'rotate' ? 'illegalMove' : 'illegalKick')
  }

  const draft = cloneState(state)
  if (action.kind === 'move') {
    applyMove(draft, action)
  }
  if (action.kind === 'rotate') {
    const piece = findPiece(draft, action.pieceId)
    piece.facing = rotateFacing(piece.facing, action.side)
    recordEvent(draft, team, { type: 'rotated', pieceId: piece.id, facing: piece.facing })
  }
  if (action.kind === 'pass' || action.kind === 'shoot') {
    const isGoal = applyKick(draft, action, random)
    if (isGoal) {
      return draft
    }
  }

  draft.actionsLeft -= 1
  if (draft.actionsLeft === 0) {
    endTurnInPlace(draft, 'noActionsLeft')
  }
  return draft
}
