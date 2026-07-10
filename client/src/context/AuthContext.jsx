import { createContext, useContext, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("2nv_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("2nv_token", data.token);
    localStorage.setItem("2nv_user", JSON.stringify(data.usuario));
    setUser(data.usuario);
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem("2nv_token");
    localStorage.removeItem("2nv_user");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
