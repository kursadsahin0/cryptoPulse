<template>
  <section class="chart" aria-labelledby="coin-chart-title">
    <div class="chart__top">
      <h2 id="coin-chart-title" class="chart__title">Price</h2>
      <div class="chart__ranges" role="radiogroup" aria-label="Chart timeframe">
        <button
          v-for="item in timeframes"
          :key="item.id"
          type="button"
          class="chart__range"
          role="radio"
          :aria-checked="item.id === timeframe"
          :class="{ 'chart__range--active': item.id === timeframe }"
          @click="emit('select-timeframe', item.id)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <dl class="chart__facts">
      <div v-for="fact in facts" :key="fact.label">
        <dt>{{ fact.label }}</dt>
        <dd>
          <PriceChange v-if="fact.change" :value="fact.amount" />
          <LiveValue v-else-if="fact.live" :signature="fact.text" :amount="fact.amount" />
          <template v-else>{{ fact.text }}</template>
        </dd>
      </div>
    </dl>

    <div class="chart__stage" :aria-busy="loading ? 'true' : 'false'">
      <SkeletonBlock v-if="loading" height="100%" />
      <EmptyState
        v-else-if="status === 'error' || !points.length"
        title="Chart unavailable"
        message="Price history could not be loaded for this market."
        retry
        @retry="emit('retry')"
      />
      <svg
        v-else
        class="chart__svg"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        :aria-label="summary"
        @mousemove="onMove"
        @mouseleave="hoverIndex = -1"
      >
        <line
          v-for="line in guides"
          :key="line"
          :x1="pad.left"
          :x2="width - pad.right"
          :y1="line"
          :y2="line"
          class="chart__guide"
        />
        <path :d="areaPath" class="chart__area" />
        <path :d="linePath" class="chart__line" />
        <circle class="chart__point" :cx="focus.x" :cy="focus.y" r="3.5" />
      </svg>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import { detailTimeframes } from '@/services/api/market'
import { formatCurrency } from '@/utils/format'

const props = defineProps({
  points: { type: Array, default: () => [] },
  status: { type: String, default: 'idle' },
  timeframe: { type: String, default: '24h' },
  currency: { type: String, default: 'usd' },
  price: { default: null },
  name: { type: String, default: 'Market' },
})

const emit = defineEmits(['select-timeframe', 'retry'])

const timeframes = detailTimeframes
const width = 720
const height = 320
const pad = { top: 16, right: 12, bottom: 16, left: 12 }
const hoverIndex = ref(-1)

const loading = computed(() => props.status === 'idle' || props.status === 'loading')
const active = computed(() => {
  if (hoverIndex.value >= 0) return props.points[hoverIndex.value] ?? null
  return props.points.at(-1) ?? null
})

const facts = computed(() => {
  const rows = props.points
  const candle = active.value
  const open = rows[0]?.open ?? null
  const high = rows.reduce((max, point) => (point.high > max ? point.high : max), rows[0]?.high ?? null)
  const low = rows.reduce((min, point) => (point.low < min ? point.low : min), rows[0]?.low ?? null)
  const volume = rows.reduce((sum, point) => sum + (point.volume || 0), 0)
  const first = rows[0]?.value
  const last = props.price ?? rows.at(-1)?.value
  const change = first ? ((last - first) / first) * 100 : null
  const money = (value) => formatCurrency(value, props.currency)

  return [
    { label: 'Price', text: money(candle?.value ?? props.price), amount: candle?.value ?? props.price, live: true },
    { label: 'Open', text: money(hoverIndex.value >= 0 ? candle?.open : open) },
    { label: 'High', text: money(hoverIndex.value >= 0 ? candle?.high : high) },
    { label: 'Low', text: money(hoverIndex.value >= 0 ? candle?.low : low) },
    { label: 'Volume', text: formatCurrency(hoverIndex.value >= 0 ? candle?.volume : volume, props.currency, { compact: true }) },
    { label: 'Change', amount: change, change: true },
  ]
})

const geometry = computed(() => {
  const values = props.points.map((point) => point.value).filter((value) => Number.isFinite(value))
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  return props.points.map((point, index) => ({
    x: pad.left + (props.points.length === 1 ? innerW / 2 : (index / (props.points.length - 1)) * innerW),
    y: pad.top + ((max - point.value) / span) * innerH,
  }))
})

const linePath = computed(() => geometry.value.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '))
const areaPath = computed(() => {
  const coords = geometry.value
  if (!coords.length) return ''
  const baseline = height - pad.bottom
  return `${linePath.value} L ${coords.at(-1).x} ${baseline} L ${coords[0].x} ${baseline} Z`
})
const focus = computed(() => {
  const index = hoverIndex.value >= 0 ? hoverIndex.value : geometry.value.length - 1
  return geometry.value[index] ?? { x: 0, y: 0 }
})
const guides = [0.25, 0.5, 0.75].map((ratio) => pad.top + ratio * (height - pad.top - pad.bottom))
const summary = computed(() => `${props.name} price chart`)

function onMove(event) {
  const bounds = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientX - bounds.left) / bounds.width
  const index = Math.round(ratio * (props.points.length - 1))
  hoverIndex.value = Math.min(props.points.length - 1, Math.max(0, index))
}
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.chart {
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  padding: $spacing-4;
}

.chart__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-3;
}

.chart__title {
  margin: 0;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.chart__ranges {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-1;
}

.chart__range {
  min-width: 40px;
  min-height: 28px;
  padding: 0 $spacing-2;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
  cursor: pointer;

  @include focus-ring;

  &--active {
    color: $accent-blue;
    box-shadow: inset 0 -2px 0 $accent-blue;
  }
}

.chart__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-3 $spacing-4;
  margin: $spacing-4 0 0;
}

.chart__facts dt {
  color: var(--text-muted);
  font-size: $font-size-xs;
}

.chart__facts dd {
  margin: $spacing-1 0 0;
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  font-variant-numeric: tabular-nums;
}

.chart__stage {
  height: 240px;
  margin-top: $spacing-4;
}

.chart__svg {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.chart__guide {
  stroke: var(--border-color);
  stroke-width: 1;
}

.chart__area {
  fill: color-mix(in srgb, #{$accent-blue} 16%, transparent);
}

.chart__line {
  fill: none;
  stroke: $accent-blue;
  stroke-width: 1.75;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.chart__point {
  fill: var(--accent);
}

@include from-tablet {
  .chart__facts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .chart__stage {
    height: 320px;
  }
}

@include from-desktop {
  .chart__facts {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>
