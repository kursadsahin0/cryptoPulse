<template>
  <q-page class="watchlist">
    <header class="watchlist__header">
      <div>
        <h1 class="watchlist__title">Watchlist</h1>
        <p class="watchlist__subtitle">Prices for the coins you starred, updated with the market.</p>
      </div>

      <label class="currency">
        <span class="visually-hidden">Quote currency</span>
        <select
          class="currency__select"
          :value="preferences.quoteCurrency"
          @change="preferences.setQuoteCurrency($event.target.value)"
        >
          <option v-for="item in quoteCurrencies" :key="item.code" :value="item.code">
            {{ currencyShort(item.code) }}
          </option>
        </select>
      </label>
    </header>

    <div v-if="showEmpty" class="watchlist__empty">
      <p class="watchlist__empty-title">No coins on your watchlist</p>
      <p class="watchlist__empty-copy">Star a market to follow its price here.</p>
      <router-link class="watchlist__browse" :to="{ name: 'markets' }">Browse markets</router-link>
    </div>

    <MarketTable
      v-else
      :rows="pageRows"
      :currency="preferences.quoteCurrency"
      :status="tableStatus"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      :page="page"
      :page-count="pageCount"
      :total="sorted.length"
      :page-size="pageSize"
      :watched-ids="crypto.watchedIds"
      @sort="toggleSort"
      @page="page = $event"
      @retry="reload"
      @toggle-watch="crypto.toggleWatch"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MarketTable from '@/components/market/MarketTable.vue'
import { currencyShort, quoteCurrencies, usePreferencesStore } from '@/stores/preferences'
import { useCryptoStore } from '@/stores/crypto'
import { useMarketStore } from '@/stores/market'

const pageSize = 50
const refreshMs = 30000

const market = useMarketStore()
const preferences = usePreferencesStore()
const crypto = useCryptoStore()

const sortKey = ref('')
const sortDir = ref('asc')
const page = ref(1)
let refreshTimer = 0
let refreshedAt = 0

const saved = computed(() =>
  crypto.watchlist.map((id) => market.listings.find((coin) => coin.id === id) ?? placeholder(id)),
)

const sorted = computed(() => {
  if (!sortKey.value) return saved.value
  const rows = saved.value.slice()
  const direction = sortDir.value === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    const left = a[sortKey.value]
    const right = b[sortKey.value]
    if (left == null && right == null) return 0
    if (left == null) return 1
    if (right == null) return -1
    if (left === right) return 0
    return left > right ? direction : -direction
  })
  return rows
})

const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize)))
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return sorted.value.slice(start, start + pageSize)
})

const tableStatus = computed(() => {
  if (market.listings.length) return 'ready'
  return market.listingsStatus
})

const showEmpty = computed(
  () => !crypto.watchlist.length && tableStatus.value !== 'idle' && tableStatus.value !== 'loading',
)

function placeholder(id) {
  const symbol = id.includes('-')
    ? id.split('-')[0].toUpperCase()
    : id.replace(/USDT$/i, '').toUpperCase()
  return {
    id,
    name: symbol || id,
    symbol: symbol || id,
    image: '',
    rank: null,
    price: null,
    change24h: null,
    change7d: null,
    marketCap: null,
    volume: null,
    circulatingSupply: null,
  }
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'rank' ? 'asc' : 'desc'
  }
  page.value = 1
}

function reload() {
  refreshedAt = Date.now()
  market.loadListings(preferences.quoteCurrency)
}

function refresh() {
  if (document.hidden) return
  refreshedAt = Date.now()
  market.loadListings(preferences.quoteCurrency, { background: true })
}

function refreshIfDue() {
  if (!document.hidden && Date.now() - refreshedAt >= refreshMs) refresh()
}

onMounted(() => {
  reload()
  refreshTimer = window.setInterval(refresh, refreshMs)
  document.addEventListener('visibilitychange', refreshIfDue)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', refreshIfDue)
})

watch(() => preferences.quoteCurrency, reload)
watch(
  () => crypto.watchlist.length,
  () => {
    if (page.value > pageCount.value) page.value = pageCount.value
  },
)
</script>

<style lang="scss" scoped>
@import '../assets/styles/variables';
@import '../assets/styles/mixins';

.watchlist {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  min-width: 0;
}

.watchlist__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: $spacing-4;
}

.watchlist__title {
  margin: 0;
  color: var(--text-primary);
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
}

.watchlist__subtitle {
  margin: $spacing-2 0 0;
  max-width: 42rem;
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.currency__select {
  min-height: 36px;
  padding: 0 $spacing-3;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: $font-size-sm;

  @include focus-ring;
}

.watchlist__empty {
  padding: $spacing-8 $spacing-4;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  text-align: center;
}

.watchlist__empty-title {
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.watchlist__empty-copy {
  margin-top: $spacing-1;
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.watchlist__browse {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  margin-top: $spacing-4;
  padding: 0 $spacing-4;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  text-decoration: none;

  @include focus-ring;

  &:hover {
    text-decoration: none;
  }
}
</style>
