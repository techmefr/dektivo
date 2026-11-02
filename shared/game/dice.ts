import type { RandomSource } from './types'

export const rollDie = (faces: readonly number[], random: RandomSource): number => {
  const index = Math.min(faces.length - 1, Math.floor(random() * faces.length))
  const face = faces[index]
  if (face === undefined) {
    throw new RangeError('A die needs at least one face')
  }
  return face
}

export const seededRandom = (seed: number): RandomSource => {
  let current = seed >>> 0
  return () => {
    current = (current + 0x6d2b79f5) >>> 0
    let mixed = current
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}
