import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Curso {
    id_curso: number;
    nombre_curso: string;
}

interface Alumno {
    id_alumno: number;
    nombres: string;
    apellidos: string;
}

interface PagoMensual {
    id_pago: number;
    mes_correspondiente: string;
    fecha_pago: string;
    monto: number;
    numero_recibo: string | null;
}

interface EstadoPagosMensuales {
    alumno: Alumno;
    pagos: {
        [mes: string]: PagoMensual | null;
    };
}

export default function ReportePagosAlumnos() {
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(null);
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<number | null>(null);
    const [estadoPagos, setEstadoPagos] = useState<EstadoPagosMensuales | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    // Cargar cursos
    useEffect(() => {
        const fetchCursos = async () => {
            try {
                const { data, error } = await supabase
                    .from('cursos')
                    .select('id_curso, nombre_curso')
                    .order('nombre_curso');

                if (error) throw error;
                setCursos(data || []);
            } catch (error: any) {
                console.error('Error al cargar cursos:', error);
                setError('Error al cargar los cursos');
            }
        };

        fetchCursos();
    }, []);

    // Cargar alumnos cuando se selecciona un curso
    useEffect(() => {
        const fetchAlumnos = async () => {
            if (!cursoSeleccionado) {
                setAlumnos([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('inscripciones')
                    .select(`
                        alumnos (
                            id_alumno,
                            nombres,
                            apellidos
                        )
                    `)
                    .eq('id_curso', cursoSeleccionado)
                    .eq('estado', 'Activo');

                if (error) throw error;

                const alumnosUnicos = data
                    ?.map(d => d.alumnos)
                    .filter((alumno): alumno is Alumno => alumno !== null)
                    .sort((a, b) => a.apellidos.localeCompare(b.apellidos));

                setAlumnos(alumnosUnicos || []);
            } catch (error: any) {
                console.error('Error al cargar alumnos:', error);
                setError('Error al cargar los alumnos del curso');
            } finally {
                setLoading(false);
            }
        };

        fetchAlumnos();
    }, [cursoSeleccionado]);

    // Cargar pagos cuando se selecciona un alumno
    useEffect(() => {
        const fetchPagos = async () => {
            if (!alumnoSeleccionado) {
                setEstadoPagos(null);
                return;
            }

            setLoading(true);
            try {
                const { data: alumnoData } = await supabase
                    .from('alumnos')
                    .select('id_alumno, nombres, apellidos')
                    .eq('id_alumno', alumnoSeleccionado)
                    .single();

                const { data: pagosData, error } = await supabase
                    .from('pagos')
                    .select('id_pago, mes_correspondiente, fecha_pago, monto, numero_recibo')
                    .eq('id_alumno', alumnoSeleccionado)
                    .eq('concepto', 'Mensualidad')
                    .order('fecha_pago');

                if (error) throw error;

                // Organizar pagos por mes
                const pagosPorMes: { [mes: string]: PagoMensual | null } = {};
                meses.forEach(mes => {
                    const pago = pagosData?.find(p => 
                        p.mes_correspondiente?.toLowerCase().includes(mes.toLowerCase())
                    );
                    pagosPorMes[mes] = pago || null;
                });

                setEstadoPagos({
                    alumno: alumnoData,
                    pagos: pagosPorMes
                });
            } catch (error: any) {
                console.error('Error al cargar pagos:', error);
                setError('Error al cargar el historial de pagos');
            } finally {
                setLoading(false);
            }
        };

        fetchPagos();
    }, [alumnoSeleccionado]);

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-GT');
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Reporte de Pagos Mensuales</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Selector de Curso */}
                <div>
                    <label htmlFor="curso" className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Curso
                    </label>
                    <select
                        id="curso"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={cursoSeleccionado || ''}
                        onChange={(e) => {
                            setCursoSeleccionado(e.target.value ? parseInt(e.target.value) : null);
                            setAlumnoSeleccionado(null);
                        }}
                    >
                        <option value="">-- Seleccionar Curso --</option>
                        {cursos.map(curso => (
                            <option key={curso.id_curso} value={curso.id_curso}>
                                {curso.nombre_curso}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selector de Alumno */}
                <div>
                    <label htmlFor="alumno" className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Alumno
                    </label>
                    <select
                        id="alumno"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={alumnoSeleccionado || ''}
                        onChange={(e) => setAlumnoSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
                        disabled={!cursoSeleccionado || loading}
                    >
                        <option value="">-- Seleccionar Alumno --</option>
                        {alumnos.map(alumno => (
                            <option key={alumno.id_alumno} value={alumno.id_alumno}>
                                {alumno.apellidos}, {alumno.nombres}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabla de Pagos */}
            {loading ? (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Cargando datos...</p>
                </div>
            ) : estadoPagos ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha de Pago
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Monto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    No. Recibo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {meses.map((mes) => {
                                const pago = estadoPagos.pagos[mes];
                                return (
                                    <tr key={mes} className={pago ? 'bg-green-50' : 'bg-red-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                            {mes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {pago ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {pago ? formatearFecha(pago.fecha_pago) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {pago ? `Q${pago.monto.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {pago?.numero_recibo || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 py-4">
                    Selecciona un curso y un alumno para ver su historial de pagos
                </p>
            )}
        </div>
    );
} 