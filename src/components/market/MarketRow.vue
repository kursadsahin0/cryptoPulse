<template>
  <tr class="market-row">
    <td class="row__rank" data-label="Rank">{{ coin.rank ?? '—' }}</td>
    <td class="row__asset" data-label="Asset">
      <router-link class="asset" :to="{ name: 'coin-detail', params: { symbol: coin.symbol } }">
        <img
          v-if="iconSrc"
          class="asset__icon"
          :src="iconSrc"
          alt=""
          width="24"
          height="24"
          @error="nextIcon"
        />
        <span v-else class="asset__mark" aria-hidden="true">{{ mark }}</span>
        <span class="asset__copy">
          <span class="asset__name">{{ coin.name }}</span>
          <span class="asset__symbol">{{ coin.symbol }}</span>
        </span>
      </router-link>
    </td>
    <td class="row__num" data-label="Price">
      <LiveValue :signature="priceLabel" :amount="coin.price" />
    </td>
    <td data-label="24h"><PriceChange :value="coin.change24h" /></td>
    <td data-label="7d"><PriceChange :value="coin.change7d" /></td>
    <td class="row__num" data-label="Market cap">{{ marketCapLabel }}</td>
    <td class="row__num" data-label="Volume">{{ volumeLabel }}</td>
    <td class="row__num" data-label="Circulating supply">{{ supplyLabel }}</td>
    <td class="row__watch" data-label="Watchlist">
      <button
        type="button"
        class="watch"
        :class="{ 'watch--on': watched }"
        :aria-pressed="watched ? 'true' : 'false'"
        :aria-label="watched ? `Remove ${coin.name} from watchlist` : `Add ${coin.name} to watchlist`"
        @click="emit('toggle-watch', coin.id)"
      >
        <q-icon :name="watched ? 'star' : 'star_border'" size="18px" />
      </button>
    </td>
  </tr>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import { formatCurrency, formatSupply } from '@/utils/format'

const props = defineProps({
  coin: {
    type: Object,
    required: true,
  },
  currency: {
    type: String,
    default: 'usd',
  },
  watched: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-watch'])

const iconStep = ref(0)
const iconSources = computed(() => {
  const code = String(props.coin.symbol ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const fallback = code ? `https://assets.coincap.io/assets/icons/${code}@2x.png` : ''
  return [props.coin.image, fallback].filter((src, index, list) => src && list.indexOf(src) === index)
})
const iconSrc = computed(() => iconSources.value[iconStep.value] ?? '')
const mark = computed(() => props.coin.symbol?.slice(0, 1) ?? '')

watch(
  () => props.coin.id,
  () => {
    iconStep.value = 0
  },
)

function nextIcon() {
  iconStep.value += 1
}

const priceLabel = computed(() => formatCurrency(props.coin.price, props.currency))
const marketCapLabel = computed(() =>
  formatCurrency(props.coin.marketCap, props.currency, { compact: true }),
)
const volumeLabel = computed(() => formatCurrency(props.coin.volume, props.currency, { compact: true }))
const supplyLabel = computed(() => formatSupply(props.coin.circulatingSupply))
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.asset {
  display: inline-flex;
  align-items: center;
  gap: $spacing-3;
  color: inherit;
  text-decoration: none;

  &:hover .asset__name {
    color: $accent-blue;
  }
}

.asset__icon,
.asset__mark {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
}

.asset__icon {
  border-radius: 50%;
}

.asset__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
}

.asset__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.asset__name {
  color: var(--text-primary);
  font-weight: $font-weight-medium;
}

.asset__symbol {
  color: var(--text-muted);
  font-size: $font-size-xs;
  letter-spacing: 0.04em;
}

.watch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;

  @include focus-ring;

  &:hover {
    color: var(--text-primary);
  }

  &--on {
    color: $accent-gold;
  }
}
</style>
