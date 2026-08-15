import { apiClient, unwrap } from './client'
import type { AuthUser, AuthTokens, LoginCredentials, OtpRequest, OtpVerify, ChangePasswordPayload, ResetPasswordPayload } from '@/types/auth.types'

interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

export const authApi = {
  login: (data: LoginCredentials) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', data).then(unwrap<AuthResponse>),

  sendOtp: (data: OtpRequest) =>
    apiClient.post('/auth/otp/send', data).then(unwrap<{ message: string }>),

  verifyOtp: (data: OtpVerify) =>
    apiClient.post<{ data: AuthResponse }>('/auth/otp/verify', data).then(unwrap<AuthResponse>),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken }).then(unwrap<AuthTokens>),

  logout: () => apiClient.post('/auth/logout').then(unwrap<{ message: string }>),

  me: () => apiClient.get<{ data: AuthUser }>('/auth/me').then(unwrap<AuthUser>),

  changePassword: (data: ChangePasswordPayload) =>
    apiClient.put('/auth/change-password', data).then(unwrap<{ message: string }>),

  resetPassword: (data: ResetPasswordPayload) =>
    apiClient.post('/auth/reset-password', data).then(unwrap<{ message: string }>),

  sessions: () => apiClient.get('/auth/sessions').then(unwrap),

  logoutAll: () => apiClient.delete('/auth/sessions').then(unwrap<{ message: string }>),

  logoutSession: (sessionId: string) =>
    apiClient.delete(`/auth/sessions/${sessionId}`).then(unwrap<{ message: string }>),
}
