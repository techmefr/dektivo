<script setup lang="ts">
type LocaleCode = 'fr' | 'en'

const { t, locale, setLocale } = useI18n()

const flags: Record<LocaleCode, string> = { fr: '🇫🇷', en: '🇬🇧' }
const nativeNames: Record<LocaleCode, string> = { fr: 'Français', en: 'English' }
const localeCodes: LocaleCode[] = ['fr', 'en']

const onChange = (event: Event) => {
  const value = event.target instanceof HTMLSelectElement ? event.target.value : ''
  const selected = localeCodes.find((code) => code === value)
  if (selected) {
    void setLocale(selected)
  }
}
</script>

<template>
  <label class="language-select">
    <span class="language-select__label">{{ t('settings.language') }}</span>
    <select :value="locale" @change="onChange">
      <option v-for="code in localeCodes" :key="code" :value="code" :lang="code">
        {{ flags[code] }} {{ nativeNames[code] }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.language-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 700;
}

.language-select select {
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 2px var(--panel-border);
}

.language-select option {
  background: var(--night);
}
</style>
