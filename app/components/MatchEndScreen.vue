<script setup lang="ts">
import type { Team } from '#shared/game'

const emit = defineEmits<{ replay: []; home: [] }>()

const store = useMatchStore()
const { t } = useI18n()
const replayButton = useTemplateRef<HTMLButtonElement>('replayButton')

const view = computed(() => store.humanView)
const teamName = (team: Team) => store.setup?.teamNames[team] || t(`teams.${team}`)

const title = computed(() => {
  if (view.value?.result === 'draw') {
    return t('end.draw')
  }
  return view.value?.result === store.humanTeam ? t('end.victory') : t('end.defeat')
})

const duration = computed(() => {
  const elapsedSeconds = Math.max(0, Math.round(((store.endedAt ?? Date.now()) - (store.startedAt ?? Date.now())) / 1000))
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = String(elapsedSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

onMounted(() => replayButton.value?.focus())
</script>

<template>
  <div v-if="view" class="end-backdrop">
    <section class="end panel" role="dialog" aria-modal="true" :aria-label="title">
      <h2 class="title-display end__title" :class="{ 'end__title--win': view.result === store.humanTeam }">{{ title }}</h2>
      <p class="end__score">
        <span class="end__team end__team--teal">{{ teamName('teal') }}</span>
        <strong>{{ view.score.teal }} – {{ view.score.orange }}</strong>
        <span class="end__team end__team--orange">{{ teamName('orange') }}</span>
      </p>
      <dl class="end__stats">
        <div>
          <dt>{{ t('end.duration') }}</dt>
          <dd>{{ duration }}</dd>
        </div>
        <div>
          <dt>{{ t('end.turns') }}</dt>
          <dd>{{ view.turnNumber }}</dd>
        </div>
      </dl>
      <div class="end__actions">
        <button ref="replayButton" type="button" class="arcade-button" @click="emit('replay')">{{ t('end.replay') }}</button>
        <button type="button" class="arcade-button arcade-button--ghost" @click="emit('home')">{{ t('end.home') }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.end-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(3, 12, 14, 0.7);
}

.end {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: min(380px, 100%);
  text-align: center;
  animation: end-pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}

.end__title {
  font-size: clamp(2rem, 7vmin, 3.2rem);
}

.end__title--win {
  color: var(--highlight);
}

.end__score {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.6rem;
}

.end__team {
  font-size: 1rem;
  font-weight: 800;
}

.end__team--teal {
  color: var(--team-teal-light);
}

.end__team--orange {
  color: var(--team-orange-light);
}

.end__stats {
  display: flex;
  gap: 24px;
  margin: 0;
}

.end__stats dt {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.end__stats dd {
  margin: 0;
  font-weight: 800;
  font-size: 1.2rem;
}

.end__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

@keyframes end-pop {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
}
</style>
