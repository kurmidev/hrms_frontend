import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth.store'

const BASE_URL = '/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If org is suspended, redirect to /suspended
    if (
      (error as { response?: { data?: { code?: string } } })?.response?.data?.code ===
      'SUBSCRIPTION_SUSPENDED'
    ) {
      window.location.href = '/suspended'
      return Promise.reject(error)
    }

    // If server says password change required, set the flag so the force dialog appears
    const errBody = (error as { response?: { data?: { data?: { details?: { code?: string } } } } })?.response?.data
    if (errBody?.data?.details?.code === 'MUST_CHANGE_PASSWORD') {
      const { user } = useAuthStore.getState()
      if (user && !user.mustChangePassword) {
        useAuthStore.setState({ user: { ...user, mustChangePassword: true } })
      }
      return Promise.reject(error)
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    original._retry = true

    const { refreshToken, setAccessToken, logout } = useAuthStore.getState()
    if (!refreshToken) {
      logout()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
        void reject
      })
    }

    isRefreshing = true

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
      const newToken: string = data.data.accessToken
      setAccessToken(newToken)
      processQueue(newToken)
      if (original.headers) original.headers.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch {
      logout()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data
}
