import axios from 'axios'
import { usePlatformAuthStore } from '@/store/platform-auth.store'

export const platformClient = axios.create({ baseURL: '/api/v1' })

platformClient.interceptors.request.use((config) => {
  const token = usePlatformAuthStore.getState().token
  if (token) config.headers['Platform-Authorization'] = `Bearer ${token}`
  return config
})

export function platformUnwrap<T>(res: { data: { data: T } }): T {
  return res.data.data
}
