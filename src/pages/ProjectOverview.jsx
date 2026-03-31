export default function ProjectOverview() {
  return (
    <div className="mx-auto mt-8 max-w-2xl space-y-6">
      <section className="app-card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Invoice SaaS - Billing Management System</h1>
        <p className="mt-2 text-sm text-slate-600">
          This is a SaaS-based invoice management application where users can create companies, manage clients,
          generate invoices, download invoice PDFs, send invoices via email, and share invoices through WhatsApp.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tech Stack</p>
            <p className="mt-1 text-sm font-medium text-slate-700">Backend: Django REST Framework</p>
            <p className="text-sm font-medium text-slate-700">Frontend: React</p>
            <p className="text-sm font-medium text-slate-700">Deployment: Render (API) and Vercel (Frontend)</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Developer Credit</p>
            <p className="mt-1 text-sm font-medium text-emerald-700">Developed by Varinder Yadav</p>
          </div>
        </div>
      </section>
    </div>
  );
}
