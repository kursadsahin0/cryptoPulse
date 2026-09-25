<template>
  <section class="chart" aria-labelledby="market-chart-title">
    <div class="chart__header">
      <div class="chart__lead">
        <h2 id="market-chart-title" class="visually-hidden">Market</h2>
        <label class="visually-hidden" for="chart-coin">Cryptocurrency</label>
        <select
          id="chart-coin"
          class="chart__select"
          :value="coinId"
          :disabled="!coins.length"
          @change="emit('select-coin', $event.target.value)"
        >
          <option v-if="!coins.length" value="btc-bitcoin">Bitcoin</option>
          <option v-for="coin in coins" :key="coin.id" :value="coin.id">
            {{ coin.name }} ({{ coin.symbol }})
          </option>
        </select>
        <div class="chart__quote">
          <template v-if="loading && price == null">
            <SkeletonBlock width="140px" height="32px" />
            <SkeletonBlock width="72px" height="16px" />
          </template>
          <template v-else>
            <p class="chart__price">
              <LiveValue :key="currency" :signature="priceLabel" :amount="price" />
            </p>
            <PriceChange :value="change" />
            <time v-if="updatedLabel" class="chart__time" :datetime="updatedStamp">{{ updatedLabel }}</time>
          </template>
        </div>
      </div>

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

    <div class="chart__stage" :aria-busy="loading ? 'true' : 'false'">
      <SkeletonBlock v-if="loading" height="100%" />
      <EmptyState
        v-else-if="status === 'error' || !points.length"
        title="Chart unavailable"
        message="Price history could not be loaded for this market."
        retry
        @retry="emit('retry')"
      />
      <svg v-else class="chart__svg" :viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="summary">
        <g class="chart__axis">
          <line
            v-for="guide in guides"
            :key="guide.y"
            :x1="pad.left"
            :x2="width - pad.right"
            :y1="guide.y"
            :y2="guide.y"
          />
          <text
            v-for="guide in guides"
            :key="`label-${guide.y}`"
            :x="width - 8"
            :y="guide.y - 6"
            text-anchor="end"
          >
            {{ guide.label }}
          </text>
          <text
            v-for="tick in timeTicks"
            :key="tick.x"
            class="chart__time-label"
            :class="{ 'chart__time-label--mid': tick.anchor === 'middle' }"
            :x="tick.x"
            :y="height - 8"
            :text-anchor="tick.anchor"
          >
            {{ tick.label }}
          </text>
        </g>
        <path :d="areaPath" class="chart__area" />
        <path :d="linePath" class="chart__line" />
        <circle class="chart__point" :cx="lastPoint.x" :cy="lastPoint.y" r="3.5" />
      </svg>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import { chartTimeframes } from '@/services/api/market'
import { formatCurrency, formatDateTime } from '@/utils/format'

const props = defineProps({
  coins: {
    type: Array,
    default: () => [],
  },
  coinId: {
    type: String,
    default: 'bitcoin',
  },
  currency: {
    type: String,
    default: 'usd',
  },
  price: {
    type: Number,
    default: null,
  },
  change: {
    type: Number,
    default: null,
  },
  timeframe: {
    type: String,
    default: '24h',
  },
  points: {
    type: Array,
    default: () => [],
  },
  status: {
    type: String,
    default: 'idle',
  },
})

const emit = defineEmits(['select-coin', 'select-timeframe', 'retry'])

const timeframes = chartTimeframes
const width = 960
const height = 420
const pad = { top: 12, right: 72, bottom: 36, left: 8 }

const loading = computed(() => props.status === 'idle' || props.status === 'loading')
const priceLabel = computed(() => formatCurrency(props.price, props.currency))
const latestPoint = computed(() => props.points.at(-1) ?? null)
const updatedLabel = computed(() => (latestPoint.value ? formatDateTime(latestPoint.value.time) : ''))
const updatedStamp = computed(() =>
  latestPoint.value ? new Date(latestPoint.value.time).toISOString() : undefined,
)
const geometry = computed(() => {
  const values = props.points.map((point) => point.value).filter((value) => Number.isFinite(value))
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  return props.points.map((point, index) => ({
    x:
      pad.left +
      (props.points.length === 1 ? innerW / 2 : (index / (props.points.length - 1)) * innerW),
    y: pad.top + ((max - point.value) / span) * innerH,
  }))
})

