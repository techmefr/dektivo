import { expect, it } from 'vitest'
import { parseStadiumPreferences } from './stadium-preferences'

it('defaults to silent and tolerates malformed or unavailable storage', () => {
  for (const stored of [null, '', '{bad', 'null', '[]', 'false']) {
    expect(parseStadiumPreferences(stored)).toEqual({ enabled: false, volume: 35 })
  }
})
it('validates and clamps saved preferences', () => {
  expect(parseStadiumPreferences('{"enabled":true,"volume":200}')).toEqual({ enabled: true, volume: 100 })
  expect(parseStadiumPreferences('{"enabled":"true","volume":-1}')).toEqual({ enabled: false, volume: 0 })
  expect(parseStadiumPreferences('{"volume":"99"}').volume).toBe(35)
})
