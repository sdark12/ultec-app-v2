// --- src/components/Pagos/FormularioPago.tsx ---
// CORREGIDO: Eliminadas importaciones y estados no usados, corregido error de sintaxis potencial

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pago, Alumno } from '../../types';

interface FormularioPagoProps {
    pagoAEditar?: Pago | null;
    onFormSubmit?: () => void;
}

interface Encargado {
    nombres: string;
    apellidos: string;
    telefono: string;
}

interface AlumnoExtendido {
    codigo_personal_academia: string | null;
    direccion: string | null;
    telefono: string | null;
    encargado?: Encargado | null;
}

interface AlumnoDataResponse {
    codigo_personal_academia: string | null;
    direccion: string | null;
    telefono: string | null;
    encargado: {
        nombres: string;
        apellidos: string;
        telefono: string;
    } | null;
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const selectClasses = `${inputClasses} bg-white`;

export default function FormularioPago({ pagoAEditar = null, onFormSubmit }: FormularioPagoProps) {
    // Estados que SÍ se usan
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [alumnos, setAlumnos] = useState<Pick<Alumno, 'id_alumno' | 'nombres' | 'apellidos'>[]>([]);
    const [alumnosFiltrados, setAlumnosFiltrados] = useState<Pick<Alumno, 'id_alumno' | 'nombres' | 'apellidos'>[]>([]);
    const [busquedaAlumno, setBusquedaAlumno] = useState('');
    const [inscripcionesAlumno, setInscripcionesAlumno] = useState<any[]>([]);
    const [formData, setFormData] = useState<Partial<Pago>>({
        id_alumno: undefined,
        id_inscripcion: undefined,
        monto: undefined,
        fecha_pago: new Date().toISOString().split('T')[0],
        tipo_pago: 'Efectivo',
        concepto: 'Mensualidad',
        numero_recibo: null,
        mes_correspondiente: null,
        notas: null
    });
    const [pagoRegistrado, setPagoRegistrado] = useState<Pago | null>(null);
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<{ nombres: string; apellidos: string } | null>(null);
    const [cursoSeleccionado, setCursoSeleccionado] = useState<{ nombre_curso: string } | null>(null);
    const [mostrarLista, setMostrarLista] = useState(false);

    // Cargar Alumnos
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                const { data: alumnosData, error: alumnosError } = await supabase
                    .from('alumnos')
                    .select('id_alumno, nombres, apellidos')
                    .order('apellidos');
                if (alumnosError) throw alumnosError;
                setAlumnos(alumnosData || []);
                setAlumnosFiltrados(alumnosData || []);
            } catch (error: any) {
                setErrorMsg("Error al cargar datos iniciales.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Efecto para filtrar alumnos
    useEffect(() => {
        const termino = busquedaAlumno.toLowerCase().trim();
        if (termino.length < 2) {
            setAlumnosFiltrados([]);
            setMostrarLista(false);
        } else {
            const filtrados = alumnos.filter(alumno => 
                `${alumno.apellidos} ${alumno.nombres}`.toLowerCase().includes(termino) ||
                `${alumno.nombres} ${alumno.apellidos}`.toLowerCase().includes(termino)
            );
            setAlumnosFiltrados(filtrados);
            setMostrarLista(true);
        }
    }, [busquedaAlumno, alumnos]);

    // Cargar inscripciones del alumno (Usa setLoading, setInscripcionesAlumno, supabase, formData)
    useEffect(() => {
        if (!formData.id_alumno) { setInscripcionesAlumno([]); setFormData(prev => ({ ...prev, id_inscripcion: undefined })); return; }
        const fetchInscripciones = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('inscripciones').select('id_inscripcion, ciclo_escolar, cursos(nombre_curso)').eq('id_alumno', formData.id_alumno).eq('estado', 'Activo');
            if (error) { console.error("Error cargando inscripciones del alumno", error); setInscripcionesAlumno([]); }
            else { setInscripcionesAlumno(data || []); }
            setLoading(false);
        };
        fetchInscripciones();
        setFormData(prev => ({ ...prev, id_inscripcion: undefined }));
    }, [formData.id_alumno]);

    // Resetear formulario (Usa setFormData, setErrorMsg, setSuccessMsg)
    useEffect(() => {
        if (pagoAEditar) {
            setFormData({
                id_alumno: pagoAEditar.id_alumno,
                id_inscripcion: pagoAEditar.id_inscripcion,
                monto: pagoAEditar.monto,
                fecha_pago: pagoAEditar.fecha_pago || new Date().toISOString().split('T')[0],
                tipo_pago: pagoAEditar.tipo_pago || 'Efectivo',
                concepto: pagoAEditar.concepto || 'Mensualidad',
                numero_recibo: pagoAEditar.numero_recibo || null,
                mes_correspondiente: pagoAEditar.mes_correspondiente || null,
                notas: pagoAEditar.notas || null,
            });
            // Establecer el nombre del alumno en el campo de búsqueda
            if (pagoAEditar.alumnos) {
                setBusquedaAlumno(`${pagoAEditar.alumnos.apellidos}, ${pagoAEditar.alumnos.nombres}`);
            }
        } else {
            setFormData({
                id_alumno: undefined,
                id_inscripcion: undefined,
                monto: undefined,
                fecha_pago: new Date().toISOString().split('T')[0],
                tipo_pago: 'Efectivo',
                concepto: 'Mensualidad',
                numero_recibo: null,
                mes_correspondiente: null,
                notas: null
            });
        }
        setErrorMsg(null);
        setSuccessMsg(null);
    }, [pagoAEditar]);

    // Manejador de cambios (Usa setFormData)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'id_alumno' || name === 'id_inscripcion') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : undefined }));
        } else if (name === 'monto') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        }
    };

    // Manejador de envío (Usa setLoading, setErrorMsg, setSuccessMsg, formData, supabase, setFormData, onFormSubmit)
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        setPagoRegistrado(null);

        if (!formData.id_alumno && !formData.id_inscripcion) {
            setErrorMsg("Debe seleccionar un Alumno o una Inscripción específica.");
            setLoading(false);
            return;
        }

        if (!formData.monto || formData.monto <= 0) {
            setErrorMsg("El monto debe ser un número positivo.");
            setLoading(false);
            return;
        }

        if (!formData.concepto || !formData.tipo_pago || !formData.fecha_pago) {
            setErrorMsg("Concepto, Tipo de Pago y Fecha son requeridos.");
            setLoading(false);
            return;
        }

        const dataToSubmit: Partial<Pago> = { ...formData };

        try {
            let error = null;
            let data = null;

            if (pagoAEditar && pagoAEditar.id_pago) {
                const { data: updateData, error: updateError } = await supabase
                    .from('pagos')
                    .update(dataToSubmit)
                    .eq('id_pago', pagoAEditar.id_pago)
                    .select(`
                        *,
                        alumnos (
                            nombres,
                            apellidos
                        ),
                        inscripciones (
                            cursos (
                                nombre_curso
                            )
                        )
                    `)
                    .single();

                data = updateData;
                error = updateError;

                if (!error && data) {
                    setPagoRegistrado(data as Pago);
                    setAlumnoSeleccionado(data.alumnos);
                    setCursoSeleccionado(data.inscripciones?.cursos || null);
                    setSuccessMsg("¡Pago actualizado correctamente!");
                }
            } else {
                const { data: insertData, error: insertError } = await supabase
                    .from('pagos')
                    .insert(dataToSubmit)
                    .select(`
                        *,
                        alumnos (
                            nombres,
                            apellidos
                        ),
                        inscripciones (
                            cursos (
                                nombre_curso
                            )
                        )
                    `)
                    .single();

                data = insertData;
                error = insertError;

                if (!error && data) {
                    setPagoRegistrado(data as Pago);
                    setAlumnoSeleccionado(data.alumnos);
                    setCursoSeleccionado(data.inscripciones?.cursos || null);
                    setSuccessMsg("¡Pago registrado correctamente!");
                    setFormData({
                        id_alumno: undefined,
                        id_inscripcion: undefined,
                        monto: undefined,
                        fecha_pago: new Date().toISOString().split('T')[0],
                        tipo_pago: 'Efectivo',
                        concepto: 'Mensualidad',
                        numero_recibo: null,
                        mes_correspondiente: null,
                        notas: null
                    });
                    setInscripcionesAlumno([]);
                }
            }

            if (error) throw error;
            if (onFormSubmit) onFormSubmit();
        } catch (error: any) {
            console.error("Error guardando pago:", error);
            let displayError = 'Ocurrió un error al guardar el pago.';
            if (error && typeof error === 'object' && 'message' in error) {
                if (String(error.message).includes('pagos_numero_recibo_key')) {
                    displayError = "El número de recibo ingresado ya existe.";
                } else {
                    displayError = String(error.message);
                }
            }
            setErrorMsg(displayError);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!pagoRegistrado || !alumnoSeleccionado) {
            setErrorMsg("No hay datos de pago para imprimir");
            return;
        }

        try {
            const response = await fetch('/src/components/Pagos/ReciboTemplate.html');
            let template = await response.text();

            // Obtener datos adicionales del alumno
            const { data: alumnoData, error: alumnoError } = await supabase
                .from('alumnos')
                .select(`
                    codigo_personal_academia,
                    direccion,
                    telefono,
                    encargado:id_encargado (
                        nombres,
                        apellidos,
                        telefono
                    )
                `)
                .eq('id_alumno', pagoRegistrado.id_alumno)
                .single();

            if (alumnoError) throw alumnoError;

            const alumnoDataTyped = alumnoData as AlumnoDataResponse;
            const alumnoExtendido: AlumnoExtendido = {
                codigo_personal_academia: alumnoDataTyped.codigo_personal_academia,
                direccion: alumnoDataTyped.direccion,
                telefono: alumnoDataTyped.telefono,
                encargado: alumnoDataTyped.encargado
            };

            // Obtener historial de pagos del alumno
            const { data: pagosHistorial, error: pagosError } = await supabase
                .from('pagos')
                .select(`
                    id_pago,
                    fecha_pago,
                    monto,
                    mes_correspondiente
                `)
                .eq('id_alumno', pagoRegistrado.id_alumno)
                .order('fecha_pago', { ascending: true })
                .limit(11);

            if (pagosError) throw pagosError;

            // Preparar los datos de pagos para el template
            const pagosData = Array(11).fill('').map((_, index) => {
                const pago = pagosHistorial?.[index];
                return {
                    monto: pago ? `Q${pago.monto.toFixed(2)}` : '',
                    fecha: pago ? new Date(pago.fecha_pago).toLocaleDateString('es-GT') : ''
                };
            });

            // Formatear la fecha actual
            const fechaActual = new Date().toLocaleDateString('es-GT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

            // Reemplazar todos los placeholders en el template
            template = template
                .replace(/<!-- NOMBRE ALUMNO -->/g, `${alumnoSeleccionado.apellidos}, ${alumnoSeleccionado.nombres}`)
                .replace('<!-- CODIGO ALUMNO -->', alumnoExtendido.codigo_personal_academia || '')
                .replace('<!-- DIRECCION -->', alumnoExtendido.direccion || '')
                .replace('<!-- HORARIO -->', '09:00 pm. - 05:00 pm.')
                .replace('<!-- NOMBRE ENCARGADO -->', alumnoExtendido.encargado ? `${alumnoExtendido.encargado.apellidos}, ${alumnoExtendido.encargado.nombres}` : '')
                .replace('<!-- TELEFONO -->', alumnoExtendido.encargado?.telefono || alumnoExtendido.telefono || '')
                .replace('<!-- CURSO -->', cursoSeleccionado?.nombre_curso || 'N/A')
                .replace('<!-- CANTIDAD -->', '1')
                .replace('<!-- DESCRIPCION DEL PRODUCTO -->', `${pagoRegistrado.concepto} ${pagoRegistrado.mes_correspondiente || ''}`)
                .replace('<!-- PRECIO -->', pagoRegistrado.monto.toFixed(2))
                .replace(/<!-- TOTAL -->/g, pagoRegistrado.monto.toFixed(2))
                .replace('<!-- NOTA O MENSAJE IMPORTANTE -->', pagoRegistrado.notas || 'Todas las colegiaturas se cobran por adelantado')
                .replace('<!-- FECHA ACTUAL -->', fechaActual)
                .replace('<!-- ORDEN -->', pagoRegistrado.id_pago?.toString() || '')
                .replace('<!-- FECHA INSCRIPCION -->', new Date(pagoRegistrado.fecha_pago).toLocaleDateString('es-GT'))
                .replace('<!-- FECHA Y HORA IMPRESION -->', new Date().toLocaleString('es-GT'));

            // Reemplazar los placeholders de pagos
            pagosData.forEach((pago, index) => {
                template = template
                    .replace(`<!-- PAGO${index + 1} -->`, pago.monto)
                    .replace(`<!-- PAGO${index + 1}_FECHA -->`, pago.fecha);
            });

            // Abrir ventana de impresión
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(template);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                    // printWindow.close(); // Opcional: cerrar después de imprimir
            }, 500);
            } else {
                setErrorMsg("No se pudo abrir la ventana de impresión. Por favor, permita las ventanas emergentes.");
            }
        } catch (error) {
            console.error('Error al generar el recibo:', error);
            setErrorMsg("Error al generar el recibo. Por favor, intente de nuevo.");
        }
    };

    const seleccionarAlumno = (alumno: Pick<Alumno, 'id_alumno' | 'nombres' | 'apellidos'>) => {
        setFormData(prev => ({ ...prev, id_alumno: alumno.id_alumno }));
        setBusquedaAlumno(`${alumno.apellidos}, ${alumno.nombres}`);
        setMostrarLista(false);
    };

    // Cerrar la lista al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const searchContainer = document.getElementById('search-container');
            if (searchContainer && !searchContainer.contains(event.target as Node)) {
                setMostrarLista(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // El JSX usa: handleSubmit, errorMsg, successMsg, formData, handleChange, loading, 
    // alumnos, inscripcionesAlumno, selectClasses, inputClasses
    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
                {pagoAEditar ? 'Editar Pago' : 'Registrar Nuevo Pago'}
            </h3>
            {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}
            {successMsg && (
                <div className="mb-4">
                    <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">
                        {successMsg}
                    </div>
                    {pagoRegistrado && (
                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={handlePrint}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                            >
                                Imprimir Recibo
                            </button>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector Alumno con búsqueda */}
                <div id="search-container" className="relative">
                    <label htmlFor="busqueda_alumno" className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar Alumno <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="busqueda_alumno"
                            value={busquedaAlumno}
                            onChange={(e) => setBusquedaAlumno(e.target.value)}
                            onFocus={() => {
                                if (busquedaAlumno.length >= 2) setMostrarLista(true);
                            }}
                            placeholder={pagoAEditar ? "No se puede cambiar al editar" : "Escribe al menos 2 caracteres para buscar..."}
                            className={`${inputClasses} ${pagoAEditar ? '' : 'pr-10'}`}
                            disabled={loading || !!pagoAEditar}
                            required
                        />
                        {!pagoAEditar && formData.id_alumno && (
                            <button
                                type="button"
                                onClick={() => {
                                    setBusquedaAlumno('');
                                    setFormData(prev => ({ ...prev, id_alumno: undefined }));
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    
                    {/* Lista desplegable de resultados */}
                    {mostrarLista && alumnosFiltrados.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md overflow-auto border border-gray-200">
                            {alumnosFiltrados.map(alumno => (
                                <button
                                    key={alumno.id_alumno}
                                    type="button"
                                    onClick={() => seleccionarAlumno(alumno)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                    <span className="font-medium">{alumno.apellidos}</span>, {alumno.nombres}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Mensajes de ayuda */}
                    {busquedaAlumno.length > 0 && busquedaAlumno.length < 2 && (
                        <p className="mt-1 text-sm text-gray-500">
                            Escribe al menos 2 caracteres para ver resultados
                        </p>
                    )}
                    {busquedaAlumno.length >= 2 && alumnosFiltrados.length === 0 && !formData.id_alumno && (
                        <p className="mt-1 text-sm text-gray-500">
                            No se encontraron alumnos
                        </p>
                    )}
                    {!!pagoAEditar && (
                        <p className="mt-1 text-sm text-gray-500">
                            No se puede cambiar al editar
                        </p>
                    )}
                </div>

                {/* Selector Inscripción */}
                <div>
                    <label htmlFor="id_inscripcion" className="block text-sm font-medium text-gray-700 mb-1">Inscripción Asociada (Opcional)</label>
                    <select 
                        name="id_inscripcion" 
                        id="id_inscripcion" 
                        value={formData.id_inscripcion || ''} 
                        onChange={handleChange} 
                        className={selectClasses} 
                        disabled={loading || !formData.id_alumno || inscripcionesAlumno.length === 0 || !!pagoAEditar}
                    >
                        <option value="">-- Pago General --</option>
                        {inscripcionesAlumno.map(insc => (
                            <option key={insc.id_inscripcion} value={insc.id_inscripcion}>
                                {insc.cursos?.nombre_curso} ({insc.ciclo_escolar})
                            </option>
                        ))}
                    </select>
                    {!!pagoAEditar && <p className="text-xs text-gray-500 mt-1">No se puede cambiar al editar.</p>}
                    {!formData.id_alumno && <p className="text-xs text-gray-500 mt-1">Selecciona un alumno para ver sus inscripciones.</p>}
                </div>

                {/* Monto y Fecha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">Monto (Q) <span className="text-red-500">*</span></label>
                        <input type="number" name="monto" id="monto" value={formData.monto || ''} onChange={handleChange} required min="0.01" step="0.01" placeholder="Ej: 150.00" className={inputClasses} disabled={loading} />
                    </div>
                    <div>
                        <label htmlFor="fecha_pago" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago <span className="text-red-500">*</span></label>
                        <input type="date" name="fecha_pago" id="fecha_pago" value={formData.fecha_pago || ''} onChange={handleChange} required className={inputClasses} disabled={loading} />
                    </div>
                </div>

                {/* Concepto y Tipo de Pago */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="concepto" className="block text-sm font-medium text-gray-700 mb-1">Concepto <span className="text-red-500">*</span></label>
                        <select name="concepto" id="concepto" value={formData.concepto || 'Mensualidad'} onChange={handleChange} required className={selectClasses} disabled={loading}>
                            <option value="Inscripción">Inscripción</option><option value="Mensualidad">Mensualidad</option><option value="Material">Material</option><option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tipo_pago" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago <span className="text-red-500">*</span></label>
                        <select name="tipo_pago" id="tipo_pago" value={formData.tipo_pago || 'Efectivo'} onChange={handleChange} required className={selectClasses} disabled={loading}>
                            <option value="Efectivo">Efectivo</option><option value="Transferencia">Transferencia</option><option value="Cheque">Cheque</option><option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>

                {/* Mes Correspondiente y Número Recibo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="mes_correspondiente" className="block text-sm font-medium text-gray-700 mb-1">Mes Correspondiente (si aplica)</label>
                        <input type="text" name="mes_correspondiente" id="mes_correspondiente" value={formData.mes_correspondiente || ''} onChange={handleChange} placeholder="Ej: Mayo 2025" className={inputClasses} disabled={loading} />
                    </div>
                    <div>
                        <label htmlFor="numero_recibo" className="block text-sm font-medium text-gray-700 mb-1">Número Recibo/Factura (Opcional)</label>
                        <input type="text" name="numero_recibo" id="numero_recibo" value={formData.numero_recibo || ''} onChange={handleChange} className={inputClasses} disabled={loading} />
                    </div>
                </div>

                {/* Notas */}
                <div>
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                    <textarea name="notas" id="notas" value={formData.notas || ''} onChange={handleChange} rows={3} className={inputClasses} disabled={loading}></textarea>
                </div>

                {/* Botón de Envío */}
                <div className="flex justify-end pt-4">
                    <button type="submit" className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading}>
                        {loading ? 'Guardando...' : (pagoAEditar ? 'Actualizar Pago' : 'Registrar Pago')}
                    </button>
                </div>
            </form>
        </div>
    );
}
