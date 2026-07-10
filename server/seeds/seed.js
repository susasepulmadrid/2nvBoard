import bcrypt from "bcryptjs";
import { pool, query } from "../src/db/pool.js";

/* ============================================================
   Seed de 2NVBoard — 3 células con datos de ejemplo.
   Valentina: 5 clientes / 15 colaboradores
   Juan Manuel: 8 clientes / 14 colaboradores
   Hamilton: 10 clientes / 20 colaboradores
   Ejecutar DESPUÉS de la migración: npm run seed
   ============================================================ */

const CELULAS = [
  { key: "valentina", nombre: "Célula de Valentina", lider: "Valentina Ríos", email: "valentina@2nvboard.co", pass: "valentina123", nClientes: 5, nColab: 15 },
  { key: "juan", nombre: "Célula de Juan Manuel", lider: "Juan Manuel González", email: "juan@2nvboard.co", pass: "juan123", nClientes: 8, nColab: 14 },
  { key: "hamilton", nombre: "Célula de Hamilton", lider: "Hamilton Suárez", email: "hamilton@2nvboard.co", pass: "hamilton123", nClientes: 10, nColab: 20 },
];

const nombresCli = ["Bancolombia","Grupo Éxito","EPM","Sura","Nutresa","Bancoomeva","ISA","Argos","Protección","Comfama","Une","Tigo","Corona","Familia","Postobón","Alpina","Davivienda","Falabella","Claro","Avianca","Terpel","Cementos","Ecopetrol","Bavaria"];
const ciudades = ["Medellín","Bogotá","Cali","Envigado","Barranquilla","Bucaramanga"];
const cargos = ["Dev Senior","Dev Semi","Dev Junior","QA","Líder Técnico","Diseñador UX","DevOps","Analista"];
const nombresPer = ["Andrés Gómez","Laura Peña","Julián Torres","Camila Ruiz","Diego Marín","Sofía Cardona","Mateo Vargas","Valeria Ospina","Nicolás Díaz","Isabela Franco","Samuel Rojas","Mariana Lopera","Tomás Restrepo","Daniela Cano","Sebastián Mora","Lucía Arango","Emilio Vélez","Antonia Gil","Martín Zapata","Gabriela Ríos","Felipe Duque","Sara Montoya","David Quintero","Elena Bravo","Pablo Henao","Renata Ossa","Simón Aguirre","Carla Bedoya","Óscar Palacio","Natalia Cruz","Iván Mejía","Paula Serna","Hugo Correa","Alicia Toro","Bruno Salazar","Clara Villa","Jorge Nieto","Ruth Acosta","Leo Pérez","Ana Suárez","Marco Tulio","Beatriz Lara","César Ibáñez","Delia Ramos","Erick Solís","Fabiola Nieto","Gael Muñoz","Hilda Parra","Iker Blanco"];

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const anio = new Date().getFullYear();

