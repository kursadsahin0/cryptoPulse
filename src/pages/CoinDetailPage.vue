<template>
  <q-page class="detail">
    <CoinHeader
      :profile="coin.profile"
      :quote="coin.quote"
      :currency="preferences.quoteCurrency"
      :loading="loading"
      :watched="watched"
      @toggle-watch="crypto.toggleWatch(coin.profile?.id)"
    />

    <EmptyState
      v-if="coin.status === 'error'"
      title="Coin unavailable"
      message="This market could not be loaded."
      retry
      @retry="reload"
    />
    <EmptyState
      v-else-if="coin.status === 'empty'"
      title="Coin not found"
      message="No cryptocurrency matches this symbol."
    />

    <template v-else>
      <CoinChart
        :points="coin.chartPoints"
        :status="coin.chartStatus"
        :timeframe="coin.chartTimeframe"
        :currency="preferences.quoteCurrency"
        :price="coin.quote?.price"
        :name="coin.profile?.name"
        @select-timeframe="setTimeframe"
        @retry="coin.loadChart(preferences.quoteCurrency)"
      />

      <CoinStatistics :quote="coin.quote" :currency="preferences.quoteCurrency" :loading="loading" />

      <div class="detail__split">
        <CoinAbout
          :name="coin.profile?.name"
          :description="coin.profile?.description"
          :links="coin.profile?.links ?? []"
          :loading="loading"
        />
        <CoinMarketData
          :quote="coin.quote"
          :dominance="coin.dominance"
          :currency="preferences.quoteCurrency"
          :loading="loading"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import CoinChart from '@/components/charts/CoinChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CoinAbout from '@/components/crypto/CoinAbout.vue'
import CoinHeader from '@/components/crypto/CoinHeader.vue'
import CoinMarketData from '@/components/crypto/CoinMarketData.vue'
import CoinStatistics from '@/components/crypto/CoinStatistics.vue'
import { useCoinStore } from '@/stores/coin'
import { useCryptoStore } from '@/stores/crypto'
import { usePreferencesStore } from '@/stores/preferences'

const refreshMs = 30000
const route = useRoute()
const coin = useCoinStore()
const crypto = useCryptoStore()
const preferences = usePreferencesStore()

const loading = computed(() => coin.status === 'idle' || coin.status === 'loading')
const watched = computed(() => crypto.isWatched(coin.profile?.id))
let refreshTimer = 0
let refreshedAt = 0

function reload() {
  refreshedAt = Date.now()
  coin.load(route.params.symbol, preferences.quoteCurrency)
}

function refresh() {
  if (document.hidden) return
  refreshedAt = Date.now()
  coin.load(route.params.symbol, preferences.quoteCurrency, { background: true })
}

function refreshIfDue() {
  if (!document.hidden && Date.now() - refreshedAt >= refreshMs) refresh()
}

function setTimeframe(id) {
  coin.setTimeframe(id, preferences.quoteCurrency)
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

watch(() => route.params.symbol, reload)
watch(() => preferences.quoteCurrency, reload)
watch(
  () => coin.profile?.name,
  (name) => {
    if (name) document.title = `${name} · CryptoPulse`
  },
)
</script>

<style lang="scss" scoped>
@import '../assets/styles/variables';
@import '../assets/styles/mixins';

.detail {
  display: flex;
  flex-direction: column;
  gap: $spacing-5;
  min-width: 0;
}

.detail__split {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-4;
}

@include from-desktop {
  .detail__split {
    grid-template-columns: 1.4fr 0.8fr;
    align-items: start;
  }
}
</style>
