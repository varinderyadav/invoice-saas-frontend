import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNavbar />
      <main className="mx-auto max-w-[1440px] p-6">
        <Outlet />
      </main>
    </div>
  );
}
