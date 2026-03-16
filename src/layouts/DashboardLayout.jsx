import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
    return () => {};
  }, [isSidebarOpen]);

  return (
    <div className="app-shell">
      <TopNavbar showMenuButton onMenuClick={openSidebar} />

      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-6">
            <section className="app-card p-6">
              <Outlet />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
