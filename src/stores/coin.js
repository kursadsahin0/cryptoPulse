import { defineStore } from 'pinia'
import { fetchChart, fetchCoin } from '@/services/api/market'
import { formatCurrency } from '@/utils/format'

let coinController = null
let chartController = null

const quoteKeys = ['price', 'change24h', 'volume', 'marketCap']

export const useCoinStore = defineStore('coin', {
  state: () => ({
    symbol: '',
    profile: null,
    quote: null,
    dominance: null,
    globalMarketCap: null,
    status: 'idle',
    chartPoints: [],
    chartStatus: 'idle',
    chartTimeframe: '24h',
  }),
  actions: {
    async load(symbol, currency, { background = false } = {}) {
      const nextSymbol = String(symbol ?? '').toUpperCase()
      if (!nextSymbol) return
      const switching = nextSymbol !== this.symbol
      this.symbol = nextSymbol
      coinController?.abort()
      coinController = new AbortController()
      const { signal } = coinController
      if (!background || switching || !this.profile) this.status = 'loading'
      if (switching) {
        this.profile = null
        this.quote = null
        this.dominance = null
        this.chartPoints = []
        this.chartStatus = 'idle'
      }

      try {
        const detail = await fetchCoin(nextSymbol, currency, signal)
        if (signal.aborted) return
        if (!detail) {
          if (!background || !this.profile) {
            this.profile = null
            this.quote = null
            this.status = 'empty'
          }
          return
        }
        this.profile = detail.profile
        this.globalMarketCap = detail.globalMarketCap
        this.dominance = detail.dominance
        if (background && this.quote) this.applyQuote(detail.quote)
        else this.quote = detail.quote
        this.status = 'ready'
      } catch (error) {
        if (signal.aborted || error.name === 'AbortError') return
        if (background && this.profile) return
        this.status = 'error'
      }

      await this.loadChart(currency, { background: background && !switching })
    },
    async loadChart(currency, { background = false } = {}) {
      const pair = this.profile?.symbol ?? this.symbol
      if (!pair) return
      chartController?.abort()
      chartController = new AbortController()
      const { signal } = chartController
      if (!background) this.chartStatus = 'loading'

      try {
        const points = await fetchChart(pair, currency, this.chartTimeframe, signal)
        if (signal.aborted) return
        if (background && !seriesChanged(this.chartPoints, points, currency)) return
        this.chartPoints = points
        this.chartStatus = points.length ? 'ready' : 'empty'
      } catch (error) {
        if (signal.aborted || error.name === 'AbortError') return
        if (background && this.chartPoints.length) return
        this.chartPoints = []
        this.chartStatus = 'error'
      }
    },
    async setTimeframe(id, currency) {
      if (!id || id === this.chartTimeframe) return
      this.chartTimeframe = id
      await this.loadChart(currency)
    },
    applyQuote(partial) {
      if (!this.quote || !partial) return
      const next = { ...this.quote }
      for (const key of quoteKeys) {
        if (partial[key] != null) next[key] = partial[key]
      }
      if (next.price != null && next.maxSupply) next.fdv = next.price * next.maxSupply
      this.quote = next
      if (next.marketCap != null && this.globalMarketCap) {
        this.dominance = (next.marketCap / this.globalMarketCap) * 100
      }
    },
  },
})

function seriesChanged(previous, next, currency) {
  if (!previous.length || previous.length !== next.length) return true
  const last = previous.at(-1)
  const incoming = next.at(-1)
  if (!last || !incoming || last.time !== incoming.time) return true
  return formatCurrency(last.value, currency) !== formatCurrency(incoming.value, currency)
}
