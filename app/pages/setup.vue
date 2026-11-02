<script setup lang="ts">
import { defaultSettings, secondsPerActionOptions } from '#shared/game'
import type { ActionsPerTurn, AiLevel, Team } from '#shared/game'

const { t } = useI18n()
const store = useMatchStore()

const previousSetup = store.setup
const actionsPerTurn = ref<ActionsPerTurn>(previousSetup?.settings.actionsPerTurn ?? defaultSettings.actionsPerTurn)
const secondsPerAction = ref<number | null>(previousSetup?.settings.secondsPerAction ?? defaultSettings.secondsPerAction)
const goalsToWin = ref(previousSetup?.settings.goalsToWin ?? defaultSettings.goalsToWin)
const aiLevel = ref<AiLevel>(previousSetup?.aiLevel ?? 'easy')
const humanTeam = ref<Team>(previousSetup?.humanTeam ?? 'teal')
const humanTeamName = ref(previousSetup ? previousSetup.teamNames[previousSetup.humanTeam] : '')
const aiTeamName = ref(previousSetup ? previousSetup.teamNames[previousSetup.humanTeam === 'teal' ? 'orange' : 'teal'] : '')

const actionOptions: ActionsPerTurn[] = [1, 2]
const levelOptions: AiLevel[] = ['easy', 'medium']
const teamOptions: Team[] = ['teal', 'orange']
const goalOptions = [1, 2, 3, 5]

const timerLabel = (seconds: number | null) => (seconds === null ? t('setup.noTimer') : t('setup.seconds', { count: seconds }))

const startMatch = async () => {
  const humanName = humanTeamName.value.trim()
  const aiName = aiTeamName.value.trim()
  store.startMatch({
    settings: { ...defaultSettings, actionsPerTurn: actionsPerTurn.value, secondsPerAction: secondsPerAction.value, goalsToWin: goalsToWin.value },
    aiLevel: aiLevel.value,
    humanTeam: humanTeam.value,
    teamNames: humanTeam.value === 'teal' ? { teal: humanName, orange: aiName } : { teal: aiName, orange: humanName },
  })
  await navigateTo('/match')
}
</script>

<template>
  <main class="screen">
    <form class="panel setup" @submit.prevent="startMatch">
      <h1 class="title-display setup__title">{{ t('setup.title') }}</h1>

      <fieldset class="choice">
        <legend>{{ t('setup.actionsPerTurn') }}</legend>
        <label v-for="option in actionOptions" :key="option" class="choice__option">
          <input v-model="actionsPerTurn" type="radio" name="actions" :value="option" />
          <span>{{ t('setup.actionsCount', { count: option }, option) }}</span>
        </label>
      </fieldset>

      <fieldset class="choice">
        <legend>{{ t('setup.timer') }}</legend>
        <label v-for="option in secondsPerActionOptions" :key="String(option)" class="choice__option">
          <input v-model="secondsPerAction" type="radio" name="timer" :value="option" />
          <span>{{ timerLabel(option) }}</span>
        </label>
      </fieldset>

      <fieldset class="choice">
        <legend>{{ t('setup.aiLevel') }}</legend>
        <label v-for="option in levelOptions" :key="option" class="choice__option">
          <input v-model="aiLevel" type="radio" name="level" :value="option" />
          <span>{{ t(`setup.levels.${option}`) }}</span>
        </label>
      </fieldset>

      <fieldset class="choice">
        <legend>{{ t('setup.goalsToWin') }}</legend>
        <label v-for="option in goalOptions" :key="option" class="choice__option">
          <input v-model="goalsToWin" type="radio" name="goals" :value="option" />
          <span>{{ option }}</span>
        </label>
      </fieldset>

      <fieldset class="choice">
        <legend>{{ t('setup.yourColor') }}</legend>
        <label v-for="option in teamOptions" :key="option" class="choice__option" :class="`choice__option--${option}`">
          <input v-model="humanTeam" type="radio" name="team" :value="option" />
          <span>{{ t(`teams.${option}`) }}</span>
        </label>
      </fieldset>

      <div class="setup__names">
        <label class="text-field">
          <span>{{ t('setup.yourTeamName') }}</span>
          <input v-model="humanTeamName" type="text" maxlength="16" :placeholder="t(`teams.${humanTeam}`)" />
        </label>
        <label class="text-field">
          <span>{{ t('setup.opponentTeamName') }}</span>
          <input v-model="aiTeamName" type="text" maxlength="16" :placeholder="t(`teams.${humanTeam === 'teal' ? 'orange' : 'teal'}`)" />
        </label>
      </div>

      <div class="setup__actions">
        <NuxtLink to="/" class="arcade-button arcade-button--ghost">{{ t('setup.back') }}</NuxtLink>
        <button type="submit" class="arcade-button">{{ t('setup.start') }}</button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.setup {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px 24px;
  width: min(820px, 100%);
}

.setup__title,
.setup__names,
.setup__actions {
  grid-column: 1 / -1;
}

.setup__title {
  font-size: 1.8rem;
}

.choice {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.choice legend {
  margin-bottom: 8px;
  font-weight: 800;
}

.choice__option input {
  position: absolute;
  opacity: 0;
}

.choice__option span {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.1);
  font-weight: 700;
  cursor: pointer;
}

.choice__option input:checked + span {
  background: var(--highlight);
  color: #2b1a00;
}

.choice__option--teal input:checked + span {
  background: var(--team-teal);
  color: #fff;
}

.choice__option--orange input:checked + span {
  background: var(--team-orange);
  color: #2b1300;
}

.choice__option input:focus-visible + span {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}

.setup__names {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.text-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 700;
}

.text-field input {
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 2px var(--panel-border);
}

.setup__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
