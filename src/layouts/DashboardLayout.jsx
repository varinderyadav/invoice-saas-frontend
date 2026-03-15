import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNavbar showMenuButton onMenuClick={openSidebar} />

      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

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
