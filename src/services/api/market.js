const geckoUrl = 'https://api.coingecko.com/api/v3'
const paprikaUrl = 'https://api.coinpaprika.com/v1'
const binanceUrl = 'https://api.binance.com/api/v3'

const quotePairs = {
  usd: 'USDT',
  eur: 'EUR',
  gbp: 'GBP',
  try: 'TRY',
  jpy: 'JPY',
  aud: 'AUD',
  cad: 'CAD',
  brl: 'BRL',
  mxn: 'MXN',
}

const fxPairs = {
  eur: { symbol: 'EURUSDT', invert: true },
  gbp: { symbol: 'GBPUSDT', invert: true },
  aud: { symbol: 'AUDUSDT', invert: true },
  try: { symbol: 'USDTTRY', invert: false },
  brl: { symbol: 'USDTBRL', invert: false },
  mxn: { symbol: 'USDTMXN', invert: false },
}

export const chartTimeframes = [
  { id: '1h', label: '1H', interval: '1m', limit: 60 },
  { id: '24h', label: '24H', interval: '15m', limit: 96 },
  { id: '7d', label: '7D', interval: '1h', limit: 168 },
  { id: '30d', label: '30D', interval: '4h', limit: 180 },
  { id: '3m', label: '3M', interval: '1d', limit: 90 },
  { id: '1y', label: '1Y', interval: '1d', limit: 365 },
]

export const detailTimeframes = [
  ...chartTimeframes,
  { id: 'all', label: 'ALL', interval: '1w', limit: 1000 },
]

export function findTimeframe(id) {
  return detailTimeframes.find((item) => item.id === id) ?? chartTimeframes[1]
}

export async function fetchGlobal(currency, signal) {
  try {
    return await fetchGeckoGlobal(signal)
  } catch (error) {
    if (signal?.aborted) throw error
    return fetchPaprikaGlobal(currency, signal)
  }
}

async function fetchGeckoGlobal(signal) {
  const data = await request(geckoUrl, '/global', signal)
  const payload = data.data ?? {}

  return {
    marketCap: payload.total_market_cap ?? {},
    volume: payload.total_volume ?? {},
    marketCapChange: numberOrNull(payload.market_cap_change_percentage_24h_usd),
    volumeChange: numberOrNull(payload.volume_change_percentage_24h_usd),
    btcDominance: numberOrNull(payload.market_cap_percentage?.btc),
    ethDominance: numberOrNull(payload.market_cap_percentage?.eth),
    activeCryptocurrencies: numberOrNull(payload.active_cryptocurrencies),
  }
}

async function fetchPaprikaGlobal(currency, signal) {
  const data = await request(paprikaUrl, '/global', signal)
  const quotePerUsd = await quoteUnitsPerUsd(currency, signal)
  const marketCap = scaleQuote(data.market_cap_usd, quotePerUsd)
  const volume = scaleQuote(data.volume_24h_usd, quotePerUsd)

  return {
    marketCap: marketCap == null ? {} : { [currency]: marketCap },
    volume: volume == null ? {} : { [currency]: volume },
    marketCapChange: numberOrNull(data.market_cap_change_24h),
    volumeChange: numberOrNull(data.volume_24h_change_24h),
    btcDominance: numberOrNull(data.bitcoin_dominance_percentage),
    ethDominance: null,
    activeCryptocurrencies: numberOrNull(data.cryptocurrencies_number),
  }
}

async function quoteUnitsPerUsd(currency, signal) {
  if (currency === 'usd') return 1

  const fx = fxPairs[currency]
  if (fx) {
    const data = await request(binanceUrl, `/ticker/price?symbol=${fx.symbol}`, signal)
    const price = Number(data.price)
    if (!(price > 0)) return null
    return fx.invert ? 1 / price : price
  }

  const quote = quotePairs[currency]
  if (!quote) return null

  try {
    const [usd, local] = await Promise.all([
      request(binanceUrl, '/ticker/price?symbol=BTCUSDT', signal),
      request(binanceUrl, `/ticker/price?symbol=BTC${quote}`, signal),
    ])
    const usdPrice = Number(usd.price)
    const localPrice = Number(local.price)
    if (usdPrice > 0 && localPrice > 0) return localPrice / usdPrice
  } catch (error) {
    if (signal?.aborted) throw error
  }

  const [usd, ticker] = await Promise.all([
    request(binanceUrl, '/ticker/price?symbol=BTCUSDT', signal),
    request(paprikaUrl, `/tickers/btc-bitcoin?quotes=${quote}`, signal),
  ])
  const usdPrice = Number(usd.price)
  const localPrice = Number(ticker.quotes?.[quote]?.price)
  return usdPrice > 0 && localPrice > 0 ? localPrice / usdPrice : null
}

