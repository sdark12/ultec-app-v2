// --- src/routes/CursosRoutes.tsx ---
// ACTUALIZADO: Añadidas rutas para gestionar evaluaciones de un curso específico

import { Routes, Route, Link, useParams, useNavigate, Outlet } from 'react-router-dom'; // Añadir Outlet
import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import ListaCursosAdmin from '../components/Cursos/ListaCursosAdmin';
import FormularioCurso from '../components/Cursos/FormularioCurso';
import ListaEvaluaciones from '../components/Evaluaciones/ListaEvaluaciones'; // <-- Nuevo
import FormularioEvaluacion from '../components/Evaluaciones/FormularioEvaluacion'; // <-- Nuevo
import { supabase } from '../lib/supabaseClient';
import { Curso, Evaluacion } from '../types'; // <-- Añadir Evaluacion

// Layout para la gestión de un curso específico (incluye evaluaciones)
function GestionCursoLayout() {
    const { id: cursoId } = useParams<{ id: string }>(); // ID del curso
    const [curso, setCurso] = useState<Curso | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar datos básicos del curso para mostrar título, etc.
    useEffect(() => {
        async function fetchCursoData() {
            if (!cursoId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('cursos')
                .select('id_curso, nombre_curso')
                .eq('id_curso', parseInt(cursoId, 10))
                .single();
            if (error) console.error("Error fetching curso data:", error);
            else setCurso(data);
            setLoading(false);
        }
        fetchCursoData();
    }, [cursoId]);

    if (loading) return <div>Cargando información del curso...</div>;
    if (!curso) return <div>Curso no encontrado.</div>;

    return (
        <div>
            <div className="mb-4">
                <Link to="/cursos" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver a la lista de Cursos
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Gestionar Curso: {curso.nombre_curso}
            </h2>

            {/* Outlet renderizará las rutas anidadas (ListaEvaluaciones, FormularioEvaluacion) */}
            <Outlet context={{ cursoId: parseInt(cursoId!, 10), nombreCurso: curso.nombre_curso }} />
        </div>
    );
}

// Layout para el formulario de nueva evaluación
function NuevaEvaluacionLayout() {
    return (
        <>
            {/* Podríamos añadir un enlace para volver a la lista de evaluaciones del curso */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Nueva Evaluación</h3>
            <FormularioEvaluacion />
        </>
    );
}

// Layout para el formulario de editar evaluación
function EditarEvaluacionLayout() {
    const { id: cursoId, evalId } = useParams<{ id: string, evalId: string }>(); // IDs de curso y evaluación
    const navigate = useNavigate();
    const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [curso, setCurso] = useState<Curso | null>(null);

    useEffect(() => {
        async function fetchCursoData() {
            if (!cursoId) return;
            const { data, error } = await supabase
                .from('cursos')
                .select('id_curso, nombre_curso')
                .eq('id_curso', parseInt(cursoId, 10))
                .single();
            if (error) console.error("Error fetching curso data:", error);
            else setCurso(data);
        }
        fetchCursoData();
    }, [cursoId]);

    useEffect(() => {
        async function fetchEvaluacion() {
            if (!evalId) { setErrorMsg("ID de evaluación no proporcionado."); setLoading(false); return; }
            setLoading(true); setErrorMsg(null);
            try {
                const { data, error } = await supabase
                    .from('evaluaciones')
                    .select('*')
                    .eq('id_evaluacion', parseInt(evalId, 10))
                    .single();
                if (error) throw error;
                if (data) { setEvaluacion(data as Evaluacion); }
                else { setErrorMsg(`Evaluación con ID ${evalId} no encontrada.`); }
            } catch (error: any) {
                setErrorMsg(`Error al cargar evaluación: ${error.message}`);
            } finally { setLoading(false); }
        }
        fetchEvaluacion();
    }, [evalId]);

    const handleFormSubmit = () => {
        console.log('📍 Redirigiendo después de actualizar evaluación:', {
            cursoId,
            evalId,
            curso
        });
        navigate(`/cursos/${cursoId}/gestion`);
    }

    if (loading) return <div>Cargando datos de la evaluación...</div>;
    if (errorMsg) return <div className="m-4 p-4 bg-red-100 text-red-700 rounded-md">{errorMsg}</div>;
    if (!evaluacion || !curso) return <div>No se encontró la evaluación o el curso.</div>;

    return (
        <>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Editar Evaluación</h3>
            <FormularioEvaluacion 
                evaluacionAEditar={evaluacion} 
                onFormSubmit={handleFormSubmit}
                context={{ cursoId: curso.id_curso, nombreCurso: curso.nombre_curso }}
            />
        </>
    );
}


export default function CursosRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base: /cursos (Lista de cursos) */}
                <Route index element={<ListaCursosAdmin />} />

                {/* Ruta para crear un nuevo curso */}
                <Route path="nuevo" element={<FormularioCurso />} />

                {/* Ruta para editar un curso existente */}
                <Route path="editar/:id" element={<FormularioCurso />} />

                {/* Rutas anidadas para gestionar un curso específico (incluye evaluaciones) */}
                <Route path=":id/gestion" element={<GestionCursoLayout />}>
                    {/* Ruta índice dentro de la gestión: /cursos/:id/gestion (muestra lista evaluaciones) */}
                    <Route index element={<ListaEvaluaciones />} />
                    {/* Ruta para nueva evaluación: /cursos/:id/gestion/evaluaciones/nueva */}
                    <Route path="evaluaciones/nueva" element={<NuevaEvaluacionLayout />} />
                    {/* Ruta para editar evaluación: /cursos/:id/gestion/evaluaciones/editar/:evalId */}
                    <Route path="evaluaciones/editar/:evalId" element={<EditarEvaluacionLayout />} />
                    {/* Puedes añadir más sub-rutas de gestión aquí */}
                </Route>
            </Routes>
        </MainLayout>
    );
}

