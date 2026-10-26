import { describe, expect, it } from 'vitest'
import { applyAction } from '../actions'
import { defaultRules, defaultSettings } from '../rules'
import { createMatch, placeTeam } from '../state'
import { endTurn } from '../turns'
import { buildView } from '../visibility'
import { idOf, orangePlacement, seededRandom, startedMatch, tealPlacement, withBallHeldBy } from '../test-helpers'
import { chooseAiAction } from './decide'
import type { AiLevel } from './decide'
import { chooseAiPlacement } from './placement'
import type { MatchState, Team } from '../types'

const playAiMatch = (seed: number, levels: Record<Team, AiLevel>): MatchState => {
  const random = seededRandom(seed)
  let match = createMatch({ ...defaultSettings, actionsPerTurn: seed % 2 === 0 ? 2 : 1 })
  match = placeTeam(match, 'teal', chooseAiPlacement(defaultRules, 'teal', random))
  match = placeTeam(match, 'orange', chooseAiPlacement(defaultRules, 'orange', random))
  for (let step = 0; step < 500 && match.phase === 'playing'; step += 1) {
    const team = match.activeTeam
    const action = chooseAiAction(buildView(match, team), levels[team], random)
    match = action ? applyAction(match, team, action, random) : endTurn(match, team)
  }
  return match
}

describe('ai', () => {
  it('only ever chooses legal actions and finishes whole matches', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const finished = playAiMatch(seed, { teal: 'easy', orange: 'medium' })
      expect(finished.phase).toBe('finished')
    }
  })

  it('decides the same way whatever the hidden opponent positions are', () => {
    const hiddenElsewhere = orangePlacement.map((placement) =>
      placement.shape === 'diamond' ? { ...placement, cell: { x: 7, y: 6 } } : placement,
    )
    const firstMatch = startedMatch({}, tealPlacement, orangePlacement)
    const secondMatch = startedMatch({}, tealPlacement, hiddenElsewhere)

    expect(buildView(firstMatch, 'teal')).toEqual(buildView(secondMatch, 'teal'))
    for (const level of ['easy', 'medium'] as const) {
      expect(chooseAiAction(buildView(firstMatch, 'teal'), level, seededRandom(7))).toEqual(
        chooseAiAction(buildView(secondMatch, 'teal'), level, seededRandom(7)),
      )
    }
  })

  it('shoots when a goal is within reach', () => {
    const match = withBallHeldBy(
      {
        ...startedMatch(),
        pieces: startedMatch().pieces.map((piece) =>
          piece.id === idOf('teal', 'triangle') ? { ...piece, cell: { x: 6, y: 3 }, facing: 'E' as const } : piece,
        ),
      },
      idOf('teal', 'triangle'),
    )

    expect(chooseAiAction(buildView(match, 'teal'), 'medium', seededRandom(3))).toMatchObject({ kind: 'shoot' })
  })

  it('places its three pieces inside its own half', () => {
    for (const team of ['teal', 'orange'] as const) {
      const placed = placeTeam(createMatch(defaultSettings), team, chooseAiPlacement(defaultRules, team, seededRandom(11)))
      expect(placed.pieces.map((piece) => piece.team)).toEqual([team, team, team])
    }
  })
})
