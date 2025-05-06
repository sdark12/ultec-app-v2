// --- src/routes/ProtectedRoute.tsx ---
// NUEVO ARCHIVO: Componente para proteger rutas basadas en roles

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Usuario } from '../types'; // Asegúrate que el tipo Usuario incluye 'rol'

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: (Usuario['rol'])[]; // Array opcional de roles permitidos
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { session, profile, loading } = useAuth();
    const location = useLocation();

    // 1. Si todavía está cargando la información de autenticación/perfil, mostrar un loader o nada
    //    Esto evita renderizar antes de tener la info necesaria
    if (loading) {
        // Puedes mostrar un spinner o simplemente null para esperar
        return (
            <div className="min-h-screen flex items-center justify-center">Cargando...</div>
        );
    }

    // 2. Si no hay sesión, redirigir al login
    if (!session) {
        console.log("ProtectedRoute: No session, redirecting to login.");
        // Guardar la ubicación a la que intentaba ir para posible redirección post-login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Si hay sesión pero no perfil (podría pasar brevemente o si hay error), esperar o denegar
    //    Con la lógica actual de AuthContext (v12/v15), loading debería ser false solo cuando profile ya se intentó cargar.
    //    Así que si loading es false y profile es null, significa que no se encontró perfil o hubo error.
    if (!profile) {
        console.warn("ProtectedRoute: Session exists but no profile found. Redirecting to unauthorized (or login).");
        // Decide si redirigir a login o a una página de error/no autorizado
        return <Navigate to="/unauthorized" replace />;
        // O podrías redirigir a login: return <Navigate to="/login" replace />;
    }

    // 4. Si se especificaron roles permitidos y el rol del usuario NO está incluido
    if (allowedRoles && !allowedRoles.includes(profile.rol)) {
        console.log(`ProtectedRoute: Role "${profile.rol}" not in allowedRoles [${allowedRoles.join(', ')}]. Redirecting.`);
        // Redirigir a una página de "No Autorizado"
        return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }

    // 5. Si pasó todas las verificaciones (sesión existe, perfil existe, rol permitido o no se requieren roles específicos)
    console.log(`ProtectedRoute: Access granted for role "${profile.rol}" to path "${location.pathname}".`);
    return <>{children}</>; // Renderizar el componente hijo (la ruta protegida)
};

export default ProtectedRoute;
