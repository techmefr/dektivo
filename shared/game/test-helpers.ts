import { defaultRules, defaultSettings } from './rules'
import { createMatch, pieceIdFor, placeTeam } from './state'
import type { MatchSettings, MatchState, PiecePlacement, RandomSource, Rules } from './types'

export const fixedRandom = (value: number): RandomSource => () => value

export const randomForFace = (rules: Rules, face: number): RandomSource => {
  const index = rules.dieFaces.indexOf(face)
  return fixedRandom((index + 0.5) / rules.dieFaces.length)
}

export const tealPlacement: PiecePlacement[] = [
  { shape: 'square', cell: { x: 0, y: 3 }, facing: 'E' },
  { shape: 'triangle', cell: { x: 2, y: 1 }, facing: 'E' },
  { shape: 'diamond', cell: { x: 2, y: 5 }, facing: 'E' },
]

export const orangePlacement: PiecePlacement[] = [
  { shape: 'square', cell: { x: 8, y: 3 }, facing: 'W' },
  { shape: 'triangle', cell: { x: 6, y: 1 }, facing: 'W' },
  { shape: 'diamond', cell: { x: 6, y: 5 }, facing: 'W' },
]

export const startedMatch = (
  settings: Partial<MatchSettings> = {},
  teal: PiecePlacement[] = tealPlacement,
  orange: PiecePlacement[] = orangePlacement,
  rules: Rules = defaultRules,
): MatchState => {
  const match = createMatch({ ...defaultSettings, ...settings }, 'teal', rules)
  return placeTeam(placeTeam(match, 'teal', teal), 'orange', orange)
}

export const withBallHeldBy = (state: MatchState, pieceId: string): MatchState => {
  const holder = state.pieces.find((piece) => piece.id === pieceId)
  if (!holder) {
    throw new RangeError(`Unknown piece ${pieceId}`)
  }
  return { ...state, ball: { cell: { ...holder.cell }, holderId: holder.id } }
}

export const idOf = pieceIdFor

export { seededRandom } from './dice'
