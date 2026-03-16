import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest } from "../api/authService";
import { onAuthClear } from "./authEvents";

const AuthContext = createContext(null);

// helper to decode JWT payload
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const readAccessToken = () => localStorage.getItem("accessToken");
  const readRefreshToken = () => localStorage.getItem("refreshToken");

  const [accessToken, setAccessToken] = useState(readAccessToken());
  const [refreshToken, setRefreshToken] = useState(readRefreshToken());
  const [user, setUser] = useState(() => {
    const token = readAccessToken();
    const payload = token && parseJwt(token);
    return payload ? { username: payload.username } : null;
  });

  const isAuthenticated = Boolean(accessToken);

  const login = async ({ username, password }) => {
    try {
      const result = await loginRequest(username, password);
      if (!result?.success) {
        return {
          success: false,
          message: result?.message || "Login failed. Please check your credentials.",
        };
      }

      const access = localStorage.getItem("accessToken");
      const refresh = localStorage.getItem("refreshToken");

      setAccessToken(access);
      setRefreshToken(refresh);

      const payload = access && parseJwt(access);
      if (payload) {
        setUser({ username: payload.username });
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error?.message || "Login failed." };
    }
  };

  const logout = () => {
    // clear both current and legacy tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refresh");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const clearInvalidAuth = () => {
    logout();
  };

  useEffect(() => {
    const syncAuthState = () => {
      const access = readAccessToken();
      const refresh = readRefreshToken();
      if (!access) {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        return;
      }
      setAccessToken(access);
      setRefreshToken(refresh);
      const payload = parseJwt(access);
      if (payload) {
        setUser({ username: payload.username });
      }
    };

    syncAuthState();
    const handleStorage = (event) => {
      if (event.key === "accessToken" || event.key === "refreshToken" || event.key === "access") {
        syncAuthState();
      }
    };
    window.addEventListener("storage", handleStorage);
    const unsubscribe = onAuthClear(() => {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    });
    return () => {
      window.removeEventListener("storage", handleStorage);
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated,
      login,
      logout,
      clearInvalidAuth,
    }),
    [accessToken, refreshToken, user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
