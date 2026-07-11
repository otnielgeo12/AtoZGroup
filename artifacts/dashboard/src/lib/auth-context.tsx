import React, { createContext, useContext, useState, useEffect } from "react";

export type AdminRole = "super_admin" | "admin" | "admin_fnb" | "admin_entertainment" | "admin_karaoke";
export type AdminGroup = "fnb" | "entertainment" | "karaoke" | null;

interface User {
  id: number;
  username: string;
  email: string | null;
  role: AdminRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isFnbAdmin: boolean;
  isEntertainmentAdmin: boolean;
  isKaraokeAdmin: boolean;
  adminGroup: AdminGroup;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getAdminGroup(role: AdminRole | undefined | null): AdminGroup {
  if (!role) return null;
  if (role === "admin_fnb") return "fnb";
  if (role === "admin_entertainment") return "entertainment";
  if (role === "admin_karaoke") return "karaoke";
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Set the global token getter for API client
  useEffect(() => {
    import("@workspace/api-client-react").then(({ setAuthTokenGetter }) => {
      setAuthTokenGetter(() => localStorage.getItem("auth_token"));
    });
  }, [token]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem("auth_user", JSON.stringify(userData));
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMe();
  }, [token]);

  const login = async (username: string, password: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: "Login failed" }));
      throw new Error(errData.error || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const adminGroup = getAdminGroup(user?.role);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isSuperAdmin: !!user && user.role === "super_admin",
    isFnbAdmin: !!user && user.role === "admin_fnb",
    isEntertainmentAdmin: !!user && user.role === "admin_entertainment",
    isKaraokeAdmin: !!user && user.role === "admin_karaoke",
    adminGroup,
    getToken: async () => token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
