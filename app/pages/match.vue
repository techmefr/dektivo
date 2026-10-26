<script setup lang="ts">
const store = useMatchStore()
const { t } = useI18n()

const isLogOpen = ref(false)

if (!store.match) {
  await navigateTo('/setup', { replace: true })
}

const phase = computed(() => store.match?.phase ?? null)
const celebratingName = computed(() =>
  store.celebratingTeam ? store.setup?.teamNames[store.celebratingTeam] || t(`teams.${store.celebratingTeam}`) : '',
)

const replay = () => {
  store.restartMatch()
}

const goHome = async () => {
  store.leaveMatch()
  await navigateTo('/')
}
</script>

<template>
  <main class="match-screen">
    <p class="rotate-hint">{{ t('match.rotateDevice') }}</p>

    <PlacementStage v-if="phase === 'placement'" />

    <template v-else-if="phase">
      <MatchHud @open-log="isLogOpen = true" @quit="goHome" />
      <div class="match-screen__stage">
        <div class="match-screen__board">
          <MatchBoard />
          <DieDisplay />
          <div v-if="store.celebratingTeam" class="goal-banner" :class="`goal-banner--${store.celebratingTeam}`" role="status">
            <strong>{{ t('match.goal') }}</strong>
            <span>{{ celebratingName }}</span>
          </div>
        </div>
      </div>
      <MatchLog v-if="isLogOpen" @close="isLogOpen = false" />
      <div v-if="store.isPaused && phase === 'playing'" class="pause-overlay" role="dialog" aria-modal="true" :aria-label="t('hud.paused')">
        <p class="title-display pause-overlay__title">{{ t('hud.paused') }}</p>
        <button type="button" class="arcade-button" @click="store.togglePause()">{{ t('hud.resume') }}</button>
      </div>
      <MatchEndScreen v-if="phase === 'finished' && !store.isAnimating" @replay="replay" @home="goHome" />
    </template>
  </main>
</template>

<style scoped>
.match-screen {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  overflow: hidden;
}

.match-screen__stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  container-type: size;
}

.match-screen__board {
  position: relative;
  flex-shrink: 0;
  width: min(100cqw, calc(100cqh * 122 / 98));
}

@media (max-height: 520px) {
  .match-screen__stage {
    overflow: hidden;
    padding: 0;
  }

  .match-screen__board {
    width: min(calc(100cqw * 122 / 108), calc(100cqh * 122 / 84));
  }
}

.goal-banner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: goal-zoom 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}

.goal-banner strong {
  font-family: var(--font-display);
  font-size: clamp(3rem, 16cqh, 7rem);
  color: var(--highlight);
  text-shadow: 0 6px 0 #7a4b00, 0 0 30px rgba(255, 210, 63, 0.8);
}

.goal-banner span {
  padding: 4px 16px;
  border-radius: var(--radius-pill);
  font-weight: 800;
  font-size: 1.2rem;
}

.goal-banner--teal span {
  background: var(--team-teal);
}

.goal-banner--orange span {
  background: var(--team-orange);
  color: #2b1300;
}

@keyframes goal-zoom {
  from {
    opacity: 0;
    transform: scale(0.3) rotate(-8deg);
  }
}

.pause-overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: rgba(3, 12, 14, 0.75);
}

.pause-overlay__title {
  font-size: 2.4rem;
}

.rotate-hint {
  display: none;
  margin: 0;
  padding: 6px 12px;
  background: var(--team-orange);
  color: #2b1300;
  font-weight: 800;
  font-size: 0.85rem;
  text-align: center;
}

@media (orientation: portrait) and (max-width: 700px) {
  .rotate-hint {
    display: block;
  }
}
</style>
