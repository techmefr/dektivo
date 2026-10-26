import { describe, expect, it } from 'vitest'
import { applyAction } from './actions'
import { buildView } from './visibility'
import { fixedRandom, idOf, startedMatch, withBallHeldBy } from './test-helpers'

describe('player view', () => {
  it('never exposes an opponent piece, its id, shape or cell', () => {
    const match = startedMatch()
    const serializedView = JSON.stringify(buildView(match, 'teal'))

    expect(serializedView).not.toContain('orange-')
    match.pieces
      .filter((piece) => piece.team === 'orange')
      .forEach((piece) => expect(serializedView).not.toContain(`{"x":${piece.cell.x},"y":${piece.cell.y}}`))
  })

  it('shows the public ball position but hides who holds it on the other side', () => {
    const view = buildView(withBallHeldBy(startedMatch(), idOf('orange', 'triangle')), 'teal')

    expect(view.ball).toEqual({ cell: { x: 6, y: 1 }, possession: 'opponent', holderId: null, isProtected: false })
  })

  it('keeps moves and rotations private to the team that made them', () => {
    const moved = applyAction(startedMatch(), 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 3, y: 1 } }, fixedRandom(0))
    const rotated = applyAction(moved, 'teal', { kind: 'rotate', pieceId: idOf('teal', 'square'), side: 'left' }, fixedRandom(0))
    const orangeView = buildView(rotated, 'orange')
    const tealView = buildView(rotated, 'teal')

    expect(orangeView.events.map((event) => event.payload.type)).toEqual(['placed', 'placed', 'turnEnded'])
    expect(tealView.events.map((event) => event.payload.type)).toContain('moved')
    expect(JSON.stringify(orangeView)).not.toContain('teal-')
  })
})
