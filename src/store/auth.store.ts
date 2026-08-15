import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth.types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        // Mirror the backend's wildcard convention exactly (see
        // `backend/src/common/guards/roles.guard.ts`: `if
        // (userPerms.includes('*')) return true;`). The seeded `super_admin`
        // role literally has `permissions: ['*']` — without this check, every
        // `usePermission()`-gated sidebar item, page self-gate, and action
        // button collapses to hidden/blocked for super_admin client-side,
        // even though the backend would allow every one of those requests.
        // Confirmed live: sidebar showed only Dashboard/Chat/Settings for
        // admin@igreentec.in before this fix.
        if (user.permissions.includes('*')) return true
        return user.permissions.includes(permission)
      },
    }),
    {
      name: 'hrms-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
