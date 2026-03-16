import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCompanies } from "../api/companyService";
import { getInvoices } from "../api/invoiceService";
import { getClients } from "../api/clientService";

function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
}

function StatCard({ title, value, icon, tone, to }) {
  return (
    <Link
      to={to}
      className="block transition-transform focus:outline-none focus:ring-2 focus:ring-slate-300"
    >
      <article className="app-card cursor-pointer p-5 transition-all hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
            {icon}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Dashboard() {
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        if (isMounted) {
          setError("");
        }

        const [companiesRes, invoicesRes, clientsRes] = await Promise.all([
          getCompanies(),
          getInvoices(),
          getClients(),
        ]);
        if (isMounted) {
          setCompanies(normalizeList(companiesRes));
          setInvoices(normalizeList(invoicesRes));
          setClients(normalizeList(clientsRes));
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.detail || "Failed to load dashboard statistics.");
        }
      } finally {
        if (isMounted && showLoading) {
          setLoading(false);
        }
      }
    };

    loadDashboardData(true);
    const intervalId = setInterval(() => loadDashboardData(false), 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => {
    const paidCount = invoices.filter((invoice) => invoice?.status === "paid").length;
    const pendingCount = invoices.filter((invoice) => invoice?.status === "due").length;

    return {
      totalCompanies: companies.length,
      totalInvoices: invoices.length,
      totalClients: clients.length,
      paidInvoices: paidCount,
      pendingInvoices: pendingCount,
    };
  }, [companies, invoices, clients]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading dashboard statistics...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">Overview of your invoice workspace and payment status.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies}
          tone="bg-blue-50 text-blue-600"
          to="/companies"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 11h1" />
              <path d="M14 11h1" />
            </svg>
          }
        />

        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          tone="bg-violet-50 text-violet-600"
          to="/invoices"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 3h7l5 5v13H7z" />
              <path d="M14 3v6h6" />
            </svg>
          }
        />

        <StatCard
          title="Total Clients"
          value={stats.totalClients ?? 0}
          tone="bg-sky-50 text-sky-600"
          to="/clients"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 11a4 4 0 1 0-8 0" />
              <circle cx="12" cy="7" r="4" />
              <path d="M4 21c0-3.314 3.582-6 8-6s8 2.686 8 6" />
            </svg>
          }
        />

        <StatCard
          title="Paid Invoices"
          value={stats.paidInvoices}
          tone="bg-emerald-50 text-emerald-600"
          to="/invoices?status=paid"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 13 4 4L19 7" />
            </svg>
          }
        />

        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          tone="bg-amber-50 text-amber-600"
          to="/invoices?status=due"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6l4 2" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
