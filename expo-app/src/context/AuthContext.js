import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client, { setAuthExpiredHandler, setAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [onboarded, setOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAuth(); }, []);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  const loadAuth = async () => {
    try {
      const [t, u, ob] = await AsyncStorage.multiGet(["token", "user", "onboarded"]);
      if (ob[1] === "1") setOnboarded(true);
      if (t[1]) {
        try {
          setAuthToken(t[1]);
          const res = await client.get("/users/me");
          if (res.status === 200) {
            setToken(t[1]);
            setUser(res.data);
            await AsyncStorage.setItem("user", JSON.stringify(res.data));
          }
        } catch (_) {
          setAuthToken(null);
          await AsyncStorage.multiRemove(["token", "user"]);
        }
      }
    } catch (e) { console.warn("Auth load error", e); } finally { setLoading(false); }
  };

  const login = useCallback(async (email, password) => {
    const res = await client.post("/auth/login", { email, password });
    // If 2FA is required the backend returns { two_factor_required: true }
    // WITHOUT a token — do not persist/corrupt the session.
    if (res.data && res.data.two_factor_required) {
      return res.data;
    }
    const { token: t, user: u } = res.data;
    await AsyncStorage.multiSet([["token", t], ["user", JSON.stringify(u)]]);
    setAuthToken(t);
    setToken(t);
    setUser(u);
    return res.data;
  }, []);

  const twoFactorLogin = useCallback(async (email, code) => {
    const res = await client.post("/auth/2fa-login", { email, code });
    const { token: t, user: u } = res.data;
    await AsyncStorage.multiSet([["token", t], ["user", JSON.stringify(u)]]);
    setAuthToken(t);
    setToken(t);
    setUser(u);
    return res.data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await client.post("/auth/register", { username, email, password });
    const { token: t, user: u } = res.data;
    await AsyncStorage.multiSet([["token", t], ["user", JSON.stringify(u)]]);
    setAuthToken(t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      AsyncStorage.setItem("user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem("onboarded", "1");
    setOnboarded(true);
  }, []);

  const value = useMemo(() => ({ user, token, onboarded, loading, login, twoFactorLogin, register, logout, updateUser, finishOnboarding }), [user, token, onboarded, loading, login, twoFactorLogin, register, logout, updateUser, finishOnboarding]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
