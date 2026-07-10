import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";
import { useApi } from "../hooks/useApi.js";
import { Card, Badge, ChartCard, MiniStat, FilterBar, Sel, Loader } from "../components/ui.jsx";
import { COLORS, MESES, fmtCOP, fmtM } from "../utils/format.js";

const thStyle = { textAlign: "left", fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", color: COLORS.slate, padding: "11px 14px", borderBottom: `1px solid ${COLORS.line}`, fontWeight: 600 };
const tdStyle = { padding: "11px 14px", fontSize: 13.5, borderBottom: `1px solid ${COLORS.line}` };
const tdNum = { ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" };

function Tabla({ children, maxHeight = 400 }) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto", maxHeight }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>{children}</table>
      </div>
    </Card>
  );
}

/* ---------- Facturación ---------- */
export function Facturacion({ celulaFiltro, rol }) {
  const { data, cargando, error } = useApi("/facturas", celulaFiltro);
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;

  const total = data.reduce((s, f) => s + f.valor, 0);
  const pend = data.filter((f) => f.estado === "Pendiente").reduce((s, f) => s + f.valor, 0);

  // Serie mensual acumulada a partir de las facturas.
  const porMes = {};
  data.forEach((f) => { porMes[f.mes] = (porMes[f.mes] || 0) + f.valor; });
  const serie = Object.keys(porMes).map((m) => ({ mes: MESES[m], valor: porMes[m] })).sort((a, b) => MESES.indexOf(a.mes) - MESES.indexOf(b.mes));

  return (
    <div>
      <FilterBar rol={rol} nuevo="Nueva factura" onNuevo={() => alert("Formulario de nueva factura (por implementar en tu instancia).")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        <MiniStat label="Facturación acumulada" val={fmtCOP(total)} />
        <MiniStat label="Pendiente de cobro" val={fmtCOP(pend)} color={COLORS.amber} />
        <MiniStat label="Facturas registradas" val={data.length} />
      </div>
      <ChartCard title="Facturación mensual acumulada">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={serie} margin={{ left: 8, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: COLORS.slate }} />
            <YAxis tickFormatter={fmtM} tick={{ fontSize: 11, fill: COLORS.slate }} width={54} />
            <Tooltip formatter={(v) => fmtCOP(v)} />
            <Bar dataKey="valor" name="Facturación" fill={COLORS.blue} radius={[5, 5, 0, 0]} barSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div style={{ marginTop: 14 }}>
        <Tabla maxHeight={360}>
          <thead><tr><th style={thStyle}>Cliente</th><th style={thStyle}>Mes</th><th style={thStyle}>Año</th><th style={{ ...thStyle, textAlign: "right" }}>Valor</th><th style={thStyle}>Estado</th></tr></thead>
          <tbody>
            {data.map((f) => (
              <tr key={f.id}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{f.cliente}</td>
                <td style={tdStyle}>{MESES[f.mes]}</td>
                <td style={tdStyle}>{f.anio}</td>
                <td style={tdNum}>{fmtCOP(f.valor)}</td>
                <td style={tdStyle}><Badge color={f.estado === "Pagada" ? COLORS.green : COLORS.amber}>{f.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </div>
    </div>
  );
}

/* ---------- Seguimientos ---------- */
export function Seguimientos({ celulaFiltro, rol }) {
  const { data, cargando, error } = useApi("/seguimientos", celulaFiltro);
  const [fEstado, setFEstado] = useState("Todos");
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;

  const rows = data.filter((s) => fEstado === "Todos" || s.estado === fEstado);
  const colE = { Pendiente: COLORS.amber, Completado: COLORS.green, Vencido: COLORS.red };
  const fecha = (f) => (f ? String(f).slice(0, 10) : "");

  return (
    <div>
      <FilterBar rol={rol} nuevo="Nuevo seguimiento" onNuevo={() => alert("Formulario de nuevo seguimiento (por implementar en tu instancia).")}>
        <Sel value={fEstado} onChange={setFEstado} opts={["Todos", "Pendiente", "Completado", "Vencido"]} />
      </FilterBar>
      <Tabla maxHeight={480}>
        <thead><tr><th style={thStyle}>Cliente</th><th style={thStyle}>Responsable</th><th style={thStyle}>Fecha</th><th style={thStyle}>Observación</th><th style={thStyle}>Estado</th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{s.cliente}</td>
              <td style={{ ...tdStyle, color: COLORS.slate }}>{s.responsable}</td>
              <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{fecha(s.fecha)}</td>
              <td style={{ ...tdStyle, color: COLORS.slate }}>{s.observacion}</td>
              <td style={tdStyle}><Badge color={colE[s.estado]}>{s.estado}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  );
}

/* ---------- Reportes ---------- */
export function Reportes({ celulaFiltro }) {
  const { data, cargando, error } = useApi("/reportes", celulaFiltro);
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;

  const sevColor = { rojo: COLORS.red, amarillo: COLORS.amber, verde: COLORS.green };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[["Rentabilidad", "Por cliente, colaborador y mes"], ["Financiero", "Facturación por cliente y mes"], ["Comparativo", "Mes vs mes, año vs año"], ["Alertas", "Generadas automáticamente"]].map(([t, d]) => (
          <Card key={t} style={{ padding: "15px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t}</div>
            <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 4 }}>{d}</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <AlertTriangle size={18} color={COLORS.amber} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Alertas automáticas ({data.alertas.length})</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 440, overflowY: "auto" }}>
          {data.alertas.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 9, background: COLORS.bg, borderLeft: `3px solid ${sevColor[a.severidad]}` }}>
              <Badge color={sevColor[a.severidad]}>{a.tipo}</Badge>
              <span style={{ fontSize: 13.5 }}>{a.detalle}</span>
            </div>
          ))}
          {data.alertas.length === 0 && <div style={{ color: COLORS.slate, fontSize: 13.5 }}>Sin alertas. Todo en orden.</div>}
        </div>
      </Card>
    </div>
  );
}
