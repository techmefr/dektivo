import { describe, expect, it } from 'vitest'
import { placeMarker, removeMarker, rotateMarker } from './markers'
import type { Marker } from './markers'

describe('deduction markers', () => {
  it('keeps a single marker per shape by moving it', () => {
    const first = placeMarker([], { x: 5, y: 1 }, 'square', 'W')
    const moved = placeMarker(first, { x: 6, y: 2 }, 'square', 'W')

    expect(moved).toEqual([{ cell: { x: 6, y: 2 }, kind: 'square', facing: 'W' }])
  })

  it('allows several unknown markers', () => {
    const markers = [{ x: 5, y: 1 }, { x: 6, y: 2 }, { x: 7, y: 3 }].reduce<Marker[]>(
      (current, cell) => placeMarker(current, cell, 'unknown', 'W'),
      [],
    )

    expect(markers.filter((marker) => marker.kind === 'unknown')).toHaveLength(3)
  })

  it('replaces whatever marker sat on the chosen cell', () => {
    const markers = placeMarker(placeMarker([], { x: 5, y: 1 }, 'unknown', 'W'), { x: 5, y: 1 }, 'diamond', 'W')

    expect(markers).toEqual([{ cell: { x: 5, y: 1 }, kind: 'diamond', facing: 'W' }])
  })

  it('rotates and removes a marker', () => {
    const placed = placeMarker([], { x: 5, y: 1 }, 'triangle', 'W')

    expect(rotateMarker(placed, { x: 5, y: 1 }, 'right')[0]?.facing).toBe('N')
    expect(removeMarker(placed, { x: 5, y: 1 })).toEqual([])
  })
})
