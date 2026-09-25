import { defineStore } from 'pinia'

const watchKey = 'cryptopulse-watchlist'

function readWatchlist() {
  if (typeof localStorage === 'undefined') return []
  try {
    const data = JSON.parse(localStorage.getItem(watchKey) ?? '[]')
    return Array.isArray(data) ? data.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export const useCryptoStore = defineStore('crypto', {
  state: () => ({
    selectedId: null,
    watchlist: readWatchlist(),
  }),
  getters: {
    watchedIds: (state) => new Set(state.watchlist),
  },
  actions: {
    isWatched(id) {
      return this.watchlist.includes(id)
    },
    toggleWatch(id) {
      if (!id) return
      const index = this.watchlist.indexOf(id)
      if (index === -1) this.watchlist.push(id)
      else this.watchlist.splice(index, 1)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(watchKey, JSON.stringify(this.watchlist))
      }
    },
  },
})
