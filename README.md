# CryptoPulse

Real-time cryptocurrency analytics. Track the market, starred coins, and your own holdings in one place.

Prices refresh about every 30 seconds. Quote currencies include USD, EUR, GBP, TL, JPY, AUD, CAD, BRL, and MXN. Light and dark themes are available, and the layout works on phone, tablet, and desktop.

## Features

- **Dashboard** — market overview and a price chart
- **Markets** — coin list, trending, top gainers, and top losers
- **Coin detail** — price, chart, and market stats for a single asset
- **Watchlist** — starred coins with live prices
- **Portfolio** — holdings you enter, valued at the current price, with profit and loss when the average buy price is in the active currency

Watchlist, portfolio, currency, and theme are stored in the browser.

## Stack

- Vue 3
- Quasar
- Pinia
- Vue Router
- Vite
- SCSS

Market data comes from CoinGecko, CoinPaprika, and Binance. If one source does not respond, the app tries the next.

## Requirements

Node.js 22.12, 24, or 26+.

## Setup

```bash
npm install
npm run dev
```

The dev server runs at [http://localhost:9000](http://localhost:9000).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development |
| `npm run build` | Build for production |
| `npm run lint` | Format and lint |
| `npm run lint:check` | Check formatting and lint without writing files |
