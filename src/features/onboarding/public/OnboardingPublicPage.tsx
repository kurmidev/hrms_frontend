import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { onboardingApi } from '@/api/onboarding.api'
import { toast } from 'sonner'
import { generateId, getApiErrorMessage } from '@/lib/utils'

const step1Schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(/^[6-9]\d{9}$/, '10-digit mobile number'),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender is required' }),
  nationality: z.string().optional(),
  addressLine1: z.string().min(1, 'Address is required'),
  addressCity: z.string().min(1, 'City is required'),
  addressState: z.string().min(1, 'State is required'),
  addressPincode: z.string().min(1, 'Pincode is required'),
  accountNumber: z.string().min(1, 'Account number required'),
  ifscCode: z.string().min(11, 'IFSC must be 11 chars').max(11),
  bankName: z.string().min(1, 'Bank name required'),
  accountType: z.enum(['SAVINGS', 'CURRENT'], { message: 'Account type is required' }),
  declarationAccepted: z.boolean().refine((v) => v === true, {
    message: 'You must accept the declaration to submit',
  }),
})
type Step1Values = z.infer<typeof step1Schema>

const DOCUMENT_TYPES = [
  'AADHAAR',
  'PAN',
  'RESUME',
  'OFFER_LETTER',
  'BANK_PROOF',
  'PHOTO',
  'EDUCATION_CERTIFICATE',
  'EXPERIENCE_CERTIFICATE',
  'BLOOD_GROUP_REPORT',
] as const

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

interface DocumentRow {
  id: string
  documentType: string
  file: File | null
  error: string | null
}

function createEmptyRow(): DocumentRow {
  return { id: generateId(), documentType: '', file: null, error: null }
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File exceeds 5 MB limit'
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only PDF, JPEG, JPG, and PNG files are allowed'
  }
  return null
}

