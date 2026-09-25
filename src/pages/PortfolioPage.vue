<template>
  <q-page class="portfolio">
    <header class="portfolio__header">
      <div>
        <h1 class="portfolio__title">Portfolio</h1>
        <p class="portfolio__subtitle">Track what you hold and what it is worth at the live price.</p>
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

    <section class="summary" aria-label="Portfolio summary">
      <article class="summary__card">
        <h2>Total value</h2>
        <p><LiveValue :signature="valueLabel" :amount="totalValue" /></p>
      </article>
      <article class="summary__card">
        <h2>Invested</h2>
        <p>{{ investedLabel }}</p>
      </article>
      <article class="summary__card">
        <h2>Profit / loss</h2>
        <p>
          <template v-if="totalProfit == null">—</template>
          <PriceChange v-else :value="totalProfitPercent" />
          <span v-if="totalProfit != null" class="summary__amount">{{ profitLabel }}</span>
        </p>
      </article>
    </section>

    <form class="add" @submit.prevent="submit">
      <label>
        <span class="visually-hidden">Search coin</span>
        <input v-model="query" class="add__input" type="search" placeholder="Search coin" autocomplete="off" />
      </label>
      <label>
        <span class="visually-hidden">Coin</span>
        <select v-model="coinId" class="add__input" required>
          <option value="">Select coin</option>
          <option v-for="coin in suggestions" :key="coin.id" :value="coin.id">
            {{ coin.name }} ({{ coin.symbol }})
          </option>
        </select>
      </label>
      <label>
        <span class="visually-hidden">Quantity</span>
        <input
          v-model="quantity"
          class="add__input"
          type="number"
          min="0"
          step="any"
          inputmode="decimal"
          placeholder="Quantity"
          required
        />
      </label>
      <label>
        <span class="visually-hidden">Average buy price</span>
        <input
          v-model="cost"
          class="add__input"
          type="number"
          min="0"
          step="any"
          inputmode="decimal"
          :placeholder="`Avg buy (${currencyShort(preferences.quoteCurrency)})`"
        />
      </label>
      <button class="add__submit" type="submit">Add</button>
      <p v-if="formError" class="add__error" role="alert">{{ formError }}</p>
    </form>

    <div v-if="showEmpty" class="portfolio__empty">
      <p class="portfolio__empty-title">No holdings yet</p>
      <p class="portfolio__empty-copy">Add a coin and the amount you hold. Value follows the live market price.</p>
    </div>

    <div v-else-if="loading" class="portfolio__empty" aria-busy="true">
      <p class="portfolio__empty-copy">Loading market prices.</p>
    </div>

    <div v-else class="board" role="table" aria-label="Holdings">
      <div class="board__head" role="row">
        <span role="columnheader">Asset</span>
        <span role="columnheader">Amount</span>
        <span role="columnheader">Price</span>
        <span role="columnheader">Value</span>
        <span role="columnheader">Avg buy</span>
        <span role="columnheader">Profit</span>
        <span role="columnheader"><span class="visually-hidden">Remove</span></span>
      </div>
      <article v-for="row in rows" :key="row.id" class="holding" role="row">
        <div class="holding__asset" role="cell">
          <img
            v-if="row.image && !failedIcons.has(row.id)"
            class="holding__icon"
            :src="row.image"
            alt=""
            width="24"
            height="24"
            @error="hideIcon(row.id)"
          />
          <span v-else class="holding__mark" aria-hidden="true">{{ row.symbol.slice(0, 1) }}</span>
          <router-link :to="{ name: 'coin-detail', params: { symbol: row.symbol } }">
            {{ row.name }}
            <span>{{ row.symbol }}</span>
          </router-link>
        </div>
        <p role="cell"><span>Amount</span>{{ amountLabel(row.quantity) }}</p>
        <p role="cell"><span>Price</span>{{ money(row.price) }}</p>
        <p role="cell"><span>Value</span>{{ money(row.value) }}</p>
        <p role="cell">
          <span>Avg buy</span>
          {{ row.cost == null ? '—' : money(row.cost, row.costCurrency) }}
        </p>
        <p role="cell">
          <span>Profit</span>
          <PriceChange v-if="row.profitPercent != null" :value="row.profitPercent" />
          <template v-else>—</template>
        </p>
        <p role="cell">
          <button type="button" :aria-label="`Remove ${row.name}`" @click="portfolio.removeHolding(row.id)">
            Remove
          </button>
        </p>
      </article>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import { currencyShort, quoteCurrencies, usePreferencesStore } from '@/stores/preferences'
