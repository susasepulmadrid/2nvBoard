# 2NVBoard — Documento de Análisis y Diseño

**Panel operativo y financiero para células de trabajo**
Célula de Valentina · Versión 1.0 · Fase de arquitectura (previa al desarrollo)

Stack objetivo: **React + Node/Express + PostgreSQL** · Web responsive (escritorio y móvil)

---

## Índice

1. Análisis funcional
2. Requerimientos funcionales y no funcionales
3. Casos de uso
4. Historias de usuario
5. Arquitectura de la solución
6. Modelo de base de datos
7. Diagrama entidad-relación
8. Flujo de navegación
9. Diseño UX/UI
10. Estructura de carpetas
11. Plan de desarrollo por fases

---

## 1. Análisis funcional

2NVBoard resuelve un problema concreto del líder de célula: hoy la información de clientes, personas, ingresos y costos vive dispersa en hojas de cálculo, y no existe una vista única que responda la pregunta que importa —*¿este cliente/colaborador/mes me está dejando dinero o me lo está costando?*—.

El sistema se organiza alrededor de una **cadena de cálculo** que es su verdadero núcleo:

```
Colaborador ──► Costo Empresa = Salario + Prestaciones + Seguridad Social + Bonificaciones + Otros
Cliente     ──► Facturación   = Σ facturas del período
Rentabilidad = Facturación − Costo Empresa
Margen (%)   = (Rentabilidad / Facturación) × 100
```

Todo lo demás —dashboard, reportes, alertas y semáforos de color— son proyecciones de esa cadena sobre distintas dimensiones (cliente, colaborador, mes, año, líder). Por eso el diseño prioriza que el modelo de datos y el motor de cálculo sean correctos y auditables; la interfaz es la capa de lectura.

**Actores del sistema.** Administrador (control total), Líder (gestiona solo su célula) y Consulta (solo lectura). El control de acceso por rol atraviesa todos los módulos.

**Alcance funcional.** Ocho áreas: Dashboard, Clientes, Colaboradores, Facturación, Costos salariales, Rentabilidad, Seguimientos y Reportes. Más un módulo transversal de Seguridad (login, roles, recuperación de contraseña, auditoría).

---

## 2. Requerimientos

### 2.1 Requerimientos funcionales (RF)

| ID | Requerimiento |
|----|---------------|
| RF-01 | Autenticación con usuario y contraseña, y recuperación de contraseña por correo. |
| RF-02 | Gestión de tres roles (Administrador, Líder, Consulta) con permisos diferenciados. |
| RF-03 | CRUD de clientes con nombre, NIT, ciudad, estado, fecha de inicio y líder responsable. |
| RF-04 | CRUD de colaboradores con cargo, salario, prestaciones, cliente asignado, fecha de ingreso y estado. |
| RF-05 | Registro de facturación por cliente, mes, año, valor y estado de factura. |
| RF-06 | Registro de costos salariales y cálculo automático del Costo Empresa. |
| RF-07 | Cálculo automático de Rentabilidad y Margen % por cliente, colaborador, mes y año. |
| RF-08 | Semáforo de rentabilidad: verde (rentable ≥15%), amarillo (margen bajo 0–15%), rojo (pérdida <0%). |
| RF-09 | Tablero de seguimientos con cliente, responsable, fecha, estado y observación. |
| RF-10 | Dashboard con 8 KPIs y 6 gráficos, todos filtrables. |
| RF-11 | Filtros avanzados en cada módulo (cliente, estado, ciudad, cargo, año, mes, nombre). |
| RF-12 | Reportes de rentabilidad, financieros, comparativos y de alertas automáticas. |
| RF-13 | Generación automática de alertas (margen bajo, pérdidas, facturas pendientes, seguimientos vencidos, colaboradores sin asignar, etc.). |
| RF-14 | Auditoría de cambios: quién creó/modificó/eliminó cada registro y cuándo. |
| RF-15 | **Multi-célula:** el sistema soporta varias células de trabajo simultáneas (Valentina, Juan Manuel, Hamilton…). Cada líder inicia sesión con usuario y contraseña propios. |
| RF-16 | **Aislamiento de datos por célula:** un líder autenticado ve la aplicación completa (dashboard, clientes, colaboradores, facturación, costos, rentabilidad, seguimientos, reportes) pero **solo con los clientes y colaboradores de su propia célula**. No puede ver ni acceder a datos de otras células. |
| RF-17 | El Administrador puede ver todas las células de forma consolidada o filtrar el panel por una célula específica. |

