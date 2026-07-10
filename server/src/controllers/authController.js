import bcrypt from "bcryptjs";
import { query } from "../db/pool.js";
import { firmarToken } from "../middleware/auth.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña son obligatorios." });

    const { rows } = await query(
      `SELECT id, nombre, email, password_hash, rol, celula_id, activo
       FROM usuarios WHERE email = $1`, [email.toLowerCase().trim()]);
    const user = rows[0];

    // Mensaje genérico para no revelar si el email existe.
    if (!user || !user.activo)
      return res.status(401).json({ error: "Credenciales incorrectas." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales incorrectas." });

    const token = firmarToken(user);
    res.json({
      token,
      usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, celula_id: user.celula_id },
    });
  } catch (err) {
    next(err);
  }
}

// Devuelve el usuario autenticado (para rehidratar sesión en el frontend).
export async function yo(req, res) {
  res.json({ usuario: req.user });
}
