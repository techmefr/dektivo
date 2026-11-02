const timerTickMs = 200
const urgentThresholdSeconds = 10

export const useActionTimer = () => {
  const store = useMatchStore()
  const remainingMs = ref(0)

  const secondsPerAction = computed(() => store.match?.settings.secondsPerAction ?? null)
  const hasTimer = computed(() => secondsPerAction.value !== null)
  const actionKey = computed(() => {
    const match = store.match
    return match ? `${match.turnNumber}:${match.activeTeam}:${match.actionsLeft}` : ''
  })

  watch(
    actionKey,
    () => {
      remainingMs.value = (secondsPerAction.value ?? 0) * 1000
    },
    { immediate: true },
  )

  let lastTickAt = performance.now()
  let intervalHandle: ReturnType<typeof setInterval> | undefined

  const tick = () => {
    const now = performance.now()
    const elapsed = now - lastTickAt
    lastTickAt = now
    if (!hasTimer.value || !store.isHumanTurn) {
      return
    }
    remainingMs.value = Math.max(0, remainingMs.value - elapsed)
    if (remainingMs.value === 0) {
      void store.endHumanTurn('timeout')
    }
  }

  onMounted(() => {
    lastTickAt = performance.now()
    intervalHandle = setInterval(tick, timerTickMs)
  })

  onBeforeUnmount(() => clearInterval(intervalHandle))

  const secondsLeft = computed(() => Math.ceil(remainingMs.value / 1000))
  const isUrgent = computed(() => hasTimer.value && secondsLeft.value <= urgentThresholdSeconds)
  const progress = computed(() =>
    secondsPerAction.value ? remainingMs.value / (secondsPerAction.value * 1000) : 1,
  )

  return { hasTimer, secondsLeft, isUrgent, progress }
}
