// --- src/components/Alumnos/FormularioAlumno.tsx ---
// Componente con el formulario para añadir/editar alumnos

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Ajusta la ruta
import { Alumno, Encargado } from '../../types'; // Importa el tipo definido
import { useNavigate } from 'react-router-dom';

// Props opcionales si se usa para editar
interface FormularioAlumnoProps {
    alumnoAEditar?: Alumno | null;
    onFormSubmit?: () => void; // Función para ejecutar después de enviar (ej. cerrar modal)
}

export default function FormularioAlumno({ alumnoAEditar = null, onFormSubmit }: FormularioAlumnoProps) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const navigate = useNavigate();
    const [encargados, setEncargados] = useState<Encargado[]>([]);
    const [loadingEncargados, setLoadingEncargados] = useState(false);

    // Estado para los campos del formulario, inicializado si se edita
    const [formData, setFormData] = useState<Partial<Alumno>>({
        codigo_personal_academia: alumnoAEditar?.codigo_personal_academia || '',
        codigo_personal_mineduc: alumnoAEditar?.codigo_personal_mineduc || null,
        nombres: alumnoAEditar?.nombres || '',
        apellidos: alumnoAEditar?.apellidos || '',
        genero: alumnoAEditar?.genero || 'Otro', // Default a 'Otro'
        fecha_nacimiento: alumnoAEditar?.fecha_nacimiento || '',
        direccion: alumnoAEditar?.direccion || '',
        telefono: alumnoAEditar?.telefono || '',
        nivel_educativo: alumnoAEditar?.nivel_educativo || '',
        id_encargado: alumnoAEditar?.id_encargado || null,
        numero_ingreso: alumnoAEditar?.numero_ingreso || 1,
    });

    // Cargar encargados
    const cargarEncargados = async () => {
        try {
            setLoadingEncargados(true);
            const { data, error } = await supabase
                .from('encargados')
                .select('*')
                .order('nombres', { ascending: true });

            if (error) throw error;
            setEncargados(data || []);
        } catch (error: any) {
            console.error('Error cargando encargados:', error);
            setErrorMsg('Error al cargar la lista de encargados');
        } finally {
            setLoadingEncargados(false);
        }
    };

    // Efecto para cargar encargados al montar el componente
    useEffect(() => {
        cargarEncargados();
    }, []);

    // Efecto para resetear el formulario si cambia el alumno a editar
    useEffect(() => {
        setFormData({
            codigo_personal_academia: alumnoAEditar?.codigo_personal_academia || '',
            codigo_personal_mineduc: alumnoAEditar?.codigo_personal_mineduc || null,
            nombres: alumnoAEditar?.nombres || '',
            apellidos: alumnoAEditar?.apellidos || '',
            genero: alumnoAEditar?.genero || 'Otro',
            fecha_nacimiento: alumnoAEditar?.fecha_nacimiento || '',
            direccion: alumnoAEditar?.direccion || '',
            telefono: alumnoAEditar?.telefono || '',
            nivel_educativo: alumnoAEditar?.nivel_educativo || '',
            id_encargado: alumnoAEditar?.id_encargado || null,
            numero_ingreso: alumnoAEditar?.numero_ingreso || 1,
        });
        setErrorMsg(null);
        setSuccessMsg(null);
    }, [alumnoAEditar]);


    // Manejador de cambios genérico para inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Manejo especial para checkboxes si los hubiera
        // if (type === 'checkbox') {
        //   setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        //   return;
        // }

        // Manejo para números si es necesario
        if (type === 'number') {
            // Convertir a número o dejar null si está vacío
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : value // Guardar null si el campo se vacía (excepto los requeridos)
        }));
    };

    // Manejador del envío del formulario
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        // Validación básica (puedes añadir más)
        if (!formData.codigo_personal_academia || !formData.nombres || !formData.apellidos || !formData.fecha_nacimiento || !formData.genero) {
            setErrorMsg("Por favor, completa todos los campos requeridos (*).");
            setLoading(false);
            return;
        }

        try {
            let error = null;
            let data = null;

            // Lógica para insertar o actualizar
            // NOTA: Requiere RLS INSERT/UPDATE para 'administrador' o 'secretaria'
            if (alumnoAEditar && alumnoAEditar.id_alumno) {
                // --- Actualizar Alumno ---
                const { data: updateData, error: updateError } = await supabase
                    .from('alumnos')
                    .update(formData) // Envía solo los campos del estado formData
                    .eq('id_alumno', alumnoAEditar.id_alumno) // Condición para actualizar
                    .select() // Opcional: para obtener el registro actualizado
                    .single(); // Opcional: si esperas solo un resultado
                data = updateData;
                error = updateError;
                if (!error) setSuccessMsg("¡Alumno actualizado correctamente!");

            } else {
                // --- Insertar Nuevo Alumno ---
                // Asegurarse de que numero_ingreso tenga valor si no se editó
                const dataToInsert = { ...formData, numero_ingreso: formData.numero_ingreso || 1 };
                const { data: insertData, error: insertError } = await supabase
                    .from('alumnos')
                    .insert(dataToInsert) // Inserta los datos del formulario
                    .select() // Opcional
                    .single(); // Opcional
                data = insertData;
                error = insertError;
                if (!error) setSuccessMsg("¡Alumno creado correctamente!");
            }

            if (error) throw error;

            console.log("Operación exitosa:", data);

            // Ejecutar callback si existe (ej. cerrar modal)
            if (onFormSubmit) {
                onFormSubmit();
            } else {
                // Opcional: Redirigir a la lista después de crear/editar
                setTimeout(() => navigate('/alumnos'), 1500); // Espera 1.5s
            }


        } catch (error: unknown) {
            console.error("Error guardando alumno:", error);
            let displayError = 'Ocurrió un error al guardar el alumno.';
            if (error && typeof error === 'object' && 'message' in error) {
                // Podrías personalizar más mensajes de error aquí si conoces los códigos
                displayError = String(error.message);
            }
            setErrorMsg(displayError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
                {alumnoAEditar ? 'Editar Alumno' : 'Añadir Nuevo Alumno'}
            </h3>

            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{successMsg}</div>}


            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Fila 1: Códigos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="codigo_personal_academia" className="block text-sm font-medium text-gray-700 mb-1">
                            Código Academia <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="codigo_personal_academia"
                            id="codigo_personal_academia"
                            value={formData.codigo_personal_academia || ''}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="codigo_personal_mineduc" className="block text-sm font-medium text-gray-700 mb-1">
                            Código MINEDUC (Opcional)
                        </label>
                        <input
                            type="text"
                            name="codigo_personal_mineduc"
                            id="codigo_personal_mineduc"
                            value={formData.codigo_personal_mineduc || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Fila 2: Nombres y Apellidos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombres <span className="text-red-500">*</span>
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
                            Apellidos <span className="text-red-500">*</span>
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
                </div>

                {/* Fila 3: Género y Fecha Nacimiento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-1">
                            Género <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="genero"
                            id="genero"
                            value={formData.genero || 'Otro'}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                            disabled={loading}
                        >
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Nacimiento <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="fecha_nacimiento"
                            id="fecha_nacimiento"
                            value={formData.fecha_nacimiento || ''}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Fila 4: Dirección y Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección (Opcional)
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
                    <div>
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono (Opcional)
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            id="telefono"
                            value={formData.telefono || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Fila 5: Nivel Educativo y Número Ingreso */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nivel_educativo" className="block text-sm font-medium text-gray-700 mb-1">
                            Nivel Educativo Actual (Opcional)
                        </label>
                        <input
                            type="text"
                            name="nivel_educativo"
                            id="nivel_educativo"
                            placeholder="Ej: Primero Básico"
                            value={formData.nivel_educativo || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                    {!alumnoAEditar && (
                        <div>
                            <label htmlFor="numero_ingreso" className="block text-sm font-medium text-gray-700 mb-1">
                                Número de Ingreso
                            </label>
                            <input
                                type="number"
                                name="numero_ingreso"
                                id="numero_ingreso"
                                value={formData.numero_ingreso || 1}
                                onChange={handleChange}
                                min="1"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                disabled={loading}
                            />
                        </div>
                    )}
                </div>

                {/* Selector de Encargado */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="id_encargado" className="block text-sm font-medium text-gray-700 mb-1">
                            Encargado
                        </label>
                        <div className="flex gap-2 items-center">
                            <select
                                name="id_encargado"
                                id="id_encargado"
                                value={formData.id_encargado || ''}
                                onChange={handleChange}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                                disabled={loading || loadingEncargados}
                            >
                                <option value="">Seleccione un encargado</option>
                                {encargados.map((encargado) => (
                                    <option key={encargado.id_encargado} value={encargado.id_encargado}>
                                        {encargado.nombres} {encargado.apellidos} - {encargado.relacion_parentesco || 'Sin relación especificada'}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => navigate('/encargados/nuevo')}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
                                disabled={loading}
                            >
                                Nuevo Encargado
                            </button>
                        </div>
                        {loadingEncargados && (
                            <p className="mt-1 text-sm text-gray-500">Cargando encargados...</p>
                        )}
                    </div>
                </div>

                {/* TODO: Añadir Selects para Centro Educativo y Encargado si es necesario */}
                {/* Estos requerirían cargar datos de las tablas 'centros_educativos' y 'encargados' */}


                {/* Botón de Envío */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (alumnoAEditar ? 'Actualizar Alumno' : 'Crear Alumno')}
                    </button>
                    {/* Botón Cancelar (opcional, útil en modales) */}
                    {/* <button type="button" onClick={() => navigate('/alumnos')} className="ml-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
               Cancelar
           </button> */}
                </div>
            </form>
        </div>
    );
}