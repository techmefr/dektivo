import { applyAction } from '../actions'
import { defaultRules, defaultSettings } from '../rules'
import { createMatch, placeTeam } from '../state'
import { emptyTeamStats, summarizeMatch, teamStatNames } from '../stats'
import type { MatchSummary, TeamStats } from '../stats'
import { endTurn } from '../turns'
import { buildView } from '../visibility'
import { chooseAiAction } from './decide'
import type { AiLevel } from './decide'
import { chooseAiPlacement } from './placement'
import type { MatchSettings, MatchState, RandomSource, Rules, Team } from '../types'

export type SimulationOptions = {
  levels: Record<Team, AiLevel>
  random: RandomSource
  settings?: MatchSettings
  rules?: Rules
}

export type SimulationReport = {
  matches: number
  averageTurns: number
  averageGoals: number
  wins: Record<Team | 'draw', number>
  perTurn: TeamStats
}

const maxActionsPerMatch = 1000

export const simulateAiMatch = ({ levels, random, settings = defaultSettings, rules = defaultRules }: SimulationOptions): MatchState => {
  let match = createMatch(settings, 'teal', rules)
  match = placeTeam(match, 'teal', chooseAiPlacement(rules, 'teal', random))
  match = placeTeam(match, 'orange', chooseAiPlacement(rules, 'orange', random))
  for (let step = 0; step < maxActionsPerMatch && match.phase === 'playing'; step += 1) {
    const team = match.activeTeam
    const action = chooseAiAction(buildView(match, team), levels[team], random)
    match = action ? applyAction(match, team, action, random) : endTurn(match, team)
  }
  return match
}

export const reportSimulation = (summaries: readonly MatchSummary[]): SimulationReport => {
  const totalTurns = summaries.reduce((total, summary) => total + summary.turns, 0)
  const totalGoals = summaries.reduce((total, summary) => total + summary.score.teal + summary.score.orange, 0)
  const wins: Record<Team | 'draw', number> = { teal: 0, orange: 0, draw: 0 }
  summaries.forEach((summary) => {
    if (summary.result) {
      wins[summary.result] += 1
    }
  })
  const perTurn = emptyTeamStats()
  for (const stat of teamStatNames) {
    const total = summaries.reduce((sum, summary) => sum + summary.teams.teal[stat] + summary.teams.orange[stat], 0)
    perTurn[stat] = totalTurns === 0 ? 0 : Number((total / totalTurns).toFixed(3))
  }
  return {
    matches: summaries.length,
    averageTurns: summaries.length === 0 ? 0 : Number((totalTurns / summaries.length).toFixed(1)),
    averageGoals: summaries.length === 0 ? 0 : Number((totalGoals / summaries.length).toFixed(2)),
    wins,
    perTurn,
  }
}

export const runSimulation = (count: number, options: SimulationOptions): SimulationReport =>
  reportSimulation(Array.from({ length: count }, () => summarizeMatch(simulateAiMatch(options))))
