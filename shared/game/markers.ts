import { isSameCell, rotateFacing } from './board'
import type { Cell, Facing, RotationSide, Shape } from './types'

export type MarkerKind = Shape | 'unknown'

export type Marker = {
  cell: Cell
  kind: MarkerKind
  facing: Facing
}

export const markerAt = (markers: readonly Marker[], cell: Cell): Marker | undefined =>
  markers.find((marker) => isSameCell(marker.cell, cell))

export const removeMarker = (markers: readonly Marker[], cell: Cell): Marker[] =>
  markers.filter((marker) => !isSameCell(marker.cell, cell))

export const placeMarker = (markers: readonly Marker[], cell: Cell, kind: MarkerKind, facing: Facing): Marker[] => {
  const previousShapeMarker = kind === 'unknown' ? undefined : markers.find((marker) => marker.kind === kind)
  const remaining = removeMarker(markers, cell).filter((marker) => marker !== previousShapeMarker)
  return [...remaining, { cell: { ...cell }, kind, facing: previousShapeMarker?.facing ?? facing }]
}

export const rotateMarker = (markers: readonly Marker[], cell: Cell, side: RotationSide): Marker[] =>
  markers.map((marker) =>
    isSameCell(marker.cell, cell) ? { ...marker, facing: rotateFacing(marker.facing, side) } : marker,
  )