import { useMarketStore } from '@/stores/market'
import { usePortfolioStore } from '@/stores/portfolio'
import { formatCurrency } from '@/utils/format'

const refreshMs = 30000

const market = useMarketStore()
const preferences = usePreferencesStore()
const portfolio = usePortfolioStore()

const query = ref('')
const coinId = ref('')
const quantity = ref('')
const cost = ref('')
const formError = ref('')
const failedIcons = ref(new Set())
let refreshTimer = 0
let refreshedAt = 0

const suggestions = computed(() => {
  const term = query.value.trim().toLowerCase()
  return market.listings
    .filter((coin) => !term || coin.name.toLowerCase().includes(term) || coin.symbol.toLowerCase().includes(term))
    .slice(0, 40)
})

const rows = computed(() => {
  const currency = preferences.quoteCurrency
  return portfolio.holdings.map((holding) => {
    const coin = market.listings.find((item) => item.id === holding.id)
    const price = coin?.price ?? null
    const value = price == null ? null : price * holding.quantity
    const sameCurrency = holding.cost != null && holding.costCurrency === currency
    const profit = sameCurrency && value != null ? value - holding.cost * holding.quantity : null
    const profitPercent =
      profit != null && holding.cost ? (profit / (holding.cost * holding.quantity)) * 100 : null
    return {
      id: holding.id,
      name: coin?.name ?? labelFromId(holding.id),
      symbol: coin?.symbol ?? labelFromId(holding.id),
      image: coin?.image ?? '',
      quantity: holding.quantity,
      price,
      value,
      cost: holding.cost,
      costCurrency: holding.costCurrency || currency,
      profit,
      profitPercent,
    }
  })
})

const totalValue = computed(() => {
  const valued = rows.value.filter((row) => row.value != null)
  if (!valued.length) return null
  return valued.reduce((sum, row) => sum + row.value, 0)
})

const invested = computed(() => {
  const currency = preferences.quoteCurrency
  const priced = portfolio.holdings.filter(
    (item) => item.cost != null && item.costCurrency === currency,
  )
  if (!priced.length) return null
  return priced.reduce((sum, item) => sum + item.cost * item.quantity, 0)
})

const pricedRows = computed(() => rows.value.filter((row) => row.profit != null))

const totalProfit = computed(() => {
  if (!pricedRows.value.length) return null
  return pricedRows.value.reduce((sum, row) => sum + row.profit, 0)
})

const totalProfitPercent = computed(() => {
  const base = pricedRows.value.reduce((sum, row) => sum + row.cost * row.quantity, 0)
  if (!base || totalProfit.value == null) return null
  return (totalProfit.value / base) * 100
})

const valueLabel = computed(() => formatCurrency(totalValue.value, preferences.quoteCurrency))
const investedLabel = computed(() => formatCurrency(invested.value, preferences.quoteCurrency))
const profitLabel = computed(() => formatCurrency(totalProfit.value, preferences.quoteCurrency))

const loading = computed(
  () => !market.listings.length && (market.listingsStatus === 'idle' || market.listingsStatus === 'loading'),
)
const showEmpty = computed(() => !portfolio.holdings.length && !loading.value)

function money(value, currency = preferences.quoteCurrency) {
  return formatCurrency(value, currency)
}

function amountLabel(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value)
}

function hideIcon(id) {
  failedIcons.value = new Set([...failedIcons.value, id])
}

