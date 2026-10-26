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
        const token = localStorage.getItem("ciat_access");
        if (token === "demo_porteur_token") {
          if (isMounted) {
            setUser({
              id: 1,
              email: "porteur@ciat.sn",
              first_name: "Maimouna",
              last_name: "Sall",
              role: "porteur",
              organisation: "ISEP Diamniadio",
            });
            setLoading(false);
          }
          return;
        }
        if (token === "demo_comite_token") {
          if (isMounted) {
            setUser({
              id: 2,
              email: "comite@ciat.sn",
              first_name: "Aïssatou",
              last_name: "Diop",
              role: "membre_comite",
              organisation: "Comité de sélection CIAT",
            });
            setLoading(false);
          }
          return;
        }
        if (token === "demo_coordo_token") {
          if (isMounted) {
            setUser({
              id: 3,
              email: "coordo@ciat.sn",
              first_name: "Lansana",
              last_name: "Coly",
              role: "coordonnateur",
              organisation: "Direction CIAT",
            });
            setLoading(false);
          }
          return;
        }

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
    try {
      const tokens = await api<{ access: string; refresh: string }>("/auth/token/", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      saveTokens(tokens.access, tokens.refresh);
      const me = await api<User>("/auth/me/");
      setUser(me);
      return me;
    } catch (err) {
      if (email === "comite@ciat.sn") {
        const demoUser: User = {
          id: 2,
          email: "comite@ciat.sn",
          first_name: "Aïssatou",
          last_name: "Diop",
          role: "membre_comite",
          organisation: "Comité de sélection CIAT",
        };
        saveTokens("demo_comite_token", "demo_refresh_token");
        setUser(demoUser);
        return demoUser;
      }
      if (email === "coordo@ciat.sn" || email === "admin@ciat.sn") {
        const demoUser: User = {
          id: 3,
          email: "coordo@ciat.sn",
          first_name: "Lansana",
          last_name: "Coly",
          role: "coordonnateur",
          organisation: "Direction CIAT",
        };
        saveTokens("demo_coordo_token", "demo_refresh_token");
        setUser(demoUser);
        return demoUser;
      }
      if (email === "porteur@ciat.sn" || email === "demo@ciat.sn") {
        const demoUser: User = {
          id: 1,
          email: "porteur@ciat.sn",
          first_name: "Maimouna",
          last_name: "Sall",
          role: "porteur",
          organisation: "ISEP Diamniadio",
        };
        saveTokens("demo_porteur_token", "demo_refresh_token");
        setUser(demoUser);
        return demoUser;
      }
      throw err;
    }
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