### 2.2 Requerimientos no funcionales (RNF)

| ID | Requerimiento |
|----|---------------|
| RNF-01 | Interfaz web responsive, usable en escritorio y móvil. |
| RNF-02 | Estética ejecutiva tipo Power BI / Notion; paleta azul, blanco y gris. |
| RNF-03 | Tiempo de respuesta de dashboard y gráficos < 2 s con datos de una célula. |
| RNF-04 | Contraseñas cifradas (hash bcrypt); tokens JWT con expiración. |
| RNF-05 | Autorización por rol validada en el backend, no solo en la interfaz. |
| RNF-06 | Código limpio, modular, documentado y con pruebas en la capa de servicios. |
| RNF-07 | Protección de datos: validación de entradas y prevención de inyección SQL (consultas parametrizadas). |
| RNF-08 | Escalabilidad para múltiples células sin rediseño del modelo. |

---

## 3. Casos de uso

**Diagrama de actores (texto):**

```
                 ┌────────────────── 2NVBoard ──────────────────┐
 Administrador ──┤ Gestionar usuarios · CRUD total · Auditoría   │
                 │                                               │
 Líder ──────────┤ Gestionar su célula · Registrar facturación   │
                 │ y costos · Crear seguimientos · Ver reportes  │
                 │                                               │
 Consulta ───────┤ Ver dashboard · Ver reportes (solo lectura)   │
                 └───────────────────────────────────────────────┘
```

**CU-01 — Iniciar sesión.** El usuario ingresa credenciales; el sistema valida y entrega un token con su rol. *Flujo alterno:* credenciales inválidas → mensaje de error sin revelar cuál campo falló.

**CU-02 — Registrar cliente.** (Admin/Líder) El usuario completa el formulario; el sistema valida NIT único y guarda, registrando el evento en auditoría.

**CU-03 — Registrar colaborador y costo.** (Admin/Líder) Al guardar salario y componentes, el sistema calcula el Costo Empresa automáticamente.

**CU-04 — Registrar facturación.** (Admin/Líder) Se asocia cliente + mes + año + valor + estado. El dashboard y la rentabilidad se recalculan.

**CU-05 — Consultar rentabilidad.** (Todos) El sistema muestra rentabilidad y margen por cliente/colaborador/mes con el semáforo de color.

**CU-06 — Gestionar seguimientos.** (Admin/Líder) Crear, actualizar estado (Pendiente/Completado/Vencido) y observación.

**CU-07 — Generar reportes y alertas.** (Todos) El sistema produce reportes y calcula alertas automáticas según reglas de negocio.

**CU-08 — Recuperar contraseña.** (Todos) Solicitud por correo con enlace temporal.

---

## 4. Historias de usuario

> Formato: *Como [rol], quiero [acción] para [beneficio].* Con criterios de aceptación (CA).

**HU-01** — Como **líder**, quiero ver en una sola pantalla la facturación, el costo y la rentabilidad del mes, para decidir rápido sin abrir hojas de cálculo.
- CA1: El dashboard muestra los 8 KPIs al cargar.
- CA2: La rentabilidad se calcula como Facturación − Costo Empresa.
- CA3: Los gráficos se pueden filtrar por mes y cliente.

**HU-02** — Como **líder**, quiero identificar clientes con margen menor al 15%, para renegociar antes de perder dinero.
- CA1: La tabla de rentabilidad ordena por margen.
- CA2: Los márgenes <15% aparecen en amarillo y <0% en rojo.

**HU-03** — Como **líder**, quiero detectar colaboradores sin cliente asignado, para no cargar costos sin ingreso.
- CA1: Aparece una alerta automática por cada colaborador sin asignación.

