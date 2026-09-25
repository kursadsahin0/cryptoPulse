import { defineStore } from 'pinia'

const storageKey = 'cryptopulse-portfolio'

function readHoldings() {
  if (typeof localStorage === 'undefined') return []
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(data)) return []
    return data.filter((item) => item && typeof item.id === 'string' && item.quantity > 0)
  } catch {
    return []
  }
}

export const usePortfolioStore = defineStore('portfolio', {
  state: () => ({
    holdings: readHoldings(),
  }),
  actions: {
    addHolding({ id, quantity, cost, costCurrency }) {
      if (!id || !(quantity > 0)) return
      const nextCost = cost > 0 ? cost : null
      const existing = this.holdings.find((item) => item.id === id)

      if (!existing) {
        this.holdings.push({
          id,
          quantity,
          cost: nextCost,
          costCurrency: nextCost == null ? null : costCurrency,
        })
      } else {
        const total = existing.quantity + quantity
        const sameCost =
          nextCost != null &&
          existing.cost != null &&
          existing.costCurrency === costCurrency
        existing.quantity = total
        if (sameCost) {
          existing.cost = (existing.cost * (total - quantity) + nextCost * quantity) / total
        } else if (existing.cost == null && nextCost != null) {
          existing.cost = nextCost
          existing.costCurrency = costCurrency
        }
      }

      this.persist()
    },
    removeHolding(id) {
      this.holdings = this.holdings.filter((item) => item.id !== id)
      this.persist()
    },
    persist() {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(storageKey, JSON.stringify(this.holdings))
    },
  },
})
