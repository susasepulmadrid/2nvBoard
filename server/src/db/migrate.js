import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sqlPath = path.join(__dirname, "..", "..", "migrations", "001_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log("Ejecutando migración 001_schema.sql…");
  await pool.query(sql);
  console.log("Migración completada. Tablas creadas.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Error en la migración:", err.message);
  process.exit(1);
});
