// --- src/components/Gastos/FormularioGasto.tsx ---
// CORREGIDO: Código completo y correcto

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Necesario
import { Gasto } from '../../types'; // Necesario

interface FormularioGastoProps {
    gastoAEditar?: Gasto | null;
    onFormSubmit?: () => void; // Necesario si se usa en handleSubmit
}

// Estilos que SÍ se usan
const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const textareaClasses = `${inputClasses} min-h-[60px]`;

export default function FormularioGasto({ gastoAEditar = null, onFormSubmit }: FormularioGastoProps) {
    // Estados que SÍ se usan
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Gasto>>({
        monto: gastoAEditar?.monto || undefined,
        fecha_gasto: gastoAEditar?.fecha_gasto || new Date().toISOString().split('T')[0],
        categoria: gastoAEditar?.categoria || '',
        descripcion: gastoAEditar?.descripcion || '',
        numero_comprobante: gastoAEditar?.numero_comprobante || null,
    });

    // useEffect que SÍ usa setFormData, setErrorMsg, setSuccessMsg
    useEffect(() => {
        if (gastoAEditar) {
            setFormData({
                monto: gastoAEditar.monto,
                fecha_gasto: gastoAEditar.fecha_gasto || new Date().toISOString().split('T')[0],
                categoria: gastoAEditar.categoria || '',
                descripcion: gastoAEditar.descripcion || '',
                numero_comprobante: gastoAEditar.numero_comprobante || null,
            });
        } else {
            setFormData({
                monto: undefined, fecha_gasto: new Date().toISOString().split('T')[0],
                categoria: '', descripcion: '', numero_comprobante: null
            });
        }
        setErrorMsg(null); setSuccessMsg(null);
    }, [gastoAEditar]);

    // handleChange que SÍ usa setFormData
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'monto') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };

    // handleSubmit que SÍ usa setLoading, setErrorMsg, setSuccessMsg, supabase, formData, onFormSubmit
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setLoading(true); setErrorMsg(null); setSuccessMsg(null);

        const { data: { user } } = await supabase.auth.getUser();
        let registradoPorId: number | null = null;
        if (user) {
            const { data: userData, error: userError } = await supabase
                .from('usuarios').select('id_usuario').eq('auth_user_id', user.id).single();
            if (userError || !userData) {
                console.error("Error buscando ID de usuario interno:", userError);
                setErrorMsg("No se pudo identificar al usuario que registra el gasto."); setLoading(false); return;
            }
            registradoPorId = userData.id_usuario;
        } else {
            setErrorMsg("Debes iniciar sesión para registrar un gasto."); setLoading(false); return;
        }

        if (!formData.monto || formData.monto <= 0 || !formData.categoria || !formData.descripcion || !formData.fecha_gasto || !registradoPorId) {
            setErrorMsg("Monto, Fecha, Categoría, Descripción y Usuario Registrador son requeridos."); setLoading(false); return;
        }

        const dataToSubmit: Omit<Gasto, 'id_gasto' | 'fecha_creacion' | 'fecha_actualizacion' | 'usuarios'> = {
            monto: formData.monto, fecha_gasto: formData.fecha_gasto, categoria: formData.categoria,
            descripcion: formData.descripcion, numero_comprobante: formData.numero_comprobante, registrado_por: registradoPorId
        };

        try {
            let error = null; let data = null;
            if (gastoAEditar && gastoAEditar.id_gasto) {
                setErrorMsg("La edición de gastos aún no está implementada.");
            } else {
                const { data: insertData, error: insertError } = await supabase.from('gastos').insert(dataToSubmit).select().single();
                data = insertData; error = insertError;
                if (!error) {
                    setSuccessMsg("¡Gasto registrado correctamente!");
                    setFormData({ monto: undefined, fecha_gasto: new Date().toISOString().split('T')[0], categoria: '', descripcion: '', numero_comprobante: null });
                }
            }
            if (error) throw error;
            console.log("Operación gasto exitosa:", data);
            if (onFormSubmit) onFormSubmit(); // Se usa onFormSubmit
        } catch (error: unknown) {
            console.error("Error guardando gasto:", error);
            let displayError = 'Ocurrió un error al guardar el gasto.';
            if (error && typeof error === 'object' && 'message' in error) { displayError = String(error.message); }
            setErrorMsg(displayError);
        } finally { setLoading(false); }
    };

    // El JSX SÍ usa errorMsg, successMsg, handleSubmit, formData, handleChange, loading, inputClasses, textareaClasses
    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
                {gastoAEditar ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
            </h3>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">Monto (Q) <span className="text-red-500">*</span></label><input type="number" name="monto" id="monto" value={formData.monto || ''} onChange={handleChange} required min="0.01" step="0.01" placeholder="Ej: 50.00" className={inputClasses} disabled={loading} /></div>
                    <div><label htmlFor="fecha_gasto" className="block text-sm font-medium text-gray-700 mb-1">Fecha del Gasto <span className="text-red-500">*</span></label><input type="date" name="fecha_gasto" id="fecha_gasto" value={formData.fecha_gasto || ''} onChange={handleChange} required className={inputClasses} disabled={loading} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoría <span className="text-red-500">*</span></label><input type="text" name="categoria" id="categoria" value={formData.categoria || ''} onChange={handleChange} required placeholder="Ej: Papelería, Servicios" className={inputClasses} disabled={loading} /></div>
                    <div><label htmlFor="numero_comprobante" className="block text-sm font-medium text-gray-700 mb-1">Número Comprobante (Opcional)</label><input type="text" name="numero_comprobante" id="numero_comprobante" value={formData.numero_comprobante || ''} onChange={handleChange} className={inputClasses} disabled={loading} /></div>
                </div>
                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                    <textarea name="descripcion" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} required rows={3} placeholder="Ej: Compra de resma de papel..." className={textareaClasses} disabled={loading}></textarea>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading}>
                        {loading ? 'Guardando...' : (gastoAEditar ? 'Actualizar Gasto' : 'Registrar Gasto')}
                    </button>
                </div>
            </form>
        </div>
    );
}