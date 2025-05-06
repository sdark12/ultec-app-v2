/*
  # =====================================================
  # Esquema de Base de Datos para Sistema de Gestión de Academia
  # Versión: PostgreSQL para Supabase
  # =====================================================
*/

-- -----------------------------------------------------
-- Crear Tipos Personalizados (ENUMs)
-- -----------------------------------------------------
DROP TYPE IF EXISTS public.tipo_genero CASCADE;
DROP TYPE IF EXISTS public.dia_semana CASCADE;
DROP TYPE IF EXISTS public.estado_inscripcion CASCADE;
DROP TYPE IF EXISTS public.estado_pago CASCADE;
DROP TYPE IF EXISTS public.estado_asistencia CASCADE;
DROP TYPE IF EXISTS public.tipo_pago CASCADE;
DROP TYPE IF EXISTS public.concepto_pago CASCADE;
DROP TYPE IF EXISTS public.rol_usuario CASCADE;
DROP TYPE IF EXISTS public.modalidad_horario_enum CASCADE;

CREATE TYPE public.tipo_genero AS ENUM ('Masculino', 'Femenino', 'Otro');
CREATE TYPE public.dia_semana AS ENUM ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo');
CREATE TYPE public.estado_inscripcion AS ENUM ('Activo', 'Completado', 'Retirado', 'Pendiente');
CREATE TYPE public.estado_pago AS ENUM ('Pagado', 'Pendiente', 'Exonerado');
CREATE TYPE public.estado_asistencia AS ENUM ('Presente', 'Ausente', 'Justificado', 'Tardanza');
CREATE TYPE public.tipo_pago AS ENUM ('Efectivo', 'Transferencia', 'Cheque', 'Otro');
CREATE TYPE public.concepto_pago AS ENUM ('Inscripción', 'Mensualidad', 'Material', 'Otro', 'Servicios Varios');
CREATE TYPE public.rol_usuario AS ENUM ('administrador', 'profesor', 'secretaria', 'contador', 'alumno', 'encargado');
CREATE TYPE public.modalidad_horario_enum AS ENUM ('Fijo', 'Flexible Diario', 'Finde Mañana', 'Finde Tarde');

