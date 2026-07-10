import { query } from "../db/pool.js";
import { alcanceCelula } from "../middleware/roles.js";
import { registrarAuditoria } from "../middleware/audit.js";

// GET /api/colaboradores — con costo empresa y margen, filtrado por célula.
export async function listar(req, res, next) {
  try {
    const celulaId = alcanceCelula(req);
    const params = celulaId ? [celulaId] : [];
    const filtro = celulaId ? "WHERE co.celula_id = $1" : "";
    const { rows } = await query(
      `SELECT co.id, co.nombre, co.cargo, co.cliente_id, co.estado, co.fecha_ingreso,
              co.celula_id, cl.nombre AS cliente,
              COALESCE(cs.salario,0)::float AS salario,
              COALESCE(cs.prestaciones,0)::float AS prestaciones,
              COALESCE(cs.seguridad_social,0)::float AS seguridad_social,
              COALESCE(cs.bonificaciones,0)::float AS bonificaciones,
              COALESCE(cs.otros,0)::float AS otros,
              COALESCE(cs.costo_empresa,0)::float AS costo_empresa
       FROM colaboradores co
       LEFT JOIN clientes cl ON cl.id = co.cliente_id
       LEFT JOIN costos_salariales cs ON cs.colaborador_id = co.id
       ${filtro} ORDER BY co.nombre`, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/colaboradores — crea colaborador + su registro de costo.
export async function crear(req, res, next) {
  try {
    const { nombre, cargo, cliente_id, fecha_ingreso, estado,
            salario, prestaciones, seguridad_social, bonificaciones, otros } = req.body;
    const celulaId = req.user.rol === "Lider" ? req.user.celula_id : (req.body.celula_id || req.user.celula_id);
    if (!celulaId) return res.status(400).json({ error: "Debe indicarse la célula." });
    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio." });

    const colab = await query(
      `INSERT INTO colaboradores (nombre, cargo, cliente_id, celula_id, fecha_ingreso, estado)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nombre, cargo, cliente_id || null, celulaId, fecha_ingreso || null, estado || "Activo"]);

    // costo_empresa es columna generada; se calcula solo.
    await query(
      `INSERT INTO costos_salariales
        (colaborador_id, salario, prestaciones, seguridad_social, bonificaciones, otros)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [colab.rows[0].id, salario || 0, prestaciones || 0, seguridad_social || 0, bonificaciones || 0, otros || 0]);

    await registrarAuditoria(req.user.id, "crear", "colaboradores", colab.rows[0].id, nombre);
    res.status(201).json(colab.rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/colaboradores/:id
export async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const chk = await query("SELECT celula_id FROM colaboradores WHERE id=$1", [id]);
    if (!chk.rows[0]) return res.status(404).json({ error: "Colaborador no encontrado." });
    if (req.user.rol === "Lider" && chk.rows[0].celula_id !== req.user.celula_id)
      return res.status(403).json({ error: "No puedes editar colaboradores de otra célula." });

    const { nombre, cargo, cliente_id, fecha_ingreso, estado,
            salario, prestaciones, seguridad_social, bonificaciones, otros } = req.body;
    await query(
      `UPDATE colaboradores SET nombre=$1, cargo=$2, cliente_id=$3, fecha_ingreso=$4, estado=$5
       WHERE id=$6`,
      [nombre, cargo, cliente_id || null, fecha_ingreso || null, estado, id]);
    await query(
      `UPDATE costos_salariales SET salario=$1, prestaciones=$2, seguridad_social=$3,
        bonificaciones=$4, otros=$5 WHERE colaborador_id=$6`,
      [salario || 0, prestaciones || 0, seguridad_social || 0, bonificaciones || 0, otros || 0, id]);
    await registrarAuditoria(req.user.id, "editar", "colaboradores", id, nombre);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// DELETE /api/colaboradores/:id
export async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    const chk = await query("SELECT celula_id, nombre FROM colaboradores WHERE id=$1", [id]);
    if (!chk.rows[0]) return res.status(404).json({ error: "Colaborador no encontrado." });
    if (req.user.rol === "Lider" && chk.rows[0].celula_id !== req.user.celula_id)
      return res.status(403).json({ error: "No puedes eliminar colaboradores de otra célula." });
    await query("DELETE FROM colaboradores WHERE id=$1", [id]);
    await registrarAuditoria(req.user.id, "eliminar", "colaboradores", id, chk.rows[0].nombre);
    res.status(204).end();
  } catch (err) { next(err); }
}
