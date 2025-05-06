import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import DashboardPage from './pages/DashboardPage';
import ListaAsistencias from './components/Asistencias/ListaAsistencias';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '/',
                element: <DashboardPage />
            },
            {
                path: '/asistencias',
                element: <ListaAsistencias />
            }
        ]
    }
]); 