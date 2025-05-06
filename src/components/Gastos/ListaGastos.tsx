// --- src/components/Gastos/ListaGastos.tsx ---
// NUEVO ARCHIVO: Componente para listar historial de gastos

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Gasto } from '../../types'; // Asegúrate de definir este tipo
import { Link } from 'react-router-dom';

export default function ListaGastos() {
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    // TODO: Añadir estados para filtros (fecha, categoría)

    const fetchGastos = async () => {
        setLoading(true); setErrorMsg(null);

        // Consulta básica inicial, trae todos los gastos con info de quién lo registró
        // Deberías añadir filtros por fecha
        const { data, error } = await supabase
            .from('gastos')
            .select(`
          *, 
          usuarios ( id_usuario, nombres, apellidos ) 
      `)
            .order('fecha_gasto', { ascending: false }); // Ordenar por fecha de gasto descendente

        if (error) {
            console.error('Error fetching gastos:', error);
            setErrorMsg(`Error al cargar gastos: ${error.message}. Verifica RLS.`);
            setGastos([]);
        } else if (data) {
            setGastos(data as any[]); // Usar 'any' temporalmente
            console.log('Gastos obtenidos:', data);
        }
        setLoading(false);
    };

    useEffect(() => { fetchGastos(); }, []);

    const handleDelete = async (id: number | undefined) => {
        if (id === undefined) return;
        if (!window.confirm(`¿Eliminar este registro de gasto?`)) return;

        setDeletingId(id); setErrorMsg(null);
        try {
            // Requiere RLS DELETE en 'gastos' (ej. solo admin/contador)
            const { error } = await supabase.from('gastos').delete().eq('id_gasto', id);
            if (error) throw error;
            setGastos(prev => prev.filter(g => g.id_gasto !== id));
            alert(`Gasto eliminado.`);
        } catch (error: any) {
            console.error("Error eliminando gasto:", error);
            setErrorMsg(`Error al eliminar: ${error.message}.`);
        } finally { setDeletingId(null); }
    };

    // Formatear moneda
    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return 'N/A';
        return `Q${amount.toFixed(2)}`;
    }

    if (loading && gastos.length === 0) return <div className="p-6 text-center text-gray-500">Cargando historial de gastos...</div>;
    if (errorMsg && gastos.length === 0) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold text-gray-800">Historial de Gastos</h3>
                {/* TODO: Añadir filtros aquí */}
                <Link to="/gastos/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm whitespace-nowrap">
                    + Registrar Gasto
                </Link>
            </div>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}

            {gastos.length === 0 && !loading ? (<p className="text-center text-gray-500 py-4">No hay gastos registrados.</p>) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado por</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante #</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {gastos.map((gasto) => (
                                <tr key={gasto.id_gasto} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gasto.fecha_gasto}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gasto.categoria}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={gasto.descripcion}>{gasto.descripcion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatCurrency(gasto.monto)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(gasto as any).usuarios?.nombres} {(gasto as any).usuarios?.apellidos || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gasto.numero_comprobante || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        {/* <Link to={`/gastos/editar/${gasto.id_gasto}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">Editar</Link> */}
                                        {/* <span className="text-gray-300">|</span>  */}
                                        <button onClick={() => handleDelete(gasto.id_gasto)} disabled={deletingId === gasto.id_gasto} className={`text-red-600 hover:text-red-900 hover:underline disabled:opacity-50`}>
                                            {deletingId === gasto.id_gasto ? '...' : 'Eliminar'}
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