-- -----------------------------------------------------
-- Crear Tablas Principales
-- -----------------------------------------------------
DROP TABLE IF EXISTS public.centros_educativos CASCADE;
CREATE TABLE IF NOT EXISTS public.centros_educativos (
  id_centro_educativo SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(20) NULL,
  persona_contacto VARCHAR(100) NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DROP TABLE IF EXISTS public.encargados CASCADE;
CREATE TABLE IF NOT EXISTS public.encargados (
  id_encargado SERIAL PRIMARY KEY,
  nombres VARCHAR(50) NOT NULL,
  apellidos VARCHAR(50) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  relacion_parentesco VARCHAR(30) NULL,
  direccion VARCHAR(255) NULL,
  correo_electronico VARCHAR(100) UNIQUE NULL,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_encargados_auth_user_id ON public.encargados(auth_user_id);

DROP TABLE IF EXISTS public.tipos_curso CASCADE;
CREATE TABLE IF NOT EXISTS public.tipos_curso (
  id_tipo_curso SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DROP TABLE IF EXISTS public.usuarios CASCADE;
CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NULL,
  nombres VARCHAR(50) NOT NULL,
  apellidos VARCHAR(50) NOT NULL,
  correo_electronico VARCHAR(100) NOT NULL UNIQUE,
  rol public.rol_usuario NOT NULL,
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ultimo_ingreso TIMESTAMPTZ NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON public.usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);

DROP TABLE IF EXISTS public.alumnos CASCADE;
CREATE TABLE IF NOT EXISTS public.alumnos (
  id_alumno SERIAL PRIMARY KEY,
  codigo_personal_mineduc VARCHAR(20) UNIQUE NULL,
  codigo_personal_academia VARCHAR(20) UNIQUE NOT NULL,
  nombres VARCHAR(50) NOT NULL,
  apellidos VARCHAR(50) NOT NULL,
  genero public.tipo_genero NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(20) NULL,
  nivel_educativo VARCHAR(50) NULL,
  id_centro_educativo INTEGER REFERENCES public.centros_educativos(id_centro_educativo) ON DELETE SET NULL,
  id_encargado INTEGER REFERENCES public.encargados(id_encargado) ON DELETE SET NULL,
  numero_ingreso SMALLINT NOT NULL DEFAULT 1 CHECK (numero_ingreso > 0),
  fecha_registro_academia DATE NOT NULL DEFAULT CURRENT_DATE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  esta_activo BOOLEAN DEFAULT TRUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alumnos_auth_user_id ON public.alumnos(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_id_centro ON public.alumnos(id_centro_educativo);
CREATE INDEX IF NOT EXISTS idx_alumnos_id_encargado ON public.alumnos(id_encargado);

DROP TABLE IF EXISTS public.cursos CASCADE;
CREATE TABLE IF NOT EXISTS public.cursos (
  id_curso SERIAL PRIMARY KEY,
  nombre_curso VARCHAR(100) NOT NULL UNIQUE,
  id_tipo_curso INTEGER NOT NULL REFERENCES public.tipos_curso(id_tipo_curso) ON DELETE RESTRICT,
  descripcion TEXT NULL,
  duracion_horas INTEGER NULL CHECK (duracion_horas IS NULL OR duracion_horas > 0),
  nivel_academico VARCHAR(50) NULL,
  modalidad_horario public.modalidad_horario_enum NOT NULL DEFAULT 'Fijo',
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cursos_id_tipo_curso ON public.cursos(id_tipo_curso);
CREATE INDEX IF NOT EXISTS idx_cursos_modalidad_horario ON public.cursos(modalidad_horario);

DROP TABLE IF EXISTS public.horarios CASCADE;
CREATE TABLE IF NOT EXISTS public.horarios (
  id_horario SERIAL PRIMARY KEY,
  id_curso INTEGER NOT NULL REFERENCES public.cursos(id_curso) ON DELETE CASCADE,
  dia_semana public.dia_semana NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula VARCHAR(50) NULL,
  capacidad_maxima INTEGER NULL CHECK (capacidad_maxima IS NULL OR capacidad_maxima > 0),
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (id_curso, dia_semana, hora_inicio, aula),
  CHECK (hora_fin > hora_inicio)
);
CREATE INDEX IF NOT EXISTS idx_horarios_id_curso ON public.horarios(id_curso);

DROP TABLE IF EXISTS public.inscripciones CASCADE;
CREATE TABLE IF NOT EXISTS public.inscripciones (
  id_inscripcion SERIAL PRIMARY KEY,
  id_alumno INTEGER NOT NULL REFERENCES public.alumnos(id_alumno) ON DELETE CASCADE,
  id_curso INTEGER NOT NULL REFERENCES public.cursos(id_curso) ON DELETE RESTRICT,
  fecha_inscripcion_curso DATE NOT NULL DEFAULT CURRENT_DATE,
  ciclo_escolar VARCHAR(10) NOT NULL,
  estado public.estado_inscripcion NOT NULL DEFAULT 'Activo',
  estado_pago public.estado_pago NOT NULL DEFAULT 'Pendiente',
  notas TEXT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (id_alumno, id_curso, ciclo_escolar)
);
CREATE INDEX IF NOT EXISTS idx_inscripciones_id_alumno ON public.inscripciones(id_alumno);
CREATE INDEX IF NOT EXISTS idx_inscripciones_id_curso ON public.inscripciones(id_curso);

DROP TABLE IF EXISTS public.asistencias CASCADE;
CREATE TABLE IF NOT EXISTS public.asistencias (
  id_asistencia SERIAL PRIMARY KEY,
  id_inscripcion INTEGER NOT NULL REFERENCES public.inscripciones(id_inscripcion) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado public.estado_asistencia NOT NULL DEFAULT 'Presente',
  notas TEXT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (id_inscripcion, fecha)
);
CREATE INDEX IF NOT EXISTS idx_asistencias_id_inscripcion ON public.asistencias(id_inscripcion);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON public.asistencias(fecha);

DROP TABLE IF EXISTS public.evaluaciones CASCADE;
CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id_evaluacion SERIAL PRIMARY KEY,
  id_curso INTEGER NOT NULL REFERENCES public.cursos(id_curso) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  nota_maxima DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (nota_maxima > 0),
  ponderacion DECIMAL(5,2) NOT NULL CHECK (ponderacion >= 0 AND ponderacion <= 1),
  fecha DATE NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_id_curso ON public.evaluaciones(id_curso);

DROP TABLE IF EXISTS public.calificaciones CASCADE;
CREATE TABLE IF NOT EXISTS public.calificaciones (
  id_calificacion SERIAL PRIMARY KEY,
  id_inscripcion INTEGER NOT NULL REFERENCES public.inscripciones(id_inscripcion) ON DELETE CASCADE,
  id_evaluacion INTEGER NOT NULL REFERENCES public.evaluaciones(id_evaluacion) ON DELETE CASCADE,
  nota_obtenida DECIMAL(5,2) NOT NULL CHECK (nota_obtenida >= 0),
  comentarios TEXT NULL,
  fecha_calificacion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (id_inscripcion, id_evaluacion)
);
CREATE INDEX IF NOT EXISTS idx_calificaciones_id_inscripcion ON public.calificaciones(id_inscripcion);
CREATE INDEX IF NOT EXISTS idx_calificaciones_id_evaluacion ON public.calificaciones(id_evaluacion);

DROP TABLE IF EXISTS public.pagos CASCADE;
CREATE TABLE IF NOT EXISTS public.pagos (
  id_pago SERIAL PRIMARY KEY,
  id_inscripcion INTEGER NULL REFERENCES public.inscripciones(id_inscripcion) ON DELETE SET NULL,
  id_alumno INTEGER NULL REFERENCES public.alumnos(id_alumno) ON DELETE SET NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_pago public.tipo_pago NOT NULL DEFAULT 'Efectivo',
  numero_recibo VARCHAR(50) UNIQUE NULL,
  concepto public.concepto_pago NOT NULL,
  mes_correspondiente VARCHAR(20) NULL,
  notas TEXT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pagos_id_inscripcion ON public.pagos(id_inscripcion);
CREATE INDEX IF NOT EXISTS idx_pagos_id_alumno ON public.pagos(id_alumno);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON public.pagos(fecha_pago);

DROP TABLE IF EXISTS public.gastos CASCADE;
CREATE TABLE IF NOT EXISTS public.gastos (
  id_gasto SERIAL PRIMARY KEY,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria VARCHAR(50) NOT NULL,
  descripcion TEXT NOT NULL,
  numero_comprobante VARCHAR(50) NULL,
  registrado_por INTEGER NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT,
  fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gastos_registrado_por ON public.gastos(registrado_por);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha_gasto ON public.gastos(fecha_gasto);

DROP TABLE IF EXISTS public.cursos_profesores CASCADE;
CREATE TABLE IF NOT EXISTS public.cursos_profesores (
  id_curso INT NOT NULL REFERENCES public.cursos(id_curso) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_curso, id_usuario)
);
CREATE INDEX IF NOT EXISTS idx_cursos_profesores_id_curso ON public.cursos_profesores(id_curso);
CREATE INDEX IF NOT EXISTS idx_cursos_profesores_id_usuario ON public.cursos_profesores(id_usuario);

-- =====================================================
-- FUNCIÓN AUXILIAR PARA OBTENER ROL
-- =====================================================
DROP FUNCTION IF EXISTS public.obtener_rol_usuario_actual();
CREATE OR REPLACE FUNCTION public.obtener_rol_usuario_actual()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT rol::TEXT FROM public.usuarios WHERE auth_user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.obtener_rol_usuario_actual() TO authenticated;

-- =====================================================
-- VISTAS PARA REPORTES
-- =====================================================
DROP VIEW IF EXISTS public.vista_alumnos_activos_por_tipo_curso;
DROP VIEW IF EXISTS public.vista_reporte_ingresos_mensuales;
DROP VIEW IF EXISTS public.vista_resumen_asistencia_por_curso;
DROP VIEW IF EXISTS public.vista_resumen_inscripcion_alumno;

CREATE OR REPLACE VIEW public.vista_alumnos_activos_por_tipo_curso AS
SELECT tc.nombre AS tipo_curso, COUNT(DISTINCT a.id_alumno) AS cantidad_alumnos
FROM public.alumnos a 
JOIN public.inscripciones i ON a.id_alumno = i.id_alumno 
JOIN public.cursos c ON i.id_curso = c.id_curso 
JOIN public.tipos_curso tc ON c.id_tipo_curso = tc.id_tipo_curso
WHERE i.estado = 'Activo' 
GROUP BY tc.nombre;

CREATE OR REPLACE VIEW public.vista_reporte_ingresos_mensuales AS
SELECT 
  TO_CHAR(fecha_pago, 'YYYY-MM') AS mes, 
  concepto, 
  SUM(monto) AS monto_total, 
  COUNT(*) AS cantidad_pagos
FROM public.pagos 
GROUP BY TO_CHAR(fecha_pago, 'YYYY-MM'), concepto 
ORDER BY mes DESC, concepto;

CREATE OR REPLACE VIEW public.vista_resumen_asistencia_por_curso AS
SELECT 
  c.nombre_curso AS nombre_curso,
  c.nivel_academico,
  COUNT(DISTINCT i.id_alumno) AS total_alumnos_inscritos,
  SUM(CASE WHEN asis.estado = 'Presente' THEN 1 ELSE 0 END) AS conteo_presentes,
  SUM(CASE WHEN asis.estado = 'Ausente' THEN 1 ELSE 0 END) AS conteo_ausentes,
  SUM(CASE WHEN asis.estado = 'Justificado' THEN 1 ELSE 0 END) AS conteo_justificados,
  COUNT(asis.id_asistencia) AS total_registros_asistencia,
  CASE 
    WHEN COUNT(asis.id_asistencia) = 0 THEN 0 
    ELSE ROUND((SUM(CASE WHEN asis.estado = 'Presente' THEN 1 ELSE 0 END)::NUMERIC / COUNT(asis.id_asistencia)) * 100, 2) 
  END AS tasa_asistencia_porcentaje
FROM public.cursos c 
JOIN public.inscripciones i ON c.id_curso = i.id_curso 
LEFT JOIN public.asistencias asis ON i.id_inscripcion = asis.id_inscripcion
WHERE i.estado = 'Activo' 
GROUP BY c.id_curso, c.nombre_curso, c.nivel_academico 
ORDER BY tasa_asistencia_porcentaje DESC;

CREATE OR REPLACE VIEW public.vista_resumen_inscripcion_alumno AS
SELECT 
  a.id_alumno,
  a.codigo_personal_mineduc,
  a.codigo_personal_academia,
  CONCAT(a.nombres, ' ', a.apellidos) AS nombre_completo_alumno,
  COUNT(DISTINCT CASE WHEN tc.nombre = 'TAC' THEN i.id_inscripcion END) AS inscripciones_tac,
  COUNT(DISTINCT CASE WHEN tc.nombre = 'Curso Libre' THEN i.id_inscripcion END) AS inscripciones_curso_libre,
  COUNT(DISTINCT i.id_inscripcion) AS total_inscripciones,
  STRING_AGG(DISTINCT c.nombre_curso, ', ' ORDER BY c.nombre_curso) AS cursos_inscritos,
  MAX(i.fecha_inscripcion_curso) AS fecha_ultima_inscripcion
FROM public.alumnos a 
LEFT JOIN public.inscripciones i ON a.id_alumno = i.id_alumno AND i.estado = 'Activo' 
LEFT JOIN public.cursos c ON i.id_curso = c.id_curso 
LEFT JOIN public.tipos_curso tc ON c.id_tipo_curso = tc.id_tipo_curso
GROUP BY a.id_alumno, a.codigo_personal_mineduc, a.codigo_personal_academia, nombre_completo_alumno 
ORDER BY fecha_ultima_inscripcion DESC;

-- Establecer seguridad INVOKER para las vistas
ALTER VIEW public.vista_alumnos_activos_por_tipo_curso SET (security_invoker = true);
ALTER VIEW public.vista_reporte_ingresos_mensuales SET (security_invoker = true);
ALTER VIEW public.vista_resumen_asistencia_por_curso SET (security_invoker = true);
ALTER VIEW public.vista_resumen_inscripcion_alumno SET (security_invoker = true);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.centros_educativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encargados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos_profesores ENABLE ROW LEVEL SECURITY; 