import { query } from "../db/pool.js";

// Registra una acción de escritura en la tabla de auditoría.
export async function registrarAuditoria(usuarioId, accion, entidad, entidadId, detalle = null) {
  try {
    await query(
      `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuarioId, accion, entidad, entidadId, detalle]
    );
  } catch (err) {
    // La auditoría no debe romper la operación principal; solo se registra el fallo.
    console.error("No se pudo registrar auditoría:", err.message);
  }
}

// Manejador central de errores.
export function manejadorErrores(err, req, res, next) {
  console.error(err);
  if (err.code === "23505") {
    return res.status(409).json({ error: "Ya existe un registro con ese valor único (p. ej. NIT o email)." });
  }
  res.status(500).json({ error: "Ocurrió un error en el servidor." });
}
