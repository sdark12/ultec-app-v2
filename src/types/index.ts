// --- src/types/index.ts ---
// CORREGIDO: Definición de Pago para datos relacionados

export type Encargado = {
    id_encargado?: number;
    nombres: string;
    apellidos: string;
    telefono: string;
    relacion_parentesco?: string | null;
    direccion?: string | null;
    correo_electronico?: string | null;
    auth_user_id?: string | null;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
};

export type Alumno = {
    id_alumno?: number;
    codigo_personal_academia: string;
    codigo_personal_mineduc: string | null;
    nombres: string;
    apellidos: string;
    genero: 'Masculino' | 'Femenino' | 'Otro';
    fecha_nacimiento: string;
    direccion?: string | null;
    telefono?: string | null;
    nivel_educativo?: string | null;
    id_centro_educativo?: number | null;
    id_encargado?: number | null;
    encargado?: Encargado;
    numero_ingreso?: number;
    fecha_registro_academia?: string;
    auth_user_id?: string | null;
};

export type TipoCurso = {
    id_tipo_curso: number;
    nombre: string;
    descripcion?: string | null;
};

export type Curso = {
    id_curso?: number;
    nombre_curso: string;
    id_tipo_curso?: number;
    descripcion?: string | null;
    duracion_horas?: number | null;
    nivel_academico?: string | null;
    modalidad_horario?: 'Fijo' | 'Flexible Diario' | 'Finde Mañana' | 'Finde Tarde';
    activo?: boolean;
    tipos_curso?: Pick<TipoCurso, 'id_tipo_curso' | 'nombre'> | null;
};

export type Horario = {
    id_horario: number;
    id_curso: number;
    dia_semana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
    hora_inicio: string;
    hora_fin: string;
    aula?: string | null;
    capacidad_maxima?: number | null;
    activo?: boolean;
};

export type Inscripcion = {
    id_inscripcion?: number;
    id_alumno: number;
    id_curso: number;
    fecha_inscripcion_curso?: string;
    ciclo_escolar: string;
    estado: 'Activo' | 'Completado' | 'Retirado' | 'Pendiente';
    estado_pago: 'Pagado' | 'Pendiente' | 'Exonerado';
    notas?: string | null;
    alumnos?: Pick<Alumno, 'id_alumno' | 'nombres' | 'apellidos'> | null;
    cursos?: Pick<Curso, 'id_curso' | 'nombre_curso' | 'modalidad_horario'> | null;
};

export type Asistencia = {
    id_asistencia?: number;
    id_inscripcion: number;
    fecha: string;
    estado: 'Presente' | 'Ausente' | 'Justificado' | 'Tardanza';
    notas?: string | null;
    inscripciones?: {
        id_inscripcion: number;
        alumnos?: Pick<Alumno, 'id_alumno' | 'nombres' | 'apellidos'> | null;
        cursos?: Pick<Curso, 'id_curso' | 'nombre_curso'> | null;
    } | null;
};

export type Evaluacion = {
    id_evaluacion?: number;
    id_curso: number;
    nombre: string;
    descripcion?: string | null;
    nota_maxima?: number | null;
    ponderacion: number;
    fecha?: string | null;
    bimestre: 1 | 2 | 3 | 4;
};

export type Calificacion = {
    id_calificacion?: number;
    id_inscripcion: number;
    id_evaluacion: number;
    nota_obtenida: number;
    comentarios?: string | null;
    fecha_calificacion?: string;
    evaluaciones?: Pick<Evaluacion, 'id_evaluacion' | 'nombre' | 'nota_maxima' | 'ponderacion'> | null;
    inscripciones?: {
        id_inscripcion: number;
        alumnos?: Pick<Alumno, 'id_alumno' | 'nombres' | 'apellidos'> | null;
    } | null;
};

// CORREGIDO: Tipo Pago con estructura anidada directa
export type Pago = {
    id_pago?: number;
    id_inscripcion?: number | null;
    id_alumno?: number | null;
    monto: number;
    fecha_pago: string;
    tipo_pago: 'Efectivo' | 'Transferencia' | 'Cheque' | 'Otro';
    numero_recibo?: string | null;
    concepto: 'Inscripción' | 'Mensualidad' | 'Material' | 'Otro' | 'Servicios Varios';
    mes_correspondiente?: string | null;
    notas?: string | null;
    // Definición directa de la estructura esperada de alumnos
    alumnos?: {
        id_alumno: number;
        nombres: string;
        apellidos: string;
    } | null;
    // Definición directa de la estructura esperada de inscripciones->cursos
    inscripciones?: {
        id_inscripcion: number;
        cursos?: {
            id_curso: number;
            nombre_curso: string;
        } | null;
    } | null;
};

export type Usuario = {
    id_usuario: number;
    nombres: string;
    apellidos: string;
    rol: 'administrador' | 'profesor' | 'secretaria' | 'contador' | 'alumno' | 'encargado';
};

export type Gasto = {
    id_gasto?: number;
    monto: number;
    fecha_gasto: string;
    categoria: string;
    descripcion: string;
    numero_comprobante?: string | null;
    registrado_por: number;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
    usuarios?: Pick<Usuario, 'id_usuario' | 'nombres' | 'apellidos'> | null;
};
