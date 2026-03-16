import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Companies", to: "/companies" },
  { label: "Clients", to: "/clients" },
  { label: "Invoices", to: "/invoices" },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    if (onClose) {
      onClose();
    }
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white/95 px-4 py-6 backdrop-blur transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="mb-6 flex items-center justify-between px-2 md:mb-8">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Invoice SaaS" className="h-9 w-9" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace</p>
            <h1 className="text-lg font-bold text-slate-900">Invoice SaaS</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
          aria-label="Close sidebar"
        >
          x
        </button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              [
                "nav-item",
                isActive
                  ? "nav-item-active"
                  : "nav-item-default",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
      >
        Logout
      </button>
    </aside>
    </>
  );
}
