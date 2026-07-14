import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "guest" | "business" | null;

interface AuthContextValue {
  role: UserRole;
  login: (role: Exclude<UserRole, null>) => void;
  logout: () => void;
}

const STORAGE_KEY = "hostess-role";

function readStoredRole(): UserRole {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "guest" || v === "business" ? v : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue>({
  role: null,
  login: () => {},
  logout: () => {},
});

/**
 * Глобальный стейт авторизации. Переживает перезагрузку через localStorage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(readStoredRole);

  const login = useCallback((next: Exclude<UserRole, null>) => {
    setRole(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return <AuthContext.Provider value={{ role, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
