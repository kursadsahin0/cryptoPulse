<template>
  <span class="change" :class="`change--${direction}`">
    <span class="change__mark" aria-hidden="true" />
    <span class="visually-hidden">{{ direction === 'down' ? 'Down' : direction === 'up' ? 'Up' : 'Unchanged' }}</span>
    <span>{{ formatPercent(value) }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { changeDirection, formatPercent } from '@/utils/format'

const props = defineProps({
  value: {
    default: null,
  },
})

const direction = computed(() => changeDirection(props.value))
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';

.change {
  display: inline-flex;
  align-items: center;
  gap: $spacing-1;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  font-variant-numeric: tabular-nums;
}

.change__mark {
  width: 0;
  height: 0;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

.change--up {
  color: var(--positive);

  .change__mark {
    border-bottom: 5px solid var(--positive);
  }
}

.change--down {
  color: var(--negative);

  .change__mark {
    border-top: 5px solid var(--negative);
  }
}

.change--flat {
  color: var(--text-muted);

  .change__mark {
    width: 8px;
    height: 1px;
    border: 0;
    background: var(--text-muted);
  }
}
</style>
