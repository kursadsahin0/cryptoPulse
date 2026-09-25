import { defineStore } from 'pinia'
import {
  fetchChart,
  fetchGlobal,
  fetchTickers,
  fetchTrendingSymbols,
} from '@/services/api/market'
import { formatCount, formatCurrency, formatPercent, formatSupply } from '@/utils/format'

let dashboardController = null
let chartController = null
let listingsController = null

export const useMarketStore = defineStore('market', {
  state: () => ({
    currency: 'usd',
    global: null,
    globalStatus: 'idle',
    assets: [],
    assetsStatus: 'idle',
    trending: [],
    trendingStatus: 'idle',
    chartCoinId: 'btc-bitcoin',
    chartTimeframe: '24h',
    chartPoints: [],
    chartStatus: 'idle',
    listings: [],
    listingsStatus: 'idle',
    trendingSymbols: [],
  }),
  getters: {
    gainers: (state) => rankByChange(state.assets, 'desc'),
    losers: (state) => rankByChange(state.assets, 'asc'),
    chartCoin(state) {
      return state.assets.find((asset) => asset.id === state.chartCoinId) ?? null
    },
    chartPrice(state) {
      const last = state.chartPoints.at(-1)
      return last?.value ?? this.chartCoin?.price ?? null
    },
    chartChange(state) {
      if (state.chartPoints.length < 2) return null
      const first = state.chartPoints[0].value
      const last = state.chartPoints.at(-1).value
      if (!first) return null
      return ((last - first) / first) * 100
    },
  },
  actions: {
    async load(currency, { background = false } = {}) {
      this.currency = currency
      dashboardController?.abort()
      dashboardController = new AbortController()
      const { signal } = dashboardController

      if (!background) {
        this.globalStatus = 'loading'
        this.assetsStatus = 'loading'
        this.trendingStatus = 'loading'
      }

      const [globalResult, tickerResult, trendingResult] = await Promise.allSettled([
        fetchGlobal(currency, signal),
        fetchTickers(currency, signal),
        fetchTrendingSymbols(signal),
      ])

      if (signal.aborted) return

      const tickers = settledValue(tickerResult) ?? []
      const symbols = settledValue(trendingResult) ?? []
      const global = settledValue(globalResult)

      if (global && global.ethDominance == null) {
        const ethereum = tickers.find((asset) => asset.symbol === 'ETH')
        const total = global.marketCap?.[currency]
        if (ethereum?.marketCap && total) {
          global.ethDominance = (ethereum.marketCap / total) * 100
        }
      }

      const known = new Map([...this.assets, ...this.trending].map((asset) => [asset.id, asset]))
      const normalized = tickers.map((asset) => {
        const previous = known.get(asset.id)
        return previous && sameDisplayedAsset(previous, asset, currency) ? previous : asset
      })
      const nextAssets = normalized.slice(0, 100)
      const nextTrending = symbols
        .map((symbol) => normalized.find((asset) => asset.symbol === symbol))
        .filter(Boolean)
        .slice(0, 12)

      if (!(background && globalResult.status === 'rejected')) {
        if (!background || !sameGlobal(this.global, global, currency)) {
          this.global = global
          this.globalStatus = settledStatus(globalResult)
        }
      }

      if (!(background && tickerResult.status === 'rejected')) {
        if (!background || !sameList(this.assets, nextAssets)) {
          this.assets = nextAssets
          this.assetsStatus = settledStatus(tickerResult)
        }
      }

      if (!(background && (tickerResult.status === 'rejected' || trendingResult.status === 'rejected'))) {
        if (!background || !sameList(this.trending, nextTrending)) {
          this.trending = nextTrending
          this.trendingStatus = nextTrending.length ? 'ready' : 'empty'
        }
      }

      if (!this.assets.some((asset) => asset.id === this.chartCoinId) && this.assets[0]) {
        this.chartCoinId = this.assets[0].id
      }

      await this.loadChart({ background })
    },
    async loadChart({ background = false } = {}) {
      chartController?.abort()
      chartController = new AbortController()
      const { signal } = chartController
      if (!background) this.chartStatus = 'loading'

      try {
        const symbol = this.chartCoin?.symbol ?? 'BTC'
        const points = await fetchChart(symbol, this.currency, this.chartTimeframe, signal)
        if (signal.aborted) return
        if (background && !chartChanged(this.chartPoints, points, this.currency)) return
        this.chartPoints = points
        this.chartStatus = points.length ? 'ready' : 'empty'
      } catch (error) {
        if (signal.aborted || error.name === 'AbortError') return
        if (background && this.chartPoints.length) return
        this.chartPoints = []
        this.chartStatus = 'error'
      }
    },
    async setChartCoin(id) {
      if (!id || id === this.chartCoinId) return
      this.chartCoinId = id
      await this.loadChart()
    },
    async setTimeframe(id) {
      if (id === this.chartTimeframe) return
      this.chartTimeframe = id
      await this.loadChart()
    },
    async loadListings(currency, { background = false } = {}) {
      this.currency = currency
      listingsController?.abort()
      listingsController = new AbortController()
      const { signal } = listingsController
      if (!background) this.listingsStatus = 'loading'

      const [tickerResult, trendingResult] = await Promise.allSettled([
        fetchTickers(currency, signal),
        fetchTrendingSymbols(signal),
      ])

      if (signal.aborted) return

      if (trendingResult.status === 'fulfilled') {
        this.trendingSymbols = trendingResult.value
      }

      if (background && tickerResult.status === 'rejected') return

      const tickers = settledValue(tickerResult) ?? []
      const known = new Map(this.listings.map((asset) => [asset.id, asset]))
      const next = tickers.map((asset) => {
        const previous = known.get(asset.id)
        return previous && sameDisplayedAsset(previous, asset, currency) ? previous : asset
      })

      if (!background || !sameList(this.listings, next)) {
        this.listings = next
        this.listingsStatus = settledStatus(tickerResult)
      }
    },
    patchListing(id, changes) {
      const index = this.listings.findIndex((asset) => asset.id === id)
      if (index === -1) return
      this.listings[index] = { ...this.listings[index], ...changes }
    },
  },
})

