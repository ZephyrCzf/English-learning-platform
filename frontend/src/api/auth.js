import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 添加请求拦截器，自动添加token
axiosInstance.interceptors.request.use(
  (config) => {
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

export const authApi = {
  async register(userData) {
    try {
      const response = await axiosInstance.post('/api/users/register', userData)
      return response.data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  },

  async login(credentials) {
    try {
      const response = await axiosInstance.post('/api/users/login', credentials)
      return response.data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }
}

export default authApi 