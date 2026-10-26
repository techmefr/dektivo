import type { RandomSource } from './types'

export const rollDie = (faces: readonly number[], random: RandomSource): number => {
  const index = Math.min(faces.length - 1, Math.floor(random() * faces.length))
  const face = faces[index]
  if (face === undefined) {
    throw new RangeError('A die needs at least one face')
  }
  return face
}
