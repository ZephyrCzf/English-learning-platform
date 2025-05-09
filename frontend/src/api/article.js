import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 添加响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 如果是 401 错误，清除 token 并重定向到登录页
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * @typedef {Object} SessionRequest
 * @property {string} educationLevel
 * @property {string} gradeLevel
 * @property {string[]} interests
 * @property {string[]} targetWords
 */

/**
 * @typedef {Object} QuizResult
 * @property {string} question_id
 * @property {number} selected_answer
 * @property {boolean} is_correct
 */

export const articleApi = {
  /**
   * @param {Object} sessionData
   * @param {string} sessionData.english_level
   * @param {string[]} sessionData.interests
   * @param {string[]} sessionData.targetWords
   * @returns {Promise<{sessionId: string, article: Object, quizQuestions: Array}>}
   */
  async createSession(sessionData) {
    try {
      const response = await axiosInstance.post('/api/sessions', sessionData)
      return response.data
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  },

  /**
   * @param {string} sessionId
   */
  async getArticles(sessionId) {
    try {
      console.log('Fetching articles for session:', sessionId)
      const response = await axiosInstance.get(`/api/sessions/${sessionId}/articles`)
      console.log('Raw API Response:', response)
      console.log('Response data:', response.data)
      
      // 检查返回的数据结构
      if (Array.isArray(response.data)) {
        console.log('Articles array length:', response.data.length)
        response.data.forEach((article, index) => {
          console.log(`Article ${index + 1}:`, {
            id: article.id,
            title: article.title,
            hasImageUrl: !!article.imageUrl,
            imageUrl: article.imageUrl,
            rawData: article
          })
        })
      } else {
        console.warn('Response data is not an array:', response.data)
      }
      
      return response.data
    } catch (error) {
      console.error('Error getting articles:', error)
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        })
      }
      throw error
    }
  },

  /**
   * @param {string} sessionId
   */
  async getQuizQuestions(sessionId) {
    try {
      console.log('Fetching quiz questions for session:', sessionId)
      const response = await axiosInstance.get(`/api/sessions/${sessionId}/quiz`)
      console.log('Quiz questions response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error getting quiz questions:', error)
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        })
      }
      throw error
    }
  },

  /**
   * @param {string} sessionId
   */
  async getQuizStatus(sessionId) {
    try {
      const response = await axiosInstance.get(`/api/sessions/${sessionId}/quiz-status`)
      return response.data.status
    } catch (error) {
      console.error('Error fetching quiz status:', error)
      throw error
    }
  },

  /**
   * @param {string} sessionId
   * @param {QuizResult[]} results
   */
  async submitQuizResults(sessionId, results) {
    const response = await axiosInstance.post(`/api/sessions/${sessionId}/quiz`, { results })
    return response.data
  },

  async rewriteArticle(sessionId, type) {
    try {
      const response = await axiosInstance.post(`/api/sessions/${sessionId}/rewrite`, { type })
      return response.data
    } catch (error) {
      console.error('Error rewriting article:', error)
      throw error
    }
  }
}

export default articleApi 