export function OnboardingPublicPage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<'details' | 'documents' | 'done'>('details')
  const [submittedDetails, setSubmittedDetails] = useState(false)
  const [documentRows, setDocumentRows] = useState<DocumentRow[]>([createEmptyRow()])

  const { data: linkData, isLoading, error } = useQuery({
    queryKey: ['onboarding-public', token],
    queryFn: () => onboardingApi.getPublic(token!),
    enabled: !!token,
    retry: false,
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { accountType: 'SAVINGS', declarationAccepted: false },
  })

  useEffect(() => {
    if (!linkData) return
    const link = linkData as { candidateName?: string; phone?: string }
    const nameParts = (link.candidateName ?? '').trim().split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ')
    reset({
      accountType: 'SAVINGS',
      declarationAccepted: false,
      firstName,
      lastName,
      phone: link.phone ?? '',
    })
  }, [linkData, reset])

  const { mutate: submitDetails, isPending: savingDetails } = useMutation({
    mutationFn: (data: Step1Values) =>
      onboardingApi.submitDetails(token!, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        address: {
          line1: data.addressLine1,
          city: data.addressCity,
          state: data.addressState,
          pincode: data.addressPincode,
        },
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        accountType: data.accountType,
        declarationAccepted: data.declarationAccepted,
      }),
    onSuccess: () => {
      setSubmittedDetails(true)
      setStep('documents')
      toast.success('Details saved. Please upload your documents.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to save details. Please try again.')),
  })

  const validRows = documentRows.filter((r) => r.file && !r.error && r.documentType)

  const { mutate: submitFinal, isPending: submitting } = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      validRows.forEach((row) => {
        fd.append('files', row.file as File)
        fd.append('documentTypes', row.documentType)
      })
      fd.append('finalSubmit', 'true')
      return onboardingApi.submitDocuments(token!, fd)
    },
    onSuccess: () => setStep('done'),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Submission failed. Please try again.')),
  })

  const updateRow = (id: string, patch: Partial<DocumentRow>) => {
    setDocumentRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const handleFileChange = (id: string, fileList: FileList | null) => {
    const file = fileList?.[0] ?? null
    if (!file) {
      updateRow(id, { file: null, error: null })
      return
    }
    updateRow(id, { file, error: validateFile(file) })
  }

  const addRow = () => setDocumentRows((rows) => [...rows, createEmptyRow()])

  const removeRow = (id: string) =>
    setDocumentRows((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== id)))

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-48 w-full" /></div>
  }

  if (error || !linkData) {
    return (
      <Card className="shadow-sm text-center py-12">
        <CardContent>
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Link Invalid or Expired</h2>
          <p className="text-muted-foreground">This onboarding link is no longer valid. Please contact HR for a new link.</p>
        </CardContent>
      </Card>
    )
  }

  if (step === 'done') {
    return (
      <Card className="shadow-sm text-center py-12">
        <CardContent>
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground">Thank you. HR will review your application and get back to you shortly.</p>
        </CardContent>
      </Card>
    )
  }

  const link = linkData as { candidateName?: string; jobTitle?: string; departmentName?: string }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Welcome, {link?.candidateName ?? 'Candidate'}!</h2>
        <p className="text-muted-foreground mt-1">
          {link?.jobTitle} · {link?.departmentName}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-3">
        {[{ label: 'Personal Details', id: 'details' }, { label: 'Documents', id: 'documents' }].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              (step === 'details' && i === 0) || (step === 'documents' && i === 1)
                ? 'bg-primary text-primary-foreground'
                : submittedDetails && i === 0
                ? 'bg-emerald-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}>
              {submittedDetails && i === 0 ? '✓' : i + 1}
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block">{s.label}</span>
            {i === 0 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 'details' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Personal & Bank Details</CardTitle>
            <CardDescription>Please fill in your information accurately</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((v) => submitDetails(v))} className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'firstName', label: 'First Name *', placeholder: 'Priya' },
                    { id: 'lastName', label: 'Last Name *', placeholder: 'Sharma' },
                    { id: 'phone', label: 'Mobile *', placeholder: '9876543210' },
                    { id: 'dateOfBirth', label: 'Date of Birth *', placeholder: '1995-06-15', type: 'date' },
                    { id: 'nationality', label: 'Nationality', placeholder: 'Indian' },
                  ].map(({ id, label, placeholder, type }) => (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id}>{label}</Label>
                      <Input id={id} type={type ?? 'text'} placeholder={placeholder} {...register(id as keyof Step1Values)} />
                      {errors[id as keyof Step1Values] && (
                        <p className="text-xs text-destructive">{String(errors[id as keyof Step1Values]?.message)}</p>
                      )}
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender *</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select
                          items={{ MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }}
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v ?? '')}
                        >
                          <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'addressLine1', label: 'Address Line 1 *', placeholder: '221B Baker Street' },
                    { id: 'addressCity', label: 'City *', placeholder: 'Bengaluru' },
                    { id: 'addressState', label: 'State *', placeholder: 'Karnataka' },
                    { id: 'addressPincode', label: 'Pincode *', placeholder: '560001' },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id}>{label}</Label>
                      <Input id={id} placeholder={placeholder} {...register(id as keyof Step1Values)} />
                      {errors[id as keyof Step1Values] && (
                        <p className="text-xs text-destructive">{String(errors[id as keyof Step1Values]?.message)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bank Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'accountNumber', label: 'Account Number *', placeholder: '123456789012' },
                    { id: 'ifscCode', label: 'IFSC Code *', placeholder: 'SBIN0001234' },
                    { id: 'bankName', label: 'Bank Name *', placeholder: 'State Bank of India' },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id}>{label}</Label>
                      <Input id={id} placeholder={placeholder} {...register(id as keyof Step1Values)} />
                      {errors[id as keyof Step1Values] && (
                        <p className="text-xs text-destructive">{String(errors[id as keyof Step1Values]?.message)}</p>
                      )}
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Controller
                      name="accountType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          items={{ SAVINGS: 'Savings', CURRENT: 'Current' }}
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v ?? '')}
                        >
                          <SelectTrigger id="accountType"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SAVINGS">Savings</SelectItem>
                            <SelectItem value="CURRENT">Current</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.accountType && <p className="text-xs text-destructive">{errors.accountType.message}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Controller
                    name="declarationAccepted"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="declarationAccepted"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                  <Label htmlFor="declarationAccepted" className="font-normal">
                    I declare that all information provided is true and accurate *
                  </Label>
                </div>
                {errors.declarationAccepted && (
                  <p className="text-xs text-destructive">{errors.declarationAccepted.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={savingDetails}>
                  {savingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save & Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'documents' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Document Upload</CardTitle>
            <CardDescription>Upload your identity and verification documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please have the following ready: Aadhaar Card, PAN Card, Resume, and any relevant certificates.
              Each file must be a PDF, JPEG, or PNG under 5 MB.
            </p>

            <div className="space-y-3">
              {documentRows.map((row) => (
                <div key={row.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-start">
                    <div className="space-y-1.5">
                      <Label>Document Type</Label>
                      <Select
                        items={Object.fromEntries(DOCUMENT_TYPES.map((t) => [t, t.replace(/_/g, ' ')]))}
                        value={row.documentType}
                        onValueChange={(v) => updateRow(row.id, { documentType: v ?? '' })}
                        disabled={submitting}
                      >
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>File</Label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={submitting}
                        onChange={(e) => handleFileChange(row.id, e.target.files)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs disabled:opacity-50"
                      />
                    </div>
                    <div className="flex sm:justify-end pt-1 sm:pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={submitting || documentRows.length === 1}
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {row.error && <p className="text-xs text-destructive">{row.error}</p>}
                  {!row.error && row.file && !row.documentType && (
                    <p className="text-xs text-amber-600">Please select a document type for this file.</p>
                  )}
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={submitting}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add document
            </Button>

            {validRows.length > 0 && (
              <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Ready to upload ({validRows.length})
                </p>
                {validRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between text-sm">
                    <span>{row.documentType.replace(/_/g, ' ')} — {row.file?.name}</span>
                  </div>
                ))}
              </div>
            )}

            {validRows.length === 0 && (
              <p className="text-xs text-destructive">Attach at least one document to submit.</p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('details')} disabled={submitting}>Back</Button>
              <Button onClick={() => submitFinal()} disabled={submitting || validRows.length === 0}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
