import { describe, expect, it } from 'vitest'
import { PlacementRejectedError } from './errors'
import { defaultSettings } from './rules'
import { createMatch, placeTeam } from './state'
import { orangePlacement, tealPlacement } from './test-helpers'

describe('placement', () => {
  it('starts the match once both teams have placed their three pieces', () => {
    const match = placeTeam(placeTeam(createMatch(defaultSettings), 'teal', tealPlacement), 'orange', orangePlacement)

    expect(match.phase).toBe('playing')
    expect(match.pieces).toHaveLength(6)
    expect(match.activeTeam).toBe('teal')
    expect(match.actionsLeft).toBe(2)
  })

  it('rejects a team with two pieces of the same shape', () => {
    const twoSquares = [
      tealPlacement[0]!,
      { ...tealPlacement[0]!, cell: { x: 1, y: 1 } },
      tealPlacement[2]!,
    ]

    expect(() => placeTeam(createMatch(defaultSettings), 'teal', twoSquares)).toThrowError(
      new PlacementRejectedError('wrongPieceSet'),
    )
  })

  it('rejects a piece placed in the opponent half or on the midline', () => {
    const onMidline = [{ ...tealPlacement[0]!, cell: { x: 4, y: 0 } }, tealPlacement[1]!, tealPlacement[2]!]

    expect(() => placeTeam(createMatch(defaultSettings), 'teal', onMidline)).toThrowError(
      new PlacementRejectedError('outsideOwnHalf'),
    )
  })

  it('rejects two pieces on the same cell', () => {
    const stacked = [tealPlacement[0]!, { ...tealPlacement[1]!, cell: tealPlacement[0]!.cell }, tealPlacement[2]!]

    expect(() => placeTeam(createMatch(defaultSettings), 'teal', stacked)).toThrowError(
      new PlacementRejectedError('sharedCell'),
    )
  })

  it('refuses a second placement for the same team', () => {
    const match = placeTeam(createMatch(defaultSettings), 'teal', tealPlacement)

    expect(() => placeTeam(match, 'teal', tealPlacement)).toThrowError(new PlacementRejectedError('alreadyPlaced'))
  })
})