**HU-04** — Como **administrador**, quiero gestionar usuarios y roles, para controlar quién ve y edita qué.
- CA1: Solo el administrador accede a la gestión de usuarios.
- CA2: El rol Consulta no ve botones de edición.

**HU-05** — Como **consulta**, quiero ver reportes sin poder modificarlos, para revisar el estado del negocio con seguridad.
- CA1: Todas las acciones de escritura están deshabilitadas para este rol.

**HU-06** — Como **líder**, quiero registrar seguimientos con fecha y estado, para no perder compromisos comerciales.
- CA1: Un seguimiento con fecha pasada y estado no completado se marca Vencido.

**HU-07** — Como **administrador**, quiero un registro de auditoría, para saber quién cambió cada dato.
- CA1: Cada operación de escritura guarda usuario, acción, entidad y fecha/hora.

---

## 5. Arquitectura de la solución

Arquitectura de tres capas con API REST, separando presentación, lógica de negocio y datos.

```
┌──────────────────────────────────────────────────────────┐
│  CLIENTE (navegador / móvil)                               │
│  React + Vite · React Router · Recharts · Axios            │
│  Componentes · Vistas · Contexto de autenticación          │
└───────────────────────────┬──────────────────────────────┘
                            │  HTTPS / JSON (REST)
                            │  Authorization: Bearer <JWT>
┌───────────────────────────▼──────────────────────────────┐
│  API (Node.js + Express)                                   │
│  ┌─────────────┬──────────────┬───────────────────────┐   │
│  │ Rutas       │ Middleware   │ Controladores          │   │
│  │ /clientes   │ auth (JWT)   │ validan y delegan       │   │
│  │ /colabora…  │ roles        │                         │   │
│  │ /facturas   │ validación   │ Servicios (negocio):    │   │
│  │ /reportes   │ auditoría    │ cálculo costo/rentab.   │   │
│  └─────────────┴──────────────┴───────────────────────┘   │
└───────────────────────────┬──────────────────────────────┘
                            │  SQL parametrizado (pg / Prisma)
┌───────────────────────────▼──────────────────────────────┐
│  BASE DE DATOS (PostgreSQL)                                │
│  usuarios · clientes · colaboradores · facturas            │
│  costos · seguimientos · auditoria                         │
└──────────────────────────────────────────────────────────┘
```

**Decisiones clave.** La lógica de cálculo (Costo Empresa, Rentabilidad, alertas) vive en la **capa de servicios del backend**, no en el frontend, para que sea única, testeable y no manipulable desde el cliente. La autorización por rol se valida en un middleware del servidor. El frontend solo pinta y filtra.

---

## 6. Modelo de base de datos

Siete tablas principales. Tipos en PostgreSQL.

> **Nota multi-célula.** El aislamiento de datos se apoya en una tabla `celulas` y en la columna `celula_id` presente en `usuarios`, `clientes` y `colaboradores`. Cada consulta del backend se filtra por el `celula_id` del usuario autenticado (salvo el Administrador, que puede consultar todas). Este filtro se aplica **en el servidor**, no en el cliente, para que un líder no pueda acceder a datos de otra célula ni manipulando la petición.

**celulas**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| nombre | VARCHAR(120) | p. ej. "Célula de Valentina" |
| lider_id | INT FK → usuarios.id | líder responsable |

**usuarios**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| nombre | VARCHAR(120) | |
| email | VARCHAR(160) UNIQUE | login |
| password_hash | VARCHAR(255) | bcrypt |
| rol | VARCHAR(20) | Administrador \| Líder \| Consulta |
| celula_id | INT | célula a la que pertenece |
| activo | BOOLEAN | |

**clientes**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| nombre | VARCHAR(160) | |
| nit | VARCHAR(30) UNIQUE | |
| ciudad | VARCHAR(80) | |
| estado | VARCHAR(15) | Activo \| Inactivo |
| fecha_inicio | DATE | |
| celula_id | INT FK → celulas.id | célula a la que pertenece |
| lider_id | INT FK → usuarios.id | |

