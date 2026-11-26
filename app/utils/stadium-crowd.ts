export type Spectator = { x: number; y: number; radius: number; phase: number; speed: number; color: string }

export const crowdMotion = 0.18
export const crowdScale = 1.1
const colors = ['#ef6f6c', '#f7d06b', '#7cc6fe', '#c3f0ca', '#e6c7fa']

export const createSpectators = (): Spectator[] => {
  const spectators: Spectator[] = []
  for (let row = 0; row < 44; row += 1) {
    for (let column = 0; column < 55; column += 1) {
      const x = -14.5 + column * 2.2
      const y = -12.5 + row * 2.2
      const seed = (row * 173 + column * 97) % 997
      const radius = 0.55 + (seed % 16) / 100
      const envelope = radius * crowdScale + Math.hypot(crowdMotion, crowdMotion)
      if (x + envelope >= -10 && x - envelope <= 100 && y + envelope >= -8 && y - envelope <= 78) continue
      const cornerX = Math.max(-10, Math.min(100, x))
      const cornerY = Math.max(-8, Math.min(78, y))
      if (Math.hypot(x - cornerX, y - cornerY) + envelope > 6) continue
      spectators.push({
        x, y, radius,
        phase: seed * 0.37, speed: 0.8 + (seed % 70) / 100,
        color: colors[seed % colors.length]!,
      })
    }
  }
  return spectators
}

export const spectatorFrame = (spectator: Spectator, seconds: number, moving: boolean) => {
  const phase = seconds * spectator.speed + spectator.phase
  return {
    x: spectator.x + (moving ? Math.sin(phase) * crowdMotion : 0),
    y: spectator.y + (moving ? Math.cos(phase * 1.3) * crowdMotion : 0),
    radius: spectator.radius * (moving ? 1 + Math.sin(phase * 0.7) * (crowdScale - 1) : 1),
  }
}

export const spectatorEnvelope = (spectator: Spectator) =>
  spectator.radius * crowdScale + Math.hypot(crowdMotion, crowdMotion)
