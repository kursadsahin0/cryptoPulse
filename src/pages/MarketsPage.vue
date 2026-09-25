<template>
  <q-page class="markets">
    <header class="markets__header">
      <div>
        <h1 class="markets__title">Cryptocurrency Markets</h1>
        <p class="markets__subtitle">
          Track prices, market capitalization and market performance in real time.
        </p>
      </div>

      <div class="markets__tools">
        <label class="search">
          <span class="visually-hidden">Search by name or symbol</span>
          <input
            v-model="query"
            class="search__input"
            type="search"
            placeholder="Search name or symbol"
            autocomplete="off"
          />
        </label>

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

        <button
          type="button"
          class="filter-btn"
          :aria-expanded="filtersOpen ? 'true' : 'false'"
          aria-controls="market-filters"
          @click="filtersOpen = !filtersOpen"
        >
          Filter
        </button>
      </div>
    </header>

    <div v-show="filtersOpen" id="market-filters" class="filters" role="radiogroup" aria-label="Market filter">
      <button
        v-for="item in filters"
        :key="item.id"
        type="button"
        class="filters__item"
        role="radio"
        :aria-checked="filter === item.id ? 'true' : 'false'"
        :class="{ 'filters__item--active': filter === item.id }"
        @click="selectFilter(item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <MarketTable
      :rows="pageRows"
      :currency="preferences.quoteCurrency"
      :status="market.listingsStatus"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      :page="page"
      :page-count="pageCount"
      :total="filtered.length"
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
import { useRoute, useRouter } from 'vue-router'
import MarketTable from '@/components/market/MarketTable.vue'
import { currencyShort, quoteCurrencies, usePreferencesStore } from '@/stores/preferences'
import { useCryptoStore } from '@/stores/crypto'
import { useMarketStore } from '@/stores/market'

const pageSize = 50
const largeCap = 10_000_000_000
const midCap = 1_000_000_000
const refreshMs = 30000

const filters = [
  { id: 'all', label: 'All', route: 'markets' },
  { id: 'trending', label: 'Trending', route: 'markets-trending' },
  { id: 'gainers', label: 'Gainers', route: 'markets-gainers' },
  { id: 'losers', label: 'Losers', route: 'markets-losers' },
  { id: 'large', label: 'Large Cap', route: 'markets' },
  { id: 'mid', label: 'Mid Cap', route: 'markets' },
]

const route = useRoute()
const router = useRouter()
const market = useMarketStore()
const preferences = usePreferencesStore()
const crypto = useCryptoStore()

const query = ref('')
const filtersOpen = ref(true)
const filter = ref('all')
const sortKey = ref('rank')
const sortDir = ref('asc')
const page = ref(1)
let refreshTimer = 0
let refreshedAt = 0

const trendingSet = computed(() => new Set(market.trendingSymbols))

const filtered = computed(() => {
  const term = query.value.trim().toLowerCase()
  return market.listings.filter((coin) => {
    if (term && !coin.name.toLowerCase().includes(term) && !coin.symbol.toLowerCase().includes(term)) {
      return false
    }
    if (filter.value === 'trending') return trendingSet.value.has(coin.symbol)
    if (filter.value === 'gainers') return coin.change24h != null && coin.change24h > 0
    if (filter.value === 'losers') return coin.change24h != null && coin.change24h < 0
    if (filter.value === 'large') return coin.marketCap != null && coin.marketCap >= largeCap
    if (filter.value === 'mid') {
      return coin.marketCap != null && coin.marketCap >= midCap && coin.marketCap < largeCap
    }
    return true
  })
})

const sorted = computed(() => {
  const rows = filtered.value.slice()
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

function selectFilter(id) {
  const item = filters.find((entry) => entry.id === id)
  if (!item) return
  filter.value = id
  const queryFilter = id === 'large' || id === 'mid' ? { cap: id } : {}
  router.push({ name: item.route, query: queryFilter })
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

function applyRoute() {
  if (route.name === 'markets-trending') filter.value = 'trending'
  else if (route.name === 'markets-gainers') filter.value = 'gainers'
  else if (route.name === 'markets-losers') filter.value = 'losers'
  else if (route.query.cap === 'large' || route.query.cap === 'mid') filter.value = route.query.cap
  else filter.value = 'all'
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
  applyRoute()
  reload()
  refreshTimer = window.setInterval(refresh, refreshMs)
  document.addEventListener('visibilitychange', refreshIfDue)
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', refreshIfDue)
})

watch(() => preferences.quoteCurrency, reload)
watch(() => route.fullPath, applyRoute)
watch([query, filter, sortKey, sortDir], () => {
  page.value = 1
})
watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})
</script>

<style lang="scss" scoped>
@import '../assets/styles/variables';
@import '../assets/styles/mixins';

.markets {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  min-width: 0;
}

.markets__header {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
}

.markets__title {
  margin: 0;
  color: var(--text-primary);
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
}

.markets__subtitle {
  margin: $spacing-2 0 0;
  max-width: 42rem;
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.markets__tools {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-2;
}

.search {
  flex: 1 1 220px;
}

.search__input,
.currency__select,
.filter-btn {
  min-height: 36px;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: $font-size-sm;

  @include focus-ring;
}

.search__input {
  width: 100%;
  padding: 0 $spacing-3;
}

.currency__select,
.filter-btn {
  padding: 0 $spacing-3;
}

.filter-btn {
  cursor: pointer;
}

@include below-mobile {
  .search {
    flex-basis: 100%;
  }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-2;
}

.filters__item {
  min-height: 32px;
  padding: 0 $spacing-3;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-secondary);
  font: inherit;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
  cursor: pointer;

  @include focus-ring;

  &--active {
    border-color: transparent;
    background: var(--accent);
    color: #fff;
  }
}

@include from-desktop {
  .markets__header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .markets__tools {
    flex: 0 1 460px;
    justify-content: flex-end;
  }
}
</style>
