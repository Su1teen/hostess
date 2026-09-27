import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type UserRole = "guest" | "business" | null;

interface AuthContextValue {
  role: UserRole;
  hydrated: boolean;
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
  hydrated: false,
  login: () => {},
  logout: () => {},
});

/**
 * Глобальный стейт авторизации. Переживает перезагрузку через localStorage.
 * Роль резолвится в useEffect, чтобы SSR- и первый клиентский рендер совпадали.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRole(readStoredRole());
    setHydrated(true);
  }, []);

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

  return (
    <AuthContext.Provider value={{ role, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
