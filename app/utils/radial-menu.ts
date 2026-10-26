import type { ActionIconName } from '~/utils/action-icons'

export type RadialMenuItem = {
  id: string
  label: string
  icon: ActionIconName
  isDisabled?: boolean
}

export type ScreenPoint = { x: number; y: number }

export const radialMenuRadius = 78
export const radialMenuItemSize = 64

export const clampMenuCenter = (anchor: ScreenPoint, viewport: { width: number; height: number }): ScreenPoint => {
  const margin = radialMenuRadius + radialMenuItemSize / 2 + 4
  const clampAxis = (value: number, size: number) =>
    size < margin * 2 ? size / 2 : Math.min(size - margin, Math.max(margin, value))
  return { x: clampAxis(anchor.x, viewport.width), y: clampAxis(anchor.y, viewport.height) }
}

export const radialItemOffset = (index: number, count: number): ScreenPoint => {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(1, count)
  return { x: Math.cos(angle) * radialMenuRadius, y: Math.sin(angle) * radialMenuRadius }
}
