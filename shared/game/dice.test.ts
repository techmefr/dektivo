import { describe, expect, it } from 'vitest'
import { rollDie } from './dice'
import { defaultRules } from './rules'
import { seededRandom } from './test-helpers'

describe('rollDie', () => {
  it('uses six faces holding 1, 1, 2, 2, 3, 3', () => {
    expect([...defaultRules.dieFaces].sort()).toEqual([1, 1, 2, 2, 3, 3])
  })

  it('only ever returns 1, 2 or 3 with roughly equal odds', () => {
    const random = seededRandom(42)
    const counts = new Map<number, number>()
    for (let roll = 0; roll < 6000; roll += 1) {
      const value = rollDie(defaultRules.dieFaces, random)
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    expect([...counts.keys()].sort()).toEqual([1, 2, 3])
    counts.forEach((count) => expect(count).toBeGreaterThan(1800))
  })

  it('maps the upper edge of the random range to the last face', () => {
    expect(rollDie(defaultRules.dieFaces, () => 0.999999)).toBe(3)
    expect(rollDie(defaultRules.dieFaces, () => 0)).toBe(1)
  })
})
