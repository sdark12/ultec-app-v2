// --- src/components/Reportes/ReporteFinanciero.tsx ---
// CORREGIDO: Eliminada la constante buttonClasses no usada

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pago, Gasto } from '../../types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Estilos
const inputClasses = "px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const selectClasses = `${inputClasses} w-full md:w-auto bg-white`;
// const buttonClasses = "..."; // <-- Eliminado
const cardClasses = "bg-white shadow-lg rounded-xl p-5 border border-gray-200";

interface ReporteResultados {
    ingresosMensualidades: number;
    ingresosVarios: number;
    totalIngresos: number;
    totalGastos: number;
    sueldoLiquido: number;
}

export default function ReporteFinanciero() {
    const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensual'>('diario');
    const [fechaInicio, setFechaInicio] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [fechaFin, setFechaFin] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [resultados, setResultados] = useState<ReporteResultados>({
        ingresosMensualidades: 0, ingresosVarios: 0, totalIngresos: 0, totalGastos: 0, sueldoLiquido: 0
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const formatCurrency = (amount: number) => `Q${amount.toFixed(2)}`;

    const calcularFechas = (periodoSeleccionado: 'diario' | 'semanal' | 'mensual', fechaBase: string = new Date().toISOString().split('T')[0]) => {
        const base = new Date(fechaBase + 'T00:00:00');
        let inicio: Date; let fin: Date;
        switch (periodoSeleccionado) {
            case 'semanal': inicio = startOfWeek(base, { weekStartsOn: 1 }); fin = endOfWeek(base, { weekStartsOn: 1 }); break;
            case 'mensual': inicio = startOfMonth(base); fin = endOfMonth(base); break;
            default: inicio = base; fin = base; break;
        }
        fin.setHours(23, 59, 59, 999);
        setFechaInicio(format(inicio, 'yyyy-MM-dd')); setFechaFin(format(fin, 'yyyy-MM-dd'));
    };

    useEffect(() => { calcularFechas('diario'); }, []);

    const generarReporte = async () => {
        setLoading(true); setErrorMsg(null);
        setResultados({ ingresosMensualidades: 0, ingresosVarios: 0, totalIngresos: 0, totalGastos: 0, sueldoLiquido: 0 });
        try {
            const { data: pagosData, error: pagosError } = await supabase.from('pagos').select('monto, concepto').gte('fecha_pago', fechaInicio).lte('fecha_pago', fechaFin);
            if (pagosError) throw pagosError;
            let totalMensualidades = 0; let totalVarios = 0;
            (pagosData as Pago[] || []).forEach(pago => { if (pago.concepto === 'Servicios Varios') { totalVarios += pago.monto; } else { totalMensualidades += pago.monto; } });

            const { data: gastosData, error: gastosError } = await supabase.from('gastos').select('monto').gte('fecha_gasto', fechaInicio).lte('fecha_gasto', fechaFin);
            if (gastosError) throw gastosError;
            const totalGastosCalc = (gastosData as Gasto[] || []).reduce((sum, gasto) => sum + gasto.monto, 0);

            const totalIngresosCalc = totalMensualidades + totalVarios;
            const sueldoLiquidoCalc = totalIngresosCalc - totalGastosCalc;

            setResultados({ ingresosMensualidades: totalMensualidades, ingresosVarios: totalVarios, totalIngresos: totalIngresosCalc, totalGastos: totalGastosCalc, sueldoLiquido: sueldoLiquidoCalc });
        } catch (error: any) {
            console.error("Error generando reporte:", error); setErrorMsg(`Error al generar reporte: ${error.message}`);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        generarReporte();
    }, [fechaInicio, fechaFin]);

    const handlePeriodoChange = (nuevoPeriodo: 'diario' | 'semanal' | 'mensual') => {
        setPeriodo(nuevoPeriodo); calcularFechas(nuevoPeriodo, fechaInicio);
    }
    const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevaFecha = e.target.value; setFechaInicio(nuevaFecha);
        if (periodo === 'diario') { setFechaFin(nuevaFecha); } else { calcularFechas(periodo, nuevaFecha); }
    }

    const chartData = [
        { name: 'Ing. Mensualidades', Ingresos: resultados.ingresosMensualidades, Gastos: 0 },
        { name: 'Ing. Varios', Ingresos: resultados.ingresosVarios, Gastos: 0 },
        { name: 'Gastos Totales', Ingresos: 0, Gastos: resultados.totalGastos },
    ];

    return (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-8">
            <h3 className="text-2xl font-semibold text-gray-800">Reporte Financiero</h3>
            <div className="flex flex-wrap items-end gap-4 pb-6 border-b">
                <div>
                    <label htmlFor="periodo" className="block text-sm font-medium text-gray-700 mb-1">Periodo:</label>
                    <select id="periodo" value={periodo} onChange={(e) => handlePeriodoChange(e.target.value as any)} className={selectClasses}>
                        <option value="diario">Diario</option><option value="semanal">Semanal</option><option value="mensual">Mensual</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio:</label>
                    <input type="date" id="fechaInicio" value={fechaInicio} onChange={handleFechaInicioChange} className={inputClasses} max={format(new Date(), 'yyyy-MM-dd')} />
                </div>
                {periodo !== 'diario' && (
                    <div>
                        <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin:</label>
                        <input type="date" id="fechaFin" value={fechaFin} readOnly className={`${inputClasses} bg-gray-100 cursor-not-allowed`} />
                    </div>
                )}
            </div>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {loading ? (<p className="text-center text-gray-500 py-4">Calculando resultados...</p>) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        <div className={cardClasses}><p className="text-sm font-medium text-gray-500">Ingresos (Mens./Insc.)</p><p className="mt-1 text-3xl font-semibold text-green-600">{formatCurrency(resultados.ingresosMensualidades)}</p></div>
                        <div className={cardClasses}><p className="text-sm font-medium text-gray-500">Ingresos (Serv. Varios)</p><p className="mt-1 text-3xl font-semibold text-blue-600">{formatCurrency(resultados.ingresosVarios)}</p></div>
                        <div className={cardClasses}><p className="text-sm font-medium text-gray-500">Total Ingresos</p><p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(resultados.totalIngresos)}</p></div>
                        <div className={cardClasses}><p className="text-sm font-medium text-gray-500">Total Gastos</p><p className="mt-1 text-3xl font-semibold text-red-600">{formatCurrency(resultados.totalGastos)}</p></div>
                        <div className={`${cardClasses} md:col-span-2 lg:col-span-1 xl:col-span-1`}><p className="text-sm font-medium text-gray-500">Sueldo Líquido</p><p className={`mt-1 text-3xl font-bold ${resultados.sueldoLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(resultados.sueldoLiquido)}</p></div>
                    </div>
                    <div className={`${cardClasses} h-96`}>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Resumen Gráfico</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barGap={10} >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                                <Bar dataKey="Ingresos" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