function rankByChange(assets, direction) {
  return assets
    .filter((asset) => asset.change24h != null)
    .slice()
    .sort((a, b) => (direction === 'desc' ? b.change24h - a.change24h : a.change24h - b.change24h))
    .slice(0, 8)
}

function settledValue(result) {
  return result.status === 'fulfilled' ? result.value : null
}

function sameDisplayedAsset(previous, next, currency) {
  return (
    previous.rank === next.rank &&
    previous.name === next.name &&
    previous.symbol === next.symbol &&
    formatCurrency(previous.price, currency) === formatCurrency(next.price, currency) &&
    formatPercent(previous.change24h) === formatPercent(next.change24h) &&
    formatCurrency(previous.marketCap, currency, { compact: true }) ===
      formatCurrency(next.marketCap, currency, { compact: true }) &&
    formatPercent(previous.change7d) === formatPercent(next.change7d) &&
    formatCurrency(previous.volume, currency, { compact: true }) ===
      formatCurrency(next.volume, currency, { compact: true }) &&
    formatSupply(previous.circulatingSupply) === formatSupply(next.circulatingSupply)
  )
}

function sameGlobal(previous, next, currency) {
  if (!previous || !next) return previous === next
  return (
    formatCurrency(previous.marketCap?.[currency], currency, { compact: true }) ===
      formatCurrency(next.marketCap?.[currency], currency, { compact: true }) &&
    formatCurrency(previous.volume?.[currency], currency, { compact: true }) ===
      formatCurrency(next.volume?.[currency], currency, { compact: true }) &&
    formatPercent(previous.marketCapChange) === formatPercent(next.marketCapChange) &&
    formatPercent(previous.volumeChange) === formatPercent(next.volumeChange) &&
    formatPercent(previous.btcDominance) === formatPercent(next.btcDominance) &&
    formatPercent(previous.ethDominance) === formatPercent(next.ethDominance) &&
    formatCount(previous.activeCryptocurrencies) === formatCount(next.activeCryptocurrencies)
  )
}

function sameList(previous, next) {
  return previous.length === next.length && previous.every((item, index) => item === next[index])
}

function chartChanged(previous, next, currency) {
  if (!previous.length || previous.length !== next.length) return true
  const last = previous.at(-1)
  const incoming = next.at(-1)
  if (!last || !incoming || last.time !== incoming.time) return true
  return formatCurrency(last.value, currency) !== formatCurrency(incoming.value, currency)
}

function settledStatus(result) {
  if (result.status === 'rejected') return 'error'
  const value = result.value
  if (Array.isArray(value)) return value.length ? 'ready' : 'empty'
  return value ? 'ready' : 'empty'
}