**colaboradores**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| nombre | VARCHAR(160) | |
| cargo | VARCHAR(80) | |
| cliente_id | INT FK → clientes.id NULL | NULL = sin asignar |
| celula_id | INT FK → celulas.id | célula a la que pertenece |
| fecha_ingreso | DATE | |
| estado | VARCHAR(15) | Activo \| Inactivo |

**costos_salariales** (1:1 lógico con colaborador por período)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| colaborador_id | INT FK → colaboradores.id | |
| salario | NUMERIC(14,2) | |
| prestaciones | NUMERIC(14,2) | |
| seguridad_social | NUMERIC(14,2) | |
| bonificaciones | NUMERIC(14,2) | |
| otros | NUMERIC(14,2) | |
| costo_empresa | NUMERIC(14,2) | calculado |

**facturas**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| cliente_id | INT FK → clientes.id | |
| mes | SMALLINT | 1–12 |
| anio | SMALLINT | |
| valor | NUMERIC(14,2) | |
| estado | VARCHAR(15) | Pagada \| Pendiente |

**seguimientos**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| cliente_id | INT FK → clientes.id | |
| colaborador_id | INT FK → colaboradores.id NULL | |
| responsable_id | INT FK → usuarios.id | |
| fecha | DATE | |
| estado | VARCHAR(15) | Pendiente \| Completado \| Vencido |
| observacion | TEXT | |

**auditoria**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| usuario_id | INT FK → usuarios.id | |
| accion | VARCHAR(20) | crear \| editar \| eliminar |
| entidad | VARCHAR(40) | tabla afectada |
| entidad_id | INT | registro afectado |
| fecha_hora | TIMESTAMP | default now() |

---

## 7. Diagrama entidad-relación

```
        usuarios
        ┌──────────┐
        │ id (PK)  │
        │ nombre   │
        │ email    │
        │ rol      │
        └────┬─────┘
     lider_id│ 1        responsable_id
             │          ┌───────────────────┐
             │ N        │                   │ N
        ┌────▼─────┐    │              ┌─────▼────────┐
        │ clientes │◄───┼──────────────┤ seguimientos │
        │ id (PK)  │ 1  │  cliente_id  │ id (PK)      │
        │ nombre   │    │      N       │ estado       │
        │ nit      │    │              └──────────────┘
        └────┬─────┘    │
    cliente_id│ 1       │
             │ N        │
        ┌────▼──────────┴──┐ 1      1 ┌────────────────────┐
        │ colaboradores    │─────────►│ costos_salariales  │
        │ id (PK)          │          │ colaborador_id (FK)│
        │ cargo · estado   │          │ costo_empresa      │
        └──────────────────┘          └────────────────────┘

        ┌────────────┐                ┌──────────────┐
        │ clientes   │ 1 ──────── N   │ facturas     │
        │            │◄───────────────┤ cliente_id   │
        └────────────┘                │ mes · anio   │
                                      └──────────────┘

        usuarios 1 ────── N auditoria (usuario_id)
```

**Cardinalidades.** Un cliente tiene muchos colaboradores, muchas facturas y muchos seguimientos. Un colaborador tiene un registro de costo por período. Un usuario (líder) es responsable de muchos clientes y seguimientos. Toda escritura genera un registro de auditoría.

---

## 8. Flujo de navegación

```
  [Login] ──► credenciales válidas ──► [Dashboard]
     │                                     │
     └─► [Recuperar contraseña]            ├─► [Clientes] ──► [Detalle cliente]
                                           ├─► [Colaboradores] ──► [Detalle colaborador]
                                           ├─► [Facturación]
                                           ├─► [Costos salariales]
                                           ├─► [Rentabilidad]
                                           ├─► [Seguimientos]
                                           └─► [Reportes] ─► Rentabilidad / Financiero
                                                            / Comparativo / Alertas
```

La navegación principal es una barra lateral persistente. El rol determina qué acciones aparecen: Consulta ve las mismas vistas pero sin botones de creación/edición. En móvil, la barra lateral colapsa a un menú.

---

## 9. Diseño UX/UI

