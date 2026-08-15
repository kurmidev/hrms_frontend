import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { onboardingApi } from '@/api/onboarding.api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [notesDialog, setNotesDialog] = useState<'changes' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')

  const { data: link, isLoading } = useQuery({
    queryKey: ['onboarding-link', id],
    queryFn: () => onboardingApi.get(id!),
    enabled: !!id,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['onboarding-link', id] })

  const { mutate: review, isPending: reviewing } = useMutation({
    mutationFn: () => onboardingApi.review(id!),
    onSuccess: () => { invalidate(); toast.success('Marked as Under Review.') },
  })

  const { mutate: requestChanges, isPending: requesting } = useMutation({
    mutationFn: () => onboardingApi.requestChanges(id!, notes),
    onSuccess: () => { invalidate(); setNotesDialog(null); toast.success('Changes requested.') },
  })

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: () => onboardingApi.reject(id!, notes),
    onSuccess: () => { invalidate(); setNotesDialog(null); toast.success('Application rejected.') },
  })

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-64 w-full" /></div>
  if (!link) return <div className="text-muted-foreground">Not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/onboarding')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{link.candidateName}</h1>
          <p className="text-sm text-muted-foreground">{link.email} · {link.phone}</p>
        </div>
        <StatusBadge status={link.status} type="onboarding" />
      </div>

      {/* Info */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Invitation Details</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Job Title', value: link.jobTitle },
            { label: 'Department', value: link.departmentName },
            { label: 'Work Location', value: link.workLocation },
            { label: 'Expires', value: formatDateTime(link.expiresAt) },
            { label: 'HR Notes', value: link.hrNotes },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground">{value ?? '—'}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submission data */}
      {link.submissionData && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Submitted Information</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(link.submissionData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {link.status === 'SUBMITTED' && (
          <Button onClick={() => review()} disabled={reviewing}>
            {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark Under Review
          </Button>
        )}
        {link.status === 'UNDER_REVIEW' && (
          <>
            <Button variant="outline" onClick={() => { setNotes(''); setNotesDialog('changes') }}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Request Changes
            </Button>
            <Button variant="destructive" onClick={() => { setNotes(''); setNotesDialog('reject') }}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={() => toast.info('Use the Approve flow to create the employee account.')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </>
        )}
      </div>

      {/* Transitions */}
      {link.transitions && link.transitions.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {link.transitions.map((t) => (
                <div key={t.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t.fromStatus} → {t.toStatus}</p>
                    {t.notes && <p className="text-muted-foreground text-xs">{t.notes}</p>}
                    <p className="text-xs text-muted-foreground">{formatDateTime(t.occurredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes dialog */}
      <Dialog open={!!notesDialog} onOpenChange={(o) => !o && setNotesDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{notesDialog === 'changes' ? 'Request Changes' : 'Reject Application'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Add notes for the candidate…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog(null)}>Cancel</Button>
            <Button
              variant={notesDialog === 'reject' ? 'destructive' : 'default'}
              onClick={() => notesDialog === 'changes' ? requestChanges() : reject()}
              disabled={requesting || rejecting}
            >
              {(requesting || rejecting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {notesDialog === 'changes' ? 'Send Request' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
