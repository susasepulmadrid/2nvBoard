import { query } from "../db/pool.js";
import { alcanceCelula } from "../middleware/roles.js";
import { registrarAuditoria } from "../middleware/audit.js";
import * as calc from "../services/calculos.js";

/* ---------- Facturación ---------- */
export async function listarFacturas(req, res, next) {
  try {
    const celulaId = alcanceCelula(req);
    const params = celulaId ? [celulaId] : [];
    const filtro = celulaId ? "WHERE c.celula_id = $1" : "";
    const { rows } = await query(
      `SELECT fa.id, fa.mes, fa.anio, fa.valor::float, fa.estado, fa.cliente_id, c.nombre AS cliente
       FROM facturas fa JOIN clientes c ON c.id = fa.cliente_id
       ${filtro} ORDER BY fa.anio DESC, fa.mes DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
}

export async function crearFactura(req, res, next) {
  try {
    const { cliente_id, mes, anio, valor, estado } = req.body;
    if (!cliente_id || !mes || !anio) return res.status(400).json({ error: "Cliente, mes y año son obligatorios." });
    // Verifica que el cliente sea de la célula del líder.
    if (req.user.rol === "Lider") {
      const chk = await query("SELECT celula_id FROM clientes WHERE id=$1", [cliente_id]);
      if (!chk.rows[0] || chk.rows[0].celula_id !== req.user.celula_id)
        return res.status(403).json({ error: "El cliente no pertenece a tu célula." });
    }
    const { rows } = await query(
      `INSERT INTO facturas (cliente_id, mes, anio, valor, estado)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [cliente_id, mes, anio, valor || 0, estado || "Pendiente"]);
    await registrarAuditoria(req.user.id, "crear", "facturas", rows[0].id, `Cliente ${cliente_id}`);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

/* ---------- Seguimientos ---------- */
export async function listarSeguimientos(req, res, next) {
  try {
    const celulaId = alcanceCelula(req);
    const params = celulaId ? [celulaId] : [];
    const filtro = celulaId ? "WHERE s.celula_id = $1" : "";
    const { rows } = await query(
      `SELECT s.id, s.fecha, s.estado, s.observacion, s.cliente_id,
              c.nombre AS cliente, u.nombre AS responsable
       FROM seguimientos s
       LEFT JOIN clientes c ON c.id = s.cliente_id
       LEFT JOIN usuarios u ON u.id = s.responsable_id
       ${filtro} ORDER BY s.fecha DESC`, params);
    res.json(rows);
  } catch (err) { next(err); }
}

export async function crearSeguimiento(req, res, next) {
  try {
    const { cliente_id, colaborador_id, fecha, estado, observacion } = req.body;
    const celulaId = req.user.rol === "Lider" ? req.user.celula_id : (req.body.celula_id || req.user.celula_id);
    if (!fecha) return res.status(400).json({ error: "La fecha es obligatoria." });
    const { rows } = await query(
      `INSERT INTO seguimientos (cliente_id, colaborador_id, responsable_id, celula_id, fecha, estado, observacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [cliente_id || null, colaborador_id || null, req.user.id, celulaId, fecha, estado || "Pendiente", observacion || null]);
    await registrarAuditoria(req.user.id, "crear", "seguimientos", rows[0].id, observacion);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

/* ---------- Costos (listado detallado) ---------- */
export async function listarCostos(req, res, next) {
  try {
    const celulaId = alcanceCelula(req);
    const params = celulaId ? [celulaId] : [];
    const filtro = celulaId ? "WHERE co.celula_id = $1" : "";
    const { rows } = await query(
      `SELECT co.id, co.nombre, cl.nombre AS cliente,
              cs.salario::float, cs.prestaciones::float, cs.seguridad_social::float,
              cs.bonificaciones::float, cs.otros::float, cs.costo_empresa::float
       FROM colaboradores co
       LEFT JOIN clientes cl ON cl.id = co.cliente_id
       JOIN costos_salariales cs ON cs.colaborador_id = co.id
       ${filtro} ORDER BY co.nombre`, params);
    res.json(rows);
  } catch (err) { next(err); }
}

/* ---------- Dashboard / Reportes ---------- */
export async function dashboard(req, res, next) {
  try {
    const celulaId = alcanceCelula(req);
    const hoy = new Date();
    const mes = Number(req.query.mes) || hoy.getMonth() + 1;
    const anio = Number(req.query.anio) || hoy.getFullYear();
    const [k, serie, top, dist, estados] = await Promise.all([
      calc.kpis(celulaId, mes, anio),
      calc.serieMensual(celulaId, anio),
      topClientes(celulaId),
      distribucionColaboradores(celulaId),
      estadoSeguimientos(celulaId),
    ]);
    res.json({ kpis: k, serieMensual: serie, topClientes: top, distribucionColaboradores: dist, estadoSeguimientos: estados });
  } catch (err) { next(err); }
}

export async function reportes(req, res, next) {
  try {
    const celulaId = alcanceCelula(req);
    const [rent, alertas] = await Promise.all([
      calc.rentabilidadPorCliente(celulaId),
      calc.alertas(celulaId),
    ]);
    res.json({ rentabilidadPorCliente: rent, alertas });
  } catch (err) { next(err); }
}

/* ---------- Helpers de dashboard ---------- */
async function topClientes(celulaId) {
  const params = celulaId ? [celulaId] : [];
  const filtro = celulaId ? "WHERE c.celula_id = $1" : "";
  const { rows } = await query(
    `SELECT c.nombre,
            COALESCE((SELECT SUM(valor) FROM facturas WHERE cliente_id=c.id),0)::float AS valor
     FROM clientes c ${filtro} ORDER BY valor DESC LIMIT 10`, params);
  return rows;
}
async function distribucionColaboradores(celulaId) {
  const params = celulaId ? [celulaId] : [];
  const filtro = celulaId ? "AND c.celula_id = $1" : "";
  const { rows } = await query(
    `SELECT c.nombre, COUNT(co.id)::int AS n
     FROM clientes c JOIN colaboradores co ON co.cliente_id = c.id
     WHERE 1=1 ${filtro} GROUP BY c.nombre ORDER BY n DESC LIMIT 10`, params);
  return rows;
}
async function estadoSeguimientos(celulaId) {
  const params = celulaId ? [celulaId] : [];
  const filtro = celulaId ? "WHERE celula_id = $1" : "";
  const { rows } = await query(
    `SELECT estado, COUNT(*)::int AS n FROM seguimientos ${filtro} GROUP BY estado`, params);
  return rows;
}
