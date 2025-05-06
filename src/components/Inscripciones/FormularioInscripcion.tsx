// --- src/components/Inscripciones/FormularioInscripcion.tsx ---
// CORREGIDO: Eliminada la importación no usada de 'Horario'

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
// Se quita Horario de esta importación ya que no se usa aquí
import { Inscripcion, Alumno, Curso } from '../../types';

interface FormularioInscripcionProps {
    inscripcionAEditar?: Inscripcion | null;
    onFormSubmit?: () => void;
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const selectClasses = `${inputClasses} bg-white`;

export default function FormularioInscripcion({ inscripcionAEditar = null, onFormSubmit }: FormularioInscripcionProps) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [alumnos, setAlumnos] = useState<Pick<Alumno, 'id_alumno' | 'nombres' | 'apellidos'>[]>([]);
    const [cursos, setCursos] = useState<Pick<Curso, 'id_curso' | 'nombre_curso'>[]>([]);

    const [formData, setFormData] = useState<Partial<Inscripcion>>({
        id_alumno: inscripcionAEditar?.id_alumno || undefined,
        id_curso: inscripcionAEditar?.id_curso || undefined,
        ciclo_escolar: inscripcionAEditar?.ciclo_escolar || new Date().getFullYear().toString(),
        estado: inscripcionAEditar?.estado || 'Activo',
        estado_pago: inscripcionAEditar?.estado_pago || 'Pendiente',
        notas: inscripcionAEditar?.notas || null,
    });

    // Cargar Alumnos y Cursos al montar
    useEffect(() => {
        const loadAlumnosYCursos = async () => {
            setLoading(true); setErrorMsg(null);
            try {
                const [alumnosRes, cursosRes] = await Promise.all([
                    supabase.from('alumnos').select('id_alumno, nombres, apellidos').order('apellidos', { ascending: true }),
                    supabase.from('cursos').select('id_curso, nombre_curso').eq('activo', true).order('nombre_curso', { ascending: true })
                ]);
                if (alumnosRes.error) throw alumnosRes.error; setAlumnos(alumnosRes.data || []);
                if (cursosRes.error) throw cursosRes.error; setCursos(cursosRes.data || []);
            } catch (error: any) {
                console.error("Error cargando alumnos o cursos:", error);
                setErrorMsg("Error al cargar datos necesarios.");
            } finally { setLoading(false); }
        };
        loadAlumnosYCursos();
    }, []);

    // Efecto para resetear formulario al editar
    useEffect(() => {
        if (inscripcionAEditar) {
            setFormData({
                id_alumno: inscripcionAEditar.id_alumno,
                id_curso: inscripcionAEditar.id_curso,
                ciclo_escolar: inscripcionAEditar.ciclo_escolar,
                estado: inscripcionAEditar.estado,
                estado_pago: inscripcionAEditar.estado_pago,
                notas: inscripcionAEditar.notas || null,
            });
        } else {
            setFormData({
                id_alumno: undefined, id_curso: undefined,
                ciclo_escolar: new Date().getFullYear().toString(),
                estado: 'Activo', estado_pago: 'Pendiente', notas: null
            });
        }
        setErrorMsg(null); setSuccessMsg(null);
    }, [inscripcionAEditar]);

