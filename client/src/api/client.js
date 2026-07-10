import axios from "axios";

// En desarrollo usamos el proxy de Vite (/api). En producción, VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export const api = axios.create({ baseURL });

// Adjunta el token JWT a cada petición.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("2nv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira, limpia la sesión.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("2nv_token")) {
      localStorage.removeItem("2nv_token");
      localStorage.removeItem("2nv_user");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);
