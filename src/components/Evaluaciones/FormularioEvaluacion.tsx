// --- src/components/Evaluaciones/FormularioEvaluacion.tsx ---
// CORREGIDO: Restaurada la firma correcta de handleChange

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Evaluacion } from '../../types';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';

interface FormularioEvaluacionProps {
    evaluacionAEditar?: Evaluacion | null;
    onFormSubmit?: () => void;
    context?: CursoContextType;
}

interface CursoContextType {
    cursoId: number;
    nombreCurso: string;
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

export default function FormularioEvaluacion({ evaluacionAEditar = null, onFormSubmit, context }: FormularioEvaluacionProps) {
    const outletContext = useOutletContext<CursoContextType | null>();
    const params = useParams<{ id?: string }>();
    const cursoId = evaluacionAEditar?.id_curso || context?.cursoId || outletContext?.cursoId || (params.id ? parseInt(params.id, 10) : undefined);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showBackButton, setShowBackButton] = useState(false);

    const [formData, setFormData] = useState<Partial<Evaluacion>>({
        id_curso: cursoId,
        nombre: '',
        descripcion: null,
        nota_maxima: 100.00,
        ponderacion: 0.0,
        fecha: null,
        bimestre: 1,
    });

    useEffect(() => {
        if (evaluacionAEditar && !showBackButton) {
            console.log('🔄 useEffect - Cargando datos de evaluación');
            setFormData({
                id_curso: evaluacionAEditar.id_curso,
                nombre: evaluacionAEditar.nombre || '',
                descripcion: evaluacionAEditar.descripcion || null,
                nota_maxima: evaluacionAEditar.nota_maxima || 100.00,
                ponderacion: typeof evaluacionAEditar.ponderacion === 'number' ? evaluacionAEditar.ponderacion : 0.0,
                fecha: evaluacionAEditar.fecha || null,
                bimestre: evaluacionAEditar.bimestre || 1,
            });
        }
    }, [evaluacionAEditar, showBackButton]);

    // CORRECCIÓN: Se vuelve a añadir HTMLSelectElement al tipo del evento
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'number') {
            const numValue = value === '' ? null : parseFloat(value);
            if (name === 'ponderacion') {
                setFormData(prev => ({ ...prev, [name]: numValue !== null ? numValue / 100 : undefined }));
            } else {
                setFormData(prev => ({ ...prev, [name]: numValue !== null ? numValue : undefined }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) return;
        
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        setShowBackButton(false);

        console.log('🟡 Iniciando actualización de evaluación:', {
            idCurso: cursoId,
            idEvaluacion: evaluacionAEditar?.id_evaluacion,
            formData
        });

        try {
            if (!formData.nombre || formData.ponderacion === null || formData.ponderacion === undefined || !formData.id_curso) {
                throw new Error("Nombre, Ponderación y Curso son requeridos.");
            }

            if (formData.ponderacion < 0 || formData.ponderacion > 1) {
                throw new Error("La ponderación debe estar entre 0% y 100%.");
            }

            const dataToSubmit = {
                ...formData,
                nota_maxima: formData.nota_maxima ? Number(formData.nota_maxima) : 100.00,
                ponderacion: formData.ponderacion
            };

            let response;
            if (evaluacionAEditar?.id_evaluacion) {
                response = await supabase
                    .from('evaluaciones')
                    .update(dataToSubmit)
                    .eq('id_evaluacion', evaluacionAEditar.id_evaluacion)
                    .select()
                    .single();
            } else {
                response = await supabase
                    .from('evaluaciones')
                    .insert(dataToSubmit)
                    .select()
                    .single();
            }

            if (response.error) throw response.error;

            console.log('✅ Evaluación actualizada exitosamente:', response.data);
            setSuccessMsg('¡Evaluación actualizada!');
            setShowBackButton(true);
            
            if (onFormSubmit) {
                console.log('📣 Llamando callback onSuccess');
                onFormSubmit();
            }

        } catch (error: any) {
            console.error('❌ Error en handleSubmit:', error);
            setErrorMsg(error.message || 'Ocurrió un error al guardar la evaluación.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        const rutaDestino = `/cursos/${cursoId}/gestion`;
        console.log('🎯 Redirigiendo a:', rutaDestino, {
            cursoId,
            context,
            outletContext,
            params
        });
        navigate(rutaDestino);
    };

    // Agregar log en el render
    console.log('🎨 Renderizando FormularioEvaluacion:', {
        cursoId,
        evaluacionAEditar,
        loading,
        errorMsg,
        successMsg,
        formData,
    });

    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-xl mx-auto">
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
                    {successMsg}
                    {showBackButton && (
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={handleBack}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
                                type="button"
                            >
                                Regresar a Evaluaciones
                            </button>
                        </div>
                    )}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Evaluación</label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="bimestre" className="block text-sm font-medium text-gray-700">Bimestre</label>
                        <select
                            id="bimestre"
                            name="bimestre"
                            value={formData.bimestre}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            required
                        >
                            <option value={1}>Primer Bimestre</option>
                            <option value={2}>Segundo Bimestre</option>
                            <option value={3}>Tercer Bimestre</option>
                            <option value={4}>Cuarto Bimestre</option>
                        </select>
                    </div>
                </div>
                <div><label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label><textarea name="descripcion" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows={3} className={inputClasses} disabled={loading}></textarea></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label htmlFor="nota_maxima" className="block text-sm font-medium text-gray-700 mb-1">Nota Máxima</label><input type="number" name="nota_maxima" id="nota_maxima" value={formData.nota_maxima || ''} onChange={handleChange} min="0" step="0.01" className={inputClasses} disabled={loading} /></div>
                    <div><label htmlFor="ponderacion_input" className="block text-sm font-medium text-gray-700 mb-1">Ponderación (%) <span className="text-red-500">*</span></label><input type="number" name="ponderacion" id="ponderacion_input" value={formData.ponderacion !== null && formData.ponderacion !== undefined ? (formData.ponderacion * 100).toFixed(0) : ''} onChange={handleChange} min="0" max="100" step="1" required className={inputClasses} disabled={loading} placeholder="Ej: 20" /><p className="text-xs text-gray-500 mt-1">Valor entre 0 y 100.</p></div>
                    <div><label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">Fecha (Opcional)</label><input type="date" name="fecha" id="fecha" value={formData.fecha || ''} onChange={handleChange} className={inputClasses} disabled={loading} /></div>
                </div>
                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (evaluacionAEditar ? 'Actualizar Evaluación' : 'Crear Evaluación')}
                    </button>
                </div>
            </form>
        </div>
    );
}