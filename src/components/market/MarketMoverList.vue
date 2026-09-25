<template>
  <section class="movers" :aria-labelledby="titleId" :aria-busy="loading ? 'true' : 'false'">
    <h2 :id="titleId" class="movers__title">{{ title }}</h2>

    <div v-if="loading" class="movers__panel">
      <div v-for="index in 6" :key="index" class="movers__skeleton">
        <SkeletonBlock width="24px" height="14px" />
        <SkeletonBlock width="46%" height="14px" />
        <SkeletonBlock width="22%" height="14px" />
        <SkeletonBlock width="16%" height="14px" />
      </div>
    </div>

    <div v-else-if="status === 'error' || !rows.length" class="movers__panel">
      <EmptyState
        :title="`No ${title.toLowerCase()}`"
        message="This list will fill when market data is available."
        retry
        @retry="emit('retry')"
      />
    </div>

    <div v-else class="movers__panel">
      <table class="movers__table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Asset</th>
            <th scope="col">Price</th>
            <th scope="col">24h</th>
            <th scope="col">Market cap</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td data-label="#">{{ row.rank ?? '—' }}</td>
            <td data-label="Asset">
              <span class="asset">
                <img v-if="row.image" :src="row.image" alt="" width="18" height="18" />
                <span>{{ row.name }}</span>
                <span class="asset__symbol">{{ row.symbol }}</span>
              </span>
            </td>
            <td data-label="Price">
              <LiveValue :signature="formatCurrency(row.price, currency)" :amount="row.price" />
            </td>
            <td data-label="24h"><PriceChange :value="row.change24h" /></td>
            <td data-label="Market cap">{{ formatCurrency(row.marketCap, currency, { compact: true }) }}</td>
          </tr>
        </tbody>
      </table>
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
  title: {
    type: String,
    required: true,
  },
  rows: {
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

const emit = defineEmits(['retry'])
const loading = computed(() => props.status === 'idle' || props.status === 'loading')
const titleId = computed(() => `movers-${props.title.toLowerCase().replace(/\s+/g, '-')}`)
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.movers__title {
  margin-bottom: $spacing-3;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.movers__panel {
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  overflow-x: auto;
}

.movers__skeleton {
  display: grid;
  grid-template-columns: 24px 1.4fr 1fr 0.7fr;
  gap: $spacing-3;
  align-items: center;
  padding: $spacing-3 $spacing-4;
  border-bottom: $border-width solid var(--border-color);
}

.movers__table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;
  font-variant-numeric: tabular-nums;
}

th,
td {
  padding: $spacing-3 $spacing-4;
  border-bottom: $border-width solid var(--border-color);
  text-align: right;
  white-space: nowrap;
}

th:nth-child(-n + 2),
td:nth-child(-n + 2) {
  text-align: left;
}

th {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

td {
  color: var(--text-primary);
}

tr:last-child td {
  border-bottom: 0;
}

.asset {
  display: inline-flex;
  align-items: center;
  gap: $spacing-2;
}

.asset img {
  width: 18px;
  height: 18px;
}

.asset__symbol {
  color: var(--text-muted);
  font-size: $font-size-xs;
}

@include below-mobile {
  thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  tr {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-1 $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-bottom: $border-width solid var(--border-color);
  }

  td {
    display: flex;
    justify-content: space-between;
    gap: $spacing-2;
    padding: 0;
    border: 0;
    text-align: right;
    white-space: normal;
  }

  td:nth-child(-n + 2) {
    grid-column: 1 / -1;
    text-align: left;
  }

  td::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-size: $font-size-xs;
  }

  td:nth-child(-n + 2)::before {
    content: none;
  }
}
</style>
