import type { Cell, Direction, Facing, RotationSide, Rules, Team, Vector } from './types'

export const allDirections: readonly Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
export const facingOrder: readonly Facing[] = ['N', 'E', 'S', 'W']
export const allShapes = ['square', 'triangle', 'diamond'] as const

export const directionVectors: Record<Direction, Vector> = {
  N: { dx: 0, dy: -1 },
  NE: { dx: 1, dy: -1 },
  E: { dx: 1, dy: 0 },
  SE: { dx: 1, dy: 1 },
  S: { dx: 0, dy: 1 },
  SW: { dx: -1, dy: 1 },
  W: { dx: -1, dy: 0 },
  NW: { dx: -1, dy: -1 },
}

export const kickCones: Record<Facing, readonly Direction[]> = {
  N: ['NW', 'N', 'NE'],
  E: ['NE', 'E', 'SE'],
  S: ['SE', 'S', 'SW'],
  W: ['SW', 'W', 'NW'],
}

export const opponentOf = (team: Team): Team => (team === 'teal' ? 'orange' : 'teal')

export const attackStepX = (team: Team): number => (team === 'teal' ? 1 : -1)

export const attackFacing = (team: Team): Facing => (team === 'teal' ? 'E' : 'W')

export const isSameCell = (first: Cell, second: Cell): boolean => first.x === second.x && first.y === second.y

export const cellKey = (cell: Cell): string => `${cell.x}:${cell.y}`

export const shiftCell = (cell: Cell, vector: Vector): Cell => ({ x: cell.x + vector.dx, y: cell.y + vector.dy })

export const manhattanDistance = (first: Cell, second: Cell): number =>
  Math.abs(first.x - second.x) + Math.abs(first.y - second.y)

export const isInsideBoard = (rules: Rules, cell: Cell): boolean =>
  cell.x >= 0 && cell.x < rules.boardLength && cell.y >= 0 && cell.y < rules.boardWidth

export const centerCell = (rules: Rules): Cell => ({
  x: Math.floor(rules.boardLength / 2),
  y: Math.floor(rules.boardWidth / 2),
})

export const goalRows = (rules: Rules): { first: number; last: number } => {
  const first = Math.floor((rules.boardWidth - rules.goalWidth) / 2)
  return { first, last: first + rules.goalWidth - 1 }
}

export const isInGoalMouth = (rules: Rules, row: number): boolean => {
  const rows = goalRows(rules)
  return row >= rows.first && row <= rows.last
}

export const isInOwnHalf = (rules: Rules, team: Team, cell: Cell): boolean => {
  const midline = Math.floor(rules.boardLength / 2)
  return team === 'teal' ? cell.x < midline : cell.x > rules.boardLength - 1 - midline
}

export const orthogonalNeighbors = (rules: Rules, cell: Cell): Cell[] =>
  facingOrder
    .map((facing) => shiftCell(cell, directionVectors[facing]))
    .filter((neighbor) => isInsideBoard(rules, neighbor))

export const rotateFacing = (facing: Facing, side: RotationSide): Facing => {
  const step = side === 'right' ? 1 : facingOrder.length - 1
  return facingOrder[(facingOrder.indexOf(facing) + step) % facingOrder.length] ?? facing
}

export const rotationToward = (current: Facing, target: Facing): RotationSide | null => {
  if (current === target) {
    return null
  }
  return rotateFacing(current, 'left') === target ? 'left' : 'right'
}

export const reverseVector = (vector: Vector): Vector => ({ dx: -vector.dx, dy: -vector.dy })
