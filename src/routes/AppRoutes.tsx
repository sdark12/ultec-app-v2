// --- src/routes/AppRoutes.tsx ---
// ACTUALIZADO: Para usar ProtectedRoute

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import DashboardPage from '../pages/DashboardPage';
import DashboardRoutes from './DashboardRoutes';
import AlumnosRoutes from './AlumnosRoutes';
import CursosRoutes from './CursosRoutes';
import InscripcionesRoutes from './InscripcionesRoutes';
import AsistenciasRoutes from './AsistenciasRoutes';
import CalificacionesRoutes from './CalificacionesRoutes';
import PagosRoutes from './PagosRoutes';
import GastosRoutes from './GastosRoutes';
import IngresosVariosRoutes from './IngresosVariosRoutes';
import ReportesRoutes from './ReportesRoutes';
import EncargadosRoutes from './EncargadosRoutes';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage'; // <-- Importar página no autorizada
import ProtectedRoute from './ProtectedRoute'; // <-- Importar componente de protección
import { useAuth } from '../context/AuthContext';

export default function AppRoutes() {
    const { session, loading } = useAuth(); // Obtener loading también

    // Mostrar un loader global mientras el AuthContext está cargando inicialmente
    // Esto evita renderizar las rutas antes de saber si hay sesión
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center">
                <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-medium text-gray-700">Cargando...</p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={!session ? <SignupPage /> : <Navigate to="/dashboard" replace />} />

            {/* Rutas Protegidas (envueltas con ProtectedRoute) */}
            <Route
                path="/dashboard/*"
                element={
                    <ProtectedRoute> {/* Sin allowedRoles = accesible para cualquier logueado */}
                        <DashboardRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/alumnos/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'secretaria']}>
                        <AlumnosRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/cursos/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'secretaria', 'profesor']}>
                        <CursosRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/inscripciones/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'secretaria']}>
                        <InscripcionesRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/asistencias/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'secretaria', 'profesor']}>
                        <AsistenciasRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/calificaciones/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'profesor', 'alumno']}>
                        <CalificacionesRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/pagos/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'contador', 'secretaria']}>
                        <PagosRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/gastos/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'contador']}>
                        <GastosRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/ingresos-varios/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'contador', 'secretaria']}>
                        <IngresosVariosRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reportes/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'contador']}>
                        <ReportesRoutes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/encargados/*"
                element={
                    <ProtectedRoute allowedRoles={['administrador', 'secretaria']}>
                        <EncargadosRoutes />
                    </ProtectedRoute>
                }
            />
            {/* Ruta para acceso no autorizado */}
            <Route
                path="/unauthorized"
                element={session ? <UnauthorizedPage /> : <Navigate to="/login" replace />}
            />

            {/* Ruta Raíz */}
            <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            {/* Ruta Comodín */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
