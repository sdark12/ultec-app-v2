import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Alumno, Encargado } from '../../types';
import { Link } from 'react-router-dom';

interface AlumnosEncargadoProps {
    encargado: Encargado;
}

interface Filtros {
    busqueda: string;
    nivelEducativo: string;
}

export default function AlumnosEncargado({ encargado }: AlumnosEncargadoProps) {
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        nivelEducativo: '',
    });
    
    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const alumnosPorPagina = 5;
    const [nivelesEducativos, setNivelesEducativos] = useState<string[]>([]);

    useEffect(() => {
        const cargarAlumnos = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('alumnos')
                    .select(`
                        *,
                        encargado:encargados (
                            nombres,
                            apellidos,
                            relacion_parentesco
                        )
                    `)
                    .eq('id_encargado', encargado.id_encargado)
                    .order('apellidos', { ascending: true });

                if (error) throw error;
                setAlumnos(data || []);
                
                // Extraer niveles educativos únicos
                const niveles = [...new Set(data?.map(alumno => alumno.nivel_educativo).filter(Boolean))];
                setNivelesEducativos(niveles);
            } catch (error: any) {
                console.error('Error cargando alumnos:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (encargado.id_encargado) {
            cargarAlumnos();
        }
    }, [encargado.id_encargado]);

    // Efecto para aplicar filtros
    useEffect(() => {
        const aplicarFiltros = () => {
            let resultado = [...alumnos];

            // Filtrar por búsqueda en nombres, apellidos o código
            if (filtros.busqueda) {
                const busquedaLower = filtros.busqueda.toLowerCase();
                resultado = resultado.filter(alumno => 
                    alumno.nombres.toLowerCase().includes(busquedaLower) ||
                    alumno.apellidos.toLowerCase().includes(busquedaLower) ||
                    alumno.codigo_personal_academia.toLowerCase().includes(busquedaLower)
                );
            }

            // Filtrar por nivel educativo
            if (filtros.nivelEducativo) {
                resultado = resultado.filter(alumno => 
                    alumno.nivel_educativo === filtros.nivelEducativo
                );
            }

            setAlumnosFiltrados(resultado);
            setPaginaActual(1); // Resetear a primera página al filtrar
        };

        aplicarFiltros();
    }, [filtros, alumnos]);

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '',
            nivelEducativo: '',
        });
    };

    // Cálculos para paginación
    const totalPaginas = Math.ceil(alumnosFiltrados.length / alumnosPorPagina);
    const indiceInicial = (paginaActual - 1) * alumnosPorPagina;
    const alumnosPaginados = alumnosFiltrados.slice(indiceInicial, indiceInicial + alumnosPorPagina);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
                Error: {error}
            </div>
        );
    }

    if (alumnos.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                No hay alumnos asociados a este encargado.
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Alumnos a cargo ({alumnosFiltrados.length})
                </h3>
                
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar
                        </label>
                        <input
                            type="text"
                            name="busqueda"
                            id="busqueda"
                            value={filtros.busqueda}
                            onChange={handleFiltroChange}
                            placeholder="Nombre, apellido o código"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="nivelEducativo" className="block text-sm font-medium text-gray-700 mb-1">
                            Nivel Educativo
                        </label>
                        <select
                            name="nivelEducativo"
                            id="nivelEducativo"
                            value={filtros.nivelEducativo}
                            onChange={handleFiltroChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                        >
                            <option value="">Todos los niveles</option>
                            {nivelesEducativos.map(nivel => (
                                <option key={nivel} value={nivel}>{nivel}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={limpiarFiltros}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* Lista de Alumnos */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {alumnosPaginados.map((alumno) => (
                            <li key={alumno.id_alumno}>
                                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-indigo-600 truncate">
                                                {alumno.nombres} {alumno.apellidos}
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {alumno.nivel_educativo || 'Nivel no especificado'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Código: {alumno.codigo_personal_academia}
                                                </p>
                                                {alumno.telefono && (
                                                    <p className="mt-1 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                        Tel: {alumno.telefono}
                                                    </p>
                                                )}
                                            </div>
                                            <Link
                                                to={`/alumnos/editar/${alumno.id_alumno}`}
                                                className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                            >
                                                Ver detalles
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                    <div className="flex justify-between items-center mt-4 px-4">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                disabled={paginaActual === 1}
                                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                disabled={paginaActual === totalPaginas}
                                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Siguiente
                            </button>
                        </div>
                        <span className="text-sm text-gray-600">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
} 