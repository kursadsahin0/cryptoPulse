<template>
  <span class="live" :class="tone ? `live--${tone}` : null">{{ signature }}</span>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  signature: {
    type: String,
    default: '—',
  },
  amount: {
    default: null,
  },
})

const tone = ref('')
let timer = 0

watch(
  () => [props.signature, props.amount],
  ([signature, amount], previous) => {
    const prevSignature = previous?.[0]
    const prevAmount = previous?.[1]
    if (!prevSignature || prevSignature === signature || prevSignature === '—') return
    const current = Number(amount)
    const prior = Number(prevAmount)
    tone.value = Number.isFinite(current) && Number.isFinite(prior) && current < prior ? 'down' : 'up'
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      tone.value = ''
    }, 1400)
  },
)

onBeforeUnmount(() => {
  window.clearTimeout(timer)
})
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';

.live {
  box-decoration-break: clone;
  transition: background-color 180ms linear;
}

.live--up {
  background: color-mix(in srgb, #{$positive} 18%, transparent);
}

.live--down {
  background: color-mix(in srgb, #{$negative} 16%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .live {
    transition: none;
  }
}
</style>
