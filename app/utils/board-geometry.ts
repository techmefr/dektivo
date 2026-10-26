import type { Cell, Direction, Facing } from '#shared/game'

export const cellSize = 10

export const pitchViewBox = { x: -16, y: -14, width: 122, height: 98 } as const

export const columnLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const cellLabel = (cell: Cell): string => `${columnLetters[cell.x] ?? '?'}${cell.y + 1}`

export const cellCenter = (cell: Cell): { x: number; y: number } => ({
  x: cell.x * cellSize + cellSize / 2,
  y: cell.y * cellSize + cellSize / 2,
})

export const cellPercentPosition = (cell: Cell): { left: string; top: string } => {
  const center = cellCenter(cell)
  return {
    left: `${((center.x - pitchViewBox.x) / pitchViewBox.width) * 100}%`,
    top: `${((center.y - pitchViewBox.y) / pitchViewBox.height) * 100}%`,
  }
}

export const cellWidthPercent = (cellSize / pitchViewBox.width) * 100

export const facingAngles: Record<Facing, number> = { E: 0, S: 90, W: 180, N: -90 }

export const directionAngles: Record<Direction, number> = {
  E: 0,
  SE: 45,
  S: 90,
  SW: 135,
  W: 180,
  NW: -135,
  N: -90,
  NE: -45,
}
