// --- src/components/IngresosVarios/ListaIngresosVarios.tsx ---
// NUEVO ARCHIVO: Componente para listar ingresos varios

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pago } from '../../types'; // Reutilizamos el tipo Pago
import { Link } from 'react-router-dom';

export default function ListaIngresosVarios() {
    const [ingresos, setIngresos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    // TODO: Añadir filtros de fecha

    const fetchIngresos = async () => {
        setLoading(true); setErrorMsg(null);

        // Consulta filtrando por el concepto específico
        const { data, error } = await supabase
            .from('pagos')
            .select(`*`) // Traer todos los campos de pagos para este caso
            .eq('concepto', 'Servicios Varios') // <-- FILTRO CLAVE
            .is('id_alumno', null) // Asegurarse que no esté ligado a alumno
            .is('id_inscripcion', null) // Asegurarse que no esté ligado a inscripción
            .order('fecha_pago', { ascending: false });

        if (error) {
            console.error('Error fetching ingresos varios:', error);
            setErrorMsg(`Error al cargar ingresos: ${error.message}. Verifica RLS.`);
            setIngresos([]);
        } else if (data) {
            setIngresos(data as Pago[]);
            console.log('Ingresos Varios obtenidos:', data);
        }
        setLoading(false);
    };

    useEffect(() => { fetchIngresos(); }, []);

    const handleDelete = async (id: number | undefined) => {
        if (id === undefined) return;
        if (!window.confirm(`¿Eliminar este registro de ingreso?`)) return;

        setDeletingId(id); setErrorMsg(null);
        try {
            // Requiere RLS DELETE en 'pagos' (ej. solo admin/contador)
            const { error } = await supabase.from('pagos').delete().eq('id_pago', id);
            if (error) throw error;
            setIngresos(prev => prev.filter(p => p.id_pago !== id));
            alert(`Ingreso eliminado.`);
        } catch (error: any) {
            console.error("Error eliminando ingreso:", error);
            setErrorMsg(`Error al eliminar: ${error.message}.`);
        } finally { setDeletingId(null); }
    };

    // Formatear moneda
    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return 'N/A';
        return `Q${amount.toFixed(2)}`;
    }

    if (loading && ingresos.length === 0) return <div className="p-6 text-center text-gray-500">Cargando historial de ingresos varios...</div>;
    if (errorMsg && ingresos.length === 0) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold text-gray-800">Historial de Ingresos Varios</h3>
                {/* TODO: Añadir filtros aquí */}
                <Link to="/ingresos-varios/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm whitespace-nowrap">
                    + Registrar Ingreso Vario
                </Link>
            </div>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}

            {ingresos.length === 0 && !loading ? (<p className="text-center text-gray-500 py-4">No hay ingresos varios registrados.</p>) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Pago</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas/Descripción</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recibo #</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ingresos.map((ingreso) => (
                                <tr key={ingreso.id_pago} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ingreso.fecha_pago}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ingreso.tipo_pago}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={ingreso.notas || ''}>{ingreso.notas || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatCurrency(ingreso.monto)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ingreso.numero_recibo || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        {/* <Link to={`/ingresos-varios/editar/${ingreso.id_pago}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">Editar</Link> */}
                                        {/* <span className="text-gray-300">|</span>  */}
                                        <button onClick={() => handleDelete(ingreso.id_pago)} disabled={deletingId === ingreso.id_pago} className={`text-red-600 hover:text-red-900 hover:underline disabled:opacity-50`}>
                                            {deletingId === ingreso.id_pago ? '...' : 'Eliminar'}
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
