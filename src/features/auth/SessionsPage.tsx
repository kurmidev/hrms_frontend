import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Monitor, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { sessionsApi } from '@/api/sessions.api'
import type { Session } from '@/types/session.types'
import { formatDateTime, getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

export function SessionsPage() {
  const qc = useQueryClient()
  const [revokeTarget, setRevokeTarget] = useState<Session | null>(null)
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsApi.getSessions(),
  })

  const sessions: Session[] = Array.isArray(data) ? data : []

  const { mutate: revoke, isPending: revoking } = useMutation({
    mutationFn: (id: string) => sessionsApi.revokeSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setRevokeTarget(null)
      toast.success('Session revoked.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to revoke session.')),
  })

  const { mutate: revokeAll, isPending: revokingAll } = useMutation({
    mutationFn: () => sessionsApi.revokeAllOther(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setRevokeAllOpen(false)
      toast.success('All other sessions revoked.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to revoke sessions.')),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Active Sessions</h1>
            <p className="text-sm text-muted-foreground">Manage devices signed in to your account</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setRevokeAllOpen(true)}>
          <LogOut className="h-4 w-4 mr-1.5" />
          Revoke All Other Sessions
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Device</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">IP Address</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Active</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                  No active sessions found.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{session.userAgent || 'Unknown device'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{session.ipAddress || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(session.loginAt)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setRevokeTarget(session)}>
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
        title="Revoke Session"
        description={`Revoke session for "${revokeTarget?.userAgent || 'this device'}"? This will sign it out immediately.`}
        confirmLabel={revoking ? 'Revoking…' : 'Revoke'}
        onConfirm={() => revokeTarget && revoke(revokeTarget.id)}
        variant="destructive"
      />

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title="Revoke All Other Sessions"
        description="This will sign out all devices except the one you are currently using. Continue?"
        confirmLabel={revokingAll ? 'Revoking…' : 'Revoke All'}
        onConfirm={() => revokeAll()}
        variant="destructive"
      />
    </div>
  )
}
