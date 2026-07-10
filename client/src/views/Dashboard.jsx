import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Briefcase, Users, FileText, Wallet, TrendingUp, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { useApi } from "../hooks/useApi.js";
import { ChartCard, Card, Loader } from "../components/ui.jsx";
import { COLORS, MESES, fmtCOP, fmtM, semaforo } from "../utils/format.js";

export default function Dashboard({ celulaFiltro }) {
  const { data, cargando, error } = useApi("/dashboard", celulaFiltro);
  if (cargando) return <Loader />;
  if (error) return <Card style={{ padding: 20, color: COLORS.red }}>{error}</Card>;

  const k = data.kpis;
  const serie = data.serieMensual.filter((s) => s.facturacion > 0 || s.mes <= 4).map((s) => ({ ...s, mesLabel: MESES[s.mes] }));
  const estados = data.estadoSeguimientos.map((e) => ({ name: e.estado, value: e.n }));
  const pieMap = { Pendiente: COLORS.amber, Completado: COLORS.green, Vencido: COLORS.red };

  const kpis = [
    ["Clientes activos", k.clientesActivos, null, Briefcase],
    ["Colaboradores", k.colaboradores, null, Users],
    ["Facturación del mes", fmtM(k.facturacionMes), null, FileText],
    ["Costo salarial del mes", fmtM(k.costoSalarialMes), null, Wallet],
    ["Rentabilidad", fmtM(k.rentabilidad), k.rentabilidad >= 0 ? COLORS.green : COLORS.red, TrendingUp],
    ["Margen", `${k.margen.toFixed(1)}%`, semaforo(k.margen), BarChart3],
    ["Seg. pendientes", k.seguimientosPendientes, COLORS.amber, Clock],
    ["Seg. completados", k.seguimientosCompletados, COLORS.green, CheckCircle2],
  ];

  return (
    <div>
      <div className="grid-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {kpis.map(([label, val, color, Icon]) => (
          <Card key={label} style={{ padding: "16px 17px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 12.5, color: COLORS.slate, fontWeight: 600 }}>{label}</span>
              <Icon size={16} color={COLORS.blueSoft} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, color: color || COLORS.ink, letterSpacing: "-.02em" }}>{val}</div>
          </Card>
        ))}
      </div>

      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 14 }}>
        <ChartCard title="Facturación, costo y rentabilidad por mes">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={serie} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12, fill: COLORS.slate }} />
              <YAxis tickFormatter={fmtM} tick={{ fontSize: 11, fill: COLORS.slate }} width={54} />
              <Tooltip formatter={(v) => fmtCOP(v)} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="facturacion" name="Facturación" stroke={COLORS.blue} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="costo" name="Costo" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rentabilidad" name="Rentabilidad" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Estado de seguimientos">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={estados} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={82} label>
                {estados.map((e, i) => <Cell key={i} fill={pieMap[e.name] || COLORS.slate} />)}
              </Pie>
              <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <ChartCard title="Top clientes por facturación">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topClientes} layout="vertical" margin={{ left: 20, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} horizontal={false} />
              <XAxis type="number" tickFormatter={fmtM} tick={{ fontSize: 11, fill: COLORS.slate }} />
              <YAxis type="category" dataKey="nombre" width={92} tick={{ fontSize: 11, fill: COLORS.ink }} />
              <Tooltip formatter={(v) => fmtCOP(v)} />
              <Bar dataKey="valor" fill={COLORS.blue} radius={[0, 5, 5, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Distribución de colaboradores por cliente">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.distribucionColaboradores} margin={{ left: 4, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} />
              <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: COLORS.slate }} interval={0} angle={-25} textAnchor="end" height={64} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.slate }} width={28} />
              <Tooltip />
              <Bar dataKey="n" name="Colaboradores" fill={COLORS.blueSoft} radius={[5, 5, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
