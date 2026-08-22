import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Loader2, Copy, Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { onboardingApi } from '@/api/onboarding.api'
import { ApproveOnboardingDialog } from './ApproveOnboardingDialog'
import { formatDateTime, getApiErrorMessage } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'

const RESENDABLE_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'CHANGES_REQUESTED'])

interface SubmissionAddress {
  line1?: string
  city?: string
  state?: string
  pincode?: string
}

interface SubmissionDetails {
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  address?: SubmissionAddress
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  accountType?: string
  declarationAccepted?: boolean
  [key: string]: unknown
}

interface InfoRow {
  label: string
  value: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** submissionData may be flat or wrapped under a `details` key — handle both. */
function extractSubmissionDetails(submissionData: Record<string, unknown> | null): SubmissionDetails {
  if (!submissionData) return {}
  const nested = submissionData.details
  if (isRecord(nested)) return nested as SubmissionDetails
  return submissionData as SubmissionDetails
}

const KNOWN_KEYS = new Set([
  'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'nationality',
  'address', 'bankName', 'accountNumber', 'ifscCode', 'accountType', 'declarationAccepted',
])

function toDisplayValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

function buildRows(entries: Array<[string, unknown]>): InfoRow[] {
  return entries.reduce<InfoRow[]>((rows, [key, raw]) => {
    const value = toDisplayValue(raw)
    if (value === null) return rows
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
    return [...rows, { label, value }]
  }, [])
}

function InfoRowList({ rows }: { rows: InfoRow[] }) {
  if (rows.length === 0) return null
  return (
    <>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium text-foreground">{value}</span>
        </div>
      ))}
    </>
  )
}

export function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canManage = usePermission('onboarding:manage')
  const [notesDialog, setNotesDialog] = useState<'changes' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [approveOpen, setApproveOpen] = useState(false)

  const { data: link, isLoading } = useQuery({
    queryKey: ['onboarding-link', id],
    queryFn: () => onboardingApi.get(id!),
    enabled: !!id && canManage,
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

  const { mutate: resend, isPending: resending } = useMutation({
    mutationFn: () => onboardingApi.resend(id!),
    onSuccess: () => { invalidate(); toast.success('Invite resent.') },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to resend invite.')),
  })

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/onboarding')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Onboarding</h1>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to manage onboarding.
        </div>
      </div>
    )
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-64 w-full" /></div>
  if (!link) return <div className="text-muted-foreground">Not found.</div>

  const submissionDetails = extractSubmissionDetails(link.submissionData)
  const personalRows = buildRows([
    ['Name', [submissionDetails.firstName, submissionDetails.lastName].filter(Boolean).join(' ')],
    ['Gender', submissionDetails.gender],
    ['Phone', submissionDetails.phone],
    ['Date Of Birth', submissionDetails.dateOfBirth],
    ['Nationality', submissionDetails.nationality],
  ])
  const addressLabels: Record<string, string> = {
    line1: 'Address Line 1',
    city: 'City',
    state: 'State',
    pincode: 'Pincode',
  }
  const addressRows = buildRows(
    Object.entries(submissionDetails.address ?? {}).map(([key, value]) => [
      addressLabels[key] ?? key,
      value,
    ]),
  )
  const bankRows = buildRows([
    ['Bank Name', submissionDetails.bankName],
    ['Account Number', submissionDetails.accountNumber],
    ['IFSC Code', submissionDetails.ifscCode],
    ['Account Type', submissionDetails.accountType],
  ])
  const otherRows = buildRows(
    Object.entries(submissionDetails).filter(([key]) => !KNOWN_KEYS.has(key)),
  )

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
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-muted-foreground">Onboarding Link</span>
            <div className="flex items-center gap-2 max-w-[70%]">
              <span className="text-xs text-foreground truncate" title={`${window.location.origin}/onboarding/${link.token}`}>
                {`${window.location.origin}/onboarding/${link.token}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${window.location.origin}/onboarding/${link.token}`)
                  toast.success('Link copied.')
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission data */}
      {link.submissionData && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Submitted Information</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {personalRows.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Personal Info</p>
                <InfoRowList rows={personalRows} />
              </div>
            )}
            {addressRows.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Address</p>
                <InfoRowList rows={addressRows} />
              </div>
            )}
            {bankRows.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Bank Details</p>
                <InfoRowList rows={bankRows} />
              </div>
            )}
            {otherRows.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Other</p>
                <InfoRowList rows={otherRows} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {RESENDABLE_STATUSES.has(link.status) && (
          <Button variant="outline" onClick={() => resend()} disabled={resending}>
            {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Resend Invite
          </Button>
        )}
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
            <Button onClick={() => setApproveOpen(true)}>
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
        <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
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

      {link.status === 'UNDER_REVIEW' && (
        <ApproveOnboardingDialog open={approveOpen} onOpenChange={setApproveOpen} link={link} />
      )}
    </div>
  )
}
