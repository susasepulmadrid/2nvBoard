import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// Pool de conexiones. Usa DATABASE_URL o las variables PG* del entorno.
export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        database: process.env.PGDATABASE || "2nvboard",
      }
);

// Helper: consulta parametrizada (previene inyección SQL).
export const query = (text, params) => pool.query(text, params);