const timeTicks = computed(() => {
  const coords = geometry.value
  if (coords.length < 2) return []
  const marks = [
    { index: 0, anchor: 'start' },
    { index: Math.floor((coords.length - 1) / 2), anchor: 'middle' },
    { index: coords.length - 1, anchor: 'end' },
  ]
  return marks.map((mark) => ({
    x: coords[mark.index].x,
    anchor: mark.anchor,
    label: formatDateTime(props.points[mark.index].time),
  }))
})

const linePath = computed(() => toPath(geometry.value))
const areaPath = computed(() => {
  const coords = geometry.value
  if (!coords.length) return ''
  const baseline = height - pad.bottom
  return `${toPath(coords)} L ${coords.at(-1).x} ${baseline} L ${coords[0].x} ${baseline} Z`
})
const lastPoint = computed(() => geometry.value.at(-1) ?? { x: 0, y: 0 })
const guides = computed(() => {
  const values = props.points.map((point) => point.value).filter((value) => Number.isFinite(value))
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerH = height - pad.top - pad.bottom
  return [0.2, 0.5, 0.8].map((ratio) => {
    const y = pad.top + ratio * innerH
    const value = max - ratio * span
    return { y, label: formatCurrency(value, props.currency, { compact: true }) }
  })
})

const summary = computed(() => {
  const coin = props.coins.find((item) => item.id === props.coinId)
  const name = coin?.name ?? 'Selected market'
  return `${name} price chart, latest ${priceLabel.value}`
})

function toPath(coords) {
  return coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.chart {
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  padding: $spacing-4 $spacing-4 0;
}

.chart__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-4;
  padding-bottom: $spacing-3;
}

.chart__lead {
  display: flex;
  flex-direction: column;
  gap: $spacing-1;
  min-width: 0;
}

.chart__select {
  max-width: 280px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;

  @include focus-ring;
}

.chart__quote {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: $spacing-2 $spacing-3;
}

.chart__price {
  margin: 0;
  color: var(--text-primary);
  font-size: 32px;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
  font-variant-numeric: tabular-nums;
}

.chart__time {
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-variant-numeric: tabular-nums;
}

.chart__ranges {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-1;
  padding: 3px;
  border-radius: var(--radius);
  background: var(--bg-elevated);
}

.chart__range {
  min-width: 44px;
  min-height: 30px;
  padding: 0 $spacing-2;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
  cursor: pointer;

  @include focus-ring;

  &:hover {
    color: var(--text-primary);
  }

  &--active {
    background: var(--bg-card);
    color: var(--text-primary);
    box-shadow: 0 0 0 1px var(--border-color);
  }
}

.chart__stage {
  height: 360px;
  margin-right: -#{$spacing-4};
  margin-left: -#{$spacing-4};
}

.chart__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.chart__axis line {
  stroke: var(--border-color);
  stroke-width: 1;
}

.chart__axis text {
  fill: var(--text-muted);
  font-size: 11px;
}

.chart__area {
  fill: color-mix(in srgb, var(--accent) 14%, transparent);
}

.chart__line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.chart__point {
  fill: var(--bg-card);
  stroke: var(--accent);
  stroke-width: 2;
}

@include below-mobile {
  .chart__price {
    font-size: $font-size-2xl;
  }

  .chart__ranges {
    width: 100%;
  }

  .chart__range {
    flex: 1;
  }

  .chart__stage {
    height: 240px;
  }

  .chart__time-label--mid {
    display: none;
  }
}

@include from-tablet {
  .chart__stage {
    height: 480px;
  }
}
</style>
