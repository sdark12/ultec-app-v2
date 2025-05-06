// --- src/pages/NotFoundPage.tsx ---
// Componente para mostrar cuando una ruta no existe (404)

import { Link } from 'react-router-dom'; // Necesita Link para el enlace de volver

export default function NotFoundPage() {
    return (
        // Centra el contenido vertical y horizontalmente
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            {/* Icono o gráfico opcional */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            {/* Mensaje principal */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                404
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
                ¡Ups! Parece que la página que buscas no existe.
            </p>
            {/* Enlace para volver al inicio (o al dashboard si prefieres) */}
            <Link
                to="/"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out"
            >
                Volver al Inicio
            </Link>
        </div>
    );
}
