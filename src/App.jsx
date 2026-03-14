import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter";
import TopNavbar from "./components/TopNavbar";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TopNavbar />
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}
