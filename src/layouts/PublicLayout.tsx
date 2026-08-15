import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-border/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground text-base font-bold">H</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">HRMS Portal</p>
            <p className="text-xs text-muted-foreground">Onboarding Form</p>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="text-center py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} HRMS · All information is kept confidential
      </footer>
    </div>
  )
}
