import type { AiLevel, Marker, MatchSettings, MatchState, Team } from '#shared/game'

export type MatchSetup = {
  settings: MatchSettings
  aiLevel: AiLevel
  humanTeam: Team
  teamNames: Record<Team, string>
}

export type SavedMatch = {
  version: number
  setup: MatchSetup
  match: MatchState
  markers: Marker[]
  startedAt: number | null
}

const savedMatchStorageKey = 'dektivo.savedMatch'
const savedMatchVersion = 1

const isSavedMatch = (value: unknown): value is SavedMatch => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<SavedMatch>
  return (
    candidate.version === savedMatchVersion &&
    typeof candidate.setup?.humanTeam === 'string' &&
    typeof candidate.match?.phase === 'string' &&
    Array.isArray(candidate.match.pieces) &&
    Array.isArray(candidate.markers)
  )
}

export const readSavedMatch = (): SavedMatch | null => {
  try {
    const stored = window.localStorage.getItem(savedMatchStorageKey)
    const parsed: unknown = stored === null ? null : JSON.parse(stored)
    return isSavedMatch(parsed) && parsed.match.phase !== 'finished' ? parsed : null
  } catch {
    return null
  }
}

export const writeSavedMatch = (saved: Omit<SavedMatch, 'version'>): void => {
  try {
    window.localStorage.setItem(savedMatchStorageKey, JSON.stringify({ version: savedMatchVersion, ...saved }))
  } catch {
    return
  }
}

export const clearSavedMatch = (): void => {
  try {
    window.localStorage.removeItem(savedMatchStorageKey)
  } catch {
    return
  }
}
