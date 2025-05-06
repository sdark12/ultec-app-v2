// --- src/components/Layout/Sidebar.tsx ---
// ACTUALIZADO: Para ser desplegable y recibir props

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMemo } from 'react';
import { LayoutDashboard, Users, BookOpen, ClipboardList, GraduationCap, CalendarCheck, DollarSign, Printer, ShoppingCart, BarChart3, Settings, LucideIcon, X, UserCog } from 'lucide-react'; // Añadido icono X y UserCog

// Props que recibe el Sidebar
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void; // Función para cerrar desde dentro (ej. en móvil)
}

interface NavLink {
  path: string;
  name: string;
  icon: LucideIcon;
  allowedRoles?: string[];
}

const navLinks: NavLink[] = [
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['administrador', 'secretaria', 'profesor', 'alumno', 'encargado', 'contador'] },
  { path: '/alumnos', name: 'Alumnos', icon: Users, allowedRoles: ['administrador', 'secretaria'] },
  { path: '/encargados', name: 'Encargados', icon: UserCog, allowedRoles: ['administrador', 'secretaria'] },
  { path: '/cursos', name: 'Cursos', icon: BookOpen, allowedRoles: ['administrador', 'secretaria', 'profesor'] },
  { path: '/inscripciones', name: 'Inscripciones', icon: ClipboardList, allowedRoles: ['administrador', 'secretaria'] },
  { path: '/calificaciones', name: 'Calificaciones', icon: GraduationCap, allowedRoles: ['administrador', 'profesor', 'alumno'] },
  { path: '/asistencias', name: 'Asistencias', icon: CalendarCheck, allowedRoles: ['administrador', 'secretaria', 'profesor'] },
  { path: '/pagos', name: 'Pagos Alumnos', icon: DollarSign, allowedRoles: ['administrador', 'contador', 'secretaria'] },
  { path: '/ingresos-varios', name: 'Ingresos Varios', icon: Printer, allowedRoles: ['administrador', 'contador', 'secretaria'] },
  { path: '/gastos', name: 'Gastos', icon: ShoppingCart, allowedRoles: ['administrador', 'contador'] },
  { path: '/reportes', name: 'Reportes', icon: BarChart3, allowedRoles: ['administrador', 'contador'] },
];

// Componente Sidebar 
export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation();
  const { profile, loading } = useAuth();

  // Calcula el rol directamente del perfil si existe
  const userRole = profile ? profile.rol : null;

  // Filtra los enlaces basados en el rol determinado
  const filteredLinks = useMemo(() => {
    if (!userRole) {
      return [];
    }
    return navLinks.filter(link =>
      link.allowedRoles?.includes(userRole)
    );
  }, [userRole]); // Dependencia: recalcular si cambia el rol

  return (
    // Contenedor con transición y posicionamiento absoluto/fijo
    // Se muestra u oculta basado en 'isOpen' en pantallas pequeñas
    // Permanece fijo y visible en pantallas grandes (lg:translate-x-0)
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-gray-900 to-black text-gray-100 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <div className="flex flex-col h-full">
        {/* Encabezado del Sidebar con logo y botón de cierre (visible en móvil) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700 flex-shrink-0">
          <span className="text-xl font-bold text-white">Academia Ultec</span>
          {/* Botón para cerrar en pantallas pequeñas */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Cerrar sidebar</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto">
          {/* Mostrar indicador de carga SOLO si el AuthContext está en su carga inicial */}
          {loading ? (
            <div className="p-4 text-gray-400 text-sm text-center animate-pulse">Cargando menú...</div>
          ) : (
            // Si no está cargando, mapear los filteredLinks (estará vacío si profile/userRole aún es null)
            filteredLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={toggleSidebar} // Cierra el sidebar en móvil al hacer clic en un enlace
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium group transition-colors duration-150 ease-in-out ${isActive ? 'bg-gray-700 text-white shadow-inner' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} >
                  <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} aria-hidden="true" />
                  {link.name}
                </Link>
              );
            })
          )}
          <Link
            to="/dashboard/reporte-pagos-alumnos"
            onClick={toggleSidebar}
            className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium group transition-colors duration-150 ease-in-out text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <BarChart3 className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
            <span>Reporte de Pagos Alumnos</span>
          </Link>
        </nav>

        {/* Sección Inferior */}
        <div className="p-4 border-t border-gray-700 mt-auto flex-shrink-0">
          <Link
            to="/configuracion"
            onClick={toggleSidebar} // Cierra el sidebar en móvil al hacer clic
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white group"
          >
            <Settings className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
            Configuración
          </Link>
        </div>
      </div>
    </div>
  );
}
