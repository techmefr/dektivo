import type { MatchEvent, MatchResult, MatchState, Rules, MatchSettings, Piece, Team } from './types'

export type TeamStats = {
  moves: number
  rotations: number
  blockedMoves: number
  passes: number
  shots: number
  passesCaught: number
  interceptions: number
  pickups: number
  tacklesWon: number
  tacklesMissed: number
  tacklesRefused: number
  goals: number
}

export type MatchSummary = {
  turns: number
  result: MatchResult | null
  score: Record<Team, number>
  teams: Record<Team, TeamStats>
}

export type MatchRecord = {
  rules: Rules
  settings: MatchSettings
  startingTeam: Team
  kickoffPieces: Piece[]
  finalPieces: Piece[]
  summary: MatchSummary
  events: MatchEvent[]
}

export const teamStatNames: readonly (keyof TeamStats)[] = [
  'moves',
  'rotations',
  'blockedMoves',
  'passes',
  'shots',
  'passesCaught',
  'interceptions',
  'pickups',
  'tacklesWon',
  'tacklesMissed',
  'tacklesRefused',
  'goals',
]

export const emptyTeamStats = (): TeamStats => ({
  moves: 0,
  rotations: 0,
  blockedMoves: 0,
  passes: 0,
  shots: 0,
  passesCaught: 0,
  interceptions: 0,
  pickups: 0,
  tacklesWon: 0,
  tacklesMissed: 0,
  tacklesRefused: 0,
  goals: 0,
})

type CountedStat = { team: Team; stat: keyof TeamStats }

const countedStatOf = (event: MatchEvent): CountedStat | null => {
  const { payload, audience } = event
  const privateTeam = audience === 'all' ? null : audience
  switch (payload.type) {
    case 'moved':
      return privateTeam && { team: privateTeam, stat: 'moves' }
    case 'rotated':
      return privateTeam && { team: privateTeam, stat: 'rotations' }
    case 'blocked':
      return privateTeam && { team: privateTeam, stat: 'blockedMoves' }
    case 'ballKicked':
      return { team: payload.team, stat: payload.kick === 'pass' ? 'passes' : 'shots' }
    case 'ballCaught':
      return { team: payload.team, stat: payload.intercepted ? 'interceptions' : 'passesCaught' }
    case 'ballPickedUp':
      return { team: payload.team, stat: 'pickups' }
    case 'tackled':
      return { team: payload.team, stat: 'tacklesWon' }
    case 'tackleFailed':
      return { team: payload.team, stat: 'tacklesMissed' }
    case 'tackleRefused':
      return { team: payload.team, stat: 'tacklesRefused' }
    case 'goal':
      return { team: payload.team, stat: 'goals' }
    default:
      return null
  }
}

export const summarizeMatch = (state: MatchState): MatchSummary => {
  const teams: Record<Team, TeamStats> = { teal: emptyTeamStats(), orange: emptyTeamStats() }
  for (const event of state.events) {
    const counted = countedStatOf(event)
    if (counted) {
      teams[counted.team][counted.stat] += 1
    }
  }
  return { turns: state.turnNumber, result: state.result, score: { ...state.score }, teams }
}

export const buildMatchRecord = (state: MatchState): MatchRecord =>
  structuredClone({
    rules: state.rules,
    settings: state.settings,
    startingTeam: state.startingTeam,
    kickoffPieces: state.kickoffPieces,
    finalPieces: state.pieces,
    summary: summarizeMatch(state),
    events: state.events,
  })
