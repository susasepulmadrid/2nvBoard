import { useState, useEffect } from "react";
import { api } from "../api/client.js";

/**
 * Carga datos de un endpoint, reaccionando al filtro de célula.
 * El backend ya fuerza el aislamiento; para líderes, celulaFiltro se ignora.
 */
export function useApi(path, celulaFiltro) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    const params = celulaFiltro && celulaFiltro !== "todas" ? { celula: celulaFiltro } : {};
    api.get(path, { params })
      .then((r) => { if (vivo) { setData(r.data); setError(null); } })
      .catch((e) => { if (vivo) setError(e.response?.data?.error || "Error al cargar."); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [path, celulaFiltro]);

  return { data, cargando, error };
}
