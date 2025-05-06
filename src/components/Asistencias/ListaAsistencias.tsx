// --- src/components/Asistencias/ListaAsistencias.tsx ---
// NUEVO ARCHIVO: Componente para listar historial de asistencias (con filtros básicos)

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import CalendarioAsistencias from './CalendarioAsistencias';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Curso {
    id_curso: number;
    nombre_curso: string;
}

interface AsistenciaDB {
    id_asistencia: number;
    fecha: string;
    estado: string;
    notas?: string;
    inscripciones: {
        id_inscripcion: number;
        alumnos: {
            id_alumno: number;
            nombres: string;
            apellidos: string;
        };
        cursos: {
            id_curso: number;
            nombre_curso: string;
        };
    };
}

interface Asistencia {
    id_asistencia: number;
    fecha: string;
    estado: string;
    notas?: string;
    inscripciones: {
        id_inscripcion: number;
        alumnos: {
            id_alumno: number;
            nombres: string;
            apellidos: string;
        };
        cursos: {
            id_curso: number;
            nombre_curso: string;
        };
    };
}

// Definir tipos para los parámetros de handlePrint
interface AlumnoRecibo {
    nombres: string;
    apellidos: string;
    codigo: string;
    direccion: string;
    horario: string;
    encargado: string;
    telefono: string;
    curso: string;
}

interface DatosPagoRecibo {
    cantidad: string;
    descripcion: string;
    precio: string;
    total: string;
    nota: string;
    fecha: string;
    orden: string;
    fechaInscripcion: string;
    mesesPagados: string[];
}

