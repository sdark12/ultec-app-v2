import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ListaEncargados from '../components/Encargados/ListaEncargados';
import FormularioEncargado from '../components/Encargados/FormularioEncargado';

// Layout para la página de Nuevo Encargado
function NuevoEncargadoLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/encargados" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver a la lista de Encargados
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Añadir Nuevo Encargado</h2>
            <FormularioEncargado />
        </>
    );
}

// Layout para la página de Editar Encargado
function EditarEncargadoLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/encargados" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver a la lista de Encargados
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Editar Encargado</h2>
            <FormularioEncargado />
        </>
    );
}

export default function EncargadosRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base: /encargados */}
                <Route index element={<ListaEncargados />} />
                {/* Ruta nuevo: /encargados/nuevo */}
                <Route path="nuevo" element={<NuevoEncargadoLayout />} />
                {/* Ruta editar: /encargados/editar/:id */}
                <Route path="editar/:id" element={<EditarEncargadoLayout />} />
            </Routes>
        </MainLayout>
    );
} 