<template>
  <q-layout view="hhh lpr fff" class="app-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <q-header class="app-header">
      <AppHeader
        ref="headerRef"
        :menu-open="drawerOpen"
        :mode="layoutMode"
        @toggle-menu="toggleDrawer"
      />
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      class="app-drawer"
      show-if-above
      aria-label="Sidebar"
      :width="240"
      :breakpoint="1279"
    >
      <AppSidebar ref="sidebarRef" />
    </q-drawer>

    <q-page-container>
      <div id="main-content" class="app-content" tabindex="-1">
        <h1 v-if="!route.meta.pageHeader" class="app-content__title">{{ pageTitle }}</h1>
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { usePreferencesStore } from '@/stores/preferences'

const desktopMin = 1280

const route = useRoute()
const $q = useQuasar()
const preferences = usePreferencesStore()

const drawerOpen = ref(false)
const headerRef = ref(null)
const sidebarRef = ref(null)

const layoutMode = computed(() => {
  if ($q.screen.width >= desktopMin) return 'desktop'
  if ($q.screen.width >= 768) return 'tablet'
  return 'mobile'
})

const isDesktop = computed(() => layoutMode.value === 'desktop')

const pageTitle = computed(() =>
  typeof route.meta.title === 'string' ? route.meta.title : 'CryptoPulse',
)

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

applyTheme(preferences.theme)
watch(() => preferences.theme, applyTheme)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
  if (drawerOpen.value && !isDesktop.value) {
    nextTick(() => sidebarRef.value?.focusFirst())
  }
}

watch(
  () => route.fullPath,
  () => {
    if (isDesktop.value || !drawerOpen.value) return
    drawerOpen.value = false
    nextTick(() => document.getElementById('main-content')?.focus())
  },
)

function onKeydown(event) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  if (isDesktop.value || !drawerOpen.value) return
  drawerOpen.value = false
  nextTick(() => headerRef.value?.focusMenu())
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style lang="scss" scoped>
@import '../assets/styles/variables';
@import '../assets/styles/mixins';

.skip-link {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;

  &:focus {
    z-index: 4000;
    top: $spacing-2;
    left: $spacing-2;
    width: auto;
    height: auto;
    margin: 0;
    padding: $spacing-2 $spacing-3;
    overflow: visible;
    clip: auto;
    background: var(--bg-card);
    color: var(--text-primary);
    border: $border-width solid var(--border-color);
    text-decoration: none;
  }
}

.app-header {
  background: var(--bg-card);
  color: var(--text-primary);
  border-bottom: $border-width solid var(--border-color);
  box-shadow: none;
}

.app-shell:deep(.q-drawer),
.app-shell:deep(.app-drawer) {
  background: var(--bg-card);
  color: var(--text-primary);
  border-right: $border-width solid var(--border-color);
}

.app-shell:deep(.app-drawer) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-shell:deep(.app-sidebar) {
  flex: 1;
  min-height: 0;
}

.app-content {
  min-width: 0;
  overflow-x: clip;
  padding: $spacing-4 $spacing-3 $spacing-5;

  @include from-tablet {
    padding: $spacing-5 $spacing-4 $spacing-6;
  }

  @include from-desktop {
    padding: $spacing-6 $spacing-6 $spacing-8;
  }
}

.app-content__title {
  margin: 0 0 $spacing-5;
  color: var(--text-primary);
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
  letter-spacing: 0;
}
</style>
