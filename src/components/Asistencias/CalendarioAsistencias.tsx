import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    parseISO,
    startOfWeek,
    endOfWeek,
    addDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface CalendarioAsistenciasProps {
    idAlumno: number;
    onClose: () => void;
}

export default function CalendarioAsistencias({ idAlumno, onClose }: CalendarioAsistenciasProps) {
    const navigate = useNavigate();
    // Inicializar la fecha actual al primer día del mes actual
    const [currentDate, setCurrentDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [asistencias, setAsistencias] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [nombreAlumno, setNombreAlumno] = useState<string>('');

    // Función para validar si una fecha es futura
    const esFechaFutura = (fecha: Date) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return fecha > hoy;
    };

    const fetchAsistencias = async () => {
        setLoading(true);
        setErrorMsg(null);

        const inicioMes = startOfMonth(currentDate);
        const finMes = endOfMonth(currentDate);

        // Primero obtener el nombre del alumno
        const { data: alumnoData, error: alumnoError } = await supabase
            .from('alumnos')
            .select('nombres, apellidos')
            .eq('id_alumno', idAlumno)
            .single();

        if (alumnoError) {
            console.error('Error obteniendo datos del alumno:', alumnoError);
            setErrorMsg(`Error al cargar datos del alumno: ${alumnoError.message}`);
            setLoading(false);
            return;
        }

        if (alumnoData) {
            setNombreAlumno(`${alumnoData.nombres} ${alumnoData.apellidos}`);
        }

        // Obtener las inscripciones del alumno
        const { data: inscripcionesData, error: inscripcionesError } = await supabase
            .from('inscripciones')
            .select('id_inscripcion')
            .eq('id_alumno', idAlumno)
            .eq('estado', 'Activo');

        if (inscripcionesError) {
            console.error('Error obteniendo inscripciones:', inscripcionesError);
            setErrorMsg(`Error al cargar inscripciones: ${inscripcionesError.message}`);
            setLoading(false);
            return;
        }

        if (!inscripcionesData || inscripcionesData.length === 0) {
            setErrorMsg('No se encontraron inscripciones activas para este alumno');
            setLoading(false);
            return;
        }

        const inscripcionIds = inscripcionesData.map(i => i.id_inscripcion);

        // Obtener las asistencias para todas las inscripciones del alumno
        const { data, error } = await supabase
            .from('asistencias')
            .select('fecha, estado')
            .in('id_inscripcion', inscripcionIds)
            .gte('fecha', format(inicioMes, 'yyyy-MM-dd'))
            .lte('fecha', format(finMes, 'yyyy-MM-dd'))
            .order('fecha', { ascending: true });

        if (error) {
            console.error('Error fetching asistencias:', error);
            setErrorMsg(`Error al cargar asistencias: ${error.message}`);
        } else {
            const asistenciasMap: { [key: string]: string } = {};
            data?.forEach(a => {
                // Asegurarnos de que la fecha se maneje correctamente
                const fecha = parseISO(a.fecha);
                const fechaFormateada = format(fecha, 'yyyy-MM-dd');
                asistenciasMap[fechaFormateada] = a.estado;
            });
            setAsistencias(asistenciasMap);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAsistencias();
    }, [idAlumno, currentDate]);

    // Función para obtener todos los días que se mostrarán en el calendario
    const obtenerDiasCalendario = () => {
        const inicioMes = startOfMonth(currentDate);
        const finMes = endOfMonth(currentDate);
        const inicioCalendario = startOfWeek(inicioMes);
        const finCalendario = endOfWeek(finMes);

        const dias = [];
        let diaActual = inicioCalendario;

        while (diaActual <= finCalendario) {
            dias.push(diaActual);
            diaActual = addDays(diaActual, 1);
        }

        return dias;
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

    const irARegistroDiario = (fecha: Date) => {
        // Solo permitir navegación a días no futuros
        if (!esFechaFutura(fecha)) {
            const fechaFormateada = format(fecha, 'yyyy-MM-dd');
            navigate(`/asistencias/registrar?fecha=${fechaFormateada}`);
            onClose(); // Cerrar el calendario modal
        }
    };

    const eliminarAsistencia = async (fecha: Date) => {
        try {
            setLoading(true);
            setErrorMsg(null);

            // Buscar la inscripción activa del alumno
            const { data: inscripcionData, error: inscripcionError } = await supabase
                .from('inscripciones')
                .select('id_inscripcion')
                .eq('id_alumno', idAlumno)
                .eq('estado', 'Activo')
                .single();

            if (inscripcionError) {
                throw inscripcionError;
            }

            const fechaStr = format(fecha, 'yyyy-MM-dd');

            // Eliminar la asistencia
            const { error: deleteError } = await supabase
                .from('asistencias')
                .delete()
                .eq('id_inscripcion', inscripcionData.id_inscripcion)
                .eq('fecha', fechaStr);

            if (deleteError) {
                throw deleteError;
            }

            // Actualizar el estado local
            const nuevasAsistencias = { ...asistencias };
            delete nuevasAsistencias[fechaStr];
            setAsistencias(nuevasAsistencias);

        } catch (error: any) {
            console.error('Error al eliminar asistencia:', error);
            setErrorMsg(`Error al eliminar asistencia: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">Calendario de Asistencias</h3>
                        {nombreAlumno && (
                            <p className="text-sm text-gray-600 mt-1">{nombreAlumno}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando asistencias...</p>
                    </div>
                )}

                {!loading && errorMsg && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {errorMsg}
                    </div>
                )}

                {!loading && !errorMsg && (
                    <>
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

                        <div className="grid grid-cols-7 gap-1">
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
                                <div key={dia} className="text-center text-sm font-medium text-gray-500 py-2">
                                    {dia}
                                </div>
                            ))}
                            {obtenerDiasCalendario().map(dia => {
                                const fechaStr = format(dia, 'yyyy-MM-dd');
                                const estado = asistencias[fechaStr];
                                const esHoy = isSameDay(dia, new Date());
                                const esFuturo = esFechaFutura(dia);
                                const esDelMesActual = isSameMonth(dia, currentDate);

                                return (
                                    <div
                                        key={fechaStr}
                                        className={`p-2 text-center border rounded-lg 
                                            ${esDelMesActual ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                                            ${esHoy ? 'border-blue-500' : 'border-gray-200'}
                                            ${!esFuturo && esDelMesActual ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}`}
                                    >
                                        <div className="text-sm mb-1">{format(dia, 'd')}</div>
                                        {estado && esDelMesActual && (
                                            <div className="flex flex-col items-center">
                                                <div className={`text-xs px-1 py-0.5 rounded-full ${getEstadoClass(estado)} mb-1`}>
                                                    {estado.charAt(0)}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        eliminarAsistencia(dia);
                                                    }}
                                                    className="text-xs text-red-500 hover:text-red-700"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                        {!estado && !esFuturo && esDelMesActual && (
                                            <button
                                                onClick={() => irARegistroDiario(dia)}
                                                className="text-xs text-blue-500 hover:text-blue-700"
                                            >
                                                Registrar
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

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
                )}
            </div>
        </div>
    );
} 