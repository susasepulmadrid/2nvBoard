import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useApi } from "../hooks/useApi.js";
import { Card, Badge, ChartCard, FilterBar, SearchInput, Sel, Loader } from "../components/ui.jsx";
import { COLORS, MESES, fmtCOP, fmtM, semaforo, semaforoLabel } from "../utils/format.js";

const thStyle = { textAlign: "left", fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", color: COLORS.slate, padding: "11px 14px", borderBottom: `1px solid ${COLORS.line}`, fontWeight: 600 };
const tdStyle = { padding: "11px 14px", fontSize: 13.5, borderBottom: `1px solid ${COLORS.line}` };
const tdNum = { ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" };

function Tabla({ children }) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto", maxHeight: 520 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>{children}</table>
      </div>
    </Card>
  );
}

/* ---------- Clientes ---------- */
export function Clientes({ celulaFiltro, rol }) {
  const { data, cargando, error } = useApi("/clientes", celulaFiltro);
  const [fEstado, setFEstado] = useState("Todos"), [fCiudad, setFCiudad] = useState("Todas"), [q, setQ] = useState("");
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;

  const ciudades = ["Todas", ...new Set(data.map((c) => c.ciudad).filter(Boolean))];
  const rows = data.filter((c) => (fEstado === "Todos" || c.estado === fEstado) && (fCiudad === "Todas" || c.ciudad === fCiudad) && c.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <FilterBar rol={rol} nuevo="Nuevo cliente" onNuevo={() => alert("Formulario de nuevo cliente (por implementar en tu instancia).")}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente…" />
        <Sel value={fEstado} onChange={setFEstado} opts={["Todos", "Activo", "Inactivo"]} />
        <Sel value={fCiudad} onChange={setFCiudad} opts={ciudades} />
      </FilterBar>
      <Tabla>
        <thead><tr><th style={thStyle}>Cliente</th><th style={thStyle}>NIT</th><th style={thStyle}>Ciudad</th><th style={thStyle}>Estado</th><th style={thStyle}>Líder</th><th style={{ ...thStyle, textAlign: "right" }}>Facturación</th><th style={{ ...thStyle, textAlign: "right" }}>Rentabilidad</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{c.nombre}</td>
              <td style={{ ...tdStyle, color: COLORS.slate }}>{c.nit}</td>
              <td style={tdStyle}>{c.ciudad}</td>
              <td style={tdStyle}><Badge color={c.estado === "Activo" ? COLORS.green : COLORS.slate}>{c.estado}</Badge></td>
              <td style={{ ...tdStyle, color: COLORS.slate }}>{c.lider}</td>
              <td style={tdNum}>{fmtCOP(c.facturacion)}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}><Badge color={semaforo(c.margen)}>{fmtM(c.rentabilidad)} · {c.margen.toFixed(0)}%</Badge></td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  );
}

/* ---------- Colaboradores ---------- */
export function Colaboradores({ celulaFiltro, rol }) {
  const { data, cargando, error } = useApi("/colaboradores", celulaFiltro);
  const [fCargo, setFCargo] = useState("Todos"), [q, setQ] = useState("");
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;

  const cargos = ["Todos", ...new Set(data.map((c) => c.cargo).filter(Boolean))];
  const rows = data.filter((c) => (fCargo === "Todos" || c.cargo === fCargo) && c.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <FilterBar rol={rol} nuevo="Nuevo colaborador" onNuevo={() => alert("Formulario de nuevo colaborador (por implementar en tu instancia).")}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar colaborador…" />
        <Sel value={fCargo} onChange={setFCargo} opts={cargos} />
      </FilterBar>
      <Tabla>
        <thead><tr><th style={thStyle}>Colaborador</th><th style={thStyle}>Cargo</th><th style={thStyle}>Cliente</th><th style={{ ...thStyle, textAlign: "right" }}>Costo empresa</th><th style={thStyle}>Estado</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{c.nombre}</td>
              <td style={tdStyle}>{c.cargo}</td>
              <td style={{ ...tdStyle, color: c.cliente ? COLORS.ink : COLORS.red }}>{c.cliente || "— Sin asignar"}</td>
              <td style={tdNum}>{fmtCOP(c.costo_empresa)}</td>
              <td style={tdStyle}><Badge color={c.estado === "Activo" ? COLORS.green : COLORS.slate}>{c.estado}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  );
}

/* ---------- Costos ---------- */
export function Costos({ celulaFiltro }) {
  const { data, cargando, error } = useApi("/costos", celulaFiltro);
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;
  return (
    <div>
      <Tabla>
        <thead><tr><th style={thStyle}>Colaborador</th><th style={thStyle}>Cliente</th><th style={{ ...thStyle, textAlign: "right" }}>Salario</th><th style={{ ...thStyle, textAlign: "right" }}>Prestac.</th><th style={{ ...thStyle, textAlign: "right" }}>Seg. social</th><th style={{ ...thStyle, textAlign: "right" }}>Bonif.</th><th style={{ ...thStyle, textAlign: "right" }}>Otros</th><th style={{ ...thStyle, textAlign: "right" }}>Costo empresa</th></tr></thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{c.nombre}</td>
              <td style={{ ...tdStyle, color: COLORS.slate }}>{c.cliente || "— Sin asignar"}</td>
              <td style={tdNum}>{fmtCOP(c.salario)}</td>
              <td style={tdNum}>{fmtCOP(c.prestaciones)}</td>
              <td style={tdNum}>{fmtCOP(c.seguridad_social)}</td>
              <td style={tdNum}>{fmtCOP(c.bonificaciones)}</td>
              <td style={tdNum}>{fmtCOP(c.otros)}</td>
              <td style={{ ...tdNum, fontWeight: 700, color: COLORS.blue }}>{fmtCOP(c.costo_empresa)}</td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      <p style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 12 }}>Costo empresa = Salario + Prestaciones + Seguridad social + Bonificaciones + Otros costos. Calculado automáticamente por la base de datos.</p>
    </div>
  );
}

/* ---------- Rentabilidad ---------- */
export function Rentabilidad({ celulaFiltro }) {
  const { data, cargando, error } = useApi("/reportes", celulaFiltro);
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;
  const rows = data.rentabilidadPorCliente;
  return (
    <div>
      <Tabla>
        <thead><tr><th style={thStyle}>Cliente</th><th style={{ ...thStyle, textAlign: "right" }}>Facturación</th><th style={{ ...thStyle, textAlign: "right" }}>Costo empresa</th><th style={{ ...thStyle, textAlign: "right" }}>Rentabilidad</th><th style={{ ...thStyle, textAlign: "right" }}>Margen</th><th style={thStyle}>Estado</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{r.nombre}</td>
              <td style={tdNum}>{fmtCOP(r.facturacion)}</td>
              <td style={tdNum}>{fmtCOP(r.costo_empresa)}</td>
              <td style={{ ...tdNum, fontWeight: 600, color: r.rentabilidad >= 0 ? COLORS.green : COLORS.red }}>{fmtCOP(r.rentabilidad)}</td>
              <td style={tdNum}>{r.margen.toFixed(1)}%</td>
              <td style={tdStyle}><Badge color={semaforo(r.margen)}>{semaforoLabel(r.margen)}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  );
}
