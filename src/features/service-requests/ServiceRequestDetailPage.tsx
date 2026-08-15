import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ticket, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { serviceRequestApi } from '@/api/service-request.api'
import type { ServiceRequestStatus } from '@/types/service-request.types'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { AssignRequestDialog } from './AssignRequestDialog'
import { ResolveRequestDialog } from './ResolveRequestDialog'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-slate-100 text-slate-600',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-200 text-gray-700',
}

// Status transitions permitted from the current status, offered via the "Update Status" affordance.
const NEXT_STATUSES: Record<string, ServiceRequestStatus[]> = {
  ASSIGNED: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
}

export function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canManage = usePermission('service_request:manage')

  const [assignOpen, setAssignOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [comment, setComment] = useState('')

  const { data: request, isLoading } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => serviceRequestApi.get(id as string),
    enabled: !!id,
  })

  const { mutate: updateStatus, isPending: statusPending } = useMutation({
    mutationFn: (status: ServiceRequestStatus) => {
      if (!id) return Promise.reject(new Error('No request id'))
      return serviceRequestApi.updateStatus(id, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-request', id] })
      qc.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('Status updated.')
    },
    onError: () => toast.error('Failed to update status.'),
  })

  const { mutate: addComment, isPending: commentPending } = useMutation({
    mutationFn: () => {
      if (!id) return Promise.reject(new Error('No request id'))
      return serviceRequestApi.addComment(id, { content: comment })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-request', id] })
      setComment('')
      toast.success('Comment added.')
    },
    onError: () => toast.error('Failed to add comment.'),
  })

  const nextStatuses = request ? NEXT_STATUSES[request.status] ?? [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/service-requests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Ticket className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{request?.title ?? 'Service Request'}</h1>
              {request && (
                <Badge className={`border-0 text-xs font-medium ${STATUS_COLORS[request.status]}`} variant="secondary">
                  {request.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {request
              ? `${request.category.replace('_', ' ')} · ${
                  request.isAnonymous || !request.employee
                    ? 'Anonymous'
                    : `${request.employee.firstName} ${request.employee.lastName} (${request.employee.empCode})`
                }`
              : ''}
          </p>
        </div>
        {canManage && request && request.status === 'OPEN' && (
          <Button onClick={() => setAssignOpen(true)}>Assign</Button>
        )}
        {canManage && request && (request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS') && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAssignOpen(true)}>Reassign</Button>
            <Button onClick={() => setResolveOpen(true)}>Resolve</Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : request ? (
        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-3 text-sm">
            <p className="text-foreground whitespace-pre-wrap">{request.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Priority: </span>{request.priority}</p>
              <p><span className="font-medium text-foreground">SLA Deadline: </span>{request.slaDeadline ? formatDate(request.slaDeadline) : '—'}</p>
              <p><span className="font-medium text-foreground">Resolved: </span>{request.resolvedAt ? formatDate(request.resolvedAt) : '—'}</p>
              <p><span className="font-medium text-foreground">Closed: </span>{request.closedAt ? formatDate(request.closedAt) : '—'}</p>
            </div>
            {canManage && nextStatuses.length > 0 && (
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Move to:</span>
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    disabled={statusPending}
                    onClick={() => updateStatus(s)}
                  >
                    {s.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Comments</h2>
        <div className="space-y-3">
          {(request?.comments ?? []).map((c) => (
            <Card key={c.id} className="shadow-sm">
              <CardContent className="pt-4 pb-3 text-sm space-y-1">
                <p className="text-foreground whitespace-pre-wrap">{c.content}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
          {request && (request.comments ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <Textarea
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1"
          />
          <Button
            disabled={!comment.trim() || commentPending}
            onClick={() => addComment()}
          >
            <Send className="h-4 w-4 mr-1.5" />
            Post
          </Button>
        </div>
      </div>

      <AssignRequestDialog open={assignOpen} onOpenChange={setAssignOpen} request={request ?? null} />
      <ResolveRequestDialog open={resolveOpen} onOpenChange={setResolveOpen} request={request ?? null} />
    </div>
  )
}
