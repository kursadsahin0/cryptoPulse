<template>
  <section class="stats" aria-labelledby="stats-title" :aria-busy="loading ? 'true' : 'false'">
    <h2 id="stats-title" class="visually-hidden">Market statistics</h2>

    <template v-if="loading">
      <div v-for="index in 5" :key="index" class="stats__item">
        <SkeletonBlock width="70%" height="12px" />
        <SkeletonBlock width="46%" height="18px" />
      </div>
    </template>

    <div v-else-if="status === 'error' || !stats" class="stats__empty">
      <EmptyState
        title="Statistics unavailable"
        message="Market statistics could not be loaded."
        retry
        @retry="emit('retry')"
      />
    </div>

    <template v-else>
      <div class="stats__item">
        <p class="stats__label">Bitcoin dominance</p>
        <p class="stats__value">
          <LiveValue
            :signature="formatPercent(stats.btcDominance).replace('+', '')"
            :amount="stats.btcDominance"
          />
        </p>
      </div>
      <div class="stats__item">
        <p class="stats__label">Ethereum dominance</p>
        <p class="stats__value">
          <LiveValue
            :signature="formatPercent(stats.ethDominance).replace('+', '')"
            :amount="stats.ethDominance"
          />
        </p>
      </div>
      <div class="stats__item">
        <p class="stats__label">Market cap change</p>
        <PriceChange :value="stats.marketCapChange" />
      </div>
      <div class="stats__item">
        <p class="stats__label">Volume change</p>
        <PriceChange :value="stats.volumeChange" />
      </div>
      <div class="stats__item">
        <p class="stats__label">Listed assets</p>
        <p class="stats__value">
          <LiveValue
            :signature="formatCount(stats.activeCryptocurrencies)"
            :amount="stats.activeCryptocurrencies"
          />
        </p>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import { formatCount, formatPercent } from '@/utils/format'

const props = defineProps({
  stats: {
    type: Object,
    default: null,
  },
  status: {
    type: String,
    default: 'idle',
  },
})

const emit = defineEmits(['retry'])
const loading = computed(() => props.status === 'idle' || props.status === 'loading')
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.stats {
  display: grid;
  grid-template-columns: 1fr;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
}

.stats__item {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
  padding: $spacing-3 $spacing-4;
  border-bottom: $border-width solid var(--border-color);
}

.stats__item:last-child,
.stats__empty {
  border-bottom: 0;
}

.stats__empty {
  grid-column: 1 / -1;
}

.stats__label {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.stats__value {
  color: var(--text-primary);
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
}

@include from-tablet {
  .stats {
    grid-template-columns: 1fr 1fr;
  }
}

@include from-desktop {
  .stats {
    grid-template-columns: repeat(5, 1fr);
  }

  .stats__item {
    border-right: $border-width solid var(--border-color);
    border-bottom: 0;
  }

  .stats__item:last-child {
    border-right: 0;
  }
}
</style>
