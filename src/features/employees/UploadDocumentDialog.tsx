import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { employeesApi } from '@/api/employees.api'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const DOCUMENT_TYPES = [
  'AADHAAR',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENCE',
  'VOTER_ID',
  'DEGREE',
  'RESUME',
  'OFFER_LETTER',
  'EXPERIENCE_LETTER',
  'OTHER',
] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
}

export function UploadDocumentDialog({ open, onOpenChange, employeeId }: Props) {
  const qc = useQueryClient()
  const [documentType, setDocumentType] = useState<string>('AADHAAR')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const reset = () => {
    setDocumentType('AADHAAR')
    setNotes('')
    setFile(null)
  }

  const { mutate: upload, isPending } = useMutation({
    mutationFn: () => {
      if (!file) return Promise.reject(new Error('Please choose a file'))
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)
      if (notes) formData.append('notes', notes)
      return employeesApi.uploadDocument(employeeId, formData)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', employeeId] })
      onOpenChange(false)
      reset()
      toast.success('Document uploaded.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to upload document.')),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Document Type *</Label>
            <Select
              items={Object.fromEntries(DOCUMENT_TYPES.map((t) => [t, t.replace(/_/g, ' ')]))}
              value={documentType}
              onValueChange={(v) => setDocumentType(v ?? 'AADHAAR')}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>File *</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input placeholder="Optional notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={isPending || !file} onClick={() => upload()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
