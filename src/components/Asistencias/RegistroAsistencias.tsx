import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Alumno {
    id_alumno: number;
    nombres: string;
    apellidos: string;
}

interface Curso {
    id_curso: number;
    nombre_curso: string;
}

interface Inscripcion {
    id_inscripcion: number;
    alumnos: {
        id_alumno: number;
        nombres: string;
        apellidos: string;
    };
}

interface Asistencia {
    id_asistencia: number;
    fecha: string;
    estado: string;
    inscripciones: {
        id_inscripcion: number;
        alumnos: {
            id_alumno: number;
        };
    };
}

export default function RegistroAsistencias() {
    // Inicializar la fecha actual al primer día del mes actual
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [selectedCurso, setSelectedCurso] = useState<number | null>(null);
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [asistencias, setAsistencias] = useState<{ [key: string]: { [key: number]: string } }>({});
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Función para validar si una fecha es futura
    const esFechaFutura = (fecha: Date) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return fecha > hoy;
    };

    // Cargar cursos al montar el componente
    useEffect(() => {
        async function fetchCursos() {
            const { data, error } = await supabase
                .from('cursos')
                .select('id_curso, nombre_curso')
                .eq('activo', true)
                .order('nombre_curso');
            
            if (error) {
                console.error('Error cargando cursos:', error);
                setErrorMsg(`Error al cargar cursos: ${error.message}`);
            } else {
                setCursos(data || []);
            }
        }
        fetchCursos();
    }, []);

    // Cargar alumnos cuando se selecciona un curso
    useEffect(() => {
        async function fetchAlumnos() {
            if (!selectedCurso) {
                setAlumnos([]);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from('inscripciones')
                .select(`
                    id_inscripcion,
                    alumnos (
                        id_alumno,
                        nombres,
                        apellidos
                    )
                `)
                .eq('id_curso', selectedCurso)
                .eq('estado', 'Activo');

            if (error) {
                console.error('Error cargando alumnos:', error);
                setErrorMsg(`Error al cargar alumnos: ${error.message}`);
            } else {
                const alumnosData = (data as unknown as Inscripcion[])
                    .map(i => i.alumnos)
                    .filter(Boolean)
                    .sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));
                setAlumnos(alumnosData);
            }
            setLoading(false);
        }
        fetchAlumnos();
    }, [selectedCurso]);

    // Cargar asistencias cuando cambia el mes o el curso
    useEffect(() => {
        async function fetchAsistencias() {
            if (!selectedCurso) {
                setAsistencias({});
                return;
            }

            setLoading(true);
            const inicioMes = startOfMonth(currentDate);
            const finMes = endOfMonth(currentDate);

            const { data, error } = await supabase
                .from('asistencias')
                .select(`
                    id_asistencia,
                    fecha,
                    estado,
                    inscripciones (
                        id_inscripcion,
                        alumnos (
                            id_alumno
                        )
                    )
                `)
                .eq('inscripciones.id_curso', selectedCurso)
                .gte('fecha', format(inicioMes, 'yyyy-MM-dd'))
                .lte('fecha', format(finMes, 'yyyy-MM-dd'));

            if (error) {
                console.error('Error cargando asistencias:', error);
                setErrorMsg(`Error al cargar asistencias: ${error.message}`);
            } else {
                const asistenciasMap: { [key: string]: { [key: number]: string } } = {};
                (data as unknown as Asistencia[])?.forEach(a => {
                    const fecha = parseISO(a.fecha);
                    const fechaStr = format(fecha, 'yyyy-MM-dd');
                    const idAlumno = a.inscripciones?.alumnos?.id_alumno;
                    if (idAlumno) {
                        if (!asistenciasMap[fechaStr]) {
                            asistenciasMap[fechaStr] = {};
                        }
                        asistenciasMap[fechaStr][idAlumno] = a.estado;
                    }
                });
                setAsistencias(asistenciasMap);
            }
            setLoading(false);
        }
        fetchAsistencias();
    }, [selectedCurso, currentDate]);

    const cambiarMes = (incremento: number) => {
        setCurrentDate(prev => {
            const nuevaFecha = new Date(prev);
            nuevaFecha.setMonth(prev.getMonth() + incremento);
            
            // Si el nuevo mes es futuro, no permitir el cambio
            if (incremento > 0) {
                const primerDiaSiguienteMes = new Date();
                primerDiaSiguienteMes.setDate(1);
                primerDiaSiguienteMes.setMonth(primerDiaSiguienteMes.getMonth() + 1);
                primerDiaSiguienteMes.setHours(0, 0, 0, 0);
                
                if (nuevaFecha >= primerDiaSiguienteMes) {
                    return prev;
                }
            }
            
            return nuevaFecha;
        });
    };

    const handleRegistrarAsistencia = async (fecha: Date, idAlumno: number, estado: string) => {
        try {
            // Buscar la inscripción del alumno en el curso seleccionado
            const { data: inscripcionData, error: inscripcionError } = await supabase
                .from('inscripciones')
                .select('id_inscripcion')
                .eq('id_curso', selectedCurso)
                .eq('id_alumno', idAlumno)
                .eq('estado', 'Activo')
                .single();

            if (inscripcionError) {
                throw inscripcionError;
            }

            const fechaStr = format(fecha, 'yyyy-MM-dd');

            // Si el estado está vacío (opción "-"), eliminar la asistencia
            if (!estado) {
                // Primero verificar si existe una asistencia para eliminar
                const { data: existingData } = await supabase
                    .from('asistencias')
                    .select('id_asistencia')
                    .eq('fecha', fechaStr)
                    .eq('id_inscripcion', inscripcionData.id_inscripcion)
                    .single();

                if (existingData) {
                    // Si existe, eliminarla
                    const { error: deleteError } = await supabase
                        .from('asistencias')
                        .delete()
                        .eq('fecha', fechaStr)
                        .eq('id_inscripcion', inscripcionData.id_inscripcion);

                    if (deleteError) throw deleteError;
                }

                // Actualizar estado local
                setAsistencias(prev => {
                    const newAsistencias = { ...prev };
                    if (newAsistencias[fechaStr]) {
                        delete newAsistencias[fechaStr][idAlumno];
                        // Si no quedan asistencias para esta fecha, eliminar la fecha
                        if (Object.keys(newAsistencias[fechaStr]).length === 0) {
                            delete newAsistencias[fechaStr];
                        }
                    }
                    return newAsistencias;
                });

                return;
            }

            // Si llegamos aquí, estamos agregando o actualizando una asistencia
            const { data: existingData } = await supabase
                .from('asistencias')
                .select('id_asistencia')
                .eq('fecha', fechaStr)
                .eq('id_inscripcion', inscripcionData.id_inscripcion)
                .single();

            if (existingData) {
                // Actualizar asistencia existente
                const { error: updateError } = await supabase
                    .from('asistencias')
                    .update({ estado })
                    .eq('id_asistencia', existingData.id_asistencia);

                if (updateError) throw updateError;
            } else {
                // Crear nueva asistencia
                const { error: insertError } = await supabase
                    .from('asistencias')
                    .insert({
                        fecha: fechaStr,
                        estado,
                        id_inscripcion: inscripcionData.id_inscripcion
                    });

                if (insertError) throw insertError;
            }

            // Actualizar estado local
            setAsistencias(prev => {
                const newAsistencias = { ...prev };
                if (!newAsistencias[fechaStr]) {
                    newAsistencias[fechaStr] = {};
                }
                newAsistencias[fechaStr][idAlumno] = estado;
                return newAsistencias;
            });

        } catch (error: any) {
            console.error('Error gestionando asistencia:', error);
            setErrorMsg(`Error al gestionar asistencia: ${error.message}`);
        }
    };

    const getEstadoClass = (estado: string) => {
        switch (estado) {
            case 'Presente': return 'bg-green-100 text-green-800';
            case 'Ausente': return 'bg-red-100 text-red-800';
            case 'Justificado': return 'bg-blue-100 text-blue-800';
            case 'Tardanza': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const diasMes = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-semibold text-gray-800">Registro de Asistencias</h3>
            </div>

            {/* Selector de curso */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Curso</label>
                <select
                    value={selectedCurso || ''}
                    onChange={(e) => setSelectedCurso(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">Seleccione un curso</option>
                    {cursos.map(curso => (
                        <option key={curso.id_curso} value={curso.id_curso}>
                            {curso.nombre_curso}
                        </option>
                    ))}
                </select>
            </div>

            {errorMsg && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
                    {errorMsg}
                </div>
            )}

            {selectedCurso ? (
                <>
                    {/* Navegación del mes */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => cambiarMes(-1)}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h4 className="text-lg font-medium">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </h4>
                        <button
                            onClick={() => cambiarMes(1)}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabla de asistencias */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                    {diasMes.map(dia => (
                                        <th
                                            key={format(dia, 'yyyy-MM-dd')}
                                            className={`px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                                isSameDay(dia, new Date()) ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="text-sm">{format(dia, 'd')}</div>
                                            <div className="text-xs">{format(dia, 'EEE', { locale: es })}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {alumnos.map(alumno => (
                                    <tr key={alumno.id_alumno} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {alumno.apellidos}, {alumno.nombres}
                                        </td>
                                        {diasMes.map(dia => {
                                            const fechaStr = format(dia, 'yyyy-MM-dd');
                                            const estado = asistencias[fechaStr]?.[alumno.id_alumno];
                                            const esHoy = isSameDay(dia, new Date());
                                            const esFuturo = dia > new Date();

                                            return (
                                                <td
                                                    key={fechaStr}
                                                    className={`px-2 py-2 text-center ${
                                                        esHoy ? 'bg-blue-50' : ''
                                                    }`}
                                                >
                                                    {!esFuturo && (
                                                        <select
                                                            value={estado || ''}
                                                            onChange={(e) => handleRegistrarAsistencia(dia, alumno.id_alumno, e.target.value)}
                                                            className={`w-full text-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                                                estado ? getEstadoClass(estado) : ''
                                                            }`}
                                                        >
                                                            <option value="">-</option>
                                                            <option value="Presente">P</option>
                                                            <option value="Ausente">A</option>
                                                            <option value="Justificado">J</option>
                                                            <option value="Tardanza">T</option>
                                                        </select>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-6 flex justify-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-100 mr-2"></div>
                            <span className="text-sm">Presente</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-100 mr-2"></div>
                            <span className="text-sm">Ausente</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-100 mr-2"></div>
                            <span className="text-sm">Justificado</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-100 mr-2"></div>
                            <span className="text-sm">Tardanza</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-500 py-8">
                    Seleccione un curso para comenzar a registrar asistencias
                </div>
            )}
        </div>
    );
} 