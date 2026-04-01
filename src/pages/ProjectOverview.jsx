import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProjectOverview() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemoLogin = async () => {
    if (loading) return;
    setError("");
    setLoading(true);

    const result = await login({
      username: "demo@invoicesaas.com",
      password: "Csk007@vy",
    });

    setLoading(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setError(result.message || "Demo login failed. Please try again.");
  };

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

        <div className="mt-6 flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Run Live the Project"}
          </button>
          <p className="text-xs text-slate-600">Click On This Button To Explore My project.</p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
