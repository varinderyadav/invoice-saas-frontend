import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeLabels = {
  "/dashboard": "Dashboard",
  "/companies": "Companies",
  "/clients": "Clients",
  "/invoices": "Invoices",
  "/settings": "Settings",
};

export default function TopNavbar({ showMenuButton = false, onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-surface sticky top-0 z-20 flex h-16 items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {isAuthenticated && showMenuButton ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="Open sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          </button>
        ) : null}

        <Link
          to={isAuthenticated ? "/dashboard" : "/login"}
          className="flex items-center gap-2 text-base font-semibold text-slate-900 hover:text-slate-700"
        >
          <img src="/logo.svg" alt="Invoice SaaS" className="h-8 w-8" />
          <span>Invoice SaaS</span>
        </Link>
        {isAuthenticated ? (
          <span className="ml-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 md:hidden">
            {routeLabels[location.pathname] || "Workspace"}
          </span>
        ) : null}
      </div>

      <nav className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
            >
              Dashboard
            </Link>

            {user?.username ? (
              <span className="hidden text-sm font-medium text-slate-500 sm:inline">
                {user.username}
              </span>
            ) : null}

            <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 lg:inline">
              Developed by Varinder Yadav
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-primary"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-400 lg:inline">
              Developed by Varinder Yadav
            </span>
            <Link
              to="/login"
              className="btn btn-outline"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-primary"
            >
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
