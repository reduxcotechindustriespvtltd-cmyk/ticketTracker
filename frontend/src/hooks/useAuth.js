import { createContext, useContext, useState, useCallback } from "react";
import { login as apiLogin, logout as apiLogout } from "../api/tickets";
import { setToken, clearToken, getStoredToken } from "../api/client";

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) return true;
  return Date.now() / 1000 >= payload.exp;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore user from sessionStorage token on mount (survives page refresh)
    const token = getStoredToken();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload || isTokenExpired(payload)) {
      clearToken();
      return null;
    }
    return { id: parseInt(payload.sub), email: payload.email, role: payload.role };
  });

  const signIn = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setToken(data.access_token);
    setUser({ id: data.user_id, email: data.email, role: data.role });
    return data;
  }, []);

  const signOut = useCallback(async () => {
    try { await apiLogout(); } catch (_) {}
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
