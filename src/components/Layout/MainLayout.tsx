// --- src/components/Layout/MainLayout.tsx ---
// ACTUALIZADO: Para manejar estado del sidebar y overlay

import { useState } from 'react'; // Necesario para el estado del sidebar
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    // Estado para controlar si el sidebar está abierto (en móvil)
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Función para cambiar el estado del sidebar
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        // Contenedor Flex principal
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar: Se le pasan las props isOpen y toggleSidebar */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Overlay para cerrar sidebar en móvil cuando está abierto */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" // Solo visible en móvil (lg:hidden), z-index menor que sidebar
                    onClick={toggleSidebar} // Cierra el sidebar al hacer clic
                    aria-hidden="true"
                ></div>
            )}

            {/* Área Principal */}
            {/* En pantallas grandes (lg), añade margen izquierdo para el sidebar fijo */}
            {/* En pantallas pequeñas, el margen es 0 porque el sidebar está oculto o superpuesto */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-64"> {/* ml-64 en lg y superior */}
                {/* Header: Pasa la función toggleSidebar para el botón hamburguesa */}
                <Header toggleSidebar={toggleSidebar} />

                {/* Contenido Principal */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
