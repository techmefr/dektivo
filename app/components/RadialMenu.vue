<script setup lang="ts">
import type { RadialMenuItem, ScreenPoint } from '~/utils/radial-menu'

const props = defineProps<{ anchor: ScreenPoint; items: RadialMenuItem[]; label: string }>()
const emit = defineEmits<{ select: [itemId: string]; close: [] }>()

const { t } = useI18n()
const menuElement = useTemplateRef<HTMLElement>('menuElement')
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })

const center = computed(() => clampMenuCenter(props.anchor, viewport.value))

const positionedItems = computed(() =>
  props.items.map((item, index) => {
    const offset = radialItemOffset(index, props.items.length)
    return { ...item, left: `${center.value.x + offset.x}px`, top: `${center.value.y + offset.y}px` }
  }),
)

const trackViewport = () => {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('resize', trackViewport)
  window.addEventListener('keydown', closeOnEscape)
  menuElement.value?.querySelector<HTMLButtonElement>('.radial-menu__item:not(:disabled)')?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', trackViewport)
  window.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <Teleport to="body">
    <div class="radial-backdrop" @pointerdown.self="emit('close')">
      <div ref="menuElement" class="radial-menu" role="menu" :aria-label="props.label">
        <button
          v-for="item in positionedItems"
          :key="item.id"
          type="button"
          role="menuitem"
          class="radial-menu__item"
          :style="{ left: item.left, top: item.top }"
          :disabled="item.isDisabled"
          @click="emit('select', item.id)"
        >
          <ActionIcon :name="item.icon" :size="22" />
          <span class="radial-menu__label">{{ item.label }}</span>
        </button>
        <button
          type="button"
          class="radial-menu__close"
          :style="{ left: `${center.x}px`, top: `${center.y}px` }"
          :aria-label="t('actions.cancel')"
          @click="emit('close')"
        >
          <ActionIcon name="close" :size="16" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.radial-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.16);
}

.radial-menu__item,
.radial-menu__close {
  position: fixed;
  transform: translate(-50%, -50%);
  border: 0;
  cursor: pointer;
  animation: pop-in 0.16s ease-out backwards;
}

.radial-menu__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffffff, #dfe9e6);
  color: #0f2b2e;
  box-shadow: var(--shadow-pop);
}

.radial-menu__item:hover:not(:disabled) {
  background: linear-gradient(180deg, #fff6cc, #ffd23f);
}

.radial-menu__item:disabled {
  cursor: not-allowed;
  background: #8a9a97;
  color: #3b4a49;
  box-shadow: none;
  opacity: 0.6;
}

.radial-menu__label {
  max-width: 60px;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1.05;
  text-align: center;
}

.radial-menu__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(9, 28, 33, 0.9);
  color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.4);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
