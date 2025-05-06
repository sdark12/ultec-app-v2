// --- src/routes/AsistenciasRoutes.tsx ---
// NUEVO ARCHIVO: Define las rutas anidadas para la sección de Asistencias

import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ListaAsistencias from '../components/Asistencias/ListaAsistencias';
import RegistrarAsistencia from '../components/Asistencias/RegistrarAsistencia';
import RegistroAsistencias from '../components/Asistencias/RegistroAsistencias';

// Componente Wrapper para la página de Registrar Asistencia (vista diaria)
function RegistrarAsistenciaLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/asistencias" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al historial de Asistencias
                </Link>
            </div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Registrar Asistencia (Vista Diaria)</h2>
                <Link to="/asistencias/registrar-mensual" className="text-indigo-600 hover:underline text-sm">
                    Cambiar a vista mensual →
                </Link>
            </div>
            <RegistrarAsistencia />
        </>
    );
}

// Componente Wrapper para la página de Registro Mensual
function RegistroMensualLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/asistencias" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al historial de Asistencias
                </Link>
            </div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Registro de Asistencias (Vista Mensual)</h2>
                <Link to="/asistencias/registrar" className="text-indigo-600 hover:underline text-sm">
                    Cambiar a vista diaria →
                </Link>
            </div>
            <RegistroAsistencias />
        </>
    );
}

export default function AsistenciasRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base para /asistencias (mostrar lista/historial) */}
                <Route index element={<ListaAsistencias />} />
                {/* Ruta para vista diaria */}
                <Route path="registrar" element={<RegistrarAsistenciaLayout />} />
                {/* Ruta para vista mensual */}
                <Route path="registrar-mensual" element={<RegistroMensualLayout />} />
            </Routes>
        </MainLayout>
    );
}
