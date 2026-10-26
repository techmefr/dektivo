const reducedMotionStorageKey = 'dektivo.reducedMotion'

const readStoredReducedMotion = (): boolean | null => {
  try {
    const stored = window.localStorage.getItem(reducedMotionStorageKey)
    return stored === null ? null : stored === 'true'
  } catch {
    return null
  }
}

const systemPrefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const usePreferencesStore = defineStore('preferences', () => {
  const reducedMotion = ref(readStoredReducedMotion() ?? systemPrefersReducedMotion())

  watch(reducedMotion, (isReduced) => {
    try {
      window.localStorage.setItem(reducedMotionStorageKey, String(isReduced))
    } catch {
      return
    }
  })

  const motionScale = computed(() => (reducedMotion.value ? 0.25 : 1))

  return { reducedMotion, motionScale }
})
