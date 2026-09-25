<template>
  <section class="data" aria-labelledby="coin-market-title">
    <h2 id="coin-market-title" class="data__title">Market data</h2>
    <div v-if="loading" class="data__list">
      <SkeletonBlock v-for="index in 5" :key="index" height="18px" />
    </div>
    <dl v-else class="data__list">
      <div v-for="item in items" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import { formatCurrency, formatPercent, formatSupply } from '@/utils/format'

const props = defineProps({
  quote: { type: Object, default: null },
  dominance: { default: null },
  currency: { type: String, default: 'usd' },
  loading: { type: Boolean, default: false },
})

const items = computed(() => {
  const quote = props.quote ?? {}
  const money = (value) => formatCurrency(value, props.currency, { compact: true })
  return [
    { label: 'Market cap', value: money(quote.marketCap) },
    { label: 'Volume', value: money(quote.volume) },
    { label: 'Supply', value: formatSupply(quote.circulatingSupply) },
    { label: 'Dominance', value: formatPercent(props.dominance).replace('+', '') },
    { label: 'Rank', value: quote.rank != null ? `#${quote.rank}` : '—' },
  ]
})
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';

.data {
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  padding: $spacing-4;
}

.data__title {
  margin: 0 0 $spacing-3;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.data__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
  margin: 0;
}

.data__list div {
  display: flex;
  justify-content: space-between;
  gap: $spacing-3;
  padding-bottom: $spacing-3;
  border-bottom: $border-width solid var(--border-color);
}

.data__list div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.data__list dt {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.data__list dd {
  margin: 0;
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  font-variant-numeric: tabular-nums;
}
</style>
