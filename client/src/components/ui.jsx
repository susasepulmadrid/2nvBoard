import { Search } from "lucide-react";
import { COLORS } from "../utils/format.js";

export function Card({ children, style }) {
  return <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, ...style }}>{children}</div>;
}

export function Badge({ children, color }) {
  return <span style={{ background: `${color}1A`, color, padding: "3px 9px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
}

export function ChartCard({ title, children }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: COLORS.ink }}>{title}</div>
      {children}
    </Card>
  );
}

export function MiniStat({ label, val, color }) {
  return (
    <Card style={{ padding: "15px 17px" }}>
      <div style={{ fontSize: 12.5, color: COLORS.slate, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 800, marginTop: 6, color: color || COLORS.ink, letterSpacing: "-.02em" }}>{val}</div>
    </Card>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={15} color={COLORS.slate} style={{ position: "absolute", left: 10, top: 9 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ paddingLeft: 32, width: 210, fontFamily: "inherit", fontSize: 13, padding: "7px 10px 7px 32px", border: `1px solid ${COLORS.line}`, borderRadius: 8 }} />
    </div>
  );
}

export function Sel({ value, onChange, opts }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ fontFamily: "inherit", fontSize: 13, padding: "7px 10px", border: `1px solid ${COLORS.line}`, borderRadius: 8, background: "#fff", color: COLORS.ink }}>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function FilterBar({ children, rol, nuevo, onNuevo }) {
  const puede = rol === "Administrador" || rol === "Lider";
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
      {children}
      <div style={{ flex: 1 }} />
      {puede
        ? <button onClick={onNuevo} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, background: COLORS.blue, color: "#fff", padding: "9px 16px", borderRadius: 8, fontSize: 13.5 }}>+ {nuevo}</button>
        : <span style={{ fontSize: 12, color: COLORS.slate, fontStyle: "italic" }}>Modo consulta — solo lectura</span>}
    </div>
  );
}

export function Loader() {
  return <div style={{ padding: 40, textAlign: "center", color: COLORS.slate, fontSize: 14 }}>Cargando…</div>;
}
