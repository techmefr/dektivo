import { describe, expect, it } from 'vitest'
import { createSpectators, spectatorEnvelope, spectatorFrame } from './stadium-crowd'

describe('stadium crowd geometry', () => {
  const spectators = createSpectators()
  it('has one deterministic crowd with unique seats and individual rhythms', () => {
    expect(spectators.length).toBeGreaterThan(200)
    expect(createSpectators()).toEqual(spectators)
    expect(new Set(spectators.map(({ x, y }) => x + ':' + y)).size).toBe(spectators.length)
    expect(new Set(spectators.map(({ speed, phase }) => speed + ':' + phase)).size).toBeGreaterThan(100)
  })
  it('keeps complete motion envelopes apart and inside the stands', () => {
    for (const [index, spectator] of spectators.entries()) {
      const radius = spectatorEnvelope(spectator)
      expect(spectator.x - radius).toBeGreaterThan(-16)
      expect(spectator.x + radius).toBeLessThan(106)
      expect(spectator.y - radius).toBeGreaterThan(-14)
      expect(spectator.y + radius).toBeLessThan(84)
      expect(spectator.x + radius < -10 || spectator.x - radius > 100 ||
        spectator.y + radius < -8 || spectator.y - radius > 78).toBe(true)
      for (const other of spectators.slice(index + 1)) {
        expect(Math.hypot(other.x - spectator.x, other.y - spectator.y))
          .toBeGreaterThan(radius + spectatorEnvelope(other))
      }
    }
  })
  it('bounds all moving frames and freezes reduced motion', () => {
    for (const spectator of spectators) {
      for (const seconds of [0, 0.15, 1, 7.2, 30, 1000]) {
        const position = spectatorFrame(spectator, seconds, true)
        expect(Math.hypot(position.x - spectator.x, position.y - spectator.y) + position.radius)
          .toBeLessThanOrEqual(spectatorEnvelope(spectator))
        expect(spectatorFrame(spectator, seconds, false))
          .toEqual({ x: spectator.x, y: spectator.y, radius: spectator.radius })
      }
      expect(spectatorFrame(spectator, 0, true)).not.toEqual(spectatorFrame(spectator, 30, true))
    }
  })
})
