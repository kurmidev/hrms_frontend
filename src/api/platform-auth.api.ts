import { platformClient, platformUnwrap } from './platform-client'
import type { PlatformAdmin } from '@/types/platform.types'

export const platformAuthApi = {
  login: (email: string, password: string) =>
    platformClient
      .post<{ data: { token: string; admin: PlatformAdmin } }>('/platform/auth/login', { email, password })
      .then((r) => r.data.data),
  me: () =>
    platformClient
      .get<{ data: PlatformAdmin }>('/platform/auth/me')
      .then((r) => platformUnwrap<PlatformAdmin>(r)),
}
