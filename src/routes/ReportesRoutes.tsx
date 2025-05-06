// --- src/routes/ReportesRoutes.tsx ---
// CORREGIDO: Eliminada importación no usada de Link

import { Routes, Route } from 'react-router-dom'; // Se quita Link
import MainLayout from '../components/Layout/MainLayout';
import ReporteFinanciero from '../components/Reportes/ReporteFinanciero';

export default function ReportesRoutes() {
    return (
        <MainLayout>
            <Routes>
                <Route index element={<ReporteFinanciero />} />
                <Route path="financiero" element={<ReporteFinanciero />} />
                {/* <Route path="asistencia" element={<ReporteAsistencia />} /> */}
            </Routes>
        </MainLayout>
    );
}
