<script setup lang="ts">
const { t } = useI18n()
const preferences = usePreferencesStore()
</script>

<template>
  <main class="screen">
    <section class="panel settings">
      <h1 class="title-display settings__title">{{ t('settings.title') }}</h1>
      <LanguageSelect />
      <label class="settings__toggle">
        <input v-model="preferences.reducedMotion" type="checkbox" />
        {{ t('settings.reducedMotion') }}
      </label>
      <NuxtLink to="/" class="arcade-button arcade-button--ghost">{{ t('settings.back') }}</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: min(380px, 100%);
}

.settings__title {
  font-size: 1.8rem;
}

.settings__toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-weight: 700;
}

.settings__toggle input {
  width: 22px;
  height: 22px;
  accent-color: var(--highlight);
}
</style>
