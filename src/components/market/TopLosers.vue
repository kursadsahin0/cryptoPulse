<template>
  <MarketMoverList
    title="Top losers"
    :rows="rows"
    :currency="currency"
    :status="status"
    @retry="emit('retry')"
  />
</template>

<script setup>
import MarketMoverList from '@/components/market/MarketMoverList.vue'

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  currency: {
    type: String,
    default: 'usd',
  },
  status: {
    type: String,
    default: 'idle',
  },
})

const emit = defineEmits(['retry'])
</script>
