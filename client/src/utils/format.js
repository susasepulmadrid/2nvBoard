export const COLORS = {
  ink: "#0F2A43", blue: "#1E5A8C", blueSoft: "#4A90C2", slate: "#5B7085",
  line: "#E3E9F0", bg: "#F5F7FA", panel: "#FFFFFF",
  green: "#1F9D6B", amber: "#D99A0B", red: "#D14343",
};

export const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const fmtCOP = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export const fmtM = (n) => `$${((n || 0) / 1e6).toFixed(1)}M`;

export const semaforo = (m) => (m < 0 ? COLORS.red : m < 15 ? COLORS.amber : COLORS.green);
export const semaforoLabel = (m) => (m < 0 ? "Pérdida" : m < 15 ? "Margen bajo" : "Rentable");