    // Manejador de cambios
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'id_alumno' || name === 'id_curso') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };

    // Manejador de envío
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setLoading(true); setErrorMsg(null); setSuccessMsg(null);

        if (!formData.id_alumno || !formData.id_curso || !formData.ciclo_escolar) {
            setErrorMsg("Alumno, Curso y Ciclo Escolar son requeridos."); setLoading(false); return;
        }

        const dataToSubmit = {
            id_alumno: formData.id_alumno,
            id_curso: formData.id_curso,
            ciclo_escolar: formData.ciclo_escolar,
            estado: formData.estado,
            estado_pago: formData.estado_pago,
            notas: formData.notas,
        };

        try {
            let error = null; let data = null;
            if (inscripcionAEditar && inscripcionAEditar.id_inscripcion) {
                const { data: updateData, error: updateError } = await supabase.from('inscripciones').update(dataToSubmit).eq('id_inscripcion', inscripcionAEditar.id_inscripcion).select().single();
                data = updateData; error = updateError; if (!error) setSuccessMsg("¡Inscripción actualizada!");
            } else {
                const { data: insertData, error: insertError } = await supabase.from('inscripciones').insert(dataToSubmit).select().single();
                data = insertData; error = insertError;
                if (!error) {
                    setSuccessMsg("¡Inscripción creada!");
                    setFormData({ id_alumno: undefined, id_curso: undefined, ciclo_escolar: new Date().getFullYear().toString(), estado: 'Activo', estado_pago: 'Pendiente', notas: null });
                }
            }
            if (error) throw error;
            console.log("Operación inscripción exitosa:", data);
            if (onFormSubmit) onFormSubmit();
        } catch (error: unknown) {
            console.error("Error guardando inscripción:", error);
            let displayError = 'Ocurrió un error al guardar la inscripción.';
            if (error && typeof error === 'object' && 'message' in error) {
                if (String(error.message).includes('inscripciones_id_alumno_id_curso_ciclo_escolar_key')) { displayError = "Este alumno ya está inscrito en este curso para el ciclo escolar especificado."; }
                else { displayError = String(error.message); }
            } setErrorMsg(displayError);
        } finally { setLoading(false); }
    };

    // Renderizado del formulario (sin el select de Horario)
    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
                {inscripcionAEditar ? 'Editar Inscripción' : 'Nueva Inscripción'}
            </h3>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Selector Alumno */}
                <div>
                    <label htmlFor="id_alumno" className="block text-sm font-medium text-gray-700 mb-1">Alumno <span className="text-red-500">*</span></label>
                    <select name="id_alumno" id="id_alumno" value={formData.id_alumno || ''} onChange={handleChange} required className={selectClasses} disabled={loading || !!inscripcionAEditar || alumnos.length === 0}>
                        <option value="" disabled>{alumnos.length === 0 ? 'Cargando...' : 'Selecciona...'}</option>
                        {alumnos.map(alu => (<option key={alu.id_alumno} value={alu.id_alumno}>{alu.apellidos}, {alu.nombres}</option>))}
                    </select>
                    {!!inscripcionAEditar && <p className="text-xs text-gray-500 mt-1">No se puede cambiar al editar.</p>}
                </div>

                {/* Selector Curso */}
                <div>
                    <label htmlFor="id_curso" className="block text-sm font-medium text-gray-700 mb-1">Curso <span className="text-red-500">*</span></label>
                    <select name="id_curso" id="id_curso" value={formData.id_curso || ''} onChange={handleChange} required className={selectClasses} disabled={loading || !!inscripcionAEditar || cursos.length === 0}>
                        <option value="" disabled>{cursos.length === 0 ? 'Cargando...' : 'Selecciona...'}</option>
                        {cursos.map(cur => (<option key={cur.id_curso} value={cur.id_curso}>{cur.nombre_curso}</option>))}
                    </select>
                    {!!inscripcionAEditar && <p className="text-xs text-gray-500 mt-1">No se puede cambiar al editar.</p>}
                </div>

                {/* --- SELECTOR DE HORARIO ELIMINADO --- */}

                {/* Ciclo Escolar */}
                <div>
                    <label htmlFor="ciclo_escolar" className="block text-sm font-medium text-gray-700 mb-1">Ciclo Escolar <span className="text-red-500">*</span></label>
                    <input type="text" name="ciclo_escolar" id="ciclo_escolar" value={formData.ciclo_escolar || ''} onChange={handleChange} required placeholder="Ej: 2025" className={inputClasses} disabled={loading || !!inscripcionAEditar} />
                    {!!inscripcionAEditar && <p className="text-xs text-gray-500 mt-1">No se puede cambiar al editar.</p>}
                </div>

                {/* Estado Inscripción y Estado Pago */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">Estado Inscripción</label>
                        <select name="estado" id="estado" value={formData.estado || 'Activo'} onChange={handleChange} className={selectClasses} disabled={loading}>
                            <option value="Activo">Activo</option><option value="Completado">Completado</option><option value="Retirado">Retirado</option><option value="Pendiente">Pendiente</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="estado_pago" className="block text-sm font-medium text-gray-700 mb-1">Estado Pago</label>
                        <select name="estado_pago" id="estado_pago" value={formData.estado_pago || 'Pendiente'} onChange={handleChange} className={selectClasses} disabled={loading}>
                            <option value="Pagado">Pagado</option><option value="Pendiente">Pendiente</option><option value="Exonerado">Exonerado</option>
                        </select>
                    </div>
                </div>

                {/* Notas */}
                <div>
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                    <textarea name="notas" id="notas" value={formData.notas || ''} onChange={handleChange} rows={3} className={inputClasses} disabled={loading}></textarea>
                </div>

                {/* Botón de Envío */}
                <div className="flex justify-end pt-4">
                    <button type="submit" className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading}>
                        {loading ? 'Guardando...' : (inscripcionAEditar ? 'Actualizar Inscripción' : 'Crear Inscripción')}
                    </button>
                </div>
            </form>
        </div>
    );
}
