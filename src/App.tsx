// --- src/App.tsx ---
// CORREGIDO: Eliminado BrowserRouter de aquí

// Ya no se necesitan useState, useEffect, Session ni Router aquí
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext'; // Importar Provider

function App() {
  // La lógica de sesión y carga ahora está en AuthProvider
  // El Router ahora está en main.tsx

  // AuthProvider renderizará AppRoutes cuando no esté cargando
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
export default App;