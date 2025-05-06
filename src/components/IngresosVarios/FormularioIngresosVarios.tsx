// --- src/components/IngresosVarios/FormularioIngresosVarios.tsx ---
// NUEVO ARCHIVO: Formulario para registrar ingresos varios

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pago } from '../../types'; // Reutilizamos el tipo Pago

interface FormularioIngresosVariosProps {
    ingresoAEditar?: Pago | null; // Para futura edición
    onFormSubmit?: () => void;
}

// Estilos
const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const selectClasses = `${inputClasses} bg-white`;
const textareaClasses = `${inputClasses} min-h-[60px]`; // Altura mínima para textarea

export default function FormularioIngresosVarios({ ingresoAEditar = null, onFormSubmit }: FormularioIngresosVariosProps) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Estado del formulario
    const [formData, setFormData] = useState<Partial<Pago>>({
        monto: ingresoAEditar?.monto || undefined,
        fecha_pago: ingresoAEditar?.fecha_pago || new Date().toISOString().split('T')[0],
        tipo_pago: ingresoAEditar?.tipo_pago || 'Efectivo',
        concepto: 'Servicios Varios', // Concepto fijo para esta sección
        numero_recibo: ingresoAEditar?.numero_recibo || null,
        mes_correspondiente: null, // No aplica usualmente a ingresos varios
        notas: ingresoAEditar?.notas || null, // Usaremos notas como descripción
        // id_alumno e id_inscripcion serán siempre NULL
    });

    // Resetear formulario si cambia el ingreso a editar
    useEffect(() => {
        if (ingresoAEditar) {
            setFormData({
                monto: ingresoAEditar.monto,
                fecha_pago: ingresoAEditar.fecha_pago || new Date().toISOString().split('T')[0],
                tipo_pago: ingresoAEditar.tipo_pago || 'Efectivo',
                concepto: 'Servicios Varios', // Siempre este concepto
                numero_recibo: ingresoAEditar.numero_recibo || null,
                mes_correspondiente: null,
                notas: ingresoAEditar.notas || null,
            });
        } else {
            setFormData({
                monto: undefined, fecha_pago: new Date().toISOString().split('T')[0],
                tipo_pago: 'Efectivo', concepto: 'Servicios Varios', numero_recibo: null,
                mes_correspondiente: null, notas: null
            });
        }
        setErrorMsg(null); setSuccessMsg(null);
    }, [ingresoAEditar]);

    // Manejador de cambios
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'monto') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };

    // Manejador de envío
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setLoading(true); setErrorMsg(null); setSuccessMsg(null);

        // Validación
        if (!formData.monto || formData.monto <= 0) {
            setErrorMsg("El monto debe ser un número positivo."); setLoading(false); return;
        }
        if (!formData.tipo_pago || !formData.fecha_pago || !formData.notas) { // Usamos notas como descripción requerida
            setErrorMsg("Fecha, Tipo de Pago y Descripción (en Notas) son requeridos."); setLoading(false); return;
        }

        // Asegurarse que id_alumno y id_inscripcion sean null
        const dataToSubmit: Partial<Pago> = {
            ...formData,
            id_alumno: null,
            id_inscripcion: null,
            concepto: 'Servicios Varios' // Asegurar el concepto
        };

        try {
            let error = null; let data = null;
            // Requiere RLS INSERT/UPDATE en 'pagos' (ej. admin/contador/secretaria)
            if (ingresoAEditar && ingresoAEditar.id_pago) {
                setErrorMsg("La edición de ingresos varios aún no está implementada.");
                // Lógica de Update aquí si se necesita
            } else {
                // Insertar Nuevo Ingreso Vario
                const { data: insertData, error: insertError } = await supabase.from('pagos').insert(dataToSubmit).select().single();
                data = insertData; error = insertError;
                if (!error) {
                    setSuccessMsg("¡Ingreso vario registrado correctamente!");
                    // Resetear formulario
                    setFormData({ monto: undefined, fecha_pago: new Date().toISOString().split('T')[0], tipo_pago: 'Efectivo', concepto: 'Servicios Varios', numero_recibo: null, mes_correspondiente: null, notas: null });
                }
            }
            if (error) throw error;
            console.log("Operación ingreso vario exitosa:", data);
            if (onFormSubmit) onFormSubmit();
        } catch (error: unknown) {
            console.error("Error guardando ingreso vario:", error);
            let displayError = 'Ocurrió un error al guardar el ingreso.';
            if (error && typeof error === 'object' && 'message' in error) {
                if (String(error.message).includes('pagos_numero_recibo_key')) { displayError = "El número de recibo ingresado ya existe."; }
                else { displayError = String(error.message); }
            } setErrorMsg(displayError);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto"> {/* Max-width más pequeño */}
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
                {ingresoAEditar ? 'Editar Ingreso Vario' : 'Registrar Ingreso Vario'}
            </h3>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Monto y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">Monto (Q) <span className="text-red-500">*</span></label>
                        <input type="number" name="monto" id="monto" value={formData.monto || ''} onChange={handleChange} required min="0.01" step="0.01" placeholder="Ej: 10.00" className={inputClasses} disabled={loading} />
                    </div>
                    <div>
                        <label htmlFor="fecha_pago" className="block text-sm font-medium text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                        <input type="date" name="fecha_pago" id="fecha_pago" value={formData.fecha_pago || ''} onChange={handleChange} required className={inputClasses} disabled={loading} />
                    </div>
                </div>

                {/* Tipo de Pago y Número Recibo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tipo_pago" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago <span className="text-red-500">*</span></label>
                        <select name="tipo_pago" id="tipo_pago" value={formData.tipo_pago || 'Efectivo'} onChange={handleChange} required className={selectClasses} disabled={loading}>
                            <option value="Efectivo">Efectivo</option><option value="Transferencia">Transferencia</option><option value="Cheque">Cheque</option><option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="numero_recibo" className="block text-sm font-medium text-gray-700 mb-1">Número Recibo/Factura (Opcional)</label>
                        <input type="text" name="numero_recibo" id="numero_recibo" value={formData.numero_recibo || ''} onChange={handleChange} className={inputClasses} disabled={loading} />
                    </div>
                </div>

                {/* Descripción (usando el campo 'notas') */}
                <div>
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                    <textarea name="notas" id="notas" value={formData.notas || ''} onChange={handleChange} required rows={3} placeholder="Ej: Impresión B/N, 1 hora de internet..." className={textareaClasses} disabled={loading}></textarea>
                </div>

                {/* Botón de Envío */}
                <div className="flex justify-end pt-4">
                    <button type="submit" className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading}>
                        {loading ? 'Guardando...' : (ingresoAEditar ? 'Actualizar Ingreso' : 'Registrar Ingreso')}
                    </button>
                </div>
            </form>
        </div>
    );
}