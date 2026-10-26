<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

const store = useMatchStore()
const { t } = useI18n()
const describeEvent = useEventDescription()
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')

const entries = computed(() =>
  [...(store.humanView?.events ?? [])]
    .reverse()
    .map((event) => ({ id: event.id, turnNumber: event.turnNumber, text: describeEvent(event) })),
)

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', closeOnEscape)
  closeButton.value?.focus()
})

onBeforeUnmount(() => window.removeEventListener('keydown', closeOnEscape))
</script>

<template>
  <div class="log-backdrop" @click.self="emit('close')">
    <aside class="log panel" role="dialog" aria-modal="true" :aria-label="t('log.title')">
      <header class="log__header">
        <h2 class="title-display log__title">{{ t('log.title') }}</h2>
        <button ref="closeButton" type="button" class="icon-button" :aria-label="t('hud.closeLog')" @click="emit('close')">
          <ActionIcon name="close" :size="18" />
        </button>
      </header>
      <p v-if="entries.length === 0" class="log__empty">{{ t('log.empty') }}</p>
      <ol v-else class="log__list">
        <li v-for="entry in entries" :key="entry.id" class="log__entry">
          <span class="log__turn">{{ entry.turnNumber }}</span>
          <span>{{ entry.text }}</span>
        </li>
      </ol>
      <button v-if="store.match?.phase === 'finished'" type="button" class="arcade-button arcade-button--ghost log__download" @click="store.downloadRecord()">
        {{ t('end.downloadRecord') }}
      </button>
    </aside>
  </div>
</template>

<style scoped>
.log-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.35);
}

.log {
  display: flex;
  flex-direction: column;
  width: min(360px, 100%);
  height: 100%;
  border-radius: 0;
}

.log__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.log__title {
  font-size: 1.25rem;
}

.log__empty {
  color: var(--text-muted);
}

.log__list {
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.log__entry {
  display: flex;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--panel-border);
  font-size: 0.9rem;
}

.log__download {
  margin-top: 12px;
}

.log__turn {
  min-width: 2ch;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
