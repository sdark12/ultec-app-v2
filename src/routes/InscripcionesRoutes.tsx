// --- src/routes/InscripcionesRoutes.tsx ---
// CORREGIDO: Actualizada la consulta SELECT en EditarInscripcionLayout

import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import ListaInscripciones from '../components/Inscripciones/ListaInscripciones';
import FormularioInscripcion from '../components/Inscripciones/FormularioInscripcion';
import { supabase } from '../lib/supabaseClient';
import { Inscripcion } from '../types';

// Componente Wrapper para la página de Nueva Inscripción (sin cambios)
function NuevaInscripcionLayout() {
    return (
        <>
            <div className="mb-4"><Link to="/inscripciones" className="text-indigo-600 hover:underline text-sm">&larr; Volver a la lista</Link></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Nueva Inscripción</h2>
            <FormularioInscripcion />
        </>
    );
}

// Componente Wrapper para la página de Editar Inscripción (consulta actualizada)
function EditarInscripcionLayout() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInscripcion() {
            if (!id) { setErrorMsg("ID de inscripción no proporcionado."); setLoading(false); return; }
            setLoading(true); setErrorMsg(null);
            try {
                // Consulta CORREGIDA: Ya no pide 'horarios'
                const { data, error } = await supabase
                    .from('inscripciones')
                    .select(`
                        *,
                        alumnos ( id_alumno, nombres, apellidos ),
                        cursos ( id_curso, nombre_curso, modalidad_horario ) 
                    `)
                    .eq('id_inscripcion', parseInt(id, 10))
                    .single();

                if (error) throw error;
                if (data) { setInscripcion(data as Inscripcion); }
                else { setErrorMsg(`Inscripción con ID ${id} no encontrada.`); }
            } catch (error: any) {
                console.error("Error fetching inscripción para editar:", error);
                setErrorMsg(`Error al cargar inscripción: ${error.message}`);
            } finally { setLoading(false); }
        }
        fetchInscripcion();
    }, [id]);

    const handleFormSubmit = () => {
        alert("¡Inscripción actualizada correctamente!");
        navigate('/inscripciones');
    }

    if (loading) return <div className="text-center p-6">Cargando datos de la inscripción...</div>;
    if (errorMsg) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;
    if (!inscripcion) return <div className="text-center p-6">No se encontró la inscripción.</div>;

    return (
        <>
            <div className="mb-4"><Link to="/inscripciones" className="text-indigo-600 hover:underline text-sm">&larr; Volver a la lista</Link></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Editar Inscripción</h2>
            <FormularioInscripcion inscripcionAEditar={inscripcion} onFormSubmit={handleFormSubmit} />
        </>
    );
}


export default function InscripcionesRoutes() {
    return (
        <MainLayout>
            <Routes>
                <Route index element={<ListaInscripciones />} />
                <Route path="nuevo" element={<NuevaInscripcionLayout />} />
                <Route path="editar/:id" element={<EditarInscripcionLayout />} />
            </Routes>
        </MainLayout>
    );
}
