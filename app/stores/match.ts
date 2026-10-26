import {
  applyAction,
  attackFacing,
  buildView,
  chooseAiAction,
  chooseAiPlacement,
  createMatch,
  endTurn,
  opponentOf,
  placeMarker,
  placeTeam,
  removeMarker,
  rotateMarker,
} from '#shared/game'
import type {
  AiLevel,
  Cell,
  GameAction,
  MatchEvent,
  MatchSettings,
  MatchState,
  Marker,
  MarkerKind,
  PiecePlacement,
  PlayerView,
  RotationSide,
  Team,
  TurnEndReason,
} from '#shared/game'

export type MatchSetup = {
  settings: MatchSettings
  aiLevel: AiLevel
  humanTeam: Team
  teamNames: Record<Team, string>
}

const aiThinkingDelayMs = 650
const dieDisplayMs = 750
const ballStepMs = 150
const goalCelebrationMs = 1800
const pausePollMs = 200

const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds))

export const useMatchStore = defineStore('match', () => {
  const preferences = usePreferencesStore()

  const setup = shallowRef<MatchSetup | null>(null)
  const match = shallowRef<MatchState | null>(null)
  const markers = shallowRef<Marker[]>([])
  const ballOverride = shallowRef<Cell | null>(null)
  const dieValue = ref<number | null>(null)
  const dieRollCount = ref(0)
  const celebratingTeam = ref<Team | null>(null)
  const isAiThinking = ref(false)
  const isAnimating = ref(false)
  const isPaused = ref(false)
  const startedAt = ref<number | null>(null)
  const endedAt = ref<number | null>(null)
  let lastAnimatedEventId = 0
  let sessionNumber = 0

  const humanTeam = computed<Team>(() => setup.value?.humanTeam ?? 'teal')
  const aiTeam = computed<Team>(() => opponentOf(humanTeam.value))
  const humanView = computed(() => (match.value ? buildView(match.value, humanTeam.value) : null))
  const frozenView = shallowRef<PlayerView | null>(null)
  const displayedView = computed(() => frozenView.value ?? humanView.value)
  const isHumanTurn = computed(
    () =>
      humanView.value?.phase === 'playing' &&
      humanView.value.activeTeam === humanTeam.value &&
      !isAnimating.value &&
      !isPaused.value,
  )

  const scaled = (milliseconds: number): number => Math.round(milliseconds * preferences.motionScale)

  const resetSession = (): void => {
    sessionNumber += 1
    markers.value = []
    ballOverride.value = null
    frozenView.value = null
    dieValue.value = null
    celebratingTeam.value = null
    isAiThinking.value = false
    isAnimating.value = false
    isPaused.value = false
    startedAt.value = null
    endedAt.value = null
    lastAnimatedEventId = 0
  }

  const startMatch = (newSetup: MatchSetup): void => {
    resetSession()
    setup.value = newSetup
    match.value = createMatch(newSetup.settings, newSetup.humanTeam)
  }

  const restartMatch = (): void => {
    if (setup.value) {
      startMatch(setup.value)
    }
  }

  const leaveMatch = (): void => {
    resetSession()
    match.value = null
  }

  const waitWhilePaused = async (session: number): Promise<void> => {
    while (isPaused.value && session === sessionNumber) {
      await wait(pausePollMs)
    }
  }

  const replayKick = async (events: MatchEvent[], dieIndex: number, session: number): Promise<void> => {
    const kickEvent = events.slice(dieIndex).find((event) => event.payload.type === 'ballKicked')
    const dieEvent = events[dieIndex]
    if (!kickEvent || kickEvent.payload.type !== 'ballKicked' || dieEvent?.payload.type !== 'dieRolled') {
      return
    }
    ballOverride.value = kickEvent.payload.from
    dieValue.value = dieEvent.payload.value
    dieRollCount.value += 1
    await wait(scaled(dieDisplayMs))
    for (const cell of kickEvent.payload.path) {
      if (session !== sessionNumber) {
        return
      }
      ballOverride.value = cell
      await wait(scaled(ballStepMs))
    }
  }

  const animatePublicEvents = async (viewBeforeAction: PlayerView | null): Promise<void> => {
    const session = sessionNumber
    const newEvents = (humanView.value?.events ?? []).filter((event) => event.id > lastAnimatedEventId)
    lastAnimatedEventId = newEvents.at(-1)?.id ?? lastAnimatedEventId
    isAnimating.value = true
    if (newEvents.some((event) => event.payload.type === 'dieRolled')) {
      frozenView.value = viewBeforeAction
    }
    for (const [index, event] of newEvents.entries()) {
      if (session !== sessionNumber) {
        return
      }
      if (event.payload.type === 'dieRolled') {
        await replayKick(newEvents, index, session)
      }
      if (event.payload.type === 'goal') {
        celebratingTeam.value = event.payload.team
        await wait(scaled(goalCelebrationMs))
        celebratingTeam.value = null
      }
    }
    ballOverride.value = null
    frozenView.value = null
    isAnimating.value = false
  }

  const noteMatchEnd = (): void => {
    if (match.value?.phase === 'finished' && endedAt.value === null) {
      endedAt.value = Date.now()
    }
  }

  const runAiTurn = async (): Promise<void> => {
    const session = sessionNumber
    const level = setup.value?.aiLevel ?? 'easy'
    isAiThinking.value = true
    while (match.value?.phase === 'playing' && match.value.activeTeam === aiTeam.value && session === sessionNumber) {
      await wait(scaled(aiThinkingDelayMs))
      await waitWhilePaused(session)
      if (session !== sessionNumber || !match.value) {
        return
      }
      const action = chooseAiAction(buildView(match.value, aiTeam.value), level, Math.random)
      const viewBeforeAction = humanView.value
      match.value = action
        ? applyAction(match.value, aiTeam.value, action, Math.random)
        : endTurn(match.value, aiTeam.value)
      await animatePublicEvents(viewBeforeAction)
    }
    isAiThinking.value = false
    noteMatchEnd()
  }

  const commit = async (next: MatchState): Promise<void> => {
    const viewBeforeAction = humanView.value
    match.value = next
    await animatePublicEvents(viewBeforeAction)
    noteMatchEnd()
    if (next.phase === 'playing' && match.value?.activeTeam === aiTeam.value) {
      await runAiTurn()
    }
  }

  const confirmPlacement = (placements: PiecePlacement[]): void => {
    if (!match.value) {
      return
    }
    const withHuman = placeTeam(match.value, humanTeam.value, placements)
    const withBoth = placeTeam(withHuman, aiTeam.value, chooseAiPlacement(withHuman.rules, aiTeam.value, Math.random))
    lastAnimatedEventId = withBoth.events.at(-1)?.id ?? 0
    match.value = withBoth
    startedAt.value = Date.now()
  }

  const play = async (action: GameAction): Promise<void> => {
    if (!match.value || !isHumanTurn.value) {
      return
    }
    await commit(applyAction(match.value, humanTeam.value, action, Math.random))
  }

  const endHumanTurn = async (reason: TurnEndReason): Promise<void> => {
    if (!match.value || !isHumanTurn.value) {
      return
    }
    await commit(endTurn(match.value, humanTeam.value, reason))
  }

  const togglePause = (): void => {
    isPaused.value = !isPaused.value
  }

  const setMarker = (cell: Cell, kind: MarkerKind): void => {
    markers.value = placeMarker(markers.value, cell, kind, attackFacing(aiTeam.value))
  }

  const clearMarker = (cell: Cell): void => {
    markers.value = removeMarker(markers.value, cell)
  }

  const turnMarker = (cell: Cell, side: RotationSide): void => {
    markers.value = rotateMarker(markers.value, cell, side)
  }

  return {
    setup,
    match,
    markers,
    ballOverride,
    dieValue,
    dieRollCount,
    celebratingTeam,
    isAiThinking,
    isAnimating,
    isPaused,
    startedAt,
    endedAt,
    humanTeam,
    aiTeam,
    humanView,
    displayedView,
    isHumanTurn,
    startMatch,
    restartMatch,
    leaveMatch,
    confirmPlacement,
    play,
    endHumanTurn,
    togglePause,
    setMarker,
    clearMarker,
    turnMarker,
  }
})
