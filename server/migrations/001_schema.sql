-- ============================================================
-- 2NVBoard — Esquema de base de datos (PostgreSQL)
-- Multi-célula con aislamiento de datos por célula.
-- ============================================================

DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS seguimientos CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS costos_salariales CASCADE;
DROP TABLE IF EXISTS colaboradores CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS celulas CASCADE;

-- ---------- Células de trabajo ----------
CREATE TABLE celulas (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(120) NOT NULL,
  lider_id  INTEGER,              -- FK diferida a usuarios (líder responsable)
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ---------- Usuarios ----------
CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(20)  NOT NULL CHECK (rol IN ('Administrador','Lider','Consulta')),
  celula_id     INTEGER REFERENCES celulas(id) ON DELETE SET NULL,
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     TIMESTAMP DEFAULT NOW()
);

-- FK diferida: la célula referencia a su líder
ALTER TABLE celulas
  ADD CONSTRAINT fk_celula_lider FOREIGN KEY (lider_id)
  REFERENCES usuarios(id) ON DELETE SET NULL;

-- ---------- Clientes ----------
CREATE TABLE clientes (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(160) NOT NULL,
  nit          VARCHAR(30)  UNIQUE NOT NULL,
  ciudad       VARCHAR(80),
  estado       VARCHAR(15)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  fecha_inicio DATE,
  celula_id    INTEGER NOT NULL REFERENCES celulas(id) ON DELETE CASCADE,
  lider_id     INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_clientes_celula ON clientes(celula_id);

-- ---------- Colaboradores ----------
CREATE TABLE colaboradores (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(160) NOT NULL,
  cargo         VARCHAR(80),
  cliente_id    INTEGER REFERENCES clientes(id) ON DELETE SET NULL,  -- NULL = sin asignar
  celula_id     INTEGER NOT NULL REFERENCES celulas(id) ON DELETE CASCADE,
  fecha_ingreso DATE,
  estado        VARCHAR(15) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  creado_en     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_colab_celula ON colaboradores(celula_id);
CREATE INDEX idx_colab_cliente ON colaboradores(cliente_id);

-- ---------- Costos salariales ----------
CREATE TABLE costos_salariales (
  id             SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  salario        NUMERIC(14,2) NOT NULL DEFAULT 0,
  prestaciones   NUMERIC(14,2) NOT NULL DEFAULT 0,
  seguridad_social NUMERIC(14,2) NOT NULL DEFAULT 0,
  bonificaciones NUMERIC(14,2) NOT NULL DEFAULT 0,
  otros          NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- costo_empresa se calcula como columna generada (siempre consistente)
  costo_empresa  NUMERIC(14,2) GENERATED ALWAYS AS
                 (salario + prestaciones + seguridad_social + bonificaciones + otros) STORED,
  creado_en      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_costos_colab ON costos_salariales(colaborador_id);

-- ---------- Facturas ----------
CREATE TABLE facturas (
  id         SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  mes        SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio       SMALLINT NOT NULL,
  valor      NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado     VARCHAR(15) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pagada','Pendiente')),
  creado_en  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);

-- ---------- Seguimientos ----------
CREATE TABLE seguimientos (
  id             SERIAL PRIMARY KEY,
  cliente_id     INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  colaborador_id INTEGER REFERENCES colaboradores(id) ON DELETE SET NULL,
  responsable_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  celula_id      INTEGER NOT NULL REFERENCES celulas(id) ON DELETE CASCADE,
  fecha          DATE NOT NULL,
  estado         VARCHAR(15) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Completado','Vencido')),
  observacion    TEXT,
  creado_en      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_seg_celula ON seguimientos(celula_id);

-- ---------- Auditoría ----------
CREATE TABLE auditoria (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion     VARCHAR(20) NOT NULL,   -- crear | editar | eliminar
  entidad    VARCHAR(40) NOT NULL,
  entidad_id INTEGER,
  detalle    TEXT,
  fecha_hora TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_usuario ON auditoria(usuario_id);
