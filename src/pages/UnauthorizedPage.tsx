// --- src/pages/UnauthorizedPage.tsx ---
// NUEVO ARCHIVO: Página para acceso no autorizado

import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react'; // Icono

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gray-100">
            <Lock className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Acceso Denegado
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
                No tienes permiso para acceder a esta página.
            </p>
            <Link
                to="/dashboard" // Enlace al dashboard principal
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out"
            >
                Volver al Dashboard
            </Link>
        </div>
    );
}

