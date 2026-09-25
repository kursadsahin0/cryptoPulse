<template>
  <section class="board" :aria-busy="loading ? 'true' : 'false'">
    <div v-if="loading" class="board__panel">
      <div v-for="index in 8" :key="index" class="board__skeleton">
        <SkeletonBlock width="28px" height="14px" />
        <SkeletonBlock width="42%" height="14px" />
        <SkeletonBlock width="18%" height="14px" />
        <SkeletonBlock width="12%" height="14px" />
      </div>
    </div>

    <div v-else-if="status === 'error'" class="board__panel">
      <EmptyState
        title="Markets unavailable"
        message="Prices could not be loaded."
        retry
        @retry="emit('retry')"
      />
    </div>

    <div v-else-if="!rows.length" class="board__panel">
      <EmptyState title="No markets found" message="Try another search or filter." />
    </div>

    <template v-else>
      <div class="board__scroll">
        <table class="board__table">
          <colgroup>
            <col class="col-rank" />
            <col class="col-asset" />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col class="col-watch" />
          </colgroup>
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.id"
                scope="col"
                :class="{ 'is-sorted': sortKey === column.id }"
                :aria-sort="ariaSort(column.id)"
              >
                <button
                  v-if="column.sort"
                  type="button"
                  class="sort"
                  @click="emit('sort', column.id)"
                >
                  {{ column.label }}
                  <span class="sort__mark" aria-hidden="true">{{ mark(column.id) }}</span>
                </button>
                <span v-else>{{ column.label }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <MarketRow
              v-for="coin in rows"
              :key="coin.id"
              v-memo="[
                coin.rank,
                coin.price,
                coin.change24h,
                coin.change7d,
                coin.marketCap,
                coin.volume,
                coin.circulatingSupply,
                coin.image,
                currency,
                watchedIds.has(coin.id),
              ]"
              :coin="coin"
              :currency="currency"
              :watched="watchedIds.has(coin.id)"
              @toggle-watch="emit('toggle-watch', $event)"
            />
          </tbody>
        </table>
      </div>

      <div class="board__pager">
        <p class="board__count">{{ rangeLabel }}</p>
        <div class="board__pages" role="navigation" aria-label="Pagination">
          <button type="button" class="page" :disabled="page <= 1" @click="emit('page', page - 1)">
            Previous
          </button>
          <span class="board__current">{{ page }} / {{ pageCount }}</span>
          <button
            type="button"
            class="page"
            :disabled="page >= pageCount"
            @click="emit('page', page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import MarketRow from '@/components/market/MarketRow.vue'

const props = defineProps({
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
  sortKey: {
    type: String,
    default: 'rank',
  },
  sortDir: {
    type: String,
    default: 'asc',
  },
  page: {
    type: Number,
    default: 1,
  },
  pageCount: {
    type: Number,
    default: 1,
  },
  total: {
    type: Number,
    default: 0,
  },
  pageSize: {
    type: Number,
    default: 50,
  },
  watchedIds: {
    type: Object,
    default: () => new Set(),
  },
})

const emit = defineEmits(['sort', 'page', 'retry', 'toggle-watch'])

const columns = [
  { id: 'rank', label: 'Rank', sort: true },
  { id: 'asset', label: 'Asset', sort: false },
  { id: 'price', label: 'Price', sort: true },
  { id: 'change24h', label: '24h', sort: true },
  { id: 'change7d', label: '7d', sort: true },
  { id: 'marketCap', label: 'Market cap', sort: true },
  { id: 'volume', label: 'Volume', sort: true },
  { id: 'supply', label: 'Circulating supply', sort: false },
  { id: 'watch', label: 'Watchlist', sort: false },
]

const loading = computed(() => props.status === 'idle' || props.status === 'loading')

const rangeLabel = computed(() => {
  if (!props.total) return '0 assets'
  const start = (props.page - 1) * props.pageSize + 1
  const end = Math.min(props.page * props.pageSize, props.total)
  return `${start}–${end} of ${props.total.toLocaleString('en-US')}`
})

function ariaSort(id) {
  if (props.sortKey !== id) return 'none'
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
}

function mark(id) {
  if (props.sortKey !== id) return ''
  return props.sortDir === 'asc' ? '↑' : '↓'
}
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.board__panel,
.board__scroll {
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
}

.board__scroll {
  overflow-x: auto;
}

.board__skeleton {
  display: grid;
  grid-template-columns: 28px 1.4fr 0.8fr 0.6fr;
  gap: $spacing-3;
  align-items: center;
  padding: $spacing-3 $spacing-4;
  border-bottom: $border-width solid var(--border-color);
}

.board__table {
  width: 100%;
  min-width: 920px;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: $font-size-sm;
  font-variant-numeric: tabular-nums;
}

.col-rank {
  width: 64px;
}

.col-asset {
  width: 22%;
}

.col-watch {
  width: 72px;
}

th,
:deep(td) {
  padding: $spacing-3 $spacing-4;
  border-bottom: $border-width solid var(--border-color);
  text-align: right;
  white-space: nowrap;
}

th:nth-child(-n + 2),
:deep(td:nth-child(-n + 2)),
th:last-child,
:deep(td:last-child) {
  text-align: left;
}

th {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--bg-card);
}

th.is-sorted {
  color: $accent-blue;
}

.sort {
  display: inline-flex;
  align-items: center;
  gap: $spacing-1;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;

  @include focus-ring;
}

.sort__mark {
  min-width: 0.8em;
}

:deep(tr:last-child td) {
  border-bottom: 0;
}

.board__pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-3;
  margin-top: $spacing-3;
}

.board__count,
.board__current {
  color: var(--text-muted);
  font-size: $font-size-xs;
}

.board__pages {
  display: flex;
  align-items: center;
  gap: $spacing-2;
}

@include below-mobile {
  .board__table {
    min-width: 0;
    table-layout: auto;
  }

  .board__table,
  .board__table tbody {
    display: block;
  }

  thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  :deep(.market-row) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: $spacing-2 $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-bottom: $border-width solid var(--border-color);
  }

  :deep(.market-row:last-child) {
    border-bottom: 0;
  }

  :deep(.market-row td) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-2;
    min-width: 0;
    padding: 0;
    border: 0;
    text-align: right;
    white-space: normal;
  }

  :deep(.row__rank) {
    grid-column: 1;
    grid-row: 1;
    color: var(--text-muted);
    font-size: $font-size-xs;
  }

  :deep(.row__asset) {
    grid-column: 2;
    grid-row: 1;
    justify-content: flex-start;
  }

  :deep(.row__watch) {
    grid-column: 3;
    grid-row: 1;
    justify-content: flex-end;
  }

  :deep(.market-row td:not(.row__rank):not(.row__asset):not(.row__watch)) {
    grid-column: 1 / -1;
  }

  :deep(.market-row td:not(.row__rank):not(.row__asset):not(.row__watch)::before) {
    content: attr(data-label);
    color: var(--text-muted);
    font-size: $font-size-xs;
  }

  .board__pager {
    align-items: stretch;
    flex-direction: column;
  }

  .board__pages {
    justify-content: space-between;
  }
}

.page {
  min-height: 32px;
  padding: 0 $spacing-3;
  border: $border-width solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: $font-size-xs;
  cursor: pointer;

  @include focus-ring;

  &:disabled {
    color: var(--text-muted);
    cursor: default;
  }
}
</style>
