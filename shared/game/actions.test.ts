import { describe, expect, it } from 'vitest'
import { applyAction, getPieceOptions } from './actions'
import { IllegalActionError } from './errors'
import { defaultRules } from './rules'
import { endTurn } from './turns'
import { buildView } from './visibility'
import { fixedRandom, idOf, orangePlacement, randomForFace, startedMatch, tealPlacement, withBallHeldBy } from './test-helpers'
import type { Cell, Facing, MatchState, PiecePlacement } from './types'

const anyFace = fixedRandom(0)

const relocate = (state: MatchState, pieceId: string, cell: Cell, facing?: Facing): MatchState => ({
  ...state,
  pieces: state.pieces.map((piece) =>
    piece.id === pieceId ? { ...piece, cell: { ...cell }, facing: facing ?? piece.facing } : piece,
  ),
})

const replaceShape = (placements: PiecePlacement[], shape: PiecePlacement['shape'], cell: Cell, facing?: Facing) =>
  placements.map((placement) =>
    placement.shape === shape ? { ...placement, cell, facing: facing ?? placement.facing } : placement,
  )

const lastPayloads = (state: MatchState, count: number) => state.events.slice(-count).map((event) => event.payload)

describe('moving', () => {
  it('moves one cell orthogonally and keeps the turn while actions remain', () => {
    const next = applyAction(startedMatch(), 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 3, y: 1 } }, anyFace)

    expect(next.pieces.find((piece) => piece.id === idOf('teal', 'triangle'))?.cell).toEqual({ x: 3, y: 1 })
    expect(next.activeTeam).toBe('teal')
    expect(next.actionsLeft).toBe(1)
  })

  it('refuses diagonal moves', () => {
    expect(() =>
      applyAction(startedMatch(), 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 3, y: 2 } }, anyFace),
    ).toThrowError(new IllegalActionError('illegalMove'))
  })

  it('refuses to act out of turn', () => {
    expect(() =>
      applyAction(startedMatch(), 'orange', { kind: 'rotate', pieceId: idOf('orange', 'square'), side: 'left' }, anyFace),
    ).toThrowError(new IllegalActionError('notYourTurn'))
  })

  it('picks up a free ball by stepping onto it', () => {
    const match = startedMatch({}, replaceShape(tealPlacement, 'triangle', { x: 3, y: 3 }))
    const next = applyAction(match, 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 4, y: 3 } }, anyFace)

    expect(next.ball).toEqual({ cell: { x: 4, y: 3 }, holderId: idOf('teal', 'triangle') })
    expect(lastPayloads(next, 1)[0]).toMatchObject({ type: 'ballPickedUp', team: 'teal' })
  })

  it('carries the ball with its holder', () => {
    const match = withBallHeldBy(startedMatch(), idOf('teal', 'triangle'))
    const next = applyAction(match, 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 3, y: 1 } }, anyFace)

    expect(next.ball.cell).toEqual({ x: 3, y: 1 })
  })

  it('blocks a move into a hidden opponent and only tells the mover', () => {
    const match = startedMatch({}, tealPlacement, replaceShape(orangePlacement, 'triangle', { x: 5, y: 1 }))
    const advanced = applyAction(match, 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 3, y: 1 } }, anyFace)
    const atMidline = applyAction(
      endTurn(endTurn(advanced, 'teal'), 'orange'),
      'teal',
      { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 4, y: 1 } },
      anyFace,
    )
    const bumped = applyAction(atMidline, 'teal', { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 5, y: 1 } }, anyFace)

    expect(bumped.pieces.find((piece) => piece.id === idOf('teal', 'triangle'))?.cell).toEqual({ x: 4, y: 1 })
    const blockedEvent = bumped.events.find((event) => event.payload.type === 'blocked')
    expect(blockedEvent?.audience).toBe('teal')
    expect(buildView(bumped, 'orange').events.some((event) => event.payload.type === 'blocked')).toBe(false)
    expect(bumped.activeTeam).toBe('orange')
  })

  it('tackles the ball carrier when moving into its cell', () => {
    const neighbours = relocate(
      relocate(startedMatch(), idOf('orange', 'triangle'), { x: 5, y: 1 }),
      idOf('teal', 'triangle'),
      { x: 4, y: 1 },
    )
    const tackled = applyAction(
      withBallHeldBy(neighbours, idOf('orange', 'triangle')),
      'teal',
      { kind: 'move', pieceId: idOf('teal', 'triangle'), to: { x: 5, y: 1 } },
      anyFace,
    )

    expect(tackled.ball).toEqual({ cell: { x: 4, y: 1 }, holderId: idOf('teal', 'triangle') })
    expect(tackled.pieces.find((piece) => piece.id === idOf('orange', 'triangle'))?.cell).toEqual({ x: 5, y: 1 })
    expect(lastPayloads(tackled, 1)[0]).toMatchObject({ type: 'tackled', team: 'teal' })
  })
})

