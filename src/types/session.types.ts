// Matches `AuthService.getSessions()`'s real Prisma `select` exactly
// (`{ id, ipAddress, userAgent, loginAt }` off `LoginHistory`) — the
// previous shape here (`sessionId`/`deviceInfo`/`ip`/`createdAt`/
// `lastActiveAt`/`isCurrent`) never matched the backend response, so every
// field on the Active Sessions page silently rendered as blank/"Unknown
// device" and the Revoke button called `DELETE /auth/sessions/undefined`.
// The backend has no per-session "last active" tracking beyond `loginAt`,
// and no way to identify which row is the caller's current session, so
// those two fields are intentionally not represented here.
export interface Session {
  id: string
  ipAddress?: string | null
  userAgent?: string | null
  loginAt: string
}
