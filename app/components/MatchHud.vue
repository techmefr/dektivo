<script setup lang="ts">
import type { Team } from '#shared/game'

const emit = defineEmits<{ openLog: []; quit: [] }>()

const store = useMatchStore()
const { t } = useI18n()
const timer = useActionTimer()

const view = computed(() => store.displayedView)
const teams = computed<Team[]>(() => ['teal', 'orange'])
const teamName = (team: Team) => store.setup?.teamNames[team] || t(`teams.${team}`)
const isHumanActive = computed(() => view.value?.activeTeam === store.humanTeam)
const actionPips = computed(() =>
  Array.from({ length: view.value?.settings.actionsPerTurn ?? 0 }, (_, index) => index < (view.value?.actionsLeft ?? 0)),
)
const statusText = computed(() => {
  if (view.value?.phase === 'finished') {
    return t('log.matchEnded')
  }
  return isHumanActive.value ? t('hud.yourTurn') : t('hud.opponentThinking')
})
</script>

<template>
  <header v-if="view" class="hud">
    <button type="button" class="icon-button" :aria-label="t('hud.quit')" @click="emit('quit')">
      <ActionIcon name="home" :size="20" />
    </button>

    <div class="scoreboard" role="group" :aria-label="t('hud.turn', { number: view.turnNumber })">
      <template v-for="(team, index) in teams" :key="team">
        <span v-if="index === 1" class="scoreboard__separator" aria-hidden="true">–</span>
        <span class="scoreboard__team" :class="[`scoreboard__team--${team}`, { 'scoreboard__team--active': view.activeTeam === team }]">
          <span v-if="index === 0" class="scoreboard__name">{{ teamName(team) }}</span>
          <span class="scoreboard__score">{{ view.score[team] }}</span>
          <span v-if="index === 1" class="scoreboard__name">{{ teamName(team) }}</span>
        </span>
      </template>
    </div>

    <p class="status" :class="{ 'status--opponent': !isHumanActive }" aria-live="polite">
      <span class="status__dot" :class="`status__dot--${view.activeTeam}`" aria-hidden="true" />
      {{ statusText }}
    </p>

    <div class="actions-left" role="img" :aria-label="`${t('hud.actionsLeft')} : ${view.actionsLeft}`">
      <span class="actions-left__label">{{ t('hud.actionsLeft') }}</span>
      <span v-for="(isAvailable, index) in actionPips" :key="index" class="pip" :class="{ 'pip--used': !isAvailable }" />
    </div>

    <div
      class="timer"
      :class="{ 'timer--urgent': timer.isUrgent.value && isHumanActive }"
      role="timer"
      :aria-label="timer.hasTimer.value ? t('hud.timeLeft', { seconds: timer.secondsLeft.value }) : t('hud.noTimer')"
    >
      <span v-if="timer.hasTimer.value">{{ timer.secondsLeft.value }}</span>
      <span v-else aria-hidden="true">∞</span>
    </div>

    <button type="button" class="icon-button" :aria-label="store.isPaused ? t('hud.resume') : t('hud.pause')" @click="store.togglePause()">
      <ActionIcon :name="store.isPaused ? 'play' : 'pause'" :size="20" />
    </button>
    <button type="button" class="icon-button" :aria-label="t('hud.log')" @click="emit('openLog')">
      <ActionIcon name="log" :size="20" />
    </button>
    <button
      type="button"
      class="arcade-button end-turn"
      :disabled="!store.isHumanTurn"
      @click="store.endHumanTurn('manual')"
    >
      {{ t('hud.endTurn') }}
    </button>
  </header>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 10px;
  background: var(--panel);
  border-bottom: 1px solid var(--panel-border);
}

.scoreboard {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 12px;
  background: #050d10;
  box-shadow: inset 0 0 0 2px #24343a;
  font-family: var(--font-display);
}

.scoreboard__team {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 8px;
  border-radius: 8px;
}

.scoreboard__team--active {
  box-shadow: inset 0 0 0 2px var(--highlight);
}

.scoreboard__name {
  max-width: 9ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  font-size: 0.85rem;
}

.scoreboard__score {
  min-width: 1.6ch;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  color: var(--highlight);
  text-shadow: 0 0 8px rgba(255, 210, 63, 0.6);
}

.scoreboard__team--teal .scoreboard__name {
  color: var(--team-teal-light);
}

.scoreboard__team--orange .scoreboard__name {
  color: var(--team-orange-light);
}

.scoreboard__separator {
  color: var(--text-muted);
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto 0 4px;
  font-weight: 800;
  white-space: nowrap;
}

.status--opponent {
  color: var(--text-muted);
}

.status__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status__dot--teal {
  background: var(--team-teal-light);
}

.status__dot--orange {
  background: var(--team-orange);
}

.actions-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.actions-left__label {
  margin-right: 2px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.pip {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--highlight);
  box-shadow: 0 0 6px rgba(255, 210, 63, 0.7);
}

.pip--used {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: none;
}

.timer {
  min-width: 52px;
  padding: 4px 8px;
  border-radius: 10px;
  background: #050d10;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
  color: #9ff3c2;
}

.timer--urgent {
  color: var(--urgent);
  animation: urgent-blink 0.5s steps(2) infinite;
}

@keyframes urgent-blink {
  50% {
    opacity: 0.55;
  }
}

.end-turn {
  min-height: 44px;
  padding: 0 18px;
  white-space: nowrap;
}

@media (max-width: 760px), (max-height: 420px) {
  .hud {
    gap: 6px;
    padding: 4px 6px;
  }

  .scoreboard__name,
  .actions-left__label {
    display: none;
  }

  .status {
    font-size: 0.8rem;
  }

  .end-turn {
    padding: 0 12px;
    font-size: 0.9rem;
  }
}
</style>
