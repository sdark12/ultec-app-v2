import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Encargado } from '../../types';

interface FormularioEncargadoProps {
    encargadoAEditar?: Encargado | null;
    onFormSubmit?: () => void;
}

export default function FormularioEncargado({ encargadoAEditar = null, onFormSubmit }: FormularioEncargadoProps) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Estado para los campos del formulario
    const [formData, setFormData] = useState<Partial<Encargado>>({
        nombres: encargadoAEditar?.nombres || '',
        apellidos: encargadoAEditar?.apellidos || '',
        telefono: encargadoAEditar?.telefono || '',
        relacion_parentesco: encargadoAEditar?.relacion_parentesco || null,
        direccion: encargadoAEditar?.direccion || null,
        correo_electronico: encargadoAEditar?.correo_electronico || null
    });

    // Manejador de cambios
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    };

    // Manejador de envío
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        // Validación básica
        if (!formData.nombres || !formData.apellidos || !formData.telefono) {
            setErrorMsg("Nombres, apellidos y teléfono son campos requeridos.");
            setLoading(false);
            return;
        }

        try {
            let error = null;
            let data = null;

            if (encargadoAEditar && encargadoAEditar.id_encargado) {
                // Actualizar encargado existente
                const { data: updateData, error: updateError } = await supabase
                    .from('encargados')
                    .update(formData)
                    .eq('id_encargado', encargadoAEditar.id_encargado)
                    .select()
                    .single();
                data = updateData;
                error = updateError;
            } else {
                // Crear nuevo encargado
                const { data: insertData, error: insertError } = await supabase
                    .from('encargados')
                    .insert(formData)
                    .select()
                    .single();
                data = insertData;
                error = insertError;
            }

            if (error) throw error;

            setSuccessMsg(encargadoAEditar 
                ? "¡Encargado actualizado correctamente!" 
                : "¡Encargado registrado correctamente!");

            // Resetear formulario si es nuevo
            if (!encargadoAEditar) {
                setFormData({
                    nombres: '',
                    apellidos: '',
                    telefono: '',
                    relacion_parentesco: null,
                    direccion: null,
                    correo_electronico: null
                });
            }

            if (onFormSubmit) onFormSubmit();
        } catch (error: any) {
            console.error("Error guardando encargado:", error);
            setErrorMsg(error.message || "Ocurrió un error al guardar el encargado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">
                {encargadoAEditar ? 'Editar Encargado' : 'Nuevo Encargado'}
            </h2>

            {errorMsg && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errorMsg}
                </div>
            )}

            {successMsg && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombres *
                        </label>
                        <input
                            type="text"
                            name="nombres"
                            id="nombres"
                            value={formData.nombres || ''}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                            Apellidos *
                        </label>
                        <input
                            type="text"
                            name="apellidos"
                            id="apellidos"
                            value={formData.apellidos || ''}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            id="telefono"
                            value={formData.telefono || ''}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="relacion_parentesco" className="block text-sm font-medium text-gray-700 mb-1">
                            Relación Parentesco
                        </label>
                        <input
                            type="text"
                            name="relacion_parentesco"
                            id="relacion_parentesco"
                            value={formData.relacion_parentesco || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección
                        </label>
                        <input
                            type="text"
                            name="direccion"
                            id="direccion"
                            value={formData.direccion || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="correo_electronico" className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            name="correo_electronico"
                            id="correo_electronico"
                            value={formData.correo_electronico || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : (encargadoAEditar ? 'Actualizar' : 'Guardar')}
                    </button>
                </div>
            </form>
        </div>
    );
} 