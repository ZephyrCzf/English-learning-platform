import Vue from 'vue'
import Vuex from 'vuex'
import { authApi } from '../api/auth'

Vue.use(Vuex)

// 初始化状态
const initialState = {
  userInfo: null,
  currentArticle: null,
  quizResults: [],
  isAuthenticated: !!localStorage.getItem('token'),
  username: localStorage.getItem('username') || ''
}

// 调试信息
console.log('Initial state:', initialState)

export default new Vuex.Store({
  state: { ...initialState },
  mutations: {
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo
    },
    setCurrentArticle(state, article) {
      state.currentArticle = article
    },
    setQuizResults(state, results) {
      state.quizResults = results
    },
    setAuthState(state, { isAuthenticated, username }) {
      console.log('Setting auth state:', { isAuthenticated, username })
      state.isAuthenticated = isAuthenticated
      state.username = username
    },
    resetState(state) {
      console.log('Resetting state')
      Object.assign(state, initialState)
    }
  },
  actions: {
    updateUserInfo({ commit }, userInfo) {
      commit('setUserInfo', userInfo)
    },
    updateCurrentArticle({ commit }, article) {
      commit('setCurrentArticle', article)
    },
    updateQuizResults({ commit }, results) {
      commit('setQuizResults', results)
    },
    login({ commit }, { token, username }) {
      console.log('Login action:', { token, username })
      localStorage.setItem('token', token)
      localStorage.setItem('username', username)
      commit('setAuthState', { isAuthenticated: true, username })
    },
    logout({ commit }) {
      console.log('Logout action')
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      commit('resetState')
    },
    // 初始化状态
    initAuth({ commit }) {
      console.log('Initializing auth state')
      const token = localStorage.getItem('token')
      const username = localStorage.getItem('username')
      console.log('Found in localStorage:', { token, username })
      if (token && username) {
        commit('setAuthState', { isAuthenticated: true, username })
      }
    }
  },
  getters: {
    getUserInfo: state => state.userInfo,
    getCurrentArticle: state => state.currentArticle,
    getQuizResults: state => state.quizResults,
    isAuthenticated: state => {
      console.log('Getting isAuthenticated:', state.isAuthenticated)
      return state.isAuthenticated
    },
    username: state => state.username
  }
}) 