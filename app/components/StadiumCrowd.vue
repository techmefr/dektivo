<script setup lang="ts">
import { createSpectators, spectatorFrame } from '~/utils/stadium-crowd'

const preferences = usePreferencesStore()
const match = useMatchStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const spectators = createSpectators()
const unavailable = ref(false)
let frame = 0
let lastDraw = 0
let observer: ResizeObserver | undefined
let disposed = false
const visible = ref(true)
const moving = computed(() => !preferences.reducedMotion && !match.isPaused && visible.value)

const draw = (seconds: number) => {
  const element = canvas.value
  if (!element) return
  const context = element.getContext('2d')
  if (!context) { unavailable.value = true; return }
  context.clearRect(0, 0, element.width, element.height)
  context.save()
  context.scale(element.width / 122, element.height / 98)
  context.translate(16, 14)
  for (const spectator of spectators) {
    const position = spectatorFrame(spectator, seconds, moving.value)
    context.beginPath()
    context.arc(position.x, position.y, position.radius, 0, Math.PI * 2)
    context.fillStyle = spectator.color
    context.fill()
  }
  context.restore()
}

const tick = (time: number) => {
  if (disposed || !moving.value) return
  if (time - lastDraw >= 50) {
    draw(time / 1000)
    lastDraw = time
  }
  frame = requestAnimationFrame(tick)
}

const restart = () => {
  cancelAnimationFrame(frame)
  draw(performance.now() / 1000)
  if (moving.value && !disposed && !unavailable.value) frame = requestAnimationFrame(tick)
}

const resize = () => {
  const element = canvas.value
  if (!element) return
  const bounds = element.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  element.width = Math.max(1, Math.round(bounds.width * ratio))
  element.height = Math.max(1, Math.round(bounds.height * ratio))
  restart()
}
const onVisibility = () => { visible.value = !document.hidden }
watch(moving, restart)

onMounted(() => {
  onVisibility()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(resize)
    if (canvas.value) observer.observe(canvas.value)
  }
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  resize()
})
onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(frame)
  observer?.disconnect()
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <g v-if="unavailable" class="stadium-crowd-static" aria-hidden="true" pointer-events="none">
    <circle v-for="(spectator, index) in spectators" :key="index" :cx="spectator.x" :cy="spectator.y"
      :r="spectator.radius" :fill="spectator.color" />
  </g>
  <foreignObject v-else x="-16" y="-14" width="122" height="98" pointer-events="none" aria-hidden="true">
    <canvas ref="canvas" class="stadium-crowd" />
  </foreignObject>
</template>

<style scoped>
.stadium-crowd { display: block; width: 100%; height: 100%; pointer-events: none; }
</style>
