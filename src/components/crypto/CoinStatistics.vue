<template>
  <section class="stats" aria-labelledby="coin-stats-title" :aria-busy="loading ? 'true' : 'false'">
    <h2 id="coin-stats-title" class="stats__title">Statistics</h2>
    <div v-if="loading" class="stats__grid">
      <SkeletonBlock v-for="index in 8" :key="index" height="72px" />
    </div>
    <div v-else class="stats__grid">
      <article v-for="item in items" :key="item.label" class="stats__card">
        <h3>{{ item.label }}</h3>
        <p>{{ item.value }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import { formatCurrency, formatSupply } from '@/utils/format'

const props = defineProps({
  quote: { type: Object, default: null },
  currency: { type: String, default: 'usd' },
  loading: { type: Boolean, default: false },
})

const items = computed(() => {
  const quote = props.quote ?? {}
  const money = (value) => formatCurrency(value, props.currency, { compact: true })
  return [
    { label: 'Market cap', value: money(quote.marketCap) },
    { label: 'Fully diluted valuation', value: money(quote.fdv) },
    { label: '24h volume', value: money(quote.volume) },
    { label: 'Circulating supply', value: formatSupply(quote.circulatingSupply) },
    { label: 'Total supply', value: formatSupply(quote.totalSupply) },
    { label: 'Max supply', value: formatSupply(quote.maxSupply) },
    { label: 'All-time high', value: formatCurrency(quote.ath, props.currency) },
    { label: 'All-time low', value: formatCurrency(quote.atl, props.currency) },
  ]
})
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.stats__title {
  margin: 0 0 $spacing-3;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stats__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-3;
}

.stats__card {
  min-height: 72px;
  padding: $spacing-3 $spacing-4;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
}

.stats__card h3 {
  margin: 0;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}

.stats__card p {
  margin: $spacing-2 0 0;
  color: var(--text-primary);
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
}

@include from-tablet {
  .stats__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@include from-desktop {
  .stats__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
