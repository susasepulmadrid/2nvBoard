import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "cambia-esta-clave-en-produccion";

// Verifica el token Bearer y adjunta el usuario a req.user.
export function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "No autenticado. Falta el token." });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    // payload: { id, nombre, rol, celula_id }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

export function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, celula_id: usuario.celula_id },
    SECRET,
    { expiresIn: "8h" }
  );
}
