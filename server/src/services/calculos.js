import { query } from "../db/pool.js";

/**
 * Motor de cálculo de 2NVBoard. Toda la lógica financiera vive aquí,
 * en el servidor, para que sea única, testeable y no manipulable desde
 * el cliente. Cada función respeta el filtro de célula.
 *
 * Fórmulas:
 *   Costo Empresa = salario + prestaciones + seg. social + bonif. + otros
 *   Rentabilidad  = Facturación - Costo Empresa
 *   Margen (%)    = (Rentabilidad / Facturación) * 100
 */

const filtroCelula = (celulaId, alias = "") => {
  const col = alias ? `${alias}.celula_id` : "celula_id";
  return celulaId ? { clause: `AND ${col} = $1`, params: [celulaId] } : { clause: "", params: [] };
};

export function semaforo(margen) {
  if (margen < 0) return "rojo";
  if (margen < 15) return "amarillo";
  return "verde";
}

// KPIs del dashboard para el mes/año indicados (o el actual).
export async function kpis(celulaId, mes, anio) {
  const f = filtroCelula(celulaId);

  const clientes = await query(
    `SELECT COUNT(*)::int AS n FROM clientes WHERE estado='Activo' ${f.clause}`, f.params);
  const colab = await query(
    `SELECT COUNT(*)::int AS n FROM colaboradores WHERE estado='Activo' ${f.clause}`, f.params);

  // Facturación del mes: se une por cliente para respetar la célula.
  const fact = await query(
    `SELECT COALESCE(SUM(fa.valor),0)::float AS total
     FROM facturas fa JOIN clientes c ON c.id = fa.cliente_id
     WHERE fa.mes = $${celulaId ? 2 : 1} AND fa.anio = $${celulaId ? 3 : 2}
     ${celulaId ? "AND c.celula_id = $1" : ""}`,
    celulaId ? [celulaId, mes, anio] : [mes, anio]);

  // Costo salarial del mes: colaboradores asignados a un cliente.
  const costo = await query(
    `SELECT COALESCE(SUM(cs.costo_empresa),0)::float AS total
     FROM costos_salariales cs
     JOIN colaboradores co ON co.id = cs.colaborador_id
     WHERE co.cliente_id IS NOT NULL ${celulaId ? "AND co.celula_id = $1" : ""}`,
    celulaId ? [celulaId] : []);

  const segPend = await query(
    `SELECT COUNT(*)::int AS n FROM seguimientos WHERE estado='Pendiente' ${f.clause}`, f.params);
  const segComp = await query(
    `SELECT COUNT(*)::int AS n FROM seguimientos WHERE estado='Completado' ${f.clause}`, f.params);

  const facturacion = fact.rows[0].total;
  const costoEmpresa = costo.rows[0].total;
  const rentabilidad = facturacion - costoEmpresa;
  const margen = facturacion ? (rentabilidad / facturacion) * 100 : 0;

  return {
    clientesActivos: clientes.rows[0].n,
    colaboradores: colab.rows[0].n,
    facturacionMes: facturacion,
    costoSalarialMes: costoEmpresa,
    rentabilidad,
    margen,
    seguimientosPendientes: segPend.rows[0].n,
    seguimientosCompletados: segComp.rows[0].n,
  };
}

// Rentabilidad por cliente.
export async function rentabilidadPorCliente(celulaId) {
  const params = celulaId ? [celulaId] : [];
  const filtro = celulaId ? "WHERE c.celula_id = $1" : "";
  const { rows } = await query(
    `SELECT c.id, c.nombre,
       COALESCE((SELECT SUM(valor) FROM facturas WHERE cliente_id = c.id),0)::float AS facturacion,
       COALESCE((SELECT SUM(cs.costo_empresa) FROM costos_salariales cs
                 JOIN colaboradores co ON co.id = cs.colaborador_id
                 WHERE co.cliente_id = c.id),0)::float AS costo_empresa
     FROM clientes c ${filtro}
     ORDER BY c.nombre`, params);

  return rows.map((r) => {
    const rentabilidad = r.facturacion - r.costo_empresa;
    const margen = r.facturacion ? (rentabilidad / r.facturacion) * 100 : -100;
    return { ...r, rentabilidad, margen, semaforo: semaforo(margen) };
  }).sort((a, b) => b.margen - a.margen);
}

