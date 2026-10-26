import type { MatchSettings, Rules } from './types'

export const defaultRules: Rules = {
  boardLength: 9,
  boardWidth: 7,
  goalWidth: 3,
  dieFaces: [1, 1, 2, 2, 3, 3],
  shootBonus: 2,
  kickConeOnly: true,
  shootTowardGoalOnly: true,
  tackleEnabled: true,
  edgeBounce: true,
  shapeBehavior: {
    square: 'catch',
    triangle: 'deflect',
    diamond: 'rebound',
  },
}

export const defaultSettings: MatchSettings = {
  actionsPerTurn: 2,
  secondsPerAction: 30,
  goalsToWin: 3,
  maxTurns: 40,
}

export const secondsPerActionOptions: readonly (number | null)[] = [15, 30, 60, null]
