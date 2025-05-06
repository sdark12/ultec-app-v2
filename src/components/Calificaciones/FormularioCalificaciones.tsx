// --- src/components/Calificaciones/FormularioCalificaciones.tsx ---
// ACTUALIZADO: Lógica real para ingresar/editar notas

import { useState, useEffect, useCallback } from 'react'; // Añadir useCallback
import { supabase } from '../../lib/supabaseClient';
import { Curso, Evaluacion } from '../../types';

// Estilos comunes
const selectClasses = "w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white";
const inputNotaClasses = "w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center";

export default function FormularioCalificaciones() {
    // Estados para selectores
    const [cursos, setCursos] = useState<Pick<Curso, 'id_curso' | 'nombre_curso'>[]>([]);
    const [evaluaciones, setEvaluaciones] = useState<Pick<Evaluacion, 'id_evaluacion' | 'nombre' | 'nota_maxima'>[]>([]);
    const [selectedCursoId, setSelectedCursoId] = useState<string>('');
    const [selectedEvalId, setSelectedEvalId] = useState<string>('');

    // Estados para filtros avanzados
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBimestre, setFilterBimestre] = useState<number | ''>('');
    const [filterNotaMin, setFilterNotaMin] = useState<string>('');
    const [filterNotaMax, setFilterNotaMax] = useState<string>('');
    const [sortBy, setSortBy] = useState<'nombre' | 'nota'>('nombre');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Estado para la lista de alumnos inscritos y sus calificaciones
    type AlumnoConCalificacion = {
        id_inscripcion: number;
        id_alumno: number;
        nombres: string;
        apellidos: string;
        id_calificacion: number | null;
        nota_obtenida: number | null;
        comentarios: string | null;
    };
    const [alumnosCalificar, setAlumnosCalificar] = useState<AlumnoConCalificacion[]>([]);

    // Estados de UI
    const [loadingCursos, setLoadingCursos] = useState(true);
    const [loadingEval, setLoadingEval] = useState(false);
    const [loadingAlumnos, setLoadingAlumnos] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Cargar cursos al montar
    useEffect(() => {
        async function fetchCursos() {
            setLoadingCursos(true);
            const { data, error } = await supabase.from('cursos').select('id_curso, nombre_curso').eq('activo', true).order('nombre_curso');
            if (error) console.error("Error cargando cursos", error); else setCursos(data || []);
            setLoadingCursos(false);
        } fetchCursos();
    }, []);

    // Cargar evaluaciones cuando cambia el curso
    useEffect(() => {
        if (!selectedCursoId) { setEvaluaciones([]); setSelectedEvalId(''); setAlumnosCalificar([]); return; }
        async function fetchEvaluaciones() {
            setLoadingEval(true); setErrorMsg(null); setAlumnosCalificar([]); setSelectedEvalId('');
            const { data, error } = await supabase.from('evaluaciones').select('id_evaluacion, nombre, nota_maxima').eq('id_curso', selectedCursoId).order('nombre');
            if (error) { console.error("Error cargando evaluaciones", error); setErrorMsg("Error al cargar evaluaciones."); }
            else { setEvaluaciones(data || []); }
            setLoadingEval(false);
        } fetchEvaluaciones();
    }, [selectedCursoId]);

    // Cargar alumnos inscritos y sus calificaciones existentes cuando cambia la evaluación
    const fetchAlumnosYCalificaciones = useCallback(async () => {
        if (!selectedEvalId) { setAlumnosCalificar([]); return; }
        setLoadingAlumnos(true); setErrorMsg(null);
        try {
            // 1. Obtener inscripciones activas del curso
            const { data: inscripcionesData, error: inscError } = await supabase
                .from('inscripciones')
                .select('id_inscripcion, alumnos(id_alumno, nombres, apellidos)')
                .eq('id_curso', selectedCursoId)
                .eq('estado', 'Activo'); // Solo alumnos activos
            if (inscError) throw inscError;
            if (!inscripcionesData || inscripcionesData.length === 0) {
                setAlumnosCalificar([]); setLoadingAlumnos(false); return;
            }

            // 2. Obtener calificaciones existentes para estas inscripciones y esta evaluación
            const inscripcionIds = inscripcionesData.map(i => i.id_inscripcion);
            const { data: calificacionesData, error: califError } = await supabase
                .from('calificaciones')
                .select('id_calificacion, id_inscripcion, nota_obtenida, comentarios')
                .in('id_inscripcion', inscripcionIds)
                .eq('id_evaluacion', selectedEvalId);
            if (califError) throw califError;

            // 3. Combinar datos: Para cada inscripción, buscar su calificación existente
            const alumnosConNotas = inscripcionesData.map(insc => {
                const calificacionExistente = calificacionesData?.find(cal => cal.id_inscripcion === insc.id_inscripcion);
                return {
                    id_inscripcion: insc.id_inscripcion,
                    id_alumno: (insc.alumnos as any)?.id_alumno, // Asumimos que alumnos no es null
                    nombres: (insc.alumnos as any)?.nombres || '',
                    apellidos: (insc.alumnos as any)?.apellidos || '',
                    id_calificacion: calificacionExistente?.id_calificacion || null,
                    nota_obtenida: calificacionExistente?.nota_obtenida ?? null, // Usar null si no existe
                    comentarios: calificacionExistente?.comentarios ?? null,
                };
            });
            setAlumnosCalificar(alumnosConNotas);

        } catch (error: any) {
            console.error("Error cargando alumnos/calificaciones:", error);
            setErrorMsg(`Error al cargar datos: ${error.message}`);
            setAlumnosCalificar([]);
        } finally {
            setLoadingAlumnos(false);
        }
    }, [selectedCursoId, selectedEvalId]); // Depende de ambos selectores

    // Ejecutar fetchAlumnosYCalificaciones cuando cambie la evaluación seleccionada
    useEffect(() => {
        fetchAlumnosYCalificaciones();
    }, [fetchAlumnosYCalificaciones]); // La dependencia es la función memoizada

    // Manejar cambio en un input de nota o comentario
    const handleNotaChange = (id_inscripcion: number, field: 'nota_obtenida' | 'comentarios', value: string) => {
        setAlumnosCalificar(prev =>
            prev.map(alumno => {
                if (alumno.id_inscripcion === id_inscripcion) {
                    if (field === 'nota_obtenida') {
                        // Convertir a número o null, validar contra nota máxima
                        const notaMax = evaluaciones.find(ev => ev.id_evaluacion === parseInt(selectedEvalId, 10))?.nota_maxima || 100;
                        let notaNum = value === '' ? null : parseFloat(value);
                        if (notaNum !== null && isNaN(notaNum)) notaNum = null; // Si no es número válido, poner null
                        if (notaNum !== null && notaNum < 0) notaNum = 0; // Mínimo 0
                        if (notaNum !== null && notaMax !== null && notaNum > notaMax) notaNum = notaMax; // Máximo notaMax

                        return { ...alumno, nota_obtenida: notaNum };
                    } else {
                        return { ...alumno, comentarios: value === '' ? null : value };
                    }
                }
                return alumno;
            })
        );
        // Limpiar mensajes al empezar a editar
        setErrorMsg(null);
        setSuccessMsg(null);
    };

    // Guardar todas las calificaciones ingresadas/modificadas
    const handleGuardarCalificaciones = async () => {
        if (!selectedEvalId) { setErrorMsg("Selecciona una evaluación primero."); return; }
        setSaving(true); setErrorMsg(null); setSuccessMsg(null);

        // Filtrar solo los alumnos con nota ingresada (o modificada si ya existía)
        const calificacionesAGuardar = alumnosCalificar
            .filter(a => a.nota_obtenida !== null) // Solo guardar si hay una nota
            .map(a => ({
                // id_calificacion: a.id_calificacion, // Upsert usa onConflict, no necesita el ID explícito
                id_inscripcion: a.id_inscripcion,
                id_evaluacion: parseInt(selectedEvalId, 10),
                nota_obtenida: a.nota_obtenida, // Ya es number | null, pero filtramos null arriba
                comentarios: a.comentarios,
                // fecha_calificacion se actualiza por defecto en la BD
            }));

        if (calificacionesAGuardar.length === 0) {
            setErrorMsg("No hay calificaciones válidas para guardar.");
            setSaving(false);
            return;
        }

        try {
            // Usar upsert para insertar nuevas o actualizar existentes
            // Requiere RLS INSERT/UPDATE en 'calificaciones'
            const { error } = await supabase
                .from('calificaciones')
                .upsert(calificacionesAGuardar, { onConflict: 'id_inscripcion, id_evaluacion' }); // Clave única

            if (error) throw error;

            setSuccessMsg(`¡${calificacionesAGuardar.length} calificaciones guardadas correctamente!`);
            // Opcional: Volver a cargar las calificaciones para reflejar IDs si se crearon nuevos
            // await fetchAlumnosYCalificaciones();

        } catch (error: any) {
            console.error("Error guardando calificaciones:", error);
            setErrorMsg(`Error al guardar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Obtener nota máxima de la evaluación seleccionada
    const notaMaximaActual = evaluaciones.find(ev => ev.id_evaluacion === parseInt(selectedEvalId, 10))?.nota_maxima ?? 100;

    // Función para filtrar y ordenar alumnos
    const getFilteredAndSortedAlumnos = () => {
        return alumnosCalificar
            .filter(alumno => {
                const nombreCompleto = `${alumno.nombres} ${alumno.apellidos}`.toLowerCase();
                const cumpleSearch = searchTerm === '' || nombreCompleto.includes(searchTerm.toLowerCase());
                
                const nota = alumno.nota_obtenida;
                const cumpleNotaMin = filterNotaMin === '' || (nota !== null && nota >= parseFloat(filterNotaMin));
                const cumpleNotaMax = filterNotaMax === '' || (nota !== null && nota <= parseFloat(filterNotaMax));
                
                return cumpleSearch && cumpleNotaMin && cumpleNotaMax;
            })
            .sort((a, b) => {
                if (sortBy === 'nombre') {
                    const nombreA = `${a.apellidos} ${a.nombres}`;
                    const nombreB = `${b.apellidos} ${b.nombres}`;
                    return sortOrder === 'asc' 
                        ? nombreA.localeCompare(nombreB)
                        : nombreB.localeCompare(nombreA);
                } else {
                    const notaA = a.nota_obtenida ?? -1;
                    const notaB = b.nota_obtenida ?? -1;
                    return sortOrder === 'asc' 
                        ? notaA - notaB
                        : notaB - notaA;
                }
            });
    };

    // Obtener alumnos paginados
    const getPaginatedAlumnos = () => {
        const filtered = getFilteredAndSortedAlumnos();
        const startIndex = (currentPage - 1) * itemsPerPage;
        return {
            alumnos: filtered.slice(startIndex, startIndex + itemsPerPage),
            totalAlumnos: filtered.length
        };
    };

    // Función para cambiar página
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Función para cambiar items por página
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset a la primera página
    };

    // Función para limpiar filtros
    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterBimestre('');
        setFilterNotaMin('');
        setFilterNotaMax('');
        setSortBy('nombre');
        setSortOrder('asc');
        setCurrentPage(1);
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ingresar/Editar Notas</h3>

            {/* Selectores principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select value={selectedCursoId} onChange={(e) => setSelectedCursoId(e.target.value)} className={selectClasses} disabled={loadingCursos}>
                    <option value="">-- Selecciona Curso --</option>
                    {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>)}
                </select>
                <select value={selectedEvalId} onChange={(e) => setSelectedEvalId(e.target.value)} className={selectClasses} disabled={!selectedCursoId || loadingEval}>
                    <option value="">-- Selecciona Evaluación --</option>
                    {evaluaciones.map(e => <option key={e.id_evaluacion} value={e.id_evaluacion}>{e.nombre}</option>)}
                </select>
            </div>

            {/* Filtros avanzados */}
            {selectedEvalId && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Búsqueda por nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Alumno</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nombre del alumno..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>

                        {/* Filtro por rango de notas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Notas</label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    value={filterNotaMin}
                                    onChange={(e) => setFilterNotaMin(e.target.value)}
                                    placeholder="Mín"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <input
                                    type="number"
                                    value={filterNotaMax}
                                    onChange={(e) => setFilterNotaMax(e.target.value)}
                                    placeholder="Máx"
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Ordenamiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                            <div className="flex space-x-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'nombre' | 'nota')}
                                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="nombre">Nombre</option>
                                    <option value="nota">Nota</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white hover:bg-gray-50"
                                >
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                </button>
                            </div>
                        </div>

                        {/* Botón limpiar filtros */}
                        <div className="flex items-end">
                            <button
                                onClick={handleClearFilters}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{successMsg}</div>}

            {/* Tabla de calificaciones */}
            {selectedEvalId && (
                loadingAlumnos ? (
                    <p className="text-center text-gray-500 py-4">Cargando alumnos...</p>
                ) : getPaginatedAlumnos().alumnos.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay alumnos que coincidan con los filtros.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nota (Máx: {notaMaximaActual?.toFixed(2)})</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentarios</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getPaginatedAlumnos().alumnos.map((alumno) => (
                                        <tr key={alumno.id_inscripcion}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {alumno.apellidos}, {alumno.nombres}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                                <input
                                                    type="number"
                                                    value={alumno.nota_obtenida ?? ''}
                                                    onChange={(e) => handleNotaChange(alumno.id_inscripcion, 'nota_obtenida', e.target.value)}
                                                    className={inputNotaClasses}
                                                    min="0"
                                                    max={notaMaximaActual ?? 100}
                                                    step="0.01"
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                <input
                                                    type="text"
                                                    value={alumno.comentarios ?? ''}
                                                    onChange={(e) => handleNotaChange(alumno.id_inscripcion, 'comentarios', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    placeholder="Opcional"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Mostrar</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className="px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-700">por página</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                                        currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                    }`}
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-gray-700">
                                    Página {currentPage} de {Math.ceil(getPaginatedAlumnos().totalAlumnos / itemsPerPage)}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= Math.ceil(getPaginatedAlumnos().totalAlumnos / itemsPerPage)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                                        currentPage >= Math.ceil(getPaginatedAlumnos().totalAlumnos / itemsPerPage)
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                    }`}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleGuardarCalificaciones}
                                disabled={saving || loadingAlumnos || alumnosCalificar.length === 0}
                                className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
