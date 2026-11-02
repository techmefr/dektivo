<script setup lang="ts">
const { locale } = useI18n()
const preferences = usePreferencesStore()

useHead({
  htmlAttrs: {
    lang: locale,
    class: computed(() => (preferences.reducedMotion ? 'reduced-motion' : '')),
  },
})
</script>

<template>
  <NuxtPage />
</template>
