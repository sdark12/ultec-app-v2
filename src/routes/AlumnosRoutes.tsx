
// --- src/routes/AlumnosRoutes.tsx ---
// Define las rutas anidadas para la sección de Alumnos, incluyendo Editar

import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom'; // Añadir useParams, useNavigate
import { useState, useEffect } from 'react'; // Añadir hooks
import MainLayout from '../components/Layout/MainLayout';
import ListaAlumnos from '../components/Alumnos/ListaAlumnos';
import FormularioAlumno from '../components/Alumnos/FormularioAlumno';
import { supabase } from '../lib/supabaseClient'; // Importar supabase
import { Alumno } from '../types'; // Importar tipo Alumno

// Componente Wrapper para la página de Nuevo Alumno
function NuevoAlumnoLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/alumnos" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver a la lista de Alumnos
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Añadir Nuevo Alumno</h2>
            <FormularioAlumno />
        </>
    );
}

// Componente Wrapper para la página de Editar Alumno
function EditarAlumnoLayout() {
    const { id } = useParams<{ id: string }>(); // Obtiene el 'id' de la URL
    const navigate = useNavigate();
    const [alumno, setAlumno] = useState<Alumno | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAlumno() {
            if (!id) {
                setErrorMsg("ID de alumno no proporcionado.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setErrorMsg(null);
            try {
                // Busca el alumno por ID (requiere RLS SELECT)
                const { data, error } = await supabase
                    .from('alumnos')
                    .select('*') // Selecciona todas las columnas para editar
                    .eq('id_alumno', parseInt(id, 10)) // Convierte id a número
                    .single(); // Espera solo un resultado

                if (error) throw error;
                if (data) {
                    setAlumno(data as Alumno);
                } else {
                    setErrorMsg(`Alumno con ID ${id} no encontrado.`);
                }
            } catch (error: any) {
                console.error("Error fetching alumno para editar:", error);
                setErrorMsg(`Error al cargar alumno: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
        fetchAlumno();
    }, [id]); // Se ejecuta cuando el id cambia

    // Callback para ejecutar después de que el formulario se envíe con éxito
    const handleFormSubmit = () => {
        alert("Alumno actualizado correctamente!");
        navigate('/alumnos'); // Vuelve a la lista después de editar
    }

    if (loading) return <div className="text-center p-6">Cargando datos del alumno...</div>;
    if (errorMsg) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;
    if (!alumno) return <div className="text-center p-6">No se encontró el alumno.</div>; // Seguridad adicional

    return (
        <>
            <div className="mb-4">
                <Link to="/alumnos" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver a la lista de Alumnos
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Editar Alumno</h2>
            {/* Pasa el alumno encontrado y el callback al formulario */}
            <FormularioAlumno alumnoAEditar={alumno} onFormSubmit={handleFormSubmit} />
        </>
    );
}


export default function AlumnosRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base: /alumnos */}
                <Route index element={<ListaAlumnos />} />
                {/* Ruta nuevo: /alumnos/nuevo */}
                <Route path="nuevo" element={<NuevoAlumnoLayout />} />
                {/* Ruta editar: /alumnos/editar/:id */}
                <Route path="editar/:id" element={<EditarAlumnoLayout />} />
            </Routes>
        </MainLayout>
    );
}
