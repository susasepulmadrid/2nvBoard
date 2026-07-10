import { useState } from "react";
import {
  LayoutDashboard, Users, Briefcase, FileText, Wallet,
  TrendingUp, ClipboardList, BarChart3, LogOut, Building2,
} from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./views/Login.jsx";
import Dashboard from "./views/Dashboard.jsx";
import { Clientes, Colaboradores, Costos, Rentabilidad } from "./views/Tablas.jsx";
import { Facturacion, Seguimientos, Reportes } from "./views/Reportes.jsx";
import { COLORS } from "./utils/format.js";

const CELULAS = {
  1: "Célula de Valentina", 2: "Célula de Juan Manuel", 3: "Célula de Hamilton",
};

const MENU = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["clientes", "Clientes", Briefcase],
  ["colaboradores", "Colaboradores", Users],
  ["facturacion", "Facturación", FileText],
  ["costos", "Costos salariales", Wallet],
  ["rentabilidad", "Rentabilidad", TrendingUp],
  ["seguimientos", "Seguimientos", ClipboardList],
  ["reportes", "Reportes", BarChart3],
];

const TITULOS = {
  dashboard: "Dashboard", clientes: "Clientes", colaboradores: "Colaboradores",
  facturacion: "Facturación", costos: "Costos salariales", rentabilidad: "Rentabilidad",
  seguimientos: "Seguimientos", reportes: "Reportes",
};

export default function App() {
  const { user, logout } = useAuth();
  const [vista, setVista] = useState("dashboard");
  const [celulaFiltro, setCelulaFiltro] = useState("todas");

  if (!user) return <Login />;

  const esLider = user.rol === "Lider";
  // Para líder, el ámbito es su célula (el backend lo fuerza igual). Para admin/consulta, el selector.
  const scope = esLider ? user.celula_id : celulaFiltro;
  const puedeElegir = user.rol === "Administrador" || user.rol === "Consulta";
  const etiquetaCelula = esLider
    ? CELULAS[user.celula_id]
    : celulaFiltro === "todas" ? "Todas las células" : CELULAS[celulaFiltro];

  const props = { celulaFiltro: scope, rol: user.rol };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter',system-ui,sans-serif", color: COLORS.ink }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0}
        .nv-item{display:flex;align-items:center;gap:11px;padding:10px 14px;border-radius:9px;cursor:pointer;font-size:14px;color:#B8C7D9;transition:all .15s;font-weight:500}
        .nv-item:hover{background:rgba(255,255,255,.08);color:#fff}
        .nv-item.active{background:rgba(255,255,255,.14);color:#fff}
        tr:last-child td{border-bottom:none!important}
        select:focus,input:focus{outline:2px solid ${COLORS.blueSoft};outline-offset:1px}
        @media(max-width:860px){.sidebar{display:none!important}.grid-kpi{grid-template-columns:repeat(2,1fr)!important}.grid-2{grid-template-columns:1fr!important}}
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar" style={{ width: 240, background: COLORS.ink, padding: "22px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${COLORS.blueSoft},${COLORS.blue})`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>2N</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>2NVBoard</div>
            <div style={{ color: "#7E93A8", fontSize: 11 }}>{etiquetaCelula}</div>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {MENU.map(([k, label, Icon]) => (
            <div key={k} className={`nv-item ${vista === k ? "active" : ""}`} onClick={() => setVista(k)}>
              <Icon size={17} /> {label}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "14px 8px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.blue, display: "grid", placeItems: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{user.nombre[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.nombre}</div>
              <div style={{ color: "#7E93A8", fontSize: 11 }}>{user.rol}</div>
            </div>
            <LogOut size={16} color="#7E93A8" style={{ cursor: "pointer" }} onClick={logout} title="Cerrar sesión" />
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <main style={{ flex: 1, padding: "24px 30px", overflow: "auto", maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 600, letterSpacing: ".03em", textTransform: "uppercase" }}>{etiquetaCelula}</div>
            <h1 style={{ fontSize: 25, fontWeight: 800, margin: "3px 0 0", letterSpacing: "-.02em" }}>{TITULOS[vista]}</h1>
          </div>
          {puedeElegir && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.slate }}>
              <Building2 size={16} /><span>Célula:</span>
              <select value={celulaFiltro} onChange={(e) => setCelulaFiltro(e.target.value)}
                style={{ fontFamily: "inherit", fontSize: 13, padding: "7px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 8, background: "#fff", color: COLORS.ink }}>
                <option value="todas">Todas</option>
                <option value="1">Valentina</option>
                <option value="2">Juan Manuel</option>
                <option value="3">Hamilton</option>
              </select>
            </div>
          )}
        </div>

        {vista === "dashboard" && <Dashboard {...props} />}
        {vista === "clientes" && <Clientes {...props} />}
        {vista === "colaboradores" && <Colaboradores {...props} />}
        {vista === "facturacion" && <Facturacion {...props} />}
        {vista === "costos" && <Costos {...props} />}
        {vista === "rentabilidad" && <Rentabilidad {...props} />}
        {vista === "seguimientos" && <Seguimientos {...props} />}
        {vista === "reportes" && <Reportes {...props} />}
      </main>
    </div>
  );
}
