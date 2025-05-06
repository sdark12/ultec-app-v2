// --- src/pages/LoginPage.tsx ---
// Componente de Inicio de Sesión Estilizado (igual que antes)

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      navigate('/dashboard'); // Redirige en éxito
    } catch (error: unknown) {
      console.error('Error en login:', error);
      let displayError = 'Ocurrió un error al iniciar sesión.';
      if (error && typeof error === 'object' && 'message' in error) {
        if (String(error.message).toLowerCase().includes('invalid login credentials')) {
            displayError = 'Email o contraseña incorrectos.';
        } else if (String(error.message).toLowerCase().includes('email not confirmed')) {
            displayError = 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
        } else {
            displayError = String(error.message);
        }
      }
      setErrorMsg(displayError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              // Es MUY importante configurar esta URL en tu proveedor OAuth (Google Cloud Console)
              // y en la configuración de tu proyecto Supabase online
              redirectTo: window.location.origin + '/dashboard' // O a donde quieras ir tras login exitoso
            }
        });
        if (error) throw error;
    } catch (error: unknown) {
        console.error('Error con Google Login:', error);
        let displayError = 'Error al intentar iniciar sesión con Google.';
        if (error && typeof error === 'object' && 'message' in error) {
            displayError = String(error.message);
         }
        setErrorMsg(displayError);
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-200 p-4 font-sans">
      <div className="bg-white shadow-2xl rounded-xl flex flex-col md:flex-row overflow-hidden max-w-4xl w-full">
        {/* Columna Izquierda: Formulario */}
        <div className="w-full md:w-1/2 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600 mb-8 text-sm">Si ya eres miembro, inicia sesión fácilmente.</p>
          {errorMsg && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">{errorMsg}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">Email</label>
              <input id="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out" type="email" placeholder="tu@email.com" value={email} required onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
            </div>
            <div className="mb-6 relative">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">Password</label>
              <input id="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out pr-10" type="password" placeholder="******************" value={password} required onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
              <div className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-sm leading-5">
                 <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
            </div>
            <div className="mb-5">
              <button className={`w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} type="submit" disabled={loading}>
                {loading ? 'Iniciando...' : 'Login'}
              </button>
            </div>
          </form>
          <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-xs text-gray-500 uppercase">OR</span><div className="flex-grow border-t border-gray-300"></div></div>
          <div className="mb-6">
             <button onClick={handleGoogleLogin} disabled={loading} className={`w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm flex items-center justify-center transition duration-150 ease-in-out ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.53-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                Login with Google
             </button>
          </div>
          <div className="text-center text-sm text-gray-600 mb-5">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">¿Olvidaste tu contraseña?</a>
          </div>
          <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
            ¿No tienes una cuenta?{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">Regístrate</Link>
          </div>
        </div>
        {/* Columna Derecha: Imagen */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-tr from-blue-400 to-purple-500 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80')"}}></div>
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
             <h2 className="text-3xl font-bold mb-4">Bienvenido a la Academia</h2>
             <p className="text-lg opacity-90">Tu plataforma para el aprendizaje digital.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
