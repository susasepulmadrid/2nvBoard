import { query } from "../db/pool.js";
import { alcanceCelula } from "../middleware/roles.js";
import { registrarAuditoria } from "../middleware/audit.js";

// GET /api/clientes — lista con facturación y rentabilidad, filtrada por célula.
export async function listar(req, res, next) {
  try {
    const celulaId = alcanceCelula(req);
    const params = celulaId ? [celulaId] : [];
    const filtro = celulaId ? "WHERE c.celula_id = $1" : "";
    const { rows } = await query(
      `SELECT c.id, c.nombre, c.nit, c.ciudad, c.estado, c.fecha_inicio,
              c.celula_id, u.nombre AS lider,
              COALESCE((SELECT SUM(valor) FROM facturas WHERE cliente_id=c.id),0)::float AS facturacion,
              COALESCE((SELECT SUM(cs.costo_empresa) FROM costos_salariales cs
                        JOIN colaboradores co ON co.id=cs.colaborador_id
                        WHERE co.cliente_id=c.id),0)::float AS costo_empresa
       FROM clientes c LEFT JOIN usuarios u ON u.id = c.lider_id
       ${filtro} ORDER BY c.nombre`, params);
    const data = rows.map((r) => {
      const rentabilidad = r.facturacion - r.costo_empresa;
      const margen = r.facturacion ? (rentabilidad / r.facturacion) * 100 : -100;
      return { ...r, rentabilidad, margen };
    });
    res.json(data);
  } catch (err) { next(err); }
}

// POST /api/clientes
export async function crear(req, res, next) {
  try {
    const { nombre, nit, ciudad, estado, fecha_inicio } = req.body;
    // Un líder solo puede crear en su propia célula.
    const celulaId = req.user.rol === "Lider" ? req.user.celula_id : (req.body.celula_id || req.user.celula_id);
    if (!celulaId) return res.status(400).json({ error: "Debe indicarse la célula del cliente." });
    if (!nombre || !nit) return res.status(400).json({ error: "Nombre y NIT son obligatorios." });

    const { rows } = await query(
      `INSERT INTO clientes (nombre, nit, ciudad, estado, fecha_inicio, celula_id, lider_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nombre, nit, ciudad, estado || "Activo", fecha_inicio || null, celulaId, req.user.id]);
    await registrarAuditoria(req.user.id, "crear", "clientes", rows[0].id, nombre);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/clientes/:id
export async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    // Verifica que el cliente pertenezca a la célula del líder.
    const chk = await query("SELECT celula_id FROM clientes WHERE id=$1", [id]);
    if (!chk.rows[0]) return res.status(404).json({ error: "Cliente no encontrado." });
    if (req.user.rol === "Lider" && chk.rows[0].celula_id !== req.user.celula_id)
      return res.status(403).json({ error: "No puedes editar clientes de otra célula." });

    const { nombre, nit, ciudad, estado, fecha_inicio } = req.body;
    const { rows } = await query(
      `UPDATE clientes SET nombre=$1, nit=$2, ciudad=$3, estado=$4, fecha_inicio=$5
       WHERE id=$6 RETURNING *`,
      [nombre, nit, ciudad, estado, fecha_inicio || null, id]);
    await registrarAuditoria(req.user.id, "editar", "clientes", id, nombre);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/clientes/:id
export async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    const chk = await query("SELECT celula_id, nombre FROM clientes WHERE id=$1", [id]);
    if (!chk.rows[0]) return res.status(404).json({ error: "Cliente no encontrado." });
    if (req.user.rol === "Lider" && chk.rows[0].celula_id !== req.user.celula_id)
      return res.status(403).json({ error: "No puedes eliminar clientes de otra célula." });

    await query("DELETE FROM clientes WHERE id=$1", [id]);
    await registrarAuditoria(req.user.id, "eliminar", "clientes", id, chk.rows[0].nombre);
    res.status(204).end();
  } catch (err) { next(err); }
}
