// --- src/routes/GastosRoutes.tsx ---
// NUEVO ARCHIVO: Define las rutas para la sección de Gastos

import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ListaGastos from '../components/Gastos/ListaGastos'; // Nuevo componente
import FormularioGasto from '../components/Gastos/FormularioGasto'; // Nuevo componente

// Layout para la página de Nuevo Gasto
function NuevoGastoLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/gastos" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al Historial de Gastos
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Registrar Nuevo Gasto</h2>
            <FormularioGasto />
        </>
    );
}

// Podrías añadir un layout para editar gastos si fuera necesario
// function EditarGastoLayout() { ... }

export default function GastosRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base: /gastos (Mostrar lista/historial) */}
                <Route index element={<ListaGastos />} />
                {/* Ruta para /gastos/nuevo */}
                <Route path="nuevo" element={<NuevoGastoLayout />} />
                {/* Ruta para editar (ejemplo) */}
                {/* <Route path="editar/:id" element={<EditarGastoLayout />} /> */}
            </Routes>
        </MainLayout>
    );
}