import type { Cell, MatchEvent, MatchResult, MatchSettings, MatchState, Phase, Piece, Rules, Team } from './types'

export type BallPossession = 'own' | 'opponent' | 'free'

export type BallView = {
  cell: Cell
  possession: BallPossession
  holderId: string | null
  isProtected: boolean
}

export type PlayerView = {
  team: Team
  rules: Rules
  settings: MatchSettings
  phase: Phase
  ownPieces: Piece[]
  opponentPlaced: boolean
  ball: BallView
  score: Record<Team, number>
  activeTeam: Team
  actionsLeft: number
  turnNumber: number
  result: MatchResult | null
  events: MatchEvent[]
}

const possessionFor = (state: MatchState, team: Team): BallPossession => {
  const holder = state.pieces.find((piece) => piece.id === state.ball.holderId)
  if (!holder) {
    return 'free'
  }
  return holder.team === team ? 'own' : 'opponent'
}

export const buildView = (state: MatchState, team: Team): PlayerView => {
  const possession = possessionFor(state, team)
  return structuredClone({
    team,
    rules: state.rules,
    settings: state.settings,
    phase: state.phase,
    ownPieces: state.pieces.filter((piece) => piece.team === team),
    opponentPlaced: state.placedTeams.some((placedTeam) => placedTeam !== team),
    ball: {
      cell: state.ball.cell,
      possession,
      holderId: possession === 'own' ? state.ball.holderId : null,
      isProtected: state.tackleProtectedTurn === state.turnNumber,
    },
    score: state.score,
    activeTeam: state.activeTeam,
    actionsLeft: state.actionsLeft,
    turnNumber: state.turnNumber,
    result: state.result,
    events: state.events.filter((event) => event.audience === 'all' || event.audience === team),
  })
}