async function seed() {
  console.log("Limpiando datos anteriores…");
  await query("TRUNCATE auditoria, seguimientos, facturas, costos_salariales, colaboradores, clientes, usuarios, celulas RESTART IDENTITY CASCADE");

  // Usuario administrador y de consulta
  const hashAdmin = await bcrypt.hash("admin123", 10);
  const hashConsulta = await bcrypt.hash("consulta123", 10);
  const admin = await query(
    `INSERT INTO usuarios (nombre,email,password_hash,rol,celula_id) VALUES ($1,$2,$3,'Administrador',NULL) RETURNING id`,
    ["Administrador", "admin@2nvboard.co", hashAdmin]);
  await query(
    `INSERT INTO usuarios (nombre,email,password_hash,rol,celula_id) VALUES ($1,$2,$3,'Consulta',NULL)`,
    ["Invitado", "consulta@2nvboard.co", hashConsulta]);

  let ci = 0, pi = 0;
  for (const cel of CELULAS) {
    // Crear célula (sin líder aún)
    const celRow = await query(`INSERT INTO celulas (nombre) VALUES ($1) RETURNING id`, [cel.nombre]);
    const celulaId = celRow.rows[0].id;
    // Crear líder de la célula
    const hash = await bcrypt.hash(cel.pass, 10);
    const liderRow = await query(
      `INSERT INTO usuarios (nombre,email,password_hash,rol,celula_id) VALUES ($1,$2,$3,'Lider',$4) RETURNING id`,
      [cel.lider, cel.email, hash, celulaId]);
    const liderId = liderRow.rows[0].id;
    await query(`UPDATE celulas SET lider_id=$1 WHERE id=$2`, [liderId, celulaId]);

    // Clientes
    const misClientes = [];
    for (let i = 0; i < cel.nClientes; i++) {
      const nombre = nombresCli[ci++ % nombresCli.length] + (ci > nombresCli.length ? " " + cel.key.slice(0, 3) : "");
      const nit = `${rnd(800,899)}.${rnd(100,999)}.${rnd(100,999)}-${rnd(1,9)}`;
      const cliRow = await query(
        `INSERT INTO clientes (nombre,nit,ciudad,estado,fecha_inicio,celula_id,lider_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [nombre, nit, ciudades[rnd(0,5)], Math.random()<0.85?"Activo":"Inactivo", `${rnd(2022,2024)}-0${rnd(1,9)}-1${rnd(0,5)}`, celulaId, liderId]);
      const clienteId = cliRow.rows[0].id;
      misClientes.push(clienteId);
      // Facturas (meses 1-4)
      for (let m = 1; m <= 4; m++) {
        if (Math.random() < 0.8) {
          await query(
            `INSERT INTO facturas (cliente_id,mes,anio,valor,estado) VALUES ($1,$2,$3,$4,$5)`,
            [clienteId, m, anio, rnd(8,28)*1000000, Math.random()<0.75?"Pagada":"Pendiente"]);
        }
      }
    }

    // Colaboradores + costos
    for (let i = 0; i < cel.nColab; i++) {
      const asignado = Math.random() < 0.9;
      const clienteId = asignado ? misClientes[rnd(0, misClientes.length - 1)] : null;
      const salario = rnd(35,110)*100000;
      const prest = Math.round(salario*0.25), seg = Math.round(salario*0.165);
      const bon = Math.random()<0.4 ? rnd(2,8)*100000 : 0, otr = rnd(1,3)*100000;
      const coRow = await query(
        `INSERT INTO colaboradores (nombre,cargo,cliente_id,celula_id,fecha_ingreso,estado)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [nombresPer[pi++ % nombresPer.length], cargos[rnd(0,7)], clienteId, celulaId, `${rnd(2022,2024)}-0${rnd(1,9)}-1${rnd(0,8)}`, Math.random()<0.92?"Activo":"Inactivo"]);
      await query(
        `INSERT INTO costos_salariales (colaborador_id,salario,prestaciones,seguridad_social,bonificaciones,otros)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [coRow.rows[0].id, salario, prest, seg, bon, otr]);
    }

    // Seguimientos
    for (let i = 0; i < rnd(3,5); i++) {
      const estado = ["Pendiente","Completado","Vencido"][rnd(0,2)];
      await query(
        `INSERT INTO seguimientos (cliente_id,responsable_id,celula_id,fecha,estado,observacion)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [misClientes[rnd(0,misClientes.length-1)], liderId, celulaId, `${anio}-0${rnd(5,7)}-1${rnd(0,8)}`, estado,
         ["Renovar propuesta anual","Ampliación de equipo","Revisión de SLA","Propuesta comercial nueva","Onboarding cliente"][rnd(0,4)]]);
    }
    console.log(`  ✓ ${cel.nombre}: ${cel.nClientes} clientes, ${cel.nColab} colaboradores`);
  }

  console.log("\nSeed completado.");
  console.log("Cuentas de acceso:");
  console.log("  admin@2nvboard.co / admin123        (Administrador — todas las células)");
  console.log("  valentina@2nvboard.co / valentina123 (Líder)");
  console.log("  juan@2nvboard.co / juan123           (Líder)");
  console.log("  hamilton@2nvboard.co / hamilton123   (Líder)");
  console.log("  consulta@2nvboard.co / consulta123   (Consulta — solo lectura)");
  await pool.end();
}

seed().catch((err) => { console.error("Error en seed:", err); process.exit(1); });
