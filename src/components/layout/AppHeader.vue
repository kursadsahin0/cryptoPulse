<template>
  <div class="app-header__inner">
    <div class="app-header__bar">
      <button
        v-if="!isDesktop"
        ref="menuButtonRef"
        type="button"
        class="app-icon-btn"
        aria-label="Open navigation"
        aria-controls="primary-navigation"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        @click="emit('toggle-menu')"
      >
        <q-icon name="menu" size="22px" />
      </button>

      <router-link :to="{ name: 'dashboard' }" class="app-logo">CryptoPulse</router-link>

      <div ref="toolsRef" class="app-header__tools">
        <div class="app-header__slot">
          <button
            ref="currencyButtonRef"
            type="button"
            class="app-currency"
            aria-haspopup="listbox"
            aria-controls="currency-list"
            :aria-expanded="openPanel === 'currency' ? 'true' : 'false'"
            @click="togglePanel('currency')"
          >
            <span>{{ currencyCode }}</span>
            <q-icon name="expand_more" size="16px" />
          </button>

          <ul
            v-if="openPanel === 'currency'"
            id="currency-list"
            ref="currencyListRef"
            class="app-menu"
            role="listbox"
            aria-label="Quote currency"
            tabindex="-1"
            @keydown="onCurrencyKeydown"
          >
            <li v-for="item in quoteCurrencies" :key="item.code" role="presentation">
              <button
                type="button"
                class="app-menu__option"
                role="option"
                :aria-selected="preferences.quoteCurrency === item.code"
                @click="selectCurrency(item.code)"
              >
                <span>{{ item.label }}</span>
                <span class="app-menu__code">
                  <q-icon
                    v-if="preferences.quoteCurrency === item.code"
                    name="check"
                    size="16px"
                  />
                  {{ currencyShort(item.code) }}
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div class="app-header__slot">
          <button
            ref="noticeButtonRef"
            type="button"
            class="app-icon-btn"
            aria-label="Notifications"
            aria-controls="notifications-panel"
            :aria-expanded="openPanel === 'notifications' ? 'true' : 'false'"
            @click="togglePanel('notifications')"
          >
            <q-icon name="notifications_none" size="20px" />
          </button>

          <div
            v-if="openPanel === 'notifications'"
            id="notifications-panel"
            ref="noticePanelRef"
            class="app-menu app-menu--quiet"
            role="region"
            aria-label="Notifications"
            tabindex="-1"
          >
            <p class="app-menu__title">Notifications</p>
            <p class="app-menu__empty">No notifications</p>
          </div>
        </div>

        <div class="app-header__slot">
          <button
            ref="accountButtonRef"
            type="button"
            class="app-icon-btn"
            aria-label="Account"
            aria-controls="account-panel"
            :aria-expanded="openPanel === 'account' ? 'true' : 'false'"
            @click="togglePanel('account')"
          >
            <q-icon name="person" size="20px" />
          </button>

          <div
            v-if="openPanel === 'account'"
            id="account-panel"
            ref="accountPanelRef"
            class="app-menu"
            role="region"
            aria-label="Account"
            tabindex="-1"
          >
            <p class="app-menu__title">Account</p>
            <p class="app-menu__empty">Not signed in</p>
            <router-link
              :to="{ name: 'settings' }"
              class="app-menu__link"
              @click="openPanel = null"
            >
              Settings
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { currencyShort, quoteCurrencies, usePreferencesStore } from '@/stores/preferences'

