// --- src/routes/PagosRoutes.tsx ---
// NUEVO ARCHIVO: Define las rutas para la sección de Pagos

import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ListaPagos from '../components/Pagos/ListaPagos';
import FormularioPago from '../components/Pagos/FormularioPago';
import EditarPagoLayout from '../components/Pagos/EditarPagoLayout';

// Layout para la página de Nuevo Pago
function NuevoPagoLayout() {
    return (
        <>
            <div className="mb-4">
                <Link to="/pagos" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al Historial de Pagos
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Registrar Nuevo Pago</h2>
            <FormularioPago />
        </>
    );
}

export default function PagosRoutes() {
    return (
        <MainLayout>
            <Routes>
                {/* Ruta base: /pagos (Mostrar lista/historial) */}
                <Route index element={<ListaPagos />} />
                {/* Ruta para /pagos/nuevo */}
                <Route path="nuevo" element={<NuevoPagoLayout />} />
                {/* Ruta para editar */}
                <Route path="editar/:id" element={<EditarPagoLayout />} />
            </Routes>
        </MainLayout>
    );
}