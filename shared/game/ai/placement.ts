import { attackFacing } from '../board'
import type { PiecePlacement, RandomSource, Rules, Team } from '../types'

const tealFormations: readonly (readonly PiecePlacement[])[] = [
  [
    { shape: 'square', cell: { x: 0, y: 3 }, facing: 'E' },
    { shape: 'triangle', cell: { x: 2, y: 1 }, facing: 'E' },
    { shape: 'diamond', cell: { x: 2, y: 5 }, facing: 'E' },
  ],
  [
    { shape: 'square', cell: { x: 1, y: 3 }, facing: 'E' },
    { shape: 'triangle', cell: { x: 3, y: 2 }, facing: 'E' },
    { shape: 'diamond', cell: { x: 3, y: 4 }, facing: 'E' },
  ],
  [
    { shape: 'square', cell: { x: 0, y: 2 }, facing: 'E' },
    { shape: 'triangle', cell: { x: 3, y: 5 }, facing: 'E' },
    { shape: 'diamond', cell: { x: 2, y: 1 }, facing: 'E' },
  ],
  [
    { shape: 'square', cell: { x: 1, y: 4 }, facing: 'E' },
    { shape: 'triangle', cell: { x: 2, y: 3 }, facing: 'E' },
    { shape: 'diamond', cell: { x: 3, y: 0 }, facing: 'E' },
  ],
]

const mirrorForTeam = (rules: Rules, team: Team, placement: PiecePlacement): PiecePlacement =>
  team === 'teal'
    ? { ...placement, cell: { ...placement.cell } }
    : {
        shape: placement.shape,
        cell: { x: rules.boardLength - 1 - placement.cell.x, y: placement.cell.y },
        facing: attackFacing(team),
      }

export const defaultFormation = (rules: Rules, team: Team): PiecePlacement[] =>
  (tealFormations[0] ?? []).map((placement) => mirrorForTeam(rules, team, placement))

export const chooseAiPlacement = (rules: Rules, team: Team, random: RandomSource): PiecePlacement[] => {
  const formation = tealFormations[Math.floor(random() * tealFormations.length)] ?? tealFormations[0] ?? []
  return formation.map((placement) => mirrorForTeam(rules, team, placement))
}
