<template>
  <div id="app">
    <NavBar v-if="showNavBar" />
    <main :class="['main-content', { 'no-nav': !showNavBar }]">
      <router-view />
    </main>
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'App',
  components: {
    NavBar
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
    showNavBar() {
      // 调试信息
      console.log('Current route:', this.$route.path)
      console.log('Route meta:', this.$route.meta)
      console.log('Is authenticated:', this.isAuthenticated)
      
      // 如果已认证，显示导航栏
      if (this.isAuthenticated) {
        return true
      }
      
      // 如果是游客路由（登录/注册页面），不显示导航栏
      if (this.$route.meta.guest) {
        return false
      }
      
      // 其他情况显示导航栏
      return true
    }
  },
  created() {
    // 初始化认证状态
    this.initAuth()
  },
  methods: {
    ...mapActions(['initAuth'])
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background-color: #f5f5f5;
}

.main-content.no-nav {
  padding: 0;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  color: #333;
}

/* 全局链接样式 */
a {
  color: #4CAF50;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 全局按钮样式 */
button {
  cursor: pointer;
  font-family: inherit;
}

/* 全局输入框样式 */
input, textarea {
  font-family: inherit;
  font-size: inherit;
}

/* 全局过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
