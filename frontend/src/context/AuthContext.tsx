"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearTokens, saveTokens } from "@/lib/api";

export type Role =
  | "administrateur"
  | "coordonnateur"
  | "mentor"
  | "membre_comite"
  | "porteur"
  | "visiteur";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  telephone?: string;
  genre?: string;
  organisation?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  telephone?: string;
  genre?: string;
  organisation?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api<User>("/auth/me/");
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const hasToken = Boolean(
        localStorage.getItem("ciat_access") || localStorage.getItem("ciat_refresh")
      );

      if (hasToken) {
        try {
          const me = await api<User>("/auth/me/");
          if (isMounted) setUser(me);
        } catch {
          clearTokens();
          if (isMounted) setUser(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const tokens = await api<{ access: string; refresh: string }>("/auth/token/", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    saveTokens(tokens.access, tokens.refresh);
    const me = await api<User>("/auth/me/");
    setUser(me);
    return me;
  };

  const register = async (data: RegisterData): Promise<User> => {
    await api("/auth/register/", {
      method: "POST",
      body: data,
      auth: false,
    });
    // Connexion automatique après inscription réussie
    return await login(data.email, data.password);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
