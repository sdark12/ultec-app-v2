// --- src/components/Alumnos/ListaAlumnos.tsx --- 
// Actualizado con botones Editar y Eliminar y función handleDelete

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Alumno } from '../../types';
import { Link } from 'react-router-dom';

interface Filtros {
    busqueda: string;
    nivelEducativo: string;
    genero: string;
}

export default function ListaAlumnos() {
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    // Estado para filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        nivelEducativo: '',
        genero: ''
    });

    // Estado para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const alumnosPorPagina = 10;
    const [nivelesEducativos, setNivelesEducativos] = useState<string[]>([]);

    // Función para recargar la lista de alumnos
    const fetchAlumnos = async () => {
        setLoading(true);
        setErrorMsg(null);
        const { data, error } = await supabase
            .from('alumnos')
            .select('*')
            .order('apellidos', { ascending: true });

        if (error) {
            console.error('Error fetching alumnos:', error);
            setErrorMsg(`Error al cargar alumnos: ${error.message}. Verifica los permisos RLS.`);
            setAlumnos([]);
        } else if (data) {
            setAlumnos(data as Alumno[]);
            // Extraer niveles educativos únicos
            const niveles = [...new Set(data.map(alumno => alumno.nivel_educativo).filter(Boolean))];
            setNivelesEducativos(niveles);
        }
        setLoading(false);
    };

    // Cargar alumnos al montar el componente
    useEffect(() => {
        fetchAlumnos();
    }, []);

    // Efecto para aplicar filtros
    useEffect(() => {
        const aplicarFiltros = () => {
            let resultado = [...alumnos];

            // Filtrar por búsqueda
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

            // Filtrar por género
            if (filtros.genero) {
                resultado = resultado.filter(alumno => 
                    alumno.genero === filtros.genero
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
            genero: ''
        });
    };

    // Función para manejar la eliminación
    const handleDelete = async (id: number | undefined, nombre: string) => {
        if (id === undefined) return;

        if (!window.confirm(`¿Estás seguro de que quieres eliminar al alumno "${nombre}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        setDeletingId(id);
        setErrorMsg(null);

        try {
            const { error } = await supabase
                .from('alumnos')
                .delete()
                .eq('id_alumno', id);

            if (error) throw error;

            setAlumnos(prevAlumnos => prevAlumnos.filter(a => a.id_alumno !== id));
            alert(`Alumno "${nombre}" eliminado correctamente.`);

        } catch (error: any) {
            console.error("Error eliminando alumno:", error);
            setErrorMsg(`Error al eliminar: ${error.message}. Verifica tus permisos.`);
        } finally {
            setDeletingId(null);
        }
    };

    // Cálculos para paginación
    const totalPaginas = Math.ceil(alumnosFiltrados.length / alumnosPorPagina);
    const indiceInicial = (paginaActual - 1) * alumnosPorPagina;
    const alumnosPaginados = alumnosFiltrados.slice(indiceInicial, indiceInicial + alumnosPorPagina);

    if (loading && alumnos.length === 0) {
        return <div className="p-6 text-center text-gray-500">Cargando lista de alumnos...</div>;
    }
    if (errorMsg && alumnos.length === 0) {
        return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Lista de Alumnos</h3>
                <Link
                    to="/alumnos/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-150 ease-in-out"
                >
                    + Añadir Alumno
                </Link>
            </div>

            {/* Filtros */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div>
                    <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-1">
                        Género
                    </label>
                    <select
                        name="genero"
                        id="genero"
                        value={filtros.genero}
                        onChange={handleFiltroChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    >
                        <option value="">Todos</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={limpiarFiltros}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}

            {alumnosFiltrados.length === 0 && !loading ? (
                <p className="text-center text-gray-500 py-4">No hay alumnos que coincidan con los filtros.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Academia</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombres</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel Educativo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Género</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {alumnosPaginados.map((alumno) => (
                                    <tr key={alumno.id_alumno} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alumno.codigo_personal_academia}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alumno.nombres}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alumno.apellidos}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alumno.nivel_educativo || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alumno.genero}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <Link
                                                to={`/alumnos/editar/${alumno.id_alumno}`}
                                                className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                                title="Editar Alumno"
                                            >
                                                Editar
                                            </Link>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => handleDelete(alumno.id_alumno, `${alumno.nombres} ${alumno.apellidos}`)}
                                                disabled={deletingId === alumno.id_alumno}
                                                className={`text-red-600 hover:text-red-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed`}
                                                title="Eliminar Alumno"
                                            >
                                                {deletingId === alumno.id_alumno ? 'Borrando...' : 'Eliminar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                        <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-gray-700">
                                Mostrando {indiceInicial + 1} a {Math.min(indiceInicial + alumnosPorPagina, alumnosFiltrados.length)} de {alumnosFiltrados.length} alumnos
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                    disabled={paginaActual === 1}
                                    className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Anterior
                                </button>
                                <span className="px-3 py-1">
                                    Página {paginaActual} de {totalPaginas}
                                </span>
                                <button
                                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                    disabled={paginaActual === totalPaginas}
                                    className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
