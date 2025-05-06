// --- src/routes/CalificacionesRoutes.tsx ---
// CORREGIDO: Usa ReporteCalificacionesCurso para la ruta index

import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
// import ListaCalificaciones from '../components/Calificaciones/ListaCalificaciones'; // Ya no se importa aquí
import ReporteCalificacionesCurso from '../components/Calificaciones/ReporteCalificacionesCurso'; // <-- Se importa el reporte
import FormularioCalificaciones from '../components/Calificaciones/FormularioCalificaciones';

// Layout para la página de ingreso/edición (sin cambios)
function GestionarCalificacionesLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/calificaciones" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al Reporte de Calificaciones
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ingresar/Editar Calificaciones</h2>
            <FormularioCalificaciones />
        </>
    );
}


export default function CalificacionesRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base: /calificaciones (Mostrar reporte) */}
                <Route index element={<ReporteCalificacionesCurso />} /> {/* <-- Usa el reporte aquí */}
                {/* Ruta para ingresar/editar calificaciones */}
                <Route path="gestionar" element={<GestionarCalificacionesLayout />} />
            </Routes>
        </MainLayout>
    );
}
