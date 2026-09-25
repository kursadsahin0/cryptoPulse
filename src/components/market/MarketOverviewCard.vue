<template>
  <article class="metric" :aria-busy="loading ? 'true' : 'false'">
    <h3 class="metric__title">{{ title }}</h3>

    <template v-if="loading">
      <SkeletonBlock width="72%" height="22px" />
      <SkeletonBlock width="40%" height="14px" />
    </template>

    <template v-else>
      <p class="metric__value">
        <LiveValue :signature="value" :amount="amount" />
      </p>
      <p v-if="change != null" class="metric__meta">
        <PriceChange :value="change" />
        <span class="metric__hint">24h</span>
      </p>
    </template>
  </article>
</template>

<script setup>
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    default: '—',
  },
  amount: {
    default: null,
  },
  change: {
    type: Number,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';

.metric {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
  min-height: 96px;
  padding: $spacing-3 $spacing-4;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
}

.metric__title {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric__value {
  color: var(--text-primary);
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
  font-variant-numeric: tabular-nums;
}

.metric__meta {
  display: flex;
  align-items: center;
  gap: $spacing-2;
}

.metric__hint {
  color: var(--text-muted);
  font-size: $font-size-xs;
}
</style>
