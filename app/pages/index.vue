<script setup lang="ts">
const { t } = useI18n()
const store = useMatchStore()

const canResume = computed(() => !!store.match && store.match.phase !== 'finished')
</script>

<template>
  <main class="screen home">
    <div class="home__logo" aria-hidden="true">
      <svg viewBox="0 0 120 60">
        <rect x="4" y="18" width="24" height="24" rx="4" fill="var(--team-teal)" stroke="#fff" stroke-width="2" />
        <path d="M60 14 L78 46 H42 Z" fill="var(--team-orange)" stroke="#fff" stroke-width="2" stroke-linejoin="round" />
        <path d="M102 12 L118 30 L102 48 L86 30 Z" fill="var(--team-teal)" stroke="#fff" stroke-width="2" stroke-linejoin="round" />
        <circle cx="60" cy="54" r="5" fill="#fff" stroke="#1d1d1d" stroke-width="1" />
      </svg>
    </div>
    <h1 class="title-display home__title">{{ t('app.name') }}</h1>
    <p class="home__tagline">{{ t('app.tagline') }}</p>

    <nav class="home__menu">
      <NuxtLink v-if="canResume" to="/match" class="arcade-button arcade-button--teal">{{ t('home.resume') }}</NuxtLink>
      <NuxtLink to="/setup" class="arcade-button">{{ t('home.playAi') }}</NuxtLink>
      <button type="button" class="arcade-button arcade-button--ghost" disabled>
        {{ t('home.playOnline') }}
        <span class="home__badge">{{ t('home.comingSoon') }}</span>
      </button>
      <NuxtLink to="/settings" class="arcade-button arcade-button--ghost">{{ t('home.settings') }}</NuxtLink>
    </nav>
  </main>
</template>

<style scoped>
.home__logo svg {
  width: clamp(120px, 22vmin, 200px);
  animation: logo-bounce 2.4s ease-in-out infinite;
}

.home__title {
  font-size: clamp(2.6rem, 10vmin, 4.5rem);
  color: var(--highlight);
}

.home__tagline {
  margin: -16px 0 0;
  color: var(--text-muted);
  font-weight: 700;
}

.home__menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(320px, 100%);
}

.home__badge {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--team-orange);
  color: #2b1300;
  font-size: 0.7rem;
}

@keyframes logo-bounce {
  50% {
    transform: translateY(-6px);
  }
}

@media (max-height: 480px) {
  .home {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px 32px;
  }

  .home__logo,
  .home__tagline {
    display: none;
  }
}
</style>