function scaleQuote(usdValue, quotePerUsd) {
  const amount = numberOrNull(usdValue)
  if (amount == null || quotePerUsd == null) return null
  return amount * quotePerUsd
}

export async function fetchTickers(currency, signal) {
  try {
    return await fetchPaprikaTickers(currency, signal)
  } catch (error) {
    if (signal?.aborted) throw error
  }

  try {
    return await fetchGeckoTickers(currency, signal)
  } catch (error) {
    if (signal?.aborted) throw error
  }

  return fetchBinanceTickers(currency, signal)
}

async function fetchPaprikaTickers(currency, signal) {
  const quote = currency.toUpperCase()
  const rows = await request(paprikaUrl, `/tickers?quotes=${quote}`, signal)
  const priced = Array.isArray(rows) && rows.some((row) => row.quotes?.[quote]?.price)

  if (priced || currency === 'usd') {
    return rows
      .filter((row) => row.rank && row.quotes?.[quote])
      .sort((a, b) => a.rank - b.rank)
      .map((row) => normalizeTicker(row, quote))
  }

  const usdRows = await request(paprikaUrl, '/tickers?quotes=USD', signal)
  const rate = await quoteUnitsPerUsd(currency, signal)

  return usdRows
    .filter((row) => row.rank && row.quotes?.USD)
    .sort((a, b) => a.rank - b.rank)
    .map((row) => normalizeTicker(row, 'USD', rate))
}

async function fetchBinanceTickers(currency, signal) {
  const rows = await request(binanceUrl, '/ticker/24hr', signal)
  const rate = await quoteUnitsPerUsd(currency, signal)
  const markets = rows
    .filter((row) => row.symbol?.endsWith('USDT') && !/(UP|DOWN|BULL|BEAR)USDT$/.test(row.symbol))
    .map((row) => ({
      id: row.symbol,
      name: row.symbol.replace(/USDT$/, ''),
      symbol: row.symbol.replace(/USDT$/, ''),
      image: coinIcon(row.symbol.replace(/USDT$/, '')),
      price: scaleAmount(row.lastPrice, rate),
      change24h: numberOrNull(row.priceChangePercent),
      change7d: null,
      marketCap: null,
      volume: scaleAmount(row.quoteVolume, rate),
      circulatingSupply: null,
    }))
    .filter((row) => row.volume)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 100)

  return markets.map((row, index) => ({ ...row, rank: index + 1 }))
}

async function fetchGeckoTickers(currency, signal) {
  const params = new URLSearchParams({
    vs_currency: currency,
    order: 'market_cap_desc',
    per_page: '250',
    page: '1',
    price_change_percentage: '7d',
  })
  const rows = await request(geckoUrl, `/coins/markets?${params}`, signal)

  return rows
    .filter((row) => row.market_cap_rank)
    .map((row) => ({
      id: row.id,
      name: row.name,
      symbol: String(row.symbol ?? '').toUpperCase(),
      image: row.image || coinIcon(row.symbol),
      rank: numberOrNull(row.market_cap_rank),
      price: numberOrNull(row.current_price),
      change24h: numberOrNull(row.price_change_percentage_24h),
      change7d: numberOrNull(row.price_change_percentage_7d_in_currency),
      marketCap: numberOrNull(row.market_cap),
      volume: numberOrNull(row.total_volume),
      circulatingSupply: numberOrNull(row.circulating_supply),
    }))
}

export async function fetchTrendingSymbols(signal) {
  const data = await request(geckoUrl, '/search/trending', signal)
  return (data.coins ?? []).map((entry) => entry.item?.symbol?.toUpperCase()).filter(Boolean)
}

export async function fetchChart(symbol, currency, timeframeId, signal) {
  const pair = quotePairs[currency] ?? 'USDT'
  const timeframe = findTimeframe(timeframeId)

  try {
    return await fetchKlines(`${symbol.toUpperCase()}${pair}`, timeframe, signal)
  } catch (error) {
    if (signal?.aborted || currency === 'usd' || pair === 'USDT') throw error
    const points = await fetchKlines(`${symbol.toUpperCase()}USDT`, timeframe, signal)
    const rate = await quoteUnitsPerUsd(currency, signal)
    if (rate == null) throw error
    return points.map((point) => ({
      ...point,
      open: point.open * rate,
      high: point.high * rate,
      low: point.low * rate,
      value: point.value * rate,
      volume: point.volume * rate,
    }))
  }
}

async function fetchKlines(symbol, timeframe, signal) {
  const params = new URLSearchParams({
    symbol,
    interval: timeframe.interval,
    limit: String(timeframe.limit),
  })
  const rows = await request(binanceUrl, `/klines?${params}`, signal)

  return rows.map((row) => ({
    time: row[0],
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    value: Number(row[4]),
    volume: Number(row[7]),
  }))
}

