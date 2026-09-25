import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { title: 'Dashboard', nav: 'dashboard' },
      },
      {
        path: 'markets',
        name: 'markets',
        component: () => import('@/pages/MarketsPage.vue'),
        meta: { title: 'Cryptocurrency Markets', nav: 'markets', pageHeader: true },
      },
      {
        path: 'markets/trending',
        name: 'markets-trending',
        component: () => import('@/pages/MarketsPage.vue'),
        meta: { title: 'Trending', nav: 'markets-trending', pageHeader: true },
      },
      {
        path: 'markets/gainers',
        name: 'markets-gainers',
        component: () => import('@/pages/MarketsPage.vue'),
        meta: { title: 'Top Gainers', nav: 'markets-gainers', pageHeader: true },
      },
      {
        path: 'markets/losers',
        name: 'markets-losers',
        component: () => import('@/pages/MarketsPage.vue'),
        meta: { title: 'Top Losers', nav: 'markets-losers', pageHeader: true },
      },
      {
        path: 'coin/:symbol',
        name: 'coin-detail',
        component: () => import('@/pages/CoinDetailPage.vue'),
        meta: { title: 'Coin', nav: 'markets', pageHeader: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/pages/SettingsPage.vue'),
        meta: { title: 'Settings', nav: 'settings' },
      },
      {
        path: 'watchlist',
        name: 'watchlist',
        component: () => import('@/pages/WatchlistPage.vue'),
        meta: { title: 'Watchlist', nav: 'watchlist', pageHeader: true },
      },
      {
        path: 'portfolio',
        name: 'portfolio',
        component: () => import('@/pages/PortfolioPage.vue'),
        meta: { title: 'Portfolio', nav: 'portfolio', pageHeader: true },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: { name: 'dashboard' },
  },
]

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

  Router.afterEach((to) => {
    if (typeof document === 'undefined') return

    const title = typeof to.meta.title === 'string' ? to.meta.title : ''
    document.title = title ? `${title} · CryptoPulse` : 'CryptoPulse'
  })

  return Router
})
