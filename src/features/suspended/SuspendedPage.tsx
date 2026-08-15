import { AlertCircle } from 'lucide-react'

export function SuspendedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Account Suspended</h1>
        <p className="text-slate-600 mb-6">
          Your organization's subscription has been suspended due to unpaid invoices. Please contact
          your platform administrator to restore access.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800 mb-1">Need help?</p>
          <p>
            Contact support at{' '}
            <a href="mailto:support@hrms.com" className="text-blue-600 hover:underline">
              support@hrms.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
