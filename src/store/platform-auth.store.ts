import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlatformAdmin } from '@/types/platform.types'

interface PlatformAuthState {
  admin: PlatformAdmin | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (admin: PlatformAdmin, token: string) => void
  logout: () => void
}

export const usePlatformAuthStore = create<PlatformAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      setAuth: (admin, token) => set({ admin, token, isAuthenticated: true }),
      logout: () => set({ admin: null, token: null, isAuthenticated: false }),
    }),
    { name: 'hrms-platform-auth' }
  )
)
