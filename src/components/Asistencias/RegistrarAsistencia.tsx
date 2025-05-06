// --- src/components/Asistencias/RegistrarAsistencia.tsx ---
// NUEVO ARCHIVO: Componente placeholder para la interfaz de registro de asistencia

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Curso } from '../../types'; // Importa los tipos necesarios
import { useSearchParams } from 'react-router-dom';

export default function RegistrarAsistencia() {
    const [searchParams] = useSearchParams();
    const fechaParam = searchParams.get('fecha');
    
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [alumnosInscritos, setAlumnosInscritos] = useState<any[]>([]); // Usar 'any' temporalmente
    const [selectedCursoId, setSelectedCursoId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(
        fechaParam || new Date().toISOString().split('T')[0]
    );
    const [asistencias, setAsistencias] = useState<{ [key: number]: string }>({}); // { id_inscripcion: estado }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Efecto para actualizar la fecha cuando cambia en la URL
    useEffect(() => {
        if (fechaParam) {
            setSelectedDate(fechaParam);
        }
    }, [fechaParam]);

    // Cargar cursos (para el selector)
    useEffect(() => {
        async function fetchCursos() {
            // Aquí podrías filtrar cursos asignados al profesor logueado si aplica
            const { data, error } = await supabase
                .from('cursos')
                .select('id_curso, nombre_curso')
                .eq('activo', true)
                .order('nombre_curso');

            if (error) console.error("Error cargando cursos", error);
            else setCursos(data || []);
        }
        fetchCursos();
    }, []);

    // Cargar alumnos inscritos cuando se selecciona un curso y fecha
    useEffect(() => {
        if (!selectedCursoId || !selectedDate) {
            setAlumnosInscritos([]);
            return;
        }

        async function fetchInscritosYAsistencia() {
            setLoading(true);
            setErrorMsg(null);
            setAsistencias({}); // Resetear asistencias al cambiar curso/fecha

            try {
                // 1. Obtener inscripciones activas para el curso
                const { data: inscripcionesData, error: inscripcionesError } = await supabase
                    .from('inscripciones')
                    .select(`
                        id_inscripcion,
                        alumnos ( id_alumno, nombres, apellidos )
                    `)
                    .eq('id_curso', selectedCursoId)
                    .eq('estado', 'Activo'); // Solo alumnos activos en el curso

                if (inscripcionesError) throw inscripcionesError;
                if (!inscripcionesData) { setAlumnosInscritos([]); return; }

                // 2. Obtener asistencia existente para esas inscripciones en la fecha seleccionada
                const inscripcionIds = inscripcionesData.map(i => i.id_inscripcion);
                const { data: asistenciaData, error: asistenciaError } = await supabase
                    .from('asistencias')
                    .select('id_inscripcion, estado')
                    .in('id_inscripcion', inscripcionIds)
                    .eq('fecha', selectedDate);

                if (asistenciaError) throw asistenciaError;

                // 3. Mapear la asistencia existente al estado
                const asistenciasExistentes: { [key: number]: string } = {};
                if (asistenciaData) {
                    asistenciaData.forEach(a => {
                        asistenciasExistentes[a.id_inscripcion] = a.estado;
                    });
                }
                setAsistencias(asistenciasExistentes);

                // 4. Establecer la lista de alumnos para mostrar
                setAlumnosInscritos(inscripcionesData);

            } catch (error: any) {
                console.error("Error cargando inscritos o asistencia:", error);
                setErrorMsg(`Error al cargar datos: ${error.message}`);
                setAlumnosInscritos([]);
            } finally {
                setLoading(false);
            }
        }

        fetchInscritosYAsistencia();

    }, [selectedCursoId, selectedDate]);

    // Manejar cambio de estado de asistencia para un alumno
    const handleAsistenciaChange = (id_inscripcion: number, estado: string) => {
        setAsistencias(prev => ({
            ...prev,
            [id_inscripcion]: estado
        }));
    };

    // Guardar/Actualizar todas las asistencias marcadas
    const handleGuardarAsistencias = async () => {
        setSaving(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const asistenciasAGuardar = Object.entries(asistencias)
            .map(([id_inscripcion, estado]) => ({
                id_inscripcion: parseInt(id_inscripcion, 10),
                fecha: selectedDate,
                estado: estado as 'Presente' | 'Ausente' | 'Justificado' | 'Tardanza', // Asegurar el tipo
                // notas: '', // Podrías añadir un campo para notas si es necesario
            }))
            // Filtrar solo las que tienen un estado válido seleccionado (opcional)
            .filter(a => ['Presente', 'Ausente', 'Justificado', 'Tardanza'].includes(a.estado));

        if (asistenciasAGuardar.length === 0) {
            setErrorMsg("No hay asistencias para guardar.");
            setSaving(false);
            return;
        }

        try {
            // Usar upsert para insertar nuevas o actualizar existentes basado en (id_inscripcion, fecha)
            // Requiere RLS INSERT/UPDATE en 'asistencias'
            const { error } = await supabase
                .from('asistencias')
                .upsert(asistenciasAGuardar, { onConflict: 'id_inscripcion, fecha' });

            if (error) throw error;

            setSuccessMsg("¡Asistencias guardadas correctamente!");

        } catch (error: any) {
            console.error("Error guardando asistencias:", error);
            setErrorMsg(`Error al guardar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Selector de Curso */}
                <div>
                    <label htmlFor="selectCurso" className="block text-sm font-medium text-gray-700 mb-1">Selecciona Curso:</label>
                    <select
                        id="selectCurso"
                        value={selectedCursoId}
                        onChange={(e) => setSelectedCursoId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                        disabled={cursos.length === 0}
                    >
                        <option value="">-- Elige un curso --</option>
                        {cursos.map(curso => (
                            <option key={curso.id_curso} value={curso.id_curso}>{curso.nombre_curso}</option>
                        ))}
                    </select>
                </div>
                {/* Selector de Fecha */}
                <div>
                    <label htmlFor="selectFecha" className="block text-sm font-medium text-gray-700 mb-1">Selecciona Fecha:</label>
                    <input
                        type="date"
                        id="selectFecha"
                        name="selectFecha"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{successMsg}</div>}


            {loading ? (
                <p className="text-center text-gray-500 py-4">Cargando alumnos inscritos...</p>
            ) : !selectedCursoId ? (
                <p className="text-center text-gray-500 py-4">Por favor, selecciona un curso.</p>
            ) : alumnosInscritos.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No hay alumnos inscritos activos en este curso.</p>
            ) : (
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-700">Alumnos Inscritos ({alumnosInscritos.length}):</h4>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Asistencia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {alumnosInscritos.map((inscripcion) => (
                                    <tr key={inscripcion.id_inscripcion}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {inscripcion.alumnos?.apellidos}, {inscripcion.alumnos?.nombres}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center space-x-2">
                                            {/* Botones de Radio para Estado */}
                                            {['Presente', 'Ausente', 'Justificado', 'Tardanza'].map(estado => (
                                                <label key={estado} className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                                                        name={`asistencia-${inscripcion.id_inscripcion}`}
                                                        value={estado}
                                                        // Marca el botón si el estado coincide o si es 'Presente' por defecto y no hay estado guardado
                                                        checked={asistencias[inscripcion.id_inscripcion] === estado || (!asistencias[inscripcion.id_inscripcion] && estado === 'Presente')}
                                                        onChange={() => handleAsistenciaChange(inscripcion.id_inscripcion, estado)}
                                                    />
                                                    <span className="ml-1 mr-3 text-xs">{estado}</span>
                                                </label>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleGuardarAsistencias}
                            disabled={saving || loading || alumnosInscritos.length === 0}
                            className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {saving ? 'Guardando...' : 'Guardar Asistencias'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