describe('turn structure', () => {
  it('hands the turn over after a single action in one-action mode', () => {
    const next = applyAction(
      startedMatch({ actionsPerTurn: 1 }),
      'teal',
      { kind: 'rotate', pieceId: idOf('teal', 'square'), side: 'left' },
      anyFace,
    )

    expect(next.activeTeam).toBe('orange')
    expect(next.actionsLeft).toBe(1)
  })

  it('hands the turn over after two actions in two-action mode', () => {
    const rotate = { kind: 'rotate', pieceId: idOf('teal', 'square'), side: 'left' } as const
    const once = applyAction(startedMatch({ actionsPerTurn: 2 }), 'teal', rotate, anyFace)
    const twice = applyAction(once, 'teal', rotate, anyFace)

    expect(once.activeTeam).toBe('teal')
    expect(twice.activeTeam).toBe('orange')
    expect(twice.actionsLeft).toBe(2)
  })

  it('lets a player end the turn early', () => {
    expect(endTurn(startedMatch(), 'teal').activeTeam).toBe('orange')
  })

  it('ends the match as a draw when the turn limit is reached level', () => {
    const finished = endTurn(endTurn(startedMatch({ maxTurns: 2 }), 'teal'), 'orange')

    expect(finished.phase).toBe('finished')
    expect(finished.result).toBe('draw')
  })
})