export default function ListaAsistencias() {
    const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Estados para filtros de fecha
    const [tipoFiltroFecha, setTipoFiltroFecha] = useState<'dia' | 'rango'>('dia');
    const [filtroFecha, setFiltroFecha] = useState<string>(new Date().toISOString().split('T')[0]);
    const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0]);

    // Estados para filtros avanzados
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCurso, setFiltroCurso] = useState<string>('');
    const [filtroEstado, setFiltroEstado] = useState<string>('');
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [sortBy, setSortBy] = useState<'nombre' | 'curso' | 'estado'>('nombre');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [showCalendario, setShowCalendario] = useState(false);
    const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | null>(null);
    const [selectedAsistencias, setSelectedAsistencias] = useState<number[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Cargar cursos al montar el componente
    useEffect(() => {
        async function fetchCursos() {
            try {
                const { data, error } = await supabase
                    .from('cursos')
                    .select('id_curso, nombre_curso')
                    .order('nombre_curso');
                
                if (error) {
                    throw error;
                }
                setCursos(data || []);
            } catch (error: any) {
                console.error('Error al cargar cursos:', error);
                setErrorMsg(`Error al cargar cursos: ${error.message}`);
            }
        }
        fetchCursos();
    }, []);

    const fetchAsistencias = async () => {
        setLoading(true);
        setErrorMsg(null);

        try {
            let query = supabase
                .from('asistencias')
                .select(`
                    id_asistencia,
                    fecha,
                    estado,
                    notas,
                    inscripciones:id_inscripcion (
                        id_inscripcion,
                        alumnos:id_alumno (
                            id_alumno,
                            nombres,
                            apellidos
                        ),
                        cursos:id_curso (
                            id_curso,
                            nombre_curso
                        )
                    )
                `)
                .order('fecha', { ascending: false });

            // Aplicar filtro de fecha según el tipo seleccionado
            if (tipoFiltroFecha === 'dia') {
                query = query.eq('fecha', filtroFecha);
            } else {
                query = query
                    .gte('fecha', fechaInicio)
                    .lte('fecha', fechaFin);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            if (!data) {
                setAsistencias([]);
                return;
            }

            // Transformar los datos para que coincidan con la interfaz Asistencia
            const transformedData = (data as unknown as AsistenciaDB[])
                .filter(item => item.inscripciones) // Filtrar elementos sin inscripciones
                .map(item => ({
                    id_asistencia: item.id_asistencia,
                    fecha: item.fecha,
                    estado: item.estado,
                    notas: item.notas,
                    inscripciones: {
                        id_inscripcion: item.inscripciones.id_inscripcion,
                        alumnos: {
                            id_alumno: item.inscripciones.alumnos.id_alumno,
                            nombres: item.inscripciones.alumnos.nombres,
                            apellidos: item.inscripciones.alumnos.apellidos
                        },
                        cursos: {
                            id_curso: item.inscripciones.cursos.id_curso,
                            nombre_curso: item.inscripciones.cursos.nombre_curso
                        }
                    }
                }));

            setAsistencias(transformedData);
        } catch (error: any) {
            console.error('Error fetching asistencias:', error);
            setErrorMsg(`Error al cargar asistencias: ${error.message}`);
            setAsistencias([]);
        } finally {
            setLoading(false);
        }
    };

    // Actualizar asistencias cuando cambien los filtros de fecha
    useEffect(() => {
        fetchAsistencias();
    }, [tipoFiltroFecha, filtroFecha, fechaInicio, fechaFin]);

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFiltroFecha(event.target.value);
        setCurrentPage(1);
    };

    const handleFechaInicioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nuevaFechaInicio = event.target.value;
        setFechaInicio(nuevaFechaInicio);
        // Si la fecha de fin es anterior a la nueva fecha de inicio, actualizarla
        if (fechaFin < nuevaFechaInicio) {
            setFechaFin(nuevaFechaInicio);
        }
        setCurrentPage(1);
    };

    const handleFechaFinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFechaFin(event.target.value);
        setCurrentPage(1);
    };

    // Función para filtrar y ordenar asistencias
    const getFilteredAndSortedAsistencias = () => {
        return asistencias
            .filter(asistencia => {
                const alumno = asistencia.inscripciones.alumnos;
                const curso = asistencia.inscripciones.cursos;
                const nombreCompleto = `${alumno.apellidos} ${alumno.nombres}`.toLowerCase();
                
                const cumpleSearch = searchTerm === '' || 
                    nombreCompleto.includes(searchTerm.toLowerCase()) ||
                    curso.nombre_curso.toLowerCase().includes(searchTerm.toLowerCase());
                
                const cumpleCurso = filtroCurso === '' || curso.id_curso.toString() === filtroCurso;
                const cumpleEstado = filtroEstado === '' || asistencia.estado === filtroEstado;
                
                return cumpleSearch && cumpleCurso && cumpleEstado;
            })
            .sort((a, b) => {
                const alumnoA = a.inscripciones.alumnos;
                const alumnoB = b.inscripciones.alumnos;
                const cursoA = a.inscripciones.cursos;
                const cursoB = b.inscripciones.cursos;

                if (sortBy === 'nombre') {
                    const nombreA = `${alumnoA.apellidos} ${alumnoA.nombres}`;
                    const nombreB = `${alumnoB.apellidos} ${alumnoB.nombres}`;
                    return sortOrder === 'asc' 
                        ? nombreA.localeCompare(nombreB)
                        : nombreB.localeCompare(nombreA);
                } else if (sortBy === 'curso') {
                    const cursoNameA = cursoA.nombre_curso;
                    const cursoNameB = cursoB.nombre_curso;
                    return sortOrder === 'asc'
                        ? cursoNameA.localeCompare(cursoNameB)
                        : cursoNameB.localeCompare(cursoNameA);
                } else {
                    return sortOrder === 'asc'
                        ? a.estado.localeCompare(b.estado)
                        : b.estado.localeCompare(a.estado);
                }
            });
    };

    // Obtener asistencias paginadas
    const getPaginatedAsistencias = () => {
        const filtered = getFilteredAndSortedAsistencias();
        const startIndex = (currentPage - 1) * itemsPerPage;
        return {
            asistencias: filtered.slice(startIndex, startIndex + itemsPerPage),
            totalAsistencias: filtered.length
        };
    };

    // Función para cambiar página
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Función para cambiar items por página
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Función para limpiar filtros
    const handleClearFilters = () => {
        setSearchTerm('');
        setFiltroCurso('');
        setFiltroEstado('');
        setSortBy('nombre');
        setSortOrder('asc');
        setCurrentPage(1);
    };

    // Helper para clases de estado
    const getEstadoClass = (estado: string) => {
        switch (estado) {
            case 'Presente': return 'bg-green-100 text-green-800';
            case 'Ausente': return 'bg-red-100 text-red-800';
            case 'Justificado': return 'bg-blue-100 text-blue-800';
            case 'Tardanza': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const handleVerCalendario = (idAlumno: number) => {
        setSelectedAlumnoId(idAlumno);
        setShowCalendario(true);
    };

    const eliminarAsistencias = async (ids: number[]) => {
        try {
            setIsDeleting(true);
            setErrorMsg(null);

            const { error } = await supabase
                .from('asistencias')
                .delete()
                .in('id_asistencia', ids);

            if (error) {
                throw error;
            }

            // Actualizar la lista de asistencias
            setAsistencias(prev => prev.filter(a => !ids.includes(a.id_asistencia)));
            setSelectedAsistencias([]);

        } catch (error: any) {
            console.error('Error al eliminar asistencias:', error);
            setErrorMsg(`Error al eliminar asistencias: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedAsistencias.length === asistencias.length) {
            setSelectedAsistencias([]);
        } else {
            setSelectedAsistencias(asistencias.map(a => a.id_asistencia).filter((id): id is number => id !== undefined));
        }
    };

    const handleSelectAsistencia = (id: number) => {
        setSelectedAsistencias(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handlePrint = async (alumno: AlumnoRecibo, datosPago: DatosPagoRecibo) => {
        const response = await fetch('/src/components/Pagos/ReciboTemplate.html');
        let template = await response.text();

        // Reemplaza los campos dinámicos
        template = template
            .replace(/<!-- NOMBRE ALUMNO -->/g, `${alumno.nombres} ${alumno.apellidos}`)
            .replace('<!-- CODIGO ALUMNO -->', alumno.codigo)
            .replace('<!-- DIRECCION -->', alumno.direccion)
            .replace('<!-- HORARIO -->', alumno.horario)
            .replace('<!-- NOMBRE ENCARGADO -->', alumno.encargado)
            .replace('<!-- TELEFONO -->', alumno.telefono)
            .replace('<!-- CURSO -->', alumno.curso)
            .replace('<!-- CANTIDAD -->', datosPago.cantidad)
            .replace('<!-- DESCRIPCION DEL PRODUCTO -->', datosPago.descripcion)
            .replace('<!-- PRECIO -->', datosPago.precio)
            .replace(/<!-- TOTAL -->/g, datosPago.total)
            .replace('<!-- NOTA O MENSAJE IMPORTANTE -->', datosPago.nota)
            .replace('<!-- FECHA ACTUAL -->', datosPago.fecha)
            .replace('<!-- ORDEN -->', datosPago.orden)
            .replace('<!-- FECHA INSCRIPCION -->', datosPago.fechaInscripcion)
            .replace('<!-- FECHA Y HORA IMPRESION -->', new Date().toLocaleString());

        // Meses cancelados
        const mesesHTML = (datosPago.mesesPagados || []).map((mes: string) => `<li>${mes}</li>`).join('');
        template = template.replace('<!-- <li>Mes 1</li> -->', mesesHTML);

        // Abrir e imprimir de forma segura
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(template);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        } else {
            alert('No se pudo abrir la ventana de impresión. Por favor, revisa el bloqueo de ventanas emergentes.');
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-semibold text-gray-800">Historial de Asistencias</h3>
                <div className="flex items-center space-x-4">
                    <Link to="/asistencias/registrar" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                        + Registrar Asistencia (Diaria)
                    </Link>
                    <Link to="/asistencias/registrar-mensual" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                        + Registro Mensual
                    </Link>
                </div>
            </div>

            {/* Filtros de fecha */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Selector de tipo de filtro */}
                    <div className="lg:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de filtro:</label>
                        <div className="flex gap-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio h-4 w-4 text-indigo-600"
                                    checked={tipoFiltroFecha === 'dia'}
                                    onChange={() => setTipoFiltroFecha('dia')}
                                />
                                <span className="ml-2">Día específico</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio h-4 w-4 text-indigo-600"
                                    checked={tipoFiltroFecha === 'rango'}
                                    onChange={() => setTipoFiltroFecha('rango')}
                                />
                                <span className="ml-2">Rango de fechas</span>
                            </label>
                        </div>
                    </div>

                    {tipoFiltroFecha === 'dia' ? (
                        <div>
                            <label htmlFor="filtroFecha" className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
                            <input
                                type="date"
                                id="filtroFecha"
                                name="filtroFecha"
                                value={filtroFecha}
                                onChange={handleDateChange}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio:</label>
                                <input
                                    type="date"
                                    id="fechaInicio"
                                    name="fechaInicio"
                                    value={fechaInicio}
                                    onChange={handleFechaInicioChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">Fecha fin:</label>
                                <input
                                    type="date"
                                    id="fechaFin"
                                    name="fechaFin"
                                    value={fechaFin}
                                    min={fechaInicio}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={handleFechaFinChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Filtros avanzados */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Búsqueda por nombre/curso */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Nombre del alumno o curso..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    {/* Filtro por curso */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                        <select
                            value={filtroCurso}
                            onChange={(e) => setFiltroCurso(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Todos los cursos</option>
                            {cursos.map(curso => (
                                <option key={curso.id_curso} value={curso.id_curso}>
                                    {curso.nombre_curso}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Todos los estados</option>
                            <option value="Presente">Presente</option>
                            <option value="Ausente">Ausente</option>
                            <option value="Justificado">Justificado</option>
                            <option value="Tardanza">Tardanza</option>
                        </select>
                    </div>

                    {/* Ordenamiento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
                        <div className="flex space-x-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'nombre' | 'curso' | 'estado')}
                                className="w-2/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="nombre">Nombre</option>
                                <option value="curso">Curso</option>
                                <option value="estado">Estado</option>
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
                    <div className="flex items-end lg:col-span-4">
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}

            {loading ? (
                <div className="p-6 text-center text-gray-500">Cargando asistencias...</div>
            ) : getPaginatedAsistencias().asistencias.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No hay registros de asistencia que coincidan con los filtros.</p>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedAsistencias.length === asistencias.length && asistencias.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getPaginatedAsistencias().asistencias.map((asistencia) => (
                                    <tr key={asistencia.id_asistencia} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedAsistencias.includes(asistencia.id_asistencia)}
                                                onChange={() => handleSelectAsistencia(asistencia.id_asistencia)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(asistencia.fecha), 'PPP', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {asistencia.inscripciones.alumnos.apellidos}, {asistencia.inscripciones.alumnos.nombres}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {asistencia.inscripciones.cursos.nombre_curso}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(asistencia.estado)}`}>
                                                {asistencia.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{asistencia.notas || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <button
                                                onClick={() => handleVerCalendario(asistencia.inscripciones.alumnos.id_alumno)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Ver calendario de asistencias"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
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
                                Página {currentPage} de {Math.ceil(getPaginatedAsistencias().totalAsistencias / itemsPerPage)}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= Math.ceil(getPaginatedAsistencias().totalAsistencias / itemsPerPage)}
                                className={`px-3 py-1 rounded-md text-sm font-medium ${
                                    currentPage >= Math.ceil(getPaginatedAsistencias().totalAsistencias / itemsPerPage)
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCalendario && selectedAlumnoId && (
                <CalendarioAsistencias
                    idAlumno={selectedAlumnoId}
                    onClose={() => {
                        setShowCalendario(false);
                        setSelectedAlumnoId(null);
                    }}
                />
            )}

            {selectedAsistencias.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        {selectedAsistencias.length} asistencias seleccionadas
                    </span>
                    <button
                        onClick={() => eliminarAsistencias(selectedAsistencias)}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-50"
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar seleccionadas'}
                    </button>
                </div>
            )}
        </div>
    );
}