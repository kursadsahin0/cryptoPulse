<template>
  <div class="app-sidebar">
    <div class="app-sidebar__body">
      <nav id="primary-navigation" class="app-nav" aria-label="Primary">
        <router-link
          v-for="item in primaryNav"
          :key="item.nav"
          :to="{ name: item.name }"
          class="app-nav__link"
          :class="{ 'app-nav__link--active': isCurrent(item.nav) }"
          :aria-current="isCurrent(item.nav) ? 'page' : undefined"
        >
          <q-icon class="app-nav__icon" :name="item.icon" size="18px" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <nav class="app-nav app-nav--section" aria-labelledby="market-heading">
        <p id="market-heading" class="app-sidebar__label">Market</p>
        <router-link
          v-for="item in marketNav"
          :key="item.nav"
          :to="{ name: item.name }"
          class="app-nav__link"
          :class="{ 'app-nav__link--active': isCurrent(item.nav) }"
          :aria-current="isCurrent(item.nav) ? 'page' : undefined"
        >
          <q-icon class="app-nav__icon" :name="item.icon" size="18px" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </div>

    <div class="app-sidebar__footer">
      <nav class="app-nav" aria-label="Preferences">
        <router-link
          :to="{ name: 'settings' }"
          class="app-nav__link"
          :class="{ 'app-nav__link--active': isCurrent('settings') }"
          :aria-current="isCurrent('settings') ? 'page' : undefined"
        >
          <q-icon class="app-nav__icon" name="settings" size="18px" />
          <span>Settings</span>
        </router-link>

        <button
          type="button"
          class="app-nav__link"
          :aria-pressed="isDark"
          @click="preferences.toggleTheme()"
        >
          <q-icon class="app-nav__icon" :name="isDark ? 'light_mode' : 'dark_mode'" size="18px" />
          <span>Theme</span>
          <span class="app-nav__meta">{{ isDark ? 'Dark' : 'Light' }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePreferencesStore } from '@/stores/preferences'

const route = useRoute()
const preferences = usePreferencesStore()

const primaryNav = [
  { name: 'dashboard', nav: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { name: 'markets', nav: 'markets', label: 'Markets', icon: 'show_chart' },
  { name: 'watchlist', nav: 'watchlist', label: 'Watchlist', icon: 'star_border' },
  { name: 'portfolio', nav: 'portfolio', label: 'Portfolio', icon: 'account_balance_wallet' },
]

const marketNav = [
  { name: 'markets-trending', nav: 'markets-trending', label: 'Trending', icon: 'timeline' },
  { name: 'markets-gainers', nav: 'markets-gainers', label: 'Top Gainers', icon: 'north' },
  { name: 'markets-losers', nav: 'markets-losers', label: 'Top Losers', icon: 'south' },
]

const isDark = computed(() => preferences.theme === 'dark')

function isCurrent(nav) {
  return route.meta.nav === nav
}

function focusFirst() {
  document.querySelector('#primary-navigation a')?.focus()
}

defineExpose({ focusFirst })
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.app-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--text-primary);
}

.app-sidebar__body {
  flex: 1;
  overflow: auto;
  padding: $spacing-3 $spacing-2 $spacing-2;
}

.app-sidebar__footer {
  margin-top: auto;
  padding: $spacing-2 $spacing-2 $spacing-3;
  border-top: $border-width solid var(--border-color);
}

.app-sidebar__label {
  margin: $spacing-4 $spacing-3 $spacing-2;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.08em;
  line-height: $line-height-tight;
  text-transform: uppercase;
}

.app-nav {
  display: flex;
  flex-direction: column;
}

.app-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: $spacing-3;
  width: 100%;
  min-height: 40px;
  padding: 0 $spacing-3;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  line-height: $line-height-tight;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 120ms linear,
    color 120ms linear;

  @include focus-ring(var(--accent), -2px);

  &:hover {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    text-decoration: none;
  }

  &--active {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);

    &::before {
      content: '';
      position: absolute;
      top: 8px;
      bottom: 8px;
      left: 0;
      width: 2px;
      background: var(--accent);
    }

    &:hover {
      background: color-mix(in srgb, var(--accent) 16%, transparent);
      color: var(--accent);
    }
  }
}

.app-nav__icon {
  flex-shrink: 0;
}

.app-nav__meta {
  margin-left: auto;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-regular;
}

@media (prefers-reduced-motion: reduce) {
  .app-nav__link {
    transition: none;
  }
}
</style>
