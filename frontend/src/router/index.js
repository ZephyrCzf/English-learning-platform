import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ArticleView from '../views/ArticleView.vue'
import QuizPage from '../views/QuizPage.vue'
import QuizResult from '../views/QuizResult.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/article/:sessionId',
    name: 'article',
    component: ArticleView,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:sessionId',
    name: 'quiz',
    component: QuizPage,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/result/:sessionId',
    name: 'result',
    component: QuizResult,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guest: true }
  },
  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated
  console.log('Route guard - isAuthenticated:', isAuthenticated)
  console.log('Route guard - to:', to.path)
  console.log('Route guard - meta:', to.meta)

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      console.log('Route guard - redirecting to login')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      console.log('Route guard - proceeding to protected route')
      next()
    }
  } else if (to.matched.some(record => record.meta.guest)) {
    if (isAuthenticated) {
      console.log('Route guard - redirecting to home')
      next('/')
    } else {
      console.log('Route guard - proceeding to guest route')
      next()
    }
  } else {
    console.log('Route guard - proceeding to public route')
    next()
  }
})

export default router 