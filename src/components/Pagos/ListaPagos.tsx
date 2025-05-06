// --- src/components/Pagos/ListaPagos.tsx ---
// NUEVO ARCHIVO: Componente para listar historial de pagos

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pago } from '../../types';
import { Link } from 'react-router-dom';

// Interfaz para los filtros
interface FiltrosPago {
    fechaInicio: string;
    fechaFin: string;
    alumno: string;
    concepto: string;
    tipoPago: string;
    montoMin: string;
    montoMax: string;
}

export default function ListaPagos() {
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    // Estados para filtros y paginación
    const [filtros, setFiltros] = useState<FiltrosPago>({
        fechaInicio: '',
        fechaFin: '',
        alumno: '',
        concepto: '',
        tipoPago: '',
        montoMin: '',
        montoMax: ''
    });
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // Selección múltiple
    const [selectedPagos, setSelectedPagos] = useState<number[]>([]);

    // Lista de conceptos y tipos de pago para los filtros
    const conceptos = ['Mensualidad', 'Inscripción', 'Material', 'Otro'];
    const tiposPago = ['Efectivo', 'Transferencia', 'Cheque', 'Otro'];

    const fetchPagos = async () => {
        setLoading(true);
        setErrorMsg(null);

        try {
            let query = supabase
                .from('pagos')
                .select(`
                    id_pago, 
                    fecha_pago,
                    monto,
                    tipo_pago,
                    concepto,
                    numero_recibo,
                    mes_correspondiente,
                    notas,
                    id_alumno,
                    id_inscripcion,
                    alumnos:alumnos (
                        id_alumno,
                        nombres,
                        apellidos
                    ),
                    inscripciones:inscripciones (
                        id_inscripcion,
                        cursos:cursos (
                            id_curso,
                            nombre_curso
                        )
                    )
                `, { count: 'exact' });

            // Aplicar filtros
            if (filtros.fechaInicio) query = query.gte('fecha_pago', filtros.fechaInicio);
            if (filtros.fechaFin) query = query.lte('fecha_pago', filtros.fechaFin);
            if (filtros.concepto) query = query.eq('concepto', filtros.concepto);
            if (filtros.tipoPago) query = query.eq('tipo_pago', filtros.tipoPago);
            if (filtros.montoMin) query = query.gte('monto', parseFloat(filtros.montoMin));
            if (filtros.montoMax) query = query.lte('monto', parseFloat(filtros.montoMax));
            if (filtros.alumno) {
                query = query.or(`alumnos.nombres.ilike.%${filtros.alumno}%,alumnos.apellidos.ilike.%${filtros.alumno}%`);
            }

            // Aplicar paginación
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;
            
            const { data, error, count } = await query
                .order('fecha_pago', { ascending: false })
                .range(from, to);

            if (error) throw error;
            
            // Transformar los datos usando una conversión explícita
            const pagosProcesados: Pago[] = (data || []).map(item => {
                const rawItem = item as unknown as {
                    id_pago: number;
                    fecha_pago: string;
                    monto: number;
                    tipo_pago: string;
                    concepto: string;
                    numero_recibo: string | null;
                    mes_correspondiente: string | null;
                    notas: string | null;
                    id_alumno: number | null;
                    id_inscripcion: number | null;
                    alumnos: {
                        id_alumno: number;
                        nombres: string;
                        apellidos: string;
                    } | null;
                    inscripciones: {
                        id_inscripcion: number;
                        cursos: {
                            id_curso: number;
                            nombre_curso: string;
                        } | null;
                    } | null;
                };

                return {
                    id_pago: rawItem.id_pago,
                    fecha_pago: rawItem.fecha_pago,
                    monto: rawItem.monto,
                    tipo_pago: rawItem.tipo_pago as 'Efectivo' | 'Transferencia' | 'Cheque' | 'Otro',
                    concepto: rawItem.concepto as 'Inscripción' | 'Mensualidad' | 'Material' | 'Otro' | 'Servicios Varios',
                    numero_recibo: rawItem.numero_recibo,
                    mes_correspondiente: rawItem.mes_correspondiente,
                    notas: rawItem.notas,
                    id_alumno: rawItem.id_alumno,
                    id_inscripcion: rawItem.id_inscripcion,
                    alumnos: rawItem.alumnos,
                    inscripciones: rawItem.inscripciones
                };
            });
            
            setPagos(pagosProcesados);
            if (count) {
                setTotalPages(Math.ceil(count / pageSize));
            }
        } catch (error: any) {
            console.error('Error fetching pagos:', error);
            setErrorMsg(`Error al cargar pagos: ${error.message}. Verifica RLS.`);
            setPagos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPagos();
    }, [currentPage, pageSize, filtros]);

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Resetear a primera página al cambiar filtros
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const togglePagoSelection = (id: number) => {
        setSelectedPagos(prev => 
            prev.includes(id) 
                ? prev.filter(pagoId => pagoId !== id)
                : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm(`¿Eliminar ${selectedPagos.length} pagos seleccionados?`)) return;
        
        setLoading(true);
        setErrorMsg(null);
        
        try {
            const { error } = await supabase
                .from('pagos')
                .delete()
                .in('id_pago', selectedPagos);
                
            if (error) throw error;
            
            setPagos(prev => prev.filter(p => p.id_pago !== undefined && !selectedPagos.includes(p.id_pago)));
            setSelectedPagos([]);
            alert('Pagos eliminados correctamente');
        } catch (error: any) {
            console.error("Error eliminando pagos:", error);
            setErrorMsg(`Error al eliminar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(`¿Eliminar este registro de pago?`)) return;

        setDeletingId(id);
        setErrorMsg(null);
        try {
            const { error } = await supabase.from('pagos').delete().eq('id_pago', id);
            if (error) throw error;
            setPagos(prev => prev.filter(p => p.id_pago !== id));
            alert(`Pago eliminado.`);
        } catch (error: any) {
            console.error("Error eliminando pago:", error);
            setErrorMsg(`Error al eliminar: ${error.message}.`);
        } finally {
            setDeletingId(null);
        }
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return 'N/A';
        return `Q${amount.toFixed(2)}`;
    }

    if (loading && pagos.length === 0) return <div className="p-6 text-center text-gray-500">Cargando historial de pagos...</div>;
    if (errorMsg && pagos.length === 0) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col gap-6">
                {/* Cabecera y Acciones */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-semibold text-gray-800">Historial de Pagos</h3>
                    <div className="flex gap-2">
                        {selectedPagos.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                                disabled={loading}
                            >
                                Eliminar ({selectedPagos.length})
                            </button>
                        )}
                        <Link to="/pagos/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm whitespace-nowrap">
                            + Registrar Pago
                        </Link>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            id="fechaInicio"
                            name="fechaInicio"
                            value={filtros.fechaInicio}
                            onChange={handleFiltroChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            id="fechaFin"
                            name="fechaFin"
                            value={filtros.fechaFin}
                            onChange={handleFiltroChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="alumno" className="block text-sm font-medium text-gray-700 mb-1">
                            Alumno
                        </label>
                        <input
                            type="text"
                            id="alumno"
                            name="alumno"
                            value={filtros.alumno}
                            onChange={handleFiltroChange}
                            placeholder="Buscar por nombre..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="concepto" className="block text-sm font-medium text-gray-700 mb-1">
                            Concepto
                        </label>
                        <select
                            id="concepto"
                            name="concepto"
                            value={filtros.concepto}
                            onChange={handleFiltroChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Todos</option>
                            {conceptos.map(concepto => (
                                <option key={concepto} value={concepto}>{concepto}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tipoPago" className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Pago
                        </label>
                        <select
                            id="tipoPago"
                            name="tipoPago"
                            value={filtros.tipoPago}
                            onChange={handleFiltroChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Todos</option>
                            {tiposPago.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="montoMin" className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Mínimo
                        </label>
                        <input
                            type="number"
                            id="montoMin"
                            name="montoMin"
                            value={filtros.montoMin}
                            onChange={handleFiltroChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="montoMax" className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Máximo
                        </label>
                        <input
                            type="number"
                            id="montoMax"
                            name="montoMax"
                            value={filtros.montoMax}
                            onChange={handleFiltroChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}

                {/* Tabla de Pagos */}
                {pagos.length === 0 && !loading ? (
                    <p className="text-center text-gray-500 py-4">No hay pagos registrados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-8 px-6 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedPagos.length > 0 && selectedPagos.length === pagos.filter(p => p.id_pago !== undefined).length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const validIds = pagos
                                                        .map(p => p.id_pago)
                                                        .filter((id): id is number => id !== undefined);
                                                    setSelectedPagos(validIds);
                                                } else {
                                                    setSelectedPagos([]);
                                                }
                                            }}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recibo #</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pagos.map((pago) => (
                                    <tr key={pago.id_pago} className="hover:bg-gray-50">
                                        <td className="w-8 px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={pago.id_pago !== undefined && selectedPagos.includes(pago.id_pago)}
                                                onChange={() => pago.id_pago !== undefined && togglePagoSelection(pago.id_pago)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pago.fecha_pago}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {pago.alumnos?.nombres ? 
                                                `${pago.alumnos.apellidos}, ${pago.alumnos.nombres}` :
                                                'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {pago.concepto}{pago.mes_correspondiente ? ` (${pago.mes_correspondiente})` : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {pago.inscripciones?.cursos?.nombre_curso || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                            {formatCurrency(pago.monto)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {pago.numero_recibo || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <Link 
                                                to={`/pagos/editar/${pago.id_pago}`}
                                                className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                            >
                                                Editar
                                            </Link>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => pago.id_pago && handleDelete(pago.id_pago)}
                                                disabled={deletingId === pago.id_pago}
                                                className="text-red-600 hover:text-red-900 hover:underline disabled:opacity-50"
                                            >
                                                {deletingId === pago.id_pago ? '...' : 'Eliminar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Mostrar</span>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="border border-gray-300 rounded-md text-sm"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span className="text-sm text-gray-700">por página</span>
                    </div>

                    <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-gray-700">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}