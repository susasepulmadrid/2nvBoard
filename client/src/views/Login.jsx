import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { COLORS } from "../utils/format.js";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    setError(""); setCargando(true);
    try {
      await login(email, pass);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: `linear-gradient(135deg,${COLORS.ink},${COLORS.blue})`, fontFamily: "'Inter',system-ui,sans-serif", padding: 20 }}>
      <style>{`input:focus{outline:2px solid ${COLORS.blueSoft};outline-offset:1px}`}</style>
      <div style={{ background: "#fff", borderRadius: 16, padding: "38px 36px", width: 400, maxWidth: "100%", boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg,${COLORS.blueSoft},${COLORS.blue})`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800 }}>2N</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink }}>2NVBoard</div>
        </div>
        <p style={{ color: COLORS.slate, fontSize: 13.5, margin: "0 0 22px" }}>Inicia sesión para ver el panel de tu célula.</p>

        <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.slate }}>Correo</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.co" type="email"
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          style={{ width: "100%", marginTop: 5, marginBottom: 14, padding: "11px 12px", border: `1px solid ${COLORS.line}`, borderRadius: 8, fontFamily: "inherit", fontSize: 14 }} />

        <label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.slate }}>Contraseña</label>
        <div style={{ position: "relative", marginTop: 5 }}>
          <Lock size={15} color={COLORS.slate} style={{ position: "absolute", left: 11, top: 12 }} />
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="********"
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            style={{ width: "100%", padding: "11px 12px 11px 34px", border: `1px solid ${COLORS.line}`, borderRadius: 8, fontFamily: "inherit", fontSize: 14 }} />
        </div>

        {error && <div style={{ color: COLORS.red, fontSize: 12.5, marginTop: 10, fontWeight: 500 }}>{error}</div>}

        <button onClick={entrar} disabled={cargando}
          style={{ width: "100%", marginTop: 18, padding: "12px", borderRadius: 10, background: COLORS.blue, color: "#fff", fontSize: 14.5, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, opacity: cargando ? 0.7 : 1 }}>
          {cargando ? "Entrando…" : "Iniciar sesión"}
        </button>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Cuentas de prueba</div>
          <div style={{ display: "grid", gap: 5, fontSize: 12, color: COLORS.slate }}>
            {[["valentina@2nvboard.co", "valentina123"], ["juan@2nvboard.co", "juan123"], ["hamilton@2nvboard.co", "hamilton123"], ["admin@2nvboard.co", "admin123"], ["consulta@2nvboard.co", "consulta123"]].map(([u, p]) => (
              <div key={u} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: COLORS.ink }}>{u}</span><span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