**Principios.** Densidad de información controlada (dashboard ejecutivo, no minimalista vacío), jerarquía tipográfica clara, y el color como portador de significado —el semáforo verde/amarillo/rojo no es decorativo, codifica salud financiera—.

**Sistema de tokens.**

- **Color:** azul profundo `#0F2A43` (marca/sidebar), azul primario `#1E5A8C` (acciones, series), azul claro `#4A90C2` (acentos), gris azulado `#5B7085` (texto secundario), líneas `#E3E9F0`, fondo `#F5F7FA`. Semáforo: verde `#1F9D6B`, ámbar `#D99A0B`, rojo `#D14343`.
- **Tipografía:** Inter para toda la interfaz; números en variante tabular para alinear cifras en tablas.
- **Layout:** sidebar fija de 236 px + área de trabajo. Rejilla de KPIs de 4 columnas (2 en móvil). Tarjetas con borde sutil y radio de 12 px.
- **Elemento distintivo:** el *badge* de rentabilidad con color de semáforo, presente en tablas de clientes, colaboradores y rentabilidad — hace que la salud del negocio sea legible de un vistazo, sin leer cifras.

**Estados vacíos y errores.** Cada tabla vacía invita a la acción ("Registra tu primer cliente"). Los errores dicen qué pasó y cómo resolverlo, en la voz del sistema.

**Accesibilidad.** Foco de teclado visible, contraste suficiente en textos, y respeto a `prefers-reduced-motion`.

---

## 10. Estructura de carpetas

```
2nvboard/
├── client/                      # Frontend React + Vite
│   ├── src/
│   │   ├── api/                 # Axios: llamadas al backend
│   │   ├── components/          # UI reutilizable (Card, Badge, Table…)
│   │   ├── views/               # Dashboard, Clientes, Colaboradores…
│   │   ├── context/             # AuthContext (usuario y rol)
│   │   ├── hooks/               # useAuth, useFiltros…
│   │   ├── utils/               # formato moneda, semáforo
│   │   ├── routes.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                      # Backend Node + Express
│   ├── src/
│   │   ├── routes/              # /clientes /colaboradores /facturas…
│   │   ├── controllers/         # validan request y delegan
│   │   ├── services/            # LÓGICA: costo, rentabilidad, alertas
│   │   ├── middleware/          # auth JWT, roles, auditoría, errores
│   │   ├── db/                  # conexión pg + queries
│   │   ├── validators/          # validación de entradas
│   │   └── app.js
│   ├── migrations/              # esquema SQL
│   ├── seeds/                   # datos de ejemplo
│   └── package.json
│
├── docs/                        # este documento, ERD, diagramas
├── .env.example
└── README.md
```

---

## 11. Plan de desarrollo por fases

| Fase | Entregable | Contenido |
|------|-----------|-----------|
| **0. Diseño** *(actual)* | Este documento + demo navegable | Análisis, arquitectura, modelo de datos, prototipo funcional aprobable. |
| **1. Cimientos** | Backend base | Esquema PostgreSQL + migraciones, conexión, autenticación JWT, roles, semillas de datos. |
| **2. Núcleo de datos** | CRUD + cálculos | Clientes, colaboradores, costos, facturas; motor de Costo Empresa y Rentabilidad con pruebas. |
| **3. Visualización** | Frontend conectado | Dashboard con KPIs y gráficos, tablas con filtros, semáforos, conectado a la API real. |
| **4. Seguimientos y reportes** | Módulos avanzados | Tablero de seguimientos, reportes y motor de alertas automáticas. |
| **5. Endurecimiento** | Listo para producción | Auditoría, recuperación de contraseña, validaciones, protección de datos, pruebas end-to-end, documentación. |

**Criterio de avance.** Cada fase se cierra cuando sus criterios de aceptación (sección 4) pasan. No se avanza a la fase siguiente con deuda funcional abierta en el núcleo de cálculo.

---

*Fin del documento de análisis. La Parte 2 entregará el código fuente del backend y frontend conectados, empaquetado y descargable, una vez aprobada esta fase de diseño.*
