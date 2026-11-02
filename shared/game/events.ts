import type { EventAudience, EventPayload, MatchState } from './types'

export const recordEvent = (draft: MatchState, audience: EventAudience, payload: EventPayload): void => {
  draft.events.push({ id: draft.nextEventId, turnNumber: draft.turnNumber, audience, payload })
  draft.nextEventId += 1
}

export const cloneState = (state: MatchState): MatchState => structuredClone(state)
