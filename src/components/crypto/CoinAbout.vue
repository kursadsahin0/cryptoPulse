<template>
  <section class="about" aria-labelledby="coin-about-title">
    <h2 id="coin-about-title" class="about__title">About {{ name }}</h2>
    <div v-if="loading" class="about__body">
      <SkeletonBlock width="100%" height="14px" />
      <SkeletonBlock width="92%" height="14px" />
      <SkeletonBlock width="70%" height="14px" />
    </div>
    <div v-else-if="!description && !links.length" class="about__body">
      <EmptyState title="No profile" message="A description and official links are not available for this asset." />
    </div>
    <div v-else class="about__body">
      <p v-if="description" class="about__text">{{ description }}</p>
      <p v-else class="about__text">No description is available for this asset.</p>
      <ul v-if="links.length" class="about__links">
        <li v-for="link in links" :key="link.url">
          <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'

defineProps({
  name: { type: String, default: 'this asset' },
  description: { type: String, default: '' },
  links: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
</script>

<style lang="scss" scoped>
@import '../../assets/styles/variables';

.about {
  border: $border-width solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-card);
  padding: $spacing-4;
}

.about__title {
  margin: 0 0 $spacing-3;
  color: var(--text-muted);
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.about__text {
  margin: 0;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  line-height: $line-height-base;
}

.about__links {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-2;
  margin: $spacing-4 0 0;
  padding: 0;
  list-style: none;
}

.about__links a {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 $spacing-3;
  border: $border-width solid var(--border-color);
  color: $accent-blue;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  text-decoration: none;

  &:hover {
    border-color: $accent-blue;
  }
}
</style>
