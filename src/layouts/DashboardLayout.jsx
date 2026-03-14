import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Outlet />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
