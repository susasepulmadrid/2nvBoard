import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { manejadorErrores } from "./middleware/audit.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ app: "2NVBoard API", estado: "ok" }));
app.use("/api", routes);

// 404
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada." }));
// Errores
app.use(manejadorErrores);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`2NVBoard API escuchando en http://localhost:${PORT}`));
