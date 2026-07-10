// Autorización por rol. Uso: router.post("/", autenticar, permitir("Administrador","Lider"), ctrl)
export function permitir(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "No autenticado." });
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción." });
    }
    next();
  };
}

/**
 * Devuelve el filtro de célula que se debe aplicar a las consultas.
 * - Administrador: puede ver todas (null) o una célula concreta vía ?celula=ID.
 * - Líder: SIEMPRE su propia célula, sin importar lo que pida en el query.
 * - Consulta: puede filtrar por célula vía ?celula=ID, o todas.
 *
 * Este filtro se aplica en el SERVIDOR, no en el cliente: un líder no puede
 * acceder a datos de otra célula ni manipulando la petición.
 */
export function alcanceCelula(req) {
  if (req.user.rol === "Lider") {
    return req.user.celula_id; // forzado
  }
  // Administrador o Consulta
  const pedida = req.query.celula ? Number(req.query.celula) : null;
  return Number.isInteger(pedida) ? pedida : null; // null = todas
}