// Serie mensual de facturación, costo y rentabilidad.
export async function serieMensual(celulaId, anio) {
  const params = celulaId ? [anio, celulaId] : [anio];
  const filtro = celulaId ? "AND c.celula_id = $2" : "";
  const fact = await query(
    `SELECT fa.mes, SUM(fa.valor)::float AS total
     FROM facturas fa JOIN clientes c ON c.id = fa.cliente_id
     WHERE fa.anio = $1 ${filtro}
     GROUP BY fa.mes ORDER BY fa.mes`, params);

  const costoRes = await query(
    `SELECT COALESCE(SUM(cs.costo_empresa),0)::float AS total
     FROM costos_salariales cs JOIN colaboradores co ON co.id = cs.colaborador_id
     WHERE co.cliente_id IS NOT NULL ${celulaId ? "AND co.celula_id = $1" : ""}`,
    celulaId ? [celulaId] : []);
  const costoMensual = costoRes.rows[0].total;

  const porMes = {};
  fact.rows.forEach((r) => { porMes[r.mes] = r.total; });
  const serie = [];
  for (let m = 1; m <= 12; m++) {
    const f = porMes[m] || 0;
    serie.push({ mes: m, facturacion: f, costo: costoMensual, rentabilidad: f - costoMensual });
  }
  return serie;
}

// Alertas automáticas según reglas de negocio.
export async function alertas(celulaId) {
  const out = [];
  const rent = await rentabilidadPorCliente(celulaId);
  rent.forEach((c) => {
    if (c.facturacion > 0 && c.margen >= 0 && c.margen < 15)
      out.push({ tipo: "Margen bajo", severidad: "amarillo", detalle: `${c.nombre}: margen ${c.margen.toFixed(1)}% (< 15%)` });
    if (c.facturacion > 0 && c.margen < 0)
      out.push({ tipo: "Pérdida", severidad: "rojo", detalle: `${c.nombre}: margen negativo (${c.margen.toFixed(1)}%)` });
  });

  const sinAsignar = await query(
    `SELECT nombre FROM colaboradores WHERE cliente_id IS NULL
     ${celulaId ? "AND celula_id = $1" : ""}`, celulaId ? [celulaId] : []);
  sinAsignar.rows.forEach((c) =>
    out.push({ tipo: "Sin asignación", severidad: "amarillo", detalle: `${c.nombre} no tiene cliente asignado` }));

  const pendientes = await query(
    `SELECT c.nombre, fa.mes, fa.valor FROM facturas fa
     JOIN clientes c ON c.id = fa.cliente_id
     WHERE fa.estado = 'Pendiente' ${celulaId ? "AND c.celula_id = $1" : ""}`,
    celulaId ? [celulaId] : []);
  pendientes.rows.forEach((f) =>
    out.push({ tipo: "Factura pendiente", severidad: "amarillo", detalle: `${f.nombre}: mes ${f.mes}, ${f.valor} por cobrar` }));

  const vencidos = await query(
    `SELECT c.nombre, s.observacion, s.fecha FROM seguimientos s
     JOIN clientes c ON c.id = s.cliente_id
     WHERE s.estado = 'Vencido' ${celulaId ? "AND s.celula_id = $1" : ""}`,
    celulaId ? [celulaId] : []);
  vencidos.rows.forEach((s) =>
    out.push({ tipo: "Seguimiento vencido", severidad: "rojo", detalle: `${s.nombre}: ${s.observacion} (${s.fecha?.toISOString?.().slice(0,10) || s.fecha})` }));

  return out;
}
