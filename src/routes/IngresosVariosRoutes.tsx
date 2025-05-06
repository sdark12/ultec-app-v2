// --- src/routes/IngresosVariosRoutes.tsx ---
// NUEVO ARCHIVO: Define las rutas para la sección de Ingresos Varios

import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ListaIngresosVarios from '../components/IngresosVarios/ListaIngresosVarios'; // Nuevo componente
import FormularioIngresosVarios from '../components/IngresosVarios/FormularioIngresosVarios'; // Nuevo componente

// Layout para la página de Nuevo Ingreso Vario
function NuevoIngresoVarioLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/ingresos-varios" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al Historial de Ingresos Varios
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Registrar Ingreso Vario</h2>
            <FormularioIngresosVarios />
        </>
    );
}

// Podrías añadir un layout para editar si fuera necesario
// function EditarIngresoVarioLayout() { ... }

export default function IngresosVariosRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base: /ingresos-varios (Mostrar lista/historial) */}
                <Route index element={<ListaIngresosVarios />} />
                {/* Ruta para /ingresos-varios/nuevo */}
                <Route path="nuevo" element={<NuevoIngresoVarioLayout />} />
                {/* Ruta para editar (ejemplo) */}
                {/* <Route path="editar/:id" element={<EditarIngresoVarioLayout />} /> */}
            </Routes>
        </MainLayout>
    );
}