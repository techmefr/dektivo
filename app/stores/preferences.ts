import { parseStadiumPreferences } from '~/utils/stadium-preferences'

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
  let storedAudio: string | null = null
  try { storedAudio = window.localStorage.getItem('dektivo.stadiumAudio') } catch {}
  const initialAudio = parseStadiumPreferences(storedAudio)
  const soundEnabled = ref(initialAudio.enabled)
  const soundVolume = ref(initialAudio.volume)
  watch([soundEnabled, soundVolume], ([enabled, volume]) => {
    try { window.localStorage.setItem('dektivo.stadiumAudio', JSON.stringify({ enabled, volume })) } catch {}
  })

  const reducedMotion = ref(readStoredReducedMotion() ?? systemPrefersReducedMotion())

  watch(reducedMotion, (isReduced) => {
    try {
      window.localStorage.setItem(reducedMotionStorageKey, String(isReduced))
    } catch {
      return
    }
  })

  const motionScale = computed(() => (reducedMotion.value ? 0.25 : 1))

  return { reducedMotion, motionScale, soundEnabled, soundVolume }
})
