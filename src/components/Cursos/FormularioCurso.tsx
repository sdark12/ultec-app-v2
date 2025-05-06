// --- src/components/Cursos/FormularioCurso.tsx ---
// CORREGIDO: Reemplazada la clase 'input-estilo' por clases reales de Tailwind

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Curso, TipoCurso } from '../../types';

interface FormularioCursoProps {
    cursoAEditar?: Curso | null;
    onFormSubmit?: () => void;
}

// Define estilos comunes para inputs para reutilizar
const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const selectClasses = `${inputClasses} bg-white`; // Añade bg-white para select

export default function FormularioCurso({ cursoAEditar = null, onFormSubmit }: FormularioCursoProps) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [tiposDeCurso, setTiposDeCurso] = useState<TipoCurso[]>([]);

    const [formData, setFormData] = useState<Partial<Curso>>({
        nombre_curso: cursoAEditar?.nombre_curso || '',
        id_tipo_curso: cursoAEditar?.id_tipo_curso || undefined,
        descripcion: cursoAEditar?.descripcion || null,
        duracion_horas: cursoAEditar?.duracion_horas || null,
        nivel_academico: cursoAEditar?.nivel_academico || null,
        activo: cursoAEditar?.activo ?? true,
    });

    useEffect(() => {
        async function fetchTiposCurso() {
            const { data, error } = await supabase.from('tipos_curso').select('id_tipo_curso, nombre');
            if (error) {
                console.error("Error fetching tipos de curso:", error);
                setErrorMsg("No se pudieron cargar los tipos de curso.");
            } else if (data) {
                setTiposDeCurso(data as TipoCurso[]);
            }
        }
        fetchTiposCurso();
    }, []);

    useEffect(() => {
        setFormData({
            nombre_curso: cursoAEditar?.nombre_curso || '',
            id_tipo_curso: cursoAEditar?.id_tipo_curso || (cursoAEditar as any)?.tipos_curso?.id_tipo_curso || undefined,
            descripcion: cursoAEditar?.descripcion || null,
            duracion_horas: cursoAEditar?.duracion_horas || null,
            nivel_academico: cursoAEditar?.nivel_academico || null,
            activo: cursoAEditar?.activo ?? true,
        });
        setErrorMsg(null); setSuccessMsg(null);
    }, [cursoAEditar]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked })); return;
        }
        if (type === 'number') {
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue })); return;
        }
        if (name === 'id_tipo_curso') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : undefined })); return;
        }
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setLoading(true); setErrorMsg(null); setSuccessMsg(null);
        if (!formData.nombre_curso || formData.id_tipo_curso === undefined) {
            setErrorMsg("Nombre del curso y Tipo de curso son requeridos."); setLoading(false); return;
        }
        const dataToSubmit = { ...formData, duracion_horas: formData.duracion_horas ? Number(formData.duracion_horas) : null, };

        try {
            let error = null; let data = null;
            if (cursoAEditar && cursoAEditar.id_curso) {
                const { data: updateData, error: updateError } = await supabase.from('cursos').update(dataToSubmit).eq('id_curso', cursoAEditar.id_curso).select().single();
                data = updateData; error = updateError;
                if (!error) setSuccessMsg("¡Curso actualizado!");
            } else {
                const { data: insertData, error: insertError } = await supabase.from('cursos').insert(dataToSubmit).select().single();
                data = insertData; error = insertError;
                if (!error) setSuccessMsg("¡Curso creado!");
            }
            if (error) throw error;
            console.log("Operación curso exitosa:", data);
            if (onFormSubmit) onFormSubmit();
        } catch (error: unknown) {
            console.error("Error guardando curso:", error);
            let displayError = 'Ocurrió un error al guardar el curso.';
            if (error && typeof error === 'object' && 'message' in error) { displayError = String(error.message); }
            setErrorMsg(displayError);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
                {cursoAEditar ? 'Editar Curso' : 'Añadir Nuevo Curso'}
            </h3>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{successMsg}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombre_curso" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Curso <span className="text-red-500">*</span></label>
                        {/* Aplicar clases Tailwind directamente */}
                        <input type="text" name="nombre_curso" id="nombre_curso" value={formData.nombre_curso || ''} onChange={handleChange} required className={inputClasses} disabled={loading} />
                    </div>
                    <div>
                        <label htmlFor="id_tipo_curso" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Curso <span className="text-red-500">*</span></label>
                        {/* Aplicar clases Tailwind directamente */}
                        <select name="id_tipo_curso" id="id_tipo_curso" value={formData.id_tipo_curso || ''} onChange={handleChange} required className={selectClasses} disabled={loading || tiposDeCurso.length === 0}>
                            <option value="" disabled>Selecciona un tipo...</option>
                            {tiposDeCurso.map(tipo => (
                                <option key={tipo.id_tipo_curso} value={tipo.id_tipo_curso}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                    {/* Aplicar clases Tailwind directamente */}
                    <textarea name="descripcion" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows={3} className={inputClasses} disabled={loading}></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="duracion_horas" className="block text-sm font-medium text-gray-700 mb-1">Duración (Horas, Opcional)</label>
                        {/* Aplicar clases Tailwind directamente */}
                        <input type="number" name="duracion_horas" id="duracion_horas" value={formData.duracion_horas || ''} onChange={handleChange} min="0" className={inputClasses} disabled={loading} />
                    </div>
                    <div>
                        <label htmlFor="nivel_academico" className="block text-sm font-medium text-gray-700 mb-1">Nivel Académico (Ej: Primero Básico, Opcional)</label>
                        {/* Aplicar clases Tailwind directamente */}
                        <input type="text" name="nivel_academico" id="nivel_academico" value={formData.nivel_academico || ''} onChange={handleChange} className={inputClasses} disabled={loading} />
                    </div>
                </div>

                <div className="flex items-center">
                    <input id="activo" name="activo" type="checkbox" checked={formData.activo} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" disabled={loading} />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">Curso Activo</label>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading}>
                        {loading ? 'Guardando...' : (cursoAEditar ? 'Actualizar Curso' : 'Crear Curso')}
                    </button>
                </div>
            </form>
        </div>
    );
}