export async function fetchCoin(symbol, currency, signal) {
  const coinId = await findCoinId(symbol, signal)
  if (!coinId) return null

  const quote = currency.toUpperCase()
  const [profile, ticker, global] = await Promise.all([
    request(paprikaUrl, `/coins/${coinId}`, signal),
    request(paprikaUrl, `/tickers/${coinId}?quotes=${quote}`, signal),
    fetchGlobal(currency, signal).catch(() => null),
  ])

  if (currency !== 'usd' && !ticker.quotes?.[quote]?.price) {
    const [usdTicker, rate] = await Promise.all([
      request(paprikaUrl, `/tickers/${coinId}?quotes=USD`, signal),
      quoteUnitsPerUsd(currency, signal),
    ])
    return normalizeCoin(profile, usdTicker, global, currency, rate, 'USD')
  }

  return normalizeCoin(profile, ticker, global, currency)
}

async function findCoinId(symbol, signal) {
  const wanted = symbol.toUpperCase()
  const data = await request(
    paprikaUrl,
    `/search?q=${encodeURIComponent(wanted)}&c=currencies&limit=8`,
    signal,
  )
  const matches = (data.currencies ?? []).filter((coin) => coin.symbol?.toUpperCase() === wanted)
  matches.sort((a, b) => (a.rank ?? 99999) - (b.rank ?? 99999))
  return matches[0]?.id ?? null
}

function normalizeCoin(profile, ticker, global, currency, rate = 1, quoteKey) {
  const quote = quoteKey ?? currency.toUpperCase()
  const pricing = ticker.quotes?.[quote] ?? {}
  const price = scaleAmount(pricing.price, rate)
  const maxSupply = numberOrNull(ticker.max_supply)
  const marketCap = scaleAmount(pricing.market_cap, rate)
  const totalCap = numberOrNull(global?.marketCap?.[currency])

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      symbol: profile.symbol,
      image: profile.logo || `https://static.coinpaprika.com/coin/${profile.id}/logo.png`,
      description: plainText(profile.description),
      links: coinLinks(profile),
    },
    quote: {
      price,
      change24h: numberOrNull(pricing.percent_change_24h),
      rank: numberOrNull(ticker.rank),
      marketCap,
      volume: scaleAmount(pricing.volume_24h, rate),
      circulatingSupply: numberOrNull(ticker.circulating_supply ?? ticker.total_supply),
      totalSupply: numberOrNull(ticker.total_supply),
      maxSupply,
      ath: scaleAmount(pricing.ath_price, rate),
      atl: scaleAmount(pricing.atl_price, rate),
      fdv: price != null && maxSupply ? price * maxSupply : null,
    },
    dominance: marketCap != null && totalCap ? (marketCap / totalCap) * 100 : null,
    globalMarketCap: totalCap,
  }
}

function linkLabel(label, url) {
  try {
    return `${label} · ${new URL(url).hostname.replace(/^www\./, '')}`
  } catch {
    return label
  }
}

function coinLinks(profile) {
  const links = profile.links ?? {}
  const items = [
    ...(links.website ?? []).map((url) => ({ label: 'Website', url })),
    ...(links.explorer ?? []).map((url) => ({ label: linkLabel('Explorer', url), url })),
    ...(links.source_code ?? []).map((url) => ({ label: 'Source', url })),
  ]
  if (profile.whitepaper?.link) items.push({ label: 'Whitepaper', url: profile.whitepaper.link })

  return items.filter((item) => /^https?:\/\//i.test(item.url)).slice(0, 8)
}

function plainText(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTicker(row, quote, rate = 1) {
  const pricing = row.quotes[quote]

  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    image: `https://static.coinpaprika.com/coin/${row.id}/logo.png`,
    rank: numberOrNull(row.rank),
    price: scaleAmount(pricing.price, rate),
    change24h: numberOrNull(pricing.percent_change_24h),
    change7d: numberOrNull(pricing.percent_change_7d),
    marketCap: scaleAmount(pricing.market_cap, rate),
    volume: scaleAmount(pricing.volume_24h, rate),
    circulatingSupply: numberOrNull(row.circulating_supply ?? row.total_supply),
  }
}

function coinIcon(symbol) {
  const code = String(symbol ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return code ? `https://assets.coincap.io/assets/icons/${code}@2x.png` : ''
}

function scaleAmount(value, rate) {
  const amount = numberOrNull(value)
  if (amount == null || rate == null) return null
  return amount * rate
}

async function request(base, path, signal) {
  const response = await fetch(`${base}${path}`, {
    signal,
    headers: { accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Market data request failed (${response.status})`)
  }

  return response.json()
}

function numberOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
