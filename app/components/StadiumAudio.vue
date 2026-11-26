<script setup lang="ts">
import { StadiumAudioEngine } from '~/utils/stadium-audio'

const { t } = useI18n()
const preferences = usePreferencesStore()
const match = useMatchStore()
const engine = new StadiumAudioEngine()
const unlocked = ref(false)
const playing = ref(false)
const error = ref(false)
const visible = ref(true)
let disposed = false
let revision = 0
const available = computed(() =>
  visible.value && !match.isPaused &&
  (match.match?.phase === 'placement' || match.match?.phase === 'playing' ||
    (match.match?.phase === 'finished' && match.isAnimating) || !!match.celebratingTeam),
)
const sync = async () => {
  const current = ++revision
  try {
    const result = await engine.setActive(unlocked.value && preferences.soundEnabled && available.value, preferences.soundVolume)
    if (!disposed && current === revision) playing.value = result
  } catch {
    if (!disposed && current === revision) {
      playing.value = false
      unlocked.value = false
      error.value = true
    }
  }
}
const toggle = () => {
  error.value = false
  if (unlocked.value && preferences.soundEnabled) {
    preferences.soundEnabled = false
    unlocked.value = false
  } else {
    preferences.soundEnabled = true
    unlocked.value = true
  }
  void sync()
}
const changeVolume = (event: Event) => {
  preferences.soundVolume = Number((event.target as HTMLInputElement).value)
}
watch(available, () => { void sync() })
watch(() => preferences.soundVolume, (volume) => engine.setVolume(volume))
watch(() => match.celebratingTeam, (team) => {
  if (team && playing.value && available.value) engine.cheer()
})
const onVisibility = () => { visible.value = !document.hidden }
onMounted(() => {
  onVisibility()
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  disposed = true
  ++revision
  document.removeEventListener('visibilitychange', onVisibility)
  void engine.dispose().catch(() => {})
})
</script>

<template>
  <section class="stadium-audio" :aria-label="t('stadium.title')">
    <button type="button" class="stadium-audio__button" :aria-pressed="unlocked && preferences.soundEnabled" @click="toggle">
      {{ t(unlocked && preferences.soundEnabled ? 'stadium.disable' : 'stadium.enable') }}
    </button>
    <label class="stadium-audio__volume">
      <span>{{ t('stadium.volume') }} {{ preferences.soundVolume }} %</span>
      <input type="range" min="0" max="100" step="1" :value="preferences.soundVolume"
        :aria-label="t('stadium.volume')" :aria-valuetext="preferences.soundVolume + ' %'" @input="changeVolume" />
    </label>
    <span v-if="error" class="stadium-audio__error" role="status">{{ t('stadium.error') }}</span>
  </section>
</template>

<style scoped>
.stadium-audio { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px 12px; padding: 3px 10px; background: var(--panel); }
.stadium-audio__button { min-height: 44px; padding: 4px 12px; border: 1px solid var(--panel-border); border-radius: var(--radius-pill); background: transparent; cursor: pointer; font-size: .8rem; }
.stadium-audio__button[aria-pressed="true"] { border-color: var(--highlight); color: var(--highlight); }
.stadium-audio__volume { display: flex; align-items: center; gap: 8px; font-size: .75rem; }
.stadium-audio__volume input { width: 85px; min-height: 44px; accent-color: var(--highlight); }
.stadium-audio__error { font-size: .75rem; max-width: 30em; }
</style>
