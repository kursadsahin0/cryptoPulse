<template>
  <div class="empty" role="status">
    <p class="empty__title">{{ title }}</p>
    <p v-if="message" class="empty__message">{{ message }}</p>
    <button v-if="retry" type="button" class="empty__retry" @click="emit('retry')">Try again</button>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  retry: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['retry'])
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';
@import '../../assets/styles/mixins';

.empty {
  padding: $spacing-5 $spacing-4;
  text-align: center;
}

.empty__title {
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.empty__message {
  margin-top: $spacing-1;
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.empty__retry {
  margin-top: $spacing-3;
  padding: $spacing-2 $spacing-3;
  border: $border-width solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-size: $font-size-sm;
  cursor: pointer;

  @include focus-ring;

  &:hover {
    background: var(--bg-elevated);
  }
}
</style>
