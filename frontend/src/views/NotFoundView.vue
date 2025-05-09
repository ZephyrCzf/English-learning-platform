<template>
  <ResponsiveContainer>
    <div class="not-found">
      <h1>404</h1>
      <p>页面未找到</p>
      <button @click="goHome">返回首页</button>
    </div>
  </ResponsiveContainer>
</template>

<script>
import ResponsiveContainer from '@/components/ResponsiveContainer.vue'

export default {
  name: 'NotFoundView',
  components: {
    ResponsiveContainer
  },
  methods: {
    goHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

h1 {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

p {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 2rem;
}

button {
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background-color: var(--primary-hover);
}
</style> 