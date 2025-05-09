<template>
  <div class="error-message" :class="{ 'full-width': fullWidth }">
    <div class="error-content">
      <span class="error-icon">!</span>
      <p class="error-text">{{ message }}</p>
    </div>
    <button v-if="retry" class="retry-btn" @click="$emit('retry')">重试</button>
  </div>
</template>

<script>
export default {
  name: 'ErrorMessage',
  props: {
    message: {
      type: String,
      required: true
    },
    retry: {
      type: Boolean,
      default: false
    },
    fullWidth: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.error-message.full-width {
  width: 100%;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.error-icon {
  background-color: #ff4d4f;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.error-text {
  color: var(--error-color);
  margin: 0;
  font-size: var(--font-size-md);
}

.retry-btn {
  background-color: var(--error-color);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  align-self: flex-end;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #ff7875;
}
</style> 