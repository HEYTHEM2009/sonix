import { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      client
        .get("/users/me")
        .then((res) => {
          const u = res.data?.data || res.data?.user || res.data;
          if (u) setUser(u);
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await client.post("/auth/login", { email, password });
    const token = res.data.token || res.data.data?.token;
    const userData = res.data.user || res.data.data?.user;
    if (token) localStorage.setItem("token", token);
    if (userData) setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await client.post("/auth/register", data);
    const token = res.data.token || res.data.data?.token;
    const userData = res.data.user || res.data.data?.user;
    if (token) localStorage.setItem("token", token);
    if (userData) setUser(userData);
    return res.data;
  };

  const logout = async () => {
    try {
      await client.post("/auth/logout");
    } catch {
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
