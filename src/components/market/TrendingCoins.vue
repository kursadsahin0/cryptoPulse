<template>
  <section class="trending" aria-labelledby="trending-title" :aria-busy="loading ? 'true' : 'false'">
    <h2 id="trending-title" class="trending__title">Trending</h2>

    <div v-if="loading" class="trending__row">
      <article v-for="index in 5" :key="index" class="coin coin--loading">
        <SkeletonBlock width="28px" height="28px" />
        <SkeletonBlock width="72%" height="14px" />
        <SkeletonBlock width="48%" height="14px" />
      </article>
    </div>

    <EmptyState
      v-else-if="status === 'error' || !coins.length"
      title="No trending markets"
      message="Trending assets are unavailable right now."
      retry
      @retry="emit('retry')"
    />

    <div v-else class="trending__row">
      <button
        v-for="coin in coins"
        :key="coin.id"
        type="button"
        class="coin"
        @click="emit('select', coin.id)"
      >
        <img class="coin__icon" :src="coin.image" alt="" width="28" height="28" />
        <span class="coin__name">
          {{ coin.name }}
          <span class="coin__symbol">{{ coin.symbol }}</span>
        </span>
        <LiveValue
          class="coin__price"
          :signature="formatCurrency(coin.price, currency)"
          :amount="coin.price"
        />
        <PriceChange :value="coin.change24h" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import { formatCurrency } from '@/utils/format'

const props = defineProps({
  coins: {
    type: Array,
    default: () => [],
  },
  currency: {
    type: String,
    default: 'usd',
  },
  status: {
    type: String,
    default: 'idle',
  },
})

const emit = defineEmits(['select', 'retry'])
const loading = computed(() => props.status === 'idle' || props.status === 'loading')
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.trending__title {
  margin-bottom: $spacing-3;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.trending {
  min-width: 0;
}

.trending__row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: $spacing-3;
}

.coin {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-2;
  min-height: 112px;
  padding: $spacing-3;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;

  @include focus-ring;

  &:hover {
    border-color: color-mix(in srgb, #{$accent-blue} 45%, var(--border-color));
  }
}

.coin--loading {
  cursor: default;
}

.coin__icon {
  display: block;
  width: 28px;
  height: 28px;
}

.coin__name {
  max-width: 100%;
  overflow: hidden;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coin__symbol {
  margin-left: $spacing-1;
  color: var(--text-muted);
  font-size: $font-size-xs;
}

.coin__price {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
}
</style>
