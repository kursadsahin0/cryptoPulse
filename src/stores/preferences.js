import { defineStore } from 'pinia'

const storageKey = 'cryptopulse-preferences'

export const quoteCurrencies = [
  { code: 'usd', label: 'US Dollar' },
  { code: 'eur', label: 'Euro' },
  { code: 'gbp', label: 'British Pound' },
  { code: 'try', label: 'Turkish Lira', short: 'TL' },
  { code: 'jpy', label: 'Japanese Yen' },
  { code: 'aud', label: 'Australian Dollar' },
  { code: 'cad', label: 'Canadian Dollar' },
  { code: 'brl', label: 'Brazilian Real' },
  { code: 'mxn', label: 'Mexican Peso' },
]

export function currencyShort(code) {
  const item = quoteCurrencies.find((entry) => entry.code === code)
  return item?.short ?? code.toUpperCase()
}

const currencyCodes = quoteCurrencies.map((item) => item.code)

function readPreferences() {
  const fallback = { quoteCurrency: 'usd', theme: 'light' }

  if (typeof localStorage === 'undefined') return fallback

  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return fallback

    const data = JSON.parse(raw)

    return {
      quoteCurrency: currencyCodes.includes(data.quoteCurrency)
        ? data.quoteCurrency
        : fallback.quoteCurrency,
      theme: data.theme === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return fallback
  }
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => readPreferences(),
  actions: {
    setQuoteCurrency(code) {
      if (!currencyCodes.includes(code)) return
      this.quoteCurrency = code
      this.persist()
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      this.persist()
    },
    persist() {
      if (typeof localStorage === 'undefined') return

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          quoteCurrency: this.quoteCurrency,
          theme: this.theme,
        }),
      )
    },
  },
})
