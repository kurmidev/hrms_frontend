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
  const { accessToken, user } = useAuthStore.getState()
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  // CRITICAL multi-tenancy header — see CLAUDE.md ("Every authenticated
  // request must include X-Organization-ID header") and
  // `TenantMiddleware`/`@OrganizationId()` on the backend. This was
  // previously never set anywhere in the client, so every controller
  // endpoint using `@OrganizationId()` (as opposed to the JWT-payload-based
  // `@CurrentUser('organizationId')`) silently received `undefined` —
  // Prisma treats `undefined` `where` filter values as "omit this filter
  // entirely" (org-scope silently dropped, matching rows across ALL
  // organizations) and treats `undefined` on a required `create()` field as
  // a hard validation error (uncaught 500), e.g.
  // `GreenThanksConfigService.get()`'s upsert-on-read `create()` call. See
  // known-issues.md.
  if (user?.organizationId && config.headers) {
    config.headers['X-Organization-ID'] = user.organizationId
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
    const errBody = (
      error as {
        response?: { data?: { errorType?: string; error?: { code?: string } } }
      }
    )?.response?.data
    if (
      errBody?.errorType === 'MUST_CHANGE_PASSWORD' ||
      errBody?.error?.code === 'MUST_CHANGE_PASSWORD'
    ) {
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
