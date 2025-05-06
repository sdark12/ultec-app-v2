// --- src/components/Inscripciones/ListaInscripciones.tsx ---
// CORREGIDO: Se elimina la referencia a 'horarios' en el select y en la tabla

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Inscripcion } from '../../types';
import { Link } from 'react-router-dom';

interface Filtros {
    busqueda: string;
    cicloEscolar: string;
    estado: string;
    estadoPago: string;
    modalidad: string;
}

export default function ListaInscripciones() {
    const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
    const [inscripcionesFiltradas, setInscripcionesFiltradas] = useState<Inscripcion[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    // Estado para filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        cicloEscolar: '',
        estado: '',
        estadoPago: '',
        modalidad: ''
    });

    // Estado para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const inscripcionesPorPagina = 10;
    const [ciclosEscolares, setCiclosEscolares] = useState<string[]>([]);
    const [modalidades, setModalidades] = useState<string[]>([]);

    const fetchInscripciones = async () => {
        setLoading(true); 
        setErrorMsg(null);
        const { data, error } = await supabase
            .from('inscripciones')
            .select(`
                id_inscripcion, 
                fecha_inscripcion_curso,
                ciclo_escolar,
                estado,
                estado_pago,
                alumnos ( id_alumno, nombres, apellidos ),
                cursos ( id_curso, nombre_curso, modalidad_horario ) 
            `)
            .order('fecha_inscripcion_curso', { ascending: false });

        if (error) {
            console.error('Error fetching inscripciones:', error);
            setErrorMsg(`Error al cargar inscripciones: ${error.message}. Verifica RLS.`);
            setInscripciones([]);
        } else if (data) {
            setInscripciones(data as any[]);
            // Extraer ciclos escolares y modalidades únicas
            const ciclos = [...new Set(data.map(insc => insc.ciclo_escolar).filter(Boolean))];
            const mods = [...new Set(data.map(insc => (insc as any).cursos?.modalidad_horario).filter(Boolean))];
            setCiclosEscolares(ciclos);
            setModalidades(mods);
        }
        setLoading(false);
    };

    useEffect(() => { fetchInscripciones(); }, []);

    // Efecto para aplicar filtros
    useEffect(() => {
        const aplicarFiltros = () => {
            let resultado = [...inscripciones];

            // Filtrar por búsqueda
            if (filtros.busqueda) {
                const busquedaLower = filtros.busqueda.toLowerCase();
                resultado = resultado.filter(insc => 
                    (insc as any).alumnos?.nombres.toLowerCase().includes(busquedaLower) ||
                    (insc as any).alumnos?.apellidos.toLowerCase().includes(busquedaLower) ||
                    (insc as any).cursos?.nombre_curso.toLowerCase().includes(busquedaLower)
                );
            }

            // Filtrar por ciclo escolar
            if (filtros.cicloEscolar) {
                resultado = resultado.filter(insc => 
                    insc.ciclo_escolar === filtros.cicloEscolar
                );
            }

            // Filtrar por estado
            if (filtros.estado) {
                resultado = resultado.filter(insc => 
                    insc.estado === filtros.estado
                );
            }

            // Filtrar por estado de pago
            if (filtros.estadoPago) {
                resultado = resultado.filter(insc => 
                    insc.estado_pago === filtros.estadoPago
                );
            }

            // Filtrar por modalidad
            if (filtros.modalidad) {
                resultado = resultado.filter(insc => 
                    (insc as any).cursos?.modalidad_horario === filtros.modalidad
                );
            }

            setInscripcionesFiltradas(resultado);
            setPaginaActual(1); // Resetear a primera página al filtrar
        };

        aplicarFiltros();
    }, [filtros, inscripciones]);

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
            cicloEscolar: '',
            estado: '',
            estadoPago: '',
            modalidad: ''
        });
    };

    const handleDelete = async (id: number | undefined) => {
        if (id === undefined) return;
        if (!window.confirm(`¿Eliminar esta inscripción?`)) return;

        setDeletingId(id); 
        setErrorMsg(null);
        try {
            const { error } = await supabase.from('inscripciones').delete().eq('id_inscripcion', id);
            if (error) throw error;
            setInscripciones(prev => prev.filter(i => i.id_inscripcion !== id));
            alert(`Inscripción eliminada.`);
        } catch (error: any) {
            console.error("Error eliminando inscripción:", error);
            setErrorMsg(`Error al eliminar: ${error.message}.`);
        } finally { 
            setDeletingId(null); 
        }
    };

    // Cálculos para paginación
    const totalPaginas = Math.ceil(inscripcionesFiltradas.length / inscripcionesPorPagina);
    const indiceInicial = (paginaActual - 1) * inscripcionesPorPagina;
    const inscripcionesPaginadas = inscripcionesFiltradas.slice(indiceInicial, indiceInicial + inscripcionesPorPagina);

    if (loading && inscripciones.length === 0) return <div className="p-6 text-center text-gray-500">Cargando inscripciones...</div>;
    if (errorMsg && inscripciones.length === 0) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Gestionar Inscripciones</h3>
                <Link to="/inscripciones/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                    + Nueva Inscripción
                </Link>
            </div>

            {/* Filtros */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
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
                        placeholder="Nombre alumno o curso"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="cicloEscolar" className="block text-sm font-medium text-gray-700 mb-1">
                        Ciclo Escolar
                    </label>
                    <select
                        name="cicloEscolar"
                        id="cicloEscolar"
                        value={filtros.cicloEscolar}
                        onChange={handleFiltroChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    >
                        <option value="">Todos los ciclos</option>
                        {ciclosEscolares.map(ciclo => (
                            <option key={ciclo} value={ciclo}>{ciclo}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                    </label>
                    <select
                        name="estado"
                        id="estado"
                        value={filtros.estado}
                        onChange={handleFiltroChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    >
                        <option value="">Todos</option>
                        <option value="Activo">Activo</option>
                        <option value="Completado">Completado</option>
                        <option value="Retirado">Retirado</option>
                        <option value="Pendiente">Pendiente</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="estadoPago" className="block text-sm font-medium text-gray-700 mb-1">
                        Estado Pago
                    </label>
                    <select
                        name="estadoPago"
                        id="estadoPago"
                        value={filtros.estadoPago}
                        onChange={handleFiltroChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    >
                        <option value="">Todos</option>
                        <option value="Pagado">Pagado</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Exonerado">Exonerado</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700 mb-1">
                        Modalidad
                    </label>
                    <select
                        name="modalidad"
                        id="modalidad"
                        value={filtros.modalidad}
                        onChange={handleFiltroChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                    >
                        <option value="">Todas</option>
                        {modalidades.map(modalidad => (
                            <option key={modalidad} value={modalidad}>{modalidad}</option>
                        ))}
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

            {inscripcionesFiltradas.length === 0 && !loading ? (
                <p className="text-center text-gray-500 py-4">No hay inscripciones que coincidan con los filtros.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciclo</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inscripcionesPaginadas.map((insc) => (
                                    <tr key={insc.id_inscripcion} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {(insc as any).alumnos?.nombres} {(insc as any).alumnos?.apellidos}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(insc as any).cursos?.nombre_curso}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(insc as any).cursos?.modalidad_horario || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{insc.ciclo_escolar}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${insc.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {insc.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${insc.estado_pago === 'Pagado' ? 'bg-green-100 text-green-800' : (insc.estado_pago === 'Pendiente' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800')}`}>
                                                {insc.estado_pago}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <Link to={`/inscripciones/editar/${insc.id_inscripcion}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">Editar</Link>
                                            <span className="text-gray-300">|</span>
                                            <button onClick={() => handleDelete(insc.id_inscripcion)} disabled={deletingId === insc.id_inscripcion} className={`text-red-600 hover:text-red-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed`}>
                                                {deletingId === insc.id_inscripcion ? 'Borrando...' : 'Eliminar'}
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
                                Mostrando {indiceInicial + 1} a {Math.min(indiceInicial + inscripcionesPorPagina, inscripcionesFiltradas.length)} de {inscripcionesFiltradas.length} inscripciones
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