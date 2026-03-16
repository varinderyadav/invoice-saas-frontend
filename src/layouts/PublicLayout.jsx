import { Outlet } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";

export default function PublicLayout() {
  return (
    <div className="app-shell">
      <TopNavbar />
      <main className="mx-auto max-w-[1440px] p-6">
        <Outlet />
      </main>
    </div>
  );
}