const props = defineProps({
  menuOpen: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['toggle-menu'])

const route = useRoute()
const preferences = usePreferencesStore()

const openPanel = ref(null)

const toolsRef = ref(null)
const menuButtonRef = ref(null)
const currencyButtonRef = ref(null)
const currencyListRef = ref(null)
const noticeButtonRef = ref(null)
const noticePanelRef = ref(null)
const accountButtonRef = ref(null)
const accountPanelRef = ref(null)

const isDesktop = computed(() => props.mode === 'desktop')
const currencyCode = computed(() => currencyShort(preferences.quoteCurrency))

function togglePanel(name) {
  const next = openPanel.value === name ? null : name
  openPanel.value = next

  if (next === 'currency') {
    nextTick(() => {
      currencyListRef.value?.querySelector('[aria-selected="true"]')?.focus()
    })
  } else if (next === 'notifications') {
    nextTick(() => noticePanelRef.value?.focus())
  } else if (next === 'account') {
    nextTick(() => accountPanelRef.value?.focus())
  }
}

function closePanels(restoreFocus = false) {
  const panel = openPanel.value
  openPanel.value = null

  if (!restoreFocus) return

  nextTick(() => {
    if (panel === 'currency') currencyButtonRef.value?.focus()
    else if (panel === 'notifications') noticeButtonRef.value?.focus()
    else if (panel === 'account') accountButtonRef.value?.focus()
  })
}

function selectCurrency(code) {
  preferences.setQuoteCurrency(code)
  openPanel.value = null
  nextTick(() => currencyButtonRef.value?.focus())
}

function onCurrencyKeydown(event) {
  const buttons = [...(currencyListRef.value?.querySelectorAll('[role="option"]') ?? [])]
  const index = buttons.indexOf(document.activeElement)

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    const next = (index + direction + buttons.length) % buttons.length
    buttons[next]?.focus()
  } else if (event.key === 'Home') {
    event.preventDefault()
    buttons[0]?.focus()
  } else if (event.key === 'End') {
    event.preventDefault()
    buttons[buttons.length - 1]?.focus()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closePanels(true)
  }
}

function onDocumentPointer(event) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (toolsRef.value?.contains(target)) return
  openPanel.value = null
}

function onDocumentKeydown(event) {
  if (event.key !== 'Escape') return
  if (openPanel.value === null) return
  event.preventDefault()
  event.stopPropagation()
  closePanels(true)
}

watch(
  () => route.fullPath,
  () => {
    openPanel.value = null
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointer, true)
  document.addEventListener('keydown', onDocumentKeydown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointer, true)
  document.removeEventListener('keydown', onDocumentKeydown, true)
})

function focusMenu() {
  menuButtonRef.value?.focus()
}

defineExpose({ focusMenu })
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.app-header__bar {
  display: flex;
  align-items: center;
  gap: $spacing-2;
  min-height: $header-height;
  padding: 0 $spacing-4;
}

.app-logo {
  flex-shrink: 0;
  color: var(--accent);
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.01em;
  line-height: $line-height-tight;
  text-decoration: none;

  @include focus-ring(var(--accent), 2px);

  &:hover {
    color: var(--accent);
    text-decoration: none;
  }
}

.app-header__tools {
  display: flex;
  align-items: center;
  gap: $spacing-1;
  margin-left: auto;
  padding-left: $spacing-3;
  border-left: $border-width solid var(--border-color);
}

.app-header__slot {
  position: relative;
}

.app-icon-btn,
.app-currency {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background-color 120ms linear,
    color 120ms linear;

  @include focus-ring(var(--accent), 2px);

  &:hover,
  &[aria-expanded='true'] {
    color: var(--text-primary);
    background: var(--bg-elevated);
  }
}

.app-icon-btn {
  width: 36px;
  padding: 0;
}

.app-currency {
  gap: 2px;
  padding: 0 $spacing-2;
  font: inherit;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
}

.app-menu {
  position: absolute;
  top: calc(100% + #{$spacing-1});
  right: 0;
  z-index: 2;
  min-width: 220px;
  max-height: 320px;
  margin: 0;
  padding: $spacing-2 0;
  overflow-y: auto;
  list-style: none;
  border: $border-width solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
}

.app-menu--quiet {
  min-width: 240px;
}

.app-menu__title {
  margin: 0;
  padding: $spacing-1 $spacing-3 $spacing-2;
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.app-menu__empty {
  margin: 0;
  padding: 0 $spacing-3 $spacing-2;
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.app-menu__option,
.app-menu__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 36px;
  padding: 0 $spacing-3;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: $font-size-sm;
  text-align: left;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid var(--link);
    outline-offset: -2px;
  }
}

.app-menu__code {
  display: inline-flex;
  align-items: center;
  gap: $spacing-1;
  color: var(--text-secondary);
  font-size: $font-size-xs;
  letter-spacing: 0.04em;
}

@include below-mobile {
  .app-header__bar {
    padding: 0 $spacing-3;
  }

  .app-header__tools {
    padding-left: $spacing-2;
  }

  .app-logo {
    font-size: $font-size-md;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-icon-btn,
  .app-currency {
    transition: none;
  }
}
</style>
