import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import Dashboard from '../pages/DashboardPage';
import ReportePagosAlumnos from '../components/Dashboard/ReportePagosMensuales';

export default function DashboardRoutes() {
    return (
        <MainLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="reporte-pagos-alumnos" element={<ReportePagosAlumnos />} />
            </Routes>
        </MainLayout>
    );
} 