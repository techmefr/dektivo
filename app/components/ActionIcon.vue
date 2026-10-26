<script setup lang="ts">
import type { ActionIconName } from '~/utils/action-icons'

const props = withDefaults(defineProps<{ name: ActionIconName; size?: number }>(), { size: 24 })
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="actionIconPaths[props.name]" />
  </svg>
</template>
