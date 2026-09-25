<template>
  <header class="coin">
    <template v-if="loading">
      <SkeletonBlock width="48px" height="48px" />
      <div class="coin__copy">
        <SkeletonBlock width="180px" height="24px" />
        <SkeletonBlock width="96px" height="14px" />
      </div>
    </template>
    <template v-else-if="profile && quote">
      <img class="coin__icon" :src="profile.image" alt="" width="48" height="48" />
      <div class="coin__copy">
        <h1 class="coin__name">
          {{ profile.name }}
          <span class="coin__symbol">{{ profile.symbol }}</span>
        </h1>
        <p class="coin__rank">Rank #{{ quote.rank ?? '—' }}</p>
      </div>
      <div class="coin__quote">
        <p class="coin__price">
          <LiveValue :signature="priceLabel" :amount="quote.price" />
        </p>
        <PriceChange :value="quote.change24h" />
      </div>
      <button
        type="button"
        class="coin__fav"
        :class="{ 'coin__fav--on': watched }"
        :aria-pressed="watched ? 'true' : 'false'"
        :aria-label="watched ? `Remove ${profile.name} from watchlist` : `Add ${profile.name} to watchlist`"
        @click="emit('toggle-watch')"
      >
        <q-icon :name="watched ? 'star' : 'star_border'" size="20px" />
      </button>
    </template>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import LiveValue from '@/components/common/LiveValue.vue'
import PriceChange from '@/components/common/PriceChange.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import { formatCurrency } from '@/utils/format'

const props = defineProps({
  profile: { type: Object, default: null },
  quote: { type: Object, default: null },
  currency: { type: String, default: 'usd' },
  loading: { type: Boolean, default: false },
  watched: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-watch'])
const priceLabel = computed(() => formatCurrency(props.quote?.price, props.currency))
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.coin {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-3 $spacing-4;
}

.coin__icon {
  width: 48px;
  height: 48px;
}

.coin__copy {
  min-width: 0;
}

.coin__name {
  margin: 0;
  color: var(--text-primary);
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
}

.coin__symbol {
  margin-left: $spacing-2;
  color: var(--text-muted);
  font-size: $font-size-sm;
  letter-spacing: 0.04em;
}

.coin__rank {
  margin: $spacing-1 0 0;
  color: var(--text-secondary);
  font-size: $font-size-xs;
}

.coin__quote {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-1;
}

.coin__price {
  margin: 0;
  color: var(--text-primary);
  font-size: $font-size-2xl;
  font-weight: $font-weight-semibold;
  font-variant-numeric: tabular-nums;
}

.coin__fav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-left: auto;
  border: $border-width solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;

  @include focus-ring;

  &--on {
    color: $accent-gold;
  }
}

@include from-tablet {
  .coin__quote {
    align-items: flex-end;
    margin-left: auto;
  }

  .coin__fav {
    margin-left: 0;
  }
}
</style>
