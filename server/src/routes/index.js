import { Router } from "express";
import { autenticar } from "../middleware/auth.js";
import { permitir } from "../middleware/roles.js";
import { login, yo } from "../controllers/authController.js";
import * as clientes from "../controllers/clientesController.js";
import * as colaboradores from "../controllers/colaboradoresController.js";
import * as data from "../controllers/dataController.js";

const router = Router();

// --- Autenticación (pública) ---
router.post("/auth/login", login);
router.get("/auth/me", autenticar, yo);

// --- Dashboard y reportes (cualquier rol autenticado) ---
router.get("/dashboard", autenticar, data.dashboard);
router.get("/reportes", autenticar, data.reportes);

// --- Clientes ---
router.get("/clientes", autenticar, clientes.listar);
router.post("/clientes", autenticar, permitir("Administrador", "Lider"), clientes.crear);
router.put("/clientes/:id", autenticar, permitir("Administrador", "Lider"), clientes.actualizar);
router.delete("/clientes/:id", autenticar, permitir("Administrador", "Lider"), clientes.eliminar);

// --- Colaboradores ---
router.get("/colaboradores", autenticar, colaboradores.listar);
router.post("/colaboradores", autenticar, permitir("Administrador", "Lider"), colaboradores.crear);
router.put("/colaboradores/:id", autenticar, permitir("Administrador", "Lider"), colaboradores.actualizar);
router.delete("/colaboradores/:id", autenticar, permitir("Administrador", "Lider"), colaboradores.eliminar);

// --- Facturación ---
router.get("/facturas", autenticar, data.listarFacturas);
router.post("/facturas", autenticar, permitir("Administrador", "Lider"), data.crearFactura);

// --- Costos ---
router.get("/costos", autenticar, data.listarCostos);

// --- Seguimientos ---
router.get("/seguimientos", autenticar, data.listarSeguimientos);
router.post("/seguimientos", autenticar, permitir("Administrador", "Lider"), data.crearSeguimiento);

export default router;
