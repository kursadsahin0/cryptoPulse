<template>
  <span class="skeleton" :style="{ width, height }" aria-hidden="true" />
</template>

<script setup>
defineProps({
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '14px',
  },
})
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';

.skeleton {
  display: block;
  background: color-mix(in srgb, var(--text-muted) 18%, var(--bg-elevated));
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