function labelFromId(id) {
  if (id.includes('-')) return id.split('-')[0].toUpperCase()
  return id.replace(/USDT$/i, '').toUpperCase()
}

function submit() {
  formError.value = ''
  const amount = Number(quantity.value)
  const buy = cost.value === '' ? null : Number(cost.value)
  if (!coinId.value) {
    formError.value = 'Choose a coin.'
    return
  }
  if (!(amount > 0)) {
    formError.value = 'Enter a quantity greater than zero.'
    return
  }
  if (buy != null && !(buy >= 0)) {
    formError.value = 'Buy price must be zero or more.'
    return
  }
  portfolio.addHolding({
    id: coinId.value,
    quantity: amount,
    cost: buy,
    costCurrency: preferences.quoteCurrency,
  })
  quantity.value = ''
  cost.value = ''
  query.value = ''
  coinId.value = ''
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
</script>

<style lang="scss" scoped>
@import '../assets/styles/variables';
@import '../assets/styles/mixins';

.portfolio {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  min-width: 0;
}

.portfolio__header,
.summary,
.add {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-3;
}

.portfolio__header {
  align-items: flex-end;
  justify-content: space-between;
  gap: $spacing-4;
}

.portfolio__title {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
}

.portfolio__subtitle,
.portfolio__empty-copy {
  margin: $spacing-2 0 0;
  max-width: 42rem;
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.currency__select,
.add__input,
.add__submit,
.holding button {
  min-height: 36px;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  font-size: $font-size-sm;

  @include focus-ring;
}

.currency__select,
.add__input {
  padding: 0 $spacing-3;
}

.add {
  align-items: center;
}

.add label {
  flex: 1 1 140px;
}

.add__input {
  width: 100%;
}

.add__submit {
  padding: 0 $spacing-4;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}

.add__error {
  flex: 1 1 100%;
  margin: 0;
  color: var(--negative);
  font-size: $font-size-sm;
}

.summary {
  display: grid;
  grid-template-columns: 1fr;
}

.summary__card {
  padding: $spacing-4;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
}

.summary__card h2 {
  margin: 0;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.summary__card p {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: $spacing-2;
  margin: $spacing-2 0 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
}

.summary__amount {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.portfolio__empty {
  padding: $spacing-8 $spacing-4;
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  text-align: center;
}

.portfolio__empty-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.board {
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
}

.board__head {
  display: none;
}

.holding {
  display: grid;
  gap: $spacing-2 $spacing-3;
  padding: $spacing-3 $spacing-4;
  border-bottom: $border-width solid var(--border-color);
}

.holding:last-child {
  border-bottom: 0;
}

.holding p {
  display: flex;
  justify-content: space-between;
  gap: $spacing-3;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.holding p span {
  color: var(--text-muted);
  font-size: $font-size-xs;
}

.holding__asset {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  min-width: 0;
}

.holding__asset a {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: inherit;
  font-weight: $font-weight-medium;
  text-decoration: none;
}

.holding__asset a span {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-regular;
}

.holding__icon,
.holding__mark {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  border-radius: 50%;
}

.holding__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
}

.holding button {
  padding: 0 $spacing-3;
  cursor: pointer;
}

@include from-tablet {
  .summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .board__head,
  .holding {
    grid-template-columns: minmax(160px, 1.6fr) repeat(5, minmax(96px, 1fr)) 92px;
    align-items: center;
    column-gap: $spacing-4;
  }

  .board__head {
    display: grid;
    padding: $spacing-3 $spacing-4;
    border-bottom: $border-width solid var(--border-color);
    color: var(--text-muted);
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .board__head span:nth-child(n + 2) {
    text-align: right;
  }

  .holding p {
    display: block;
    text-align: right;
    white-space: nowrap;
  }

  .holding p span {
    display: none;
  }

  .holding button {
    width: 100%;
  }
}

@include below-mobile {
  .add__submit {
    flex: 1 1 100%;
  }
}
</style>
