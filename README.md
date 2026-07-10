# 2NVBoard

Panel operativo y financiero **multi-célula** para líderes de célula. Cada líder inicia sesión y ve la aplicación completa (dashboard, clientes, colaboradores, facturación, costos, rentabilidad, seguimientos y reportes) **solo con los datos de su propia célula**. El administrador ve todas las células o filtra por una.

Stack: **React + Vite** (frontend) · **Node.js + Express** (backend) · **PostgreSQL** (base de datos).

---

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 14 o superior corriendo localmente (o una URL de conexión)

---

## 1. Configurar la base de datos

Crea una base de datos vacía en PostgreSQL:

```bash
createdb 2nvboard
```

## 2. Backend

```bash
cd server
cp .env.example .env        # edita las credenciales de tu PostgreSQL y el JWT_SECRET
npm install
npm run migrate             # crea las tablas
npm run seed                # carga las 3 células con datos de ejemplo
npm run dev                 # arranca la API en http://localhost:4000
```

## 3. Frontend

En otra terminal:

```bash
cd client
npm install
npm run dev                 # arranca la app en http://localhost:5173
```

Abre http://localhost:5173 en el navegador.

---

## Cuentas de acceso (creadas por el seed)

| Correo | Contraseña | Rol | Alcance |
|--------|-----------|-----|---------|
| admin@2nvboard.co | admin123 | Administrador | Todas las células |
| valentina@2nvboard.co | valentina123 | Líder | 5 clientes, 15 colaboradores |
| juan@2nvboard.co | juan123 | Líder | 8 clientes, 14 colaboradores |
| hamilton@2nvboard.co | hamilton123 | Líder | 10 clientes, 20 colaboradores |
| consulta@2nvboard.co | consulta123 | Consulta | Solo lectura |

> **Cambia estas contraseñas** antes de usar el sistema con datos reales.

---

## Cómo funciona el aislamiento por célula

El filtrado por célula se aplica **en el servidor**, no en el navegador. Cuando un líder inicia sesión, su `celula_id` viaja dentro del token JWT. Cada consulta a la base de datos se filtra por ese `celula_id`, y el servidor **ignora** cualquier intento de pedir otra célula por parámetro de URL. Un líder no puede ver datos de otra célula ni manipulando la petición. El administrador es la única excepción: puede consultar todas las células o filtrar por una.

## Seguridad incluida

- Contraseñas cifradas con **bcrypt** (nunca se guardan en texto plano).
- Autenticación con **JWT** (expira a las 8 horas).
- Autorización por rol validada en el backend (el rol Consulta no puede crear, editar ni eliminar).
- Consultas **parametrizadas** contra inyección SQL.
- **Auditoría**: cada operación de escritura queda registrada (usuario, acción, entidad, fecha/hora).

---

## Fórmulas de negocio

```
Costo Empresa = Salario + Prestaciones + Seguridad Social + Bonificaciones + Otros
Rentabilidad  = Facturación − Costo Empresa
Margen (%)    = (Rentabilidad / Facturación) × 100
```

Semáforo de rentabilidad: **verde** (≥ 15%), **amarillo** (0–15%), **rojo** (< 0%).

El `costo_empresa` se calcula automáticamente en la base de datos como columna generada, por lo que siempre es consistente con sus componentes.

---

## Estructura del proyecto

```
2nvboard/
├── server/                 # API Node + Express
│   ├── src/
│   │   ├── routes/         # definición de endpoints
│   │   ├── controllers/    # validan la petición y delegan
│   │   ├── services/       # lógica de negocio (cálculos, alertas)
│   │   ├── middleware/     # auth JWT, roles, auditoría, errores
│   │   └── db/             # conexión y migración
│   ├── migrations/         # esquema SQL
│   └── seeds/              # datos de ejemplo de las 3 células
├── client/                 # frontend React + Vite
│   └── src/
│       ├── api/            # cliente axios con token
│       ├── context/        # sesión de usuario
│       ├── hooks/          # carga de datos
│       ├── components/     # UI reutilizable
│       ├── views/          # Dashboard, Clientes, Reportes, etc.
│       └── utils/          # formato y tema
└── docs/                   # documento de análisis y diseño
```

---

## Notas para producción

- Reemplaza `JWT_SECRET` por una clave larga y aleatoria.
- Sirve el frontend compilado (`npm run build` en `client/`) detrás de un servidor web o CDN, y apunta `VITE_API_URL` al dominio del backend.
- Configura HTTPS y una política de CORS restringida al dominio del frontend.
- Los formularios de creación (botones "+ Nuevo") están preparados en la interfaz pero conectados a un aviso; los endpoints POST del backend ya existen y funcionan, de modo que solo falta enlazar cada formulario a su endpoint según tus reglas de captura.
