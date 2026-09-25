<template>
  <q-page class="dashboard">
    <section class="dashboard__overview" aria-label="Market overview">
      <MarketOverviewCard
        v-for="card in overviewCards"
        :key="card.title"
        :title="card.title"
        :value="card.value"
        :amount="card.amount"
        :change="card.change"
        :loading="globalLoading"
      />
    </section>

    <MarketChart
      class="dashboard__chart"
      :coins="market.assets"
      :coin-id="market.chartCoinId"
      :currency="market.currency"
      :price="market.chartPrice"
      :change="market.chartChange"
      :timeframe="market.chartTimeframe"
      :points="market.chartPoints"
      :status="market.chartStatus"
      @select-coin="market.setChartCoin"
      @select-timeframe="market.setTimeframe"
      @retry="market.loadChart"
    />

    <TrendingCoins
      :coins="market.trending"
      :currency="market.currency"
      :status="market.trendingStatus"
      @select="market.setChartCoin"
      @retry="reload"
    />

    <div class="dashboard__movers">
      <TopGainers
        :rows="market.gainers"
        :currency="market.currency"
        :status="market.assetsStatus"
        @retry="reload"
      />
      <TopLosers
        :rows="market.losers"
        :currency="market.currency"
        :status="market.assetsStatus"
        @retry="reload"
      />
    </div>

    <MarketStatistics :stats="market.global" :status="market.globalStatus" @retry="reload" />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import MarketChart from '@/components/charts/MarketChart.vue'
import MarketOverviewCard from '@/components/market/MarketOverviewCard.vue'
import MarketStatistics from '@/components/market/MarketStatistics.vue'
import TopGainers from '@/components/market/TopGainers.vue'
import TopLosers from '@/components/market/TopLosers.vue'
import TrendingCoins from '@/components/market/TrendingCoins.vue'
import { useMarketStore } from '@/stores/market'
import { usePreferencesStore } from '@/stores/preferences'
import { formatCount, formatCurrency, formatPercent } from '@/utils/format'

const market = useMarketStore()
const preferences = usePreferencesStore()

const globalLoading = computed(
  () => market.globalStatus === 'idle' || market.globalStatus === 'loading',
)

const overviewCards = computed(() => {
  const stats = market.global
  const currency = market.currency

  return [
    {
      title: 'Total market cap',
      value: formatCurrency(stats?.marketCap?.[currency], currency, { compact: true }),
      amount: stats?.marketCap?.[currency] ?? null,
      change: stats?.marketCapChange ?? null,
    },
    {
      title: '24h trading volume',
      value: formatCurrency(stats?.volume?.[currency], currency, { compact: true }),
      amount: stats?.volume?.[currency] ?? null,
      change: stats?.volumeChange ?? null,
    },
    {
      title: 'BTC dominance',
      value: stats ? formatPercent(stats.btcDominance).replace('+', '') : '—',
      amount: stats?.btcDominance ?? null,
      change: null,
    },
    {
      title: 'Active cryptocurrencies',
      value: formatCount(stats?.activeCryptocurrencies),
      amount: stats?.activeCryptocurrencies ?? null,
      change: null,
    },
  ]
})

const refreshMs = 30000
let refreshTimer = 0
let refreshedAt = 0

function reload() {
  refreshedAt = Date.now()
  market.load(preferences.quoteCurrency)
}

function refresh() {
  if (document.hidden) return
  refreshedAt = Date.now()
  market.load(preferences.quoteCurrency, { background: true })
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

.dashboard {
  display: flex;
  flex-direction: column;
  gap: $spacing-6;
  min-width: 0;
  overflow-x: clip;

  > * {
    min-width: 0;
  }
}

.dashboard__overview {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-3;
}

.dashboard__movers {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-5;
}

@include from-tablet {
  .dashboard__overview {
    grid-template-columns: 1fr 1fr;
  }
}

@include from-desktop {
  .dashboard__overview {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .dashboard__movers {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
