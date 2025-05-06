// --- src/components/Layout/Header.tsx ---
// ACTUALIZADO: Añadido botón de menú hamburguesa

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Settings, LogOut, Search, Menu, Bell } from 'lucide-react'; // Añadido Menu y Bell

// Props que recibe el Header
interface HeaderProps {
    toggleSidebar: () => void; // Función para abrir/cerrar sidebar
}

export default function Header({ toggleSidebar }: HeaderProps) {
    // Se quita navigate
    const { profile, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const userName = profile ? `${profile.nombres} ${profile.apellidos}` : "Usuario";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [menuRef]);

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await logout();
        // La redirección la maneja AppRoutes
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-20">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Lado Izquierdo: Botón de Menú (móvil) y Buscador */}
                    <div className="flex items-center">
                        {/* Botón Hamburguesa (visible solo en pantallas pequeñas < lg) */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden mr-3 -ml-1 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Abrir sidebar</span>
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>

                        {/* Buscador (opcionalmente oculto en pantallas muy pequeñas) */}
                        <div className="relative text-gray-400 focus-within:text-gray-600 hidden sm:block">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input id="search-field" className="block w-full h-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Buscar..." type="search" name="search" />
                        </div>
                    </div>

                    {/* Lado Derecho: Notificaciones y Menú de Usuario */}
                    <div className="flex items-center space-x-4">
                        <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <span className="sr-only">Ver notificaciones</span>
                            <Bell className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(prev => !prev)} className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" id="user-menu-button" aria-expanded={isMenuOpen} aria-haspopup="true">
                                <span className="sr-only">Abrir menú de usuario</span>
                                <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </span>
                                <span className="hidden md:block ml-2 text-sm font-medium text-gray-700">{userName}</span>
                                <svg className={`hidden md:block ml-1 h-5 w-5 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"> <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /> </svg>
                            </button>
                            {isMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" >
                                    <Link to="/configuracion" onClick={() => setIsMenuOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" >
                                        <Settings className="mr-2 h-4 w-4 text-gray-500" aria-hidden="true" />
                                        Configuración
                                    </Link>
                                    <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700" role="menuitem" >
                                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}