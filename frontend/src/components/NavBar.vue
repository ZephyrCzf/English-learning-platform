<template>
  <nav class="navbar">
    <div class="nav-brand">
      <router-link to="/" class="brand-link">
        <span class="brand-icon">📚</span>
        英语学习平台
      </router-link>
    </div>
    <div class="nav-links">
      <template v-if="isAuthenticated">
        <span class="welcome-text">
          <span class="user-icon">👤</span>
          {{ username }}
        </span>
        <router-link to="/" class="nav-link">
          <span class="link-icon">🏠</span>
          首页
        </router-link>
        <a href="#" @click.prevent="handleLogout" class="nav-link logout-link">
          <span class="link-icon">🚪</span>
          退出
        </a>
      </template>
      <template v-else>
        <router-link to="/login" class="nav-link login-link">
          <span class="link-icon">🔑</span>
          登录
        </router-link>
        <router-link to="/register" class="nav-link register-link">
          <span class="link-icon">✍️</span>
          注册
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'NavBar',
  computed: {
    ...mapGetters(['isAuthenticated', 'username'])
  },
  methods: {
    ...mapActions(['logout']),
    async handleLogout() {
      try {
        await this.logout()
        await this.$nextTick()
        this.$router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 2rem;
  background-color: white;
  color: #4CAF50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  color: #4CAF50;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.brand-link:hover {
  transform: translateY(-1px);
  color: #45a049;
}

.brand-icon {
  font-size: 1.4rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.welcome-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #4CAF50;
  padding: 0.3rem 0.8rem;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 15px;
}

.user-icon {
  font-size: 1rem;
}

.nav-link {
  color: #4CAF50;
  text-decoration: none;
  padding: 0.4rem 1rem;
  border-radius: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.nav-link:hover {
  background: rgba(76, 175, 80, 0.1);
  transform: translateY(-1px);
  color: #45a049;
}

.link-icon {
  font-size: 1rem;
}

.login-link {
  background: rgba(76, 175, 80, 0.1);
}

.register-link {
  background: rgba(76, 175, 80, 0.15);
}

.logout-link {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.logout-link:hover {
  background: rgba(220, 53, 69, 0.15);
  color: #c82333;
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.5rem 1rem;
  }

  .brand-link {
    font-size: 1rem;
  }

  .nav-links {
    gap: 0.8rem;
  }

  .nav-link {
    padding: 0.3rem 0.8rem;
  }

  .welcome-text {
    display: none;
  }
}
</style> 