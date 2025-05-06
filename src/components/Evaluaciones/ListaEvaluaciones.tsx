// --- src/components/Evaluaciones/ListaEvaluaciones.tsx ---
// CORREGIDO: Código completo y correcto

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Necesario para llamadas a BD
import { Evaluacion } from '../../types'; // Necesario para tipar el estado
import { Link, useOutletContext } from 'react-router-dom'; // Necesario para enlaces

// Define el tipo del contexto que viene de CursosRoutes -> GestionCursoLayout
interface CursoContextType {
    cursoId: number;
    // nombreCurso: string; // No se usa aquí, pero el contexto lo provee
}

export default function ListaEvaluaciones() {
    // Obtiene el cursoId del contexto del Outlet
    const { cursoId } = useOutletContext<CursoContextType>();

    // Estados del componente
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]); // Guarda la lista de evaluaciones
    const [loading, setLoading] = useState(true); // Indica si está cargando
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // Guarda mensajes de error
    const [deletingId, setDeletingId] = useState<number | null>(null); // Indica qué evaluación se está borrando

    // Función para obtener las evaluaciones del curso actual
    const fetchEvaluaciones = async () => {
        if (!cursoId) return; // No hacer nada si no hay cursoId (seguridad extra)
        setLoading(true); // Iniciar carga
        setErrorMsg(null); // Limpiar errores

        // Consulta a Supabase para obtener evaluaciones del cursoId
        const { data, error } = await supabase
            .from('evaluaciones')
            .select('*') // Selecciona todas las columnas
            .eq('id_curso', cursoId) // Filtra por el ID del curso actual
            .order('fecha', { ascending: true, nullsFirst: false }); // Ordena por fecha

        // Manejo del resultado
        if (error) {
            console.error('Error fetching evaluaciones:', error);
            setErrorMsg(`Error al cargar evaluaciones: ${error.message}.`);
            setEvaluaciones([]); // Limpia en caso de error
        } else if (data) {
            setEvaluaciones(data as Evaluacion[]); // Guarda los datos en el estado
            console.log(`Evaluaciones obtenidas para curso ${cursoId}:`, data);
        }
        setLoading(false); // Finaliza la carga
    };

    // useEffect para llamar a fetchEvaluaciones cuando el componente se monta o cambia cursoId
    useEffect(() => {
        fetchEvaluaciones();
    }, [cursoId]);

    // Función para manejar la eliminación de una evaluación
    const handleDelete = async (id: number | undefined, nombre: string) => {
        if (id === undefined) return; // Seguridad

        // Confirmación
        if (!window.confirm(`¿Eliminar la evaluación "${nombre}"? Esto borrará las calificaciones asociadas.`)) return;

        setDeletingId(id); // Mostrar estado de borrado
        setErrorMsg(null); // Limpiar errores
        try {
            // Llamada a Supabase para borrar (Requiere RLS DELETE)
            const { error } = await supabase.from('evaluaciones').delete().eq('id_evaluacion', id);
            if (error) throw error; // Lanzar error si falla

            // Actualizar estado local
            setEvaluaciones(prev => prev.filter(e => e.id_evaluacion !== id));
            alert(`Evaluación "${nombre}" eliminada.`);
        } catch (error: any) {
            console.error("Error eliminando evaluación:", error);
            setErrorMsg(`Error al eliminar: ${error.message}.`); // Mostrar error
        } finally {
            setDeletingId(null); // Quitar estado de borrado
        }
    };

    // Helper para formatear ponderación como porcentaje
    const formatPonderacion = (ponderacion: number | null | undefined) => {
        if (ponderacion === null || ponderacion === undefined) return 'N/A';
        // Multiplica por 100 y formatea a 0 decimales
        return `${(ponderacion * 100).toFixed(0)}%`;
    }

    // Renderizado condicional de carga
    if (loading) return <div className="p-4 text-center text-gray-500">Cargando evaluaciones...</div>;
    // Renderizado de error si no se cargaron datos
    if (errorMsg && evaluaciones.length === 0) return <div className="m-4 p-4 bg-red-100 text-red-700 rounded-md">{errorMsg}</div>;

    // Renderizado principal
    return (
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Evaluaciones Definidas</h3>
                {/* Enlace para crear nueva evaluación */}
                <Link
                    to={`/cursos/${cursoId}/gestion/evaluaciones/nueva`}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                >
                    + Nueva Evaluación
                </Link>
            </div>
            {/* Muestra errores (ej. de borrado) */}
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{errorMsg}</div>}

            {/* Mensaje si no hay evaluaciones */}
            {evaluaciones.length === 0 && !loading ? (
                <p className="text-center text-gray-500 py-4">No hay evaluaciones definidas para este curso.</p>
            ) : (
                // Tabla de evaluaciones
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Máx.</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ponderación</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {evaluaciones.map((ev) => (
                                <tr key={ev.id_evaluacion} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{ev.nombre}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate" title={ev.descripcion || ''}>{ev.descripcion || '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{ev.nota_maxima?.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{formatPonderacion(ev.ponderacion)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{ev.fecha || '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        {/* Enlace para editar */}
                                        <Link to={`/cursos/${cursoId}/gestion/evaluaciones/editar/${ev.id_evaluacion}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">Editar</Link>
                                        <span className="text-gray-300">|</span>
                                        {/* Botón para eliminar */}
                                        <button onClick={() => handleDelete(ev.id_evaluacion, ev.nombre)} disabled={deletingId === ev.id_evaluacion} className={`text-red-600 hover:text-red-900 hover:underline disabled:opacity-50`}>
                                            {deletingId === ev.id_evaluacion ? '...' : 'Eliminar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
