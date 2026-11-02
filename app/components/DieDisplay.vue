<script setup lang="ts">
const store = useMatchStore()
const preferences = usePreferencesStore()
const { t } = useI18n()

const isVisible = ref(false)
const isRolling = ref(false)
let hideHandle: ReturnType<typeof setTimeout> | undefined
let rollHandle: ReturnType<typeof setTimeout> | undefined

const pipLayouts: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 30, y: 30 },
    { x: 70, y: 70 },
  ],
  3: [
    { x: 28, y: 28 },
    { x: 50, y: 50 },
    { x: 72, y: 72 },
  ],
}

const pips = computed(() => pipLayouts[store.dieValue ?? 1] ?? [])

watch(
  () => store.dieRollCount,
  () => {
    clearTimeout(hideHandle)
    clearTimeout(rollHandle)
    isVisible.value = true
    isRolling.value = true
    rollHandle = setTimeout(() => (isRolling.value = false), 450 * preferences.motionScale)
    hideHandle = setTimeout(() => (isVisible.value = false), 2200)
  },
)

onBeforeUnmount(() => {
  clearTimeout(hideHandle)
  clearTimeout(rollHandle)
})
</script>

<template>
  <div class="die-slot" aria-live="polite">
    <div v-if="isVisible" class="die" :class="{ 'die--rolling': isRolling }">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect x="6" y="6" width="88" height="88" rx="18" />
        <circle v-for="(pip, index) in isRolling ? pipLayouts[2] : pips" :key="index" :cx="pip.x" :cy="pip.y" r="9" />
      </svg>
      <span v-if="!isRolling" class="visually-hidden">{{ t('die.result', { value: store.dieValue }) }}</span>
    </div>
  </div>
</template>

<style scoped>
.die-slot {
  position: absolute;
  top: 3%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.die {
  width: clamp(44px, 8vmin, 72px);
  filter: drop-shadow(0 6px 0 rgba(0, 0, 0, 0.35));
}

.die rect {
  fill: #fffdf5;
  stroke: #2b1a00;
  stroke-width: 4;
}

.die circle {
  fill: #c0392b;
}

.die--rolling {
  animation: die-roll 0.45s ease-out;
}

@keyframes die-roll {
  from {
    transform: rotate(-200deg) scale(0.4);
  }
  to {
    transform: rotate(0) scale(1);
  }
}
</style>
