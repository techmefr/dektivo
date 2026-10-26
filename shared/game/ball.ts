import { directionVectors, isInGoalMouth, isInsideBoard, isSameCell, reverseVector, shiftCell } from './board'
import type { Cell, Direction, EventPayload, Piece, Rules, Team, Vector } from './types'

export type KickOutcome =
  | { type: 'caught'; holder: Piece; intercepted: boolean }
  | { type: 'stopped'; cell: Cell }
  | { type: 'goal'; scoringTeam: Team }

export type KickResolution = {
  path: Cell[]
  steps: EventPayload[]
  outcome: KickOutcome
}

export type KickRequest = {
  rules: Rules
  pieces: readonly Piece[]
  kicker: Piece
  direction: Direction
  distance: number
}

const facingVectors: Record<Piece['facing'], Vector> = {
  N: directionVectors.N,
  E: directionVectors.E,
  S: directionVectors.S,
  W: directionVectors.W,
}

const scoringTeamForGoalAt = (column: number): Team => (column < 0 ? 'orange' : 'teal')

const crossesGoalLine = (rules: Rules, cell: Cell): boolean =>
  (cell.x < 0 || cell.x >= rules.boardLength) && isInGoalMouth(rules, cell.y)

export const resolveKick = ({ rules, pieces, kicker, direction, distance }: KickRequest): KickResolution => {
  const path: Cell[] = []
  const steps: EventPayload[] = []
  let position = { ...kicker.cell }
  let vector = { ...directionVectors[direction] }
  let remaining = distance

  while (remaining > 0) {
    const next = shiftCell(position, vector)

    if (crossesGoalLine(rules, next)) {
      path.push(next)
      return { path, steps, outcome: { type: 'goal', scoringTeam: scoringTeamForGoalAt(next.x) } }
    }

    if (!isInsideBoard(rules, next)) {
      if (!rules.edgeBounce) {
        break
      }
      const isOutOnLength = next.x < 0 || next.x >= rules.boardLength
      const isOutOnWidth = next.y < 0 || next.y >= rules.boardWidth
      vector = { dx: isOutOnLength ? -vector.dx : vector.dx, dy: isOutOnWidth ? -vector.dy : vector.dy }
      steps.push({ type: 'ballBouncedOffEdge', at: { ...position } })
      remaining -= 1
      continue
    }

    const occupant = pieces.find((piece) => isSameCell(piece.cell, next))
    if (occupant) {
      const behavior = occupant.team === kicker.team ? 'catch' : rules.shapeBehavior[occupant.shape]
      if (behavior === 'catch') {
        path.push(next)
        return { path, steps, outcome: { type: 'caught', holder: occupant, intercepted: occupant.team !== kicker.team } }
      }
      vector = behavior === 'rebound' ? reverseVector(vector) : { ...facingVectors[occupant.facing] }
      steps.push({ type: 'ballDeflected', at: { ...next }, behavior })
      remaining -= 1
      continue
    }

    position = next
    path.push(next)
    remaining -= 1
  }

  const holderAtRest = pieces.find((piece) => isSameCell(piece.cell, position))
  if (holderAtRest) {
    return { path, steps, outcome: { type: 'caught', holder: holderAtRest, intercepted: holderAtRest.team !== kicker.team } }
  }
  return { path, steps, outcome: { type: 'stopped', cell: position } }
}