describe('kicking', () => {
  const carrierAt = (cell: Cell, facing: Facing, orange: PiecePlacement[] = orangePlacement) =>
    withBallHeldBy(relocate(startedMatch({}, tealPlacement, orange), idOf('teal', 'triangle'), cell, facing), idOf('teal', 'triangle'))

  it('only offers kicks inside the facing cone and shots toward the opponent goal', () => {
    const options = getPieceOptions(buildView(carrierAt({ x: 3, y: 3 }, 'N'), 'teal'), idOf('teal', 'triangle'))

    expect(options.passDirections).toEqual(['NW', 'N', 'NE'])
    expect(options.shootDirections).toEqual(['NE'])
  })

  it('offers no kick to a piece without the ball', () => {
    const options = getPieceOptions(buildView(startedMatch(), 'teal'), idOf('teal', 'square'))

    expect(options.passDirections).toEqual([])
    expect(options.shootDirections).toEqual([])
  })

  it('passes to a teammate on the path whatever the die says', () => {
    const match = relocate(carrierAt({ x: 2, y: 3 }, 'E'), idOf('teal', 'diamond'), { x: 3, y: 4 })
    const next = applyAction(match, 'teal', { kind: 'pass', pieceId: idOf('teal', 'triangle'), direction: 'SE' }, randomForFace(defaultRules, 3))

    expect(next.ball).toEqual({ cell: { x: 3, y: 4 }, holderId: idOf('teal', 'diamond') })
  })

  it('stops the ball on an empty cell after the rolled distance', () => {
    const next = applyAction(carrierAt({ x: 2, y: 3 }, 'E'), 'teal', { kind: 'pass', pieceId: idOf('teal', 'triangle'), direction: 'E' }, randomForFace(defaultRules, 2))

    expect(next.ball).toEqual({ cell: { x: 4, y: 3 }, holderId: null })
    expect(next.events.some((event) => event.payload.type === 'dieRolled' && event.payload.value === 2)).toBe(true)
  })

  it('lets an opponent square intercept the ball', () => {
    const next = applyAction(
      carrierAt({ x: 3, y: 3 }, 'E', replaceShape(orangePlacement, 'square', { x: 5, y: 3 })),
      'teal',
      { kind: 'pass', pieceId: idOf('teal', 'triangle'), direction: 'E' },
      randomForFace(defaultRules, 3),
    )

    expect(next.ball).toEqual({ cell: { x: 5, y: 3 }, holderId: idOf('orange', 'square') })
    expect(next.events.at(-1)?.payload).toMatchObject({ type: 'ballCaught', team: 'orange', intercepted: true })
  })

  it('bounces the ball straight back off an opponent diamond', () => {
    const next = applyAction(
      carrierAt({ x: 3, y: 3 }, 'E', replaceShape(orangePlacement, 'diamond', { x: 5, y: 3 })),
      'teal',
      { kind: 'pass', pieceId: idOf('teal', 'triangle'), direction: 'E' },
      randomForFace(defaultRules, 2),
    )

    expect(next.ball).toEqual({ cell: { x: 4, y: 3 }, holderId: null })
    expect(next.events.some((event) => event.payload.type === 'ballDeflected' && event.payload.behavior === 'rebound')).toBe(true)
  })

  it('turns the ball toward where an opponent triangle faces', () => {
    const next = applyAction(
      carrierAt({ x: 3, y: 3 }, 'E', replaceShape(orangePlacement, 'triangle', { x: 5, y: 3 }, 'N')),
      'teal',
      { kind: 'pass', pieceId: idOf('teal', 'triangle'), direction: 'E' },
      randomForFace(defaultRules, 3),
    )

    expect(next.ball).toEqual({ cell: { x: 4, y: 2 }, holderId: null })
  })

  it('bounces off the side line', () => {
    const next = applyAction(carrierAt({ x: 3, y: 0 }, 'N'), 'teal', { kind: 'pass', pieceId: idOf('teal', 'triangle'), direction: 'NE' }, randomForFace(defaultRules, 3))

    expect(next.ball).toEqual({ cell: { x: 5, y: 2 }, holderId: null })
    expect(next.events.some((event) => event.payload.type === 'ballBouncedOffEdge')).toBe(true)
  })

  it('scores, resets to the kickoff and gives the ball to the conceding team', () => {
    const orange = replaceShape(orangePlacement, 'square', { x: 7, y: 6 })
    const kickoffCell = tealPlacement.find((placement) => placement.shape === 'triangle')?.cell
    const next = applyAction(carrierAt({ x: 6, y: 3 }, 'E', orange), 'teal', { kind: 'shoot', pieceId: idOf('teal', 'triangle'), direction: 'E' }, randomForFace(defaultRules, 1))

    expect(next.score).toEqual({ teal: 1, orange: 0 })
    expect(next.ball).toEqual({ cell: { x: 4, y: 3 }, holderId: null })
    expect(next.pieces.find((piece) => piece.id === idOf('teal', 'triangle'))?.cell).toEqual(kickoffCell)
    expect(next.activeTeam).toBe('orange')
  })

  it('ends the match when a team reaches the goal target', () => {
    const match = { ...carrierAt({ x: 6, y: 3 }, 'E', replaceShape(orangePlacement, 'square', { x: 7, y: 6 })) }
    match.settings = { ...match.settings, goalsToWin: 1 }
    const next = applyAction(match, 'teal', { kind: 'shoot', pieceId: idOf('teal', 'triangle'), direction: 'E' }, randomForFace(defaultRules, 1))

    expect(next.phase).toBe('finished')
    expect(next.result).toBe('teal')
  })

  it('misses wide when the ball reaches the end line outside the goal mouth', () => {
    const orange = replaceShape(orangePlacement, 'square', { x: 5, y: 6 })
    const next = applyAction(carrierAt({ x: 6, y: 0 }, 'E', orange), 'teal', { kind: 'shoot', pieceId: idOf('teal', 'triangle'), direction: 'E' }, randomForFace(defaultRules, 1))

    expect(next.score).toEqual({ teal: 0, orange: 0 })
    expect(next.ball.holderId).toBeNull()
  })
})
