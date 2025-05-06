// --- src/components/Calificaciones/ReporteCalificacionesCurso.tsx ---
// CORREGIDO: Eliminadas importaciones no usadas y añadido manejo de nota_maxima null/undefined

// Se quita useMemo, Inscripcion, Alumno de la importación
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Se usa en useEffects
import { Curso, Evaluacion, Calificacion } from '../../types'; // Se usa Calificacion
import { Link } from 'react-router-dom'; // Se usa
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const selectClasses = "w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white";

type ReporteAlumno = {
    id_inscripcion: number;
    id_alumno: number;
    nombres: string;
    apellidos: string;
    calificaciones: { [evalId: number]: number | null };
    totales_bimestre: { [bimestre: number]: number | null };
};

export default function ReporteCalificacionesCurso() {
    // Estados que SÍ se usan
    const [cursos, setCursos] = useState<Pick<Curso, 'id_curso' | 'nombre_curso'>[]>([]);
    const [selectedCursoId, setSelectedCursoId] = useState<string>('');
    const [selectedBimestre, setSelectedBimestre] = useState(1);
    const [evaluacionesCurso, setEvaluacionesCurso] = useState<Evaluacion[]>([]);
    const [reporteData, setReporteData] = useState<ReporteAlumno[]>([]);
    const [loadingCursos, setLoadingCursos] = useState(true);
    const [loadingReporte, setLoadingReporte] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mostrarResumen, setMostrarResumen] = useState(false);

    // Estados para filtros avanzados
    const [searchTerm, setSearchTerm] = useState('');
    const [filterNotaMin, setFilterNotaMin] = useState<string>('');
    const [filterNotaMax, setFilterNotaMax] = useState<string>('');
    const [sortBy, setSortBy] = useState<'nombre' | 'nota'>('nombre');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Cargar cursos (Usa setLoadingCursos, supabase, setCursos)
    useEffect(() => {
        async function fetchCursos() {
            setLoadingCursos(true);
            const { data, error } = await supabase.from('cursos').select('id_curso, nombre_curso').eq('activo', true).order('nombre_curso');
            if (error) console.error("Error cargando cursos", error); else setCursos(data || []);
            setLoadingCursos(false);
        } fetchCursos();
    }, []);

    // Cargar datos del reporte (Usa setLoadingReporte, setErrorMsg, setEvaluacionesCurso, setReporteData, supabase, Calificacion)
    useEffect(() => {
        if (!selectedCursoId) { setEvaluacionesCurso([]); setReporteData([]); return; }
        async function fetchReporteData() {
            setLoadingReporte(true); setErrorMsg(null); setEvaluacionesCurso([]); setReporteData([]);
            try {
                const cursoIdNum = parseInt(selectedCursoId, 10);
                const { data: evalsData, error: evalsError } = await supabase.from('evaluaciones').select('*').eq('id_curso', cursoIdNum).order('id_evaluacion');
                if (evalsError) throw evalsError;
                const evaluaciones = (evalsData as Evaluacion[]) || [];
                setEvaluacionesCurso(evaluaciones);

                const { data: inscData, error: inscError } = await supabase.from('inscripciones').select('id_inscripcion, alumnos!inner(id_alumno, nombres, apellidos)').eq('id_curso', cursoIdNum).eq('estado', 'Activo');
                if (inscError) throw inscError;
                const inscripciones = (inscData as any[]) || [];
                if (inscripciones.length === 0) { setLoadingReporte(false); return; }

                const inscripcionIds = inscripciones.map(i => i.id_inscripcion);
                const evaluacionIds = evaluaciones.map(e => e.id_evaluacion);
                if (inscripcionIds.length === 0 || evaluacionIds.length === 0) { setLoadingReporte(false); return; }

                const { data: califData, error: califError } = await supabase.from('calificaciones').select('id_inscripcion, id_evaluacion, nota_obtenida').in('id_inscripcion', inscripcionIds).in('id_evaluacion', evaluacionIds);
                if (califError) throw califError;
                const calificaciones = (califData as Calificacion[]) || []; // Se usa Calificacion aquí

                // Agrupar evaluaciones por bimestre
                const evaluacionesPorBimestre = evaluaciones.reduce((acc, ev) => {
                    if (!acc[ev.bimestre]) {
                        acc[ev.bimestre] = [];
                    }
                    acc[ev.bimestre].push(ev);
                    return acc;
                }, {} as { [key: number]: Evaluacion[] });

                const reporte = inscripciones.map(insc => {
                    const alumnoCalificaciones: { [evalId: number]: number | null } = {};
                    const totalesPorBimestre: { [bimestre: number]: number | null } = {1: null, 2: null, 3: null, 4: null};

                    // Procesar calificaciones por bimestre
                    [1, 2, 3, 4].forEach(bimestre => {
                        const evaluacionesBimestre = evaluacionesPorBimestre[bimestre] || [];
                        let totalBimestre = 0;
                        let cantidadNotas = 0;

                        evaluacionesBimestre.forEach(ev => {
                            const calif = calificaciones.find(c => 
                                c.id_inscripcion === insc.id_inscripcion && 
                                c.id_evaluacion === ev.id_evaluacion
                            );
                            const nota = calif?.nota_obtenida ?? null;
                            alumnoCalificaciones[ev.id_evaluacion!] = nota;

                            if (nota !== null) {
                                totalBimestre += nota;
                                cantidadNotas++;
                            }
                        });

                        totalesPorBimestre[bimestre] = cantidadNotas > 0 ? totalBimestre : null;
                    });

                    return {
                        id_inscripcion: insc.id_inscripcion,
                        id_alumno: insc.alumnos.id_alumno,
                        nombres: insc.alumnos.nombres,
                        apellidos: insc.alumnos.apellidos,
                        calificaciones: alumnoCalificaciones,
                        totales_bimestre: totalesPorBimestre
                    };
                });
                setReporteData(reporte); // Se usa setReporteData
            } catch (error: any) {
                console.error("Error generando reporte:", error); setErrorMsg(`Error al generar reporte: ${error.message}`); // Se usa setErrorMsg
            } finally { setLoadingReporte(false); } // Se usa setLoadingReporte
        } fetchReporteData();
    }, [selectedCursoId]);

    // Función para calcular el promedio final
    const calcularPromedioFinal = (alumno: ReporteAlumno) => {
        let totalBimestres = 0;
        let bimestresConNotas = 0;

        [1, 2, 3, 4].forEach(bimestre => {
            if (alumno.totales_bimestre[bimestre] !== null) {
                totalBimestres += alumno.totales_bimestre[bimestre]!;
                bimestresConNotas++;
            }
        });

        return bimestresConNotas > 0 ? totalBimestres / bimestresConNotas : null;
    };

    // Función para filtrar y ordenar alumnos
    const getFilteredAndSortedAlumnos = () => {
        return reporteData
            .filter(alumno => {
                const nombreCompleto = `${alumno.nombres} ${alumno.apellidos}`.toLowerCase();
                const cumpleSearch = searchTerm === '' || nombreCompleto.includes(searchTerm.toLowerCase());
                
                let cumpleNota = true;
                if (mostrarResumen) {
                    const promedioFinal = calcularPromedioFinal(alumno);
                    cumpleNota = (filterNotaMin === '' || (promedioFinal !== null && promedioFinal >= parseFloat(filterNotaMin))) &&
                                (filterNotaMax === '' || (promedioFinal !== null && promedioFinal <= parseFloat(filterNotaMax)));
                } else {
                    const notaBimestre = alumno.totales_bimestre[selectedBimestre];
                    cumpleNota = (filterNotaMin === '' || (notaBimestre !== null && notaBimestre >= parseFloat(filterNotaMin))) &&
                                (filterNotaMax === '' || (notaBimestre !== null && notaBimestre <= parseFloat(filterNotaMax)));
                }
                
                return cumpleSearch && cumpleNota;
            })
            .sort((a, b) => {
                if (sortBy === 'nombre') {
                    const nombreA = `${a.apellidos} ${a.nombres}`;
                    const nombreB = `${b.apellidos} ${b.nombres}`;
                    return sortOrder === 'asc' 
                        ? nombreA.localeCompare(nombreB)
                        : nombreB.localeCompare(nombreA);
                } else {
                    let notaA, notaB;
                    if (mostrarResumen) {
                        notaA = calcularPromedioFinal(a) ?? -1;
                        notaB = calcularPromedioFinal(b) ?? -1;
                    } else {
                        notaA = a.totales_bimestre[selectedBimestre] ?? -1;
                        notaB = b.totales_bimestre[selectedBimestre] ?? -1;
                    }
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
        setFilterNotaMin('');
        setFilterNotaMax('');
        setSortBy('nombre');
        setSortOrder('asc');
        setCurrentPage(1);
    };

    const generarPDF = () => {
        try {
            // Crear nuevo documento PDF
            const doc = new jsPDF();
            const cursoSeleccionado = cursos.find(c => c.id_curso === parseInt(selectedCursoId));
            
            // Configurar el encabezado
            doc.setFontSize(20);
            doc.text('Academia ULTEC', 105, 15, { align: 'center' });
            
            doc.setFontSize(14);
            doc.text('Reporte de Promedios', 105, 25, { align: 'center' });
            
            doc.setFontSize(12);
            doc.text(`Curso: ${cursoSeleccionado?.nombre_curso || ''}`, 105, 35, { align: 'center' });
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 45, { align: 'center' });

            // Preparar los datos para la tabla
            const headers = [
                ['Alumno', 'Promedio Bim. 1', 'Promedio Bim. 2', 'Promedio Bim. 3', 'Promedio Bim. 4', 'Promedio Final']
            ];

            const data = reporteData.map(alumno => {
                const promedioFinal = calcularPromedioFinal(alumno);
                return [
                    `${alumno.apellidos}, ${alumno.nombres}`,
                    alumno.totales_bimestre[1] !== null ? alumno.totales_bimestre[1].toFixed(2) : '-',
                    alumno.totales_bimestre[2] !== null ? alumno.totales_bimestre[2].toFixed(2) : '-',
                    alumno.totales_bimestre[3] !== null ? alumno.totales_bimestre[3].toFixed(2) : '-',
                    alumno.totales_bimestre[4] !== null ? alumno.totales_bimestre[4].toFixed(2) : '-',
                    promedioFinal !== null ? promedioFinal.toFixed(2) : '-'
                ];
            });

            // Generar la tabla
            autoTable(doc, {
                head: headers,
                body: data,
                startY: 55,
                theme: 'grid',
                headStyles: {
                    fillColor: [0, 123, 255],
                    textColor: 255,
                    fontSize: 10,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'left' }
                },
                margin: { top: 50 },
                didDrawPage: function(data) {
                    // Agregar pie de página
                    doc.setFontSize(8);
                    doc.text(
                        'Este documento es un reporte oficial de Academia ULTEC',
                        105,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );
                }
            });

            // Guardar el PDF
            const nombreArchivo = `Reporte_Promedios_${cursoSeleccionado?.nombre_curso.replace(/\s+/g, '_')}.pdf`;
            doc.save(nombreArchivo);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            setErrorMsg('Error al generar el PDF. Por favor, intente nuevamente.');
        }
    };

    // El JSX usa loadingCursos, errorMsg, selectedCursoId, loadingReporte, reporteData, evaluacionesCurso, Link, formatPonderacion
    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-semibold text-gray-800">Reporte de Calificaciones por Curso</h3>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <select 
                        value={selectedCursoId} 
                        onChange={(e) => setSelectedCursoId(e.target.value)} 
                        className={selectClasses} 
                        disabled={loadingCursos}
                    >
                        <option value="">-- Selecciona Curso --</option>
                        {cursos.map(curso => (
                            <option key={curso.id_curso} value={curso.id_curso}>{curso.nombre_curso}</option>
                        ))}
                    </select>
                    {!mostrarResumen && (
                        <select
                            value={selectedBimestre}
                            onChange={(e) => setSelectedBimestre(Number(e.target.value))}
                            className={selectClasses}
                            disabled={!selectedCursoId}
                        >
                            <option value={1}>Primer Bimestre</option>
                            <option value={2}>Segundo Bimestre</option>
                            <option value={3}>Tercer Bimestre</option>
                            <option value={4}>Cuarto Bimestre</option>
                        </select>
                    )}
                    <button
                        onClick={() => setMostrarResumen(!mostrarResumen)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                            mostrarResumen
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {mostrarResumen ? 'Ver Detalles' : 'Ver Resumen'}
                    </button>
                </div>
                <Link to="/calificaciones/gestionar" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm whitespace-nowrap">
                    Ingresar/Editar Notas
                </Link>
            </div>

            {/* Filtros avanzados */}
            {selectedCursoId && (
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rango de {mostrarResumen ? 'Promedio Final' : 'Notas Bimestre'}
                            </label>
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

            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {selectedCursoId && (
                loadingReporte ? (
                    <p className="text-center text-gray-500 py-4">Generando reporte...</p>
                ) : getPaginatedAlumnos().alumnos.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay alumnos que coincidan con los filtros.</p>
                ) : mostrarResumen ? (
                    // Vista de Resumen Final
                    <div className="space-y-4">
                        <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Alumno
                                        </th>
                                        {[1, 2, 3, 4].map(bimestre => (
                                            <th key={bimestre} scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                Promedio Bim. {bimestre}
                                            </th>
                                        ))}
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider bg-blue-50">
                                            Promedio Final
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getPaginatedAlumnos().alumnos.map((alumno) => {
                                        const promedioFinal = calcularPromedioFinal(alumno);
                                        return (
                                            <tr key={alumno.id_inscripcion} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {alumno.apellidos}, {alumno.nombres}
                                                </td>
                                                {[1, 2, 3, 4].map(bimestre => (
                                                    <td key={bimestre} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                        {alumno.totales_bimestre[bimestre] !== null 
                                                            ? alumno.totales_bimestre[bimestre]?.toFixed(2)
                                                            : <span className="text-gray-400">-</span>
                                                        }
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center bg-blue-50">
                                                    {promedioFinal !== null 
                                                        ? promedioFinal.toFixed(2)
                                                        : <span className="text-gray-400">-</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Alumno
                                        </th>
                                        {evaluacionesCurso
                                            .filter(ev => ev.bimestre === selectedBimestre)
                                            .map(ev => (
                                                <th 
                                                    key={ev.id_evaluacion} 
                                                    scope="col" 
                                                    className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider"
                                                    title={`Nota Máx: ${(typeof ev.nota_maxima === 'number' ? ev.nota_maxima : 100).toFixed(2)}`}
                                                >
                                                    {ev.nombre}
                                                </th>
                                            ))
                                        }
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-200">
                                            Total Bim. {selectedBimestre}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getPaginatedAlumnos().alumnos.map((alumno) => (
                                        <tr key={alumno.id_inscripcion} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {alumno.apellidos}, {alumno.nombres}
                                            </td>
                                            {evaluacionesCurso
                                                .filter(ev => ev.bimestre === selectedBimestre)
                                                .map(ev => (
                                                    <td key={ev.id_evaluacion} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                        {alumno.calificaciones[ev.id_evaluacion!] !== null 
                                                            ? alumno.calificaciones[ev.id_evaluacion!]?.toFixed(2) 
                                                            : <span className="text-gray-400">-</span>
                                                        }
                                                    </td>
                                                ))
                                            }
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center bg-gray-50">
                                                {alumno.totales_bimestre[selectedBimestre] !== null 
                                                    ? alumno.totales_bimestre[selectedBimestre]?.toFixed(2) 
                                                    : <span className="text-gray-400">-</span>
                                                }
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
                    </div>
                )
            )}
        </div>
    );
}
// formatPonderacion SÍ se usa en el JSX
const formatPonderacion = (ponderacion: number | null | undefined) => {
    if (ponderacion === null || ponderacion === undefined) return 'N/A';
    return `${(ponderacion * 100).toFixed(0)}%`;
}
