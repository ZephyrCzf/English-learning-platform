<template>
  <div class="responsive-container" :class="size">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'ResponsiveContainer',
  props: {
    size: {
      type: String,
      validator: value => ['sm', 'md', 'lg', 'xl'].includes(value)
    }
  }
}
</script>

<style scoped>
.responsive-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.responsive-container.sm {
  max-width: 640px;
}

.responsive-container.md {
  max-width: 768px;
}

.responsive-container.lg {
  max-width: 1024px;
}

.responsive-container.xl {
  max-width: 1280px;
}

@media (max-width: 640px) {
  .responsive-container {
    padding: 0 var(--spacing-sm);
  }
}
</style> 