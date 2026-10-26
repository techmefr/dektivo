import { describe, expect, it } from 'vitest'
import { applyAction } from './actions'
import { runSimulation, simulateAiMatch } from './ai/simulate'
import { defaultRules } from './rules'
import { buildMatchRecord, summarizeMatch } from './stats'
import { idOf, randomForFace, seededRandom, startedMatch, withBallHeldBy } from './test-helpers'
import type { MatchState } from './types'

const carrierNextToTealTriangle = (): MatchState =>
  withBallHeldBy(
    {
      ...startedMatch(),
      pieces: startedMatch().pieces.map((piece) => {
        if (piece.id === idOf('orange', 'triangle')) {
          return { ...piece, cell: { x: 5, y: 1 } }
        }
        return piece.id === idOf('teal', 'triangle') ? { ...piece, cell: { x: 4, y: 1 } } : piece
      }),
    },
    idOf('orange', 'triangle'),
  )

const tackle = (state: MatchState, face: number): MatchState =>
  applyAction(state, 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 5, y: 1 } }, randomForFace(defaultRules, face))

describe('match summary', () => {
  it('counts moves, missed and won tackles per team', () => {
    const missed = tackle(carrierNextToTealTriangle(), 1)
    const won = tackle(missed, 3)
    const summary = summarizeMatch(won)

    expect(summary.teams.teal).toMatchObject({ tacklesMissed: 1, tacklesWon: 1, moves: 0 })
    expect(summary.teams.orange).toMatchObject({ tacklesMissed: 0, tacklesWon: 0 })
  })

  it('counts a private move only for the team that made it', () => {
    const moved = applyAction(startedMatch(), 'teal', { kind: 'move', pieceId: idOf('teal', 'square'), to: { x: 1, y: 3 } }, seededRandom(1))

    expect(summarizeMatch(moved).teams.teal.moves).toBe(1)
    expect(summarizeMatch(moved).teams.orange.moves).toBe(0)
  })

  it('records every event with its audience and both kickoff formations', () => {
    const finished = simulateAiMatch({ levels: { teal: 'easy', orange: 'medium' }, random: seededRandom(5) })
    const record = buildMatchRecord(finished)

    expect(record.events).toEqual(finished.events)
    expect(record.kickoffPieces).toHaveLength(6)
    expect(record.summary.score).toEqual(finished.score)
  })
})

describe('simulation report', () => {
  it('aggregates whole AI matches into per-turn rates', () => {
    const report = runSimulation(5, { levels: { teal: 'medium', orange: 'medium' }, random: seededRandom(9) })

    expect(report.matches).toBe(5)
    expect(report.wins.teal + report.wins.orange + report.wins.draw).toBe(5)
    expect(report.averageTurns).toBeGreaterThan(0)
    expect(report.perTurn.moves).toBeGreaterThan(0)
  })
})
