import { centerCell, opponentOf } from './board'
import { IllegalActionError } from './errors'
import { cloneState, recordEvent } from './events'
import type { MatchResult, MatchState, Team, TurnEndReason } from './types'

const resultFromScore = (draft: MatchState): MatchResult => {
  if (draft.score.teal === draft.score.orange) {
    return 'draw'
  }
  return draft.score.teal > draft.score.orange ? 'teal' : 'orange'
}

export const finishMatch = (draft: MatchState): void => {
  draft.phase = 'finished'
  draft.result = resultFromScore(draft)
  draft.actionsLeft = 0
  recordEvent(draft, 'all', { type: 'matchEnded', result: draft.result })
}

export const passTurnTo = (draft: MatchState, nextTeam: Team, reason: TurnEndReason): void => {
  recordEvent(draft, 'all', { type: 'turnEnded', team: draft.activeTeam, reason })
  if (draft.turnNumber >= draft.settings.maxTurns) {
    finishMatch(draft)
    return
  }
  draft.turnNumber += 1
  draft.activeTeam = nextTeam
  draft.actionsLeft = draft.settings.actionsPerTurn
}

export const endTurnInPlace = (draft: MatchState, reason: TurnEndReason): void => {
  passTurnTo(draft, opponentOf(draft.activeTeam), reason)
}

export const scoreGoalInPlace = (draft: MatchState, scoringTeam: Team): void => {
  draft.score[scoringTeam] += 1
  recordEvent(draft, 'all', { type: 'goal', team: scoringTeam })
  if (draft.score[scoringTeam] >= draft.settings.goalsToWin) {
    finishMatch(draft)
    return
  }
  draft.pieces = structuredClone(draft.kickoffPieces)
  draft.ball = { cell: centerCell(draft.rules), holderId: null }
  passTurnTo(draft, opponentOf(scoringTeam), 'goal')
}

export const endTurn = (state: MatchState, team: Team, reason: TurnEndReason = 'manual'): MatchState => {
  if (state.phase !== 'playing') {
    throw new IllegalActionError('notPlaying')
  }
  if (state.activeTeam !== team) {
    throw new IllegalActionError('notYourTurn')
  }
  const draft = cloneState(state)
  endTurnInPlace(draft, reason)
  return draft
}
