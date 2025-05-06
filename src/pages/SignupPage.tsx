// --- src/pages/SignupPage.tsx ---
// Componente de Registro Estilizado (igual que antes)

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const crearPerfilUsuario = async (userId: string, email: string, nombre: string, apellido: string) => {
    console.log("Intentando crear perfil en public.usuarios para userId:", userId);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          auth_user_id: userId,
          correo_electronico: email,
          nombres: nombre,
          apellidos: apellido,
          rol: 'alumno',
          esta_activo: true
        });

      if (error) {
         if (error.code === '23505') {
             console.warn("Parece que el perfil para este usuario ya existía:", error.message);
         } else {
            throw error;
         }
      } else {
         console.log("Perfil de usuario creado/confirmado en public.usuarios:", data);
      }
    } catch (error: unknown) {
      console.error("Error creando perfil en public.usuarios:", error);
      let profileErrorMsg = 'Error al finalizar la creación del perfil.';
      if (error && typeof error === 'object' && 'message' in error) {
          profileErrorMsg = `Error al crear perfil: ${String(error.message)}`;
      }
      setErrorMsg(profileErrorMsg + " Por favor, contacta a soporte.");
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        await crearPerfilUsuario(authData.user.id, email, nombre, apellido);

         if (!errorMsg) {
            if (authData.session) {
                setSuccessMsg('¡Registro exitoso! Redirigiendo...');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setSuccessMsg('¡Registro casi listo! Revisa tu correo electrónico para confirmar tu cuenta.');
            }
         }
      } else if (authData && !authData.user && !authData.session) {
           setSuccessMsg('¡Registro casi listo! Revisa tu correo electrónico para confirmar tu cuenta.');
           console.warn("SignUp exitoso pero no se devolvió user/session.");
      } else {
           throw new Error("Respuesta inesperada de signUp.");
      }
    } catch (error: unknown) {
      console.error('Error en el proceso de signup:', error);
      let displayError = 'Ocurrió un error durante el registro.';
       if (error && typeof error === 'object' && 'message' in error) {
         if (String(error.message).toLowerCase().includes('user already registered')) {
             displayError = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
         } else if (String(error.message).toLowerCase().includes('password should be at least')) {
             displayError = 'La contraseña debe tener al menos 6 caracteres.';
         } else {
             displayError = String(error.message);
         }
       }
      if (!errorMsg) {
          setErrorMsg(displayError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-200 p-4 font-sans">
      <div className="bg-white shadow-2xl rounded-xl p-8 sm:p-12 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Regístrate</h1>
          <p className="text-gray-600 mb-8 text-sm">Crea tu cuenta para acceder a la academia.</p>
          {errorMsg && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md text-sm">{successMsg}</div>}
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="nombre">Nombre(s)</label>
              <input id="nombre" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out" type="text" placeholder="Tu nombre" value={nombre} required onChange={(e) => setNombre(e.target.value)} disabled={loading}/>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="apellido">Apellido(s)</label>
              <input id="apellido" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out" type="text" placeholder="Tus apellidos" value={apellido} required onChange={(e) => setApellido(e.target.value)} disabled={loading}/>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="signup-email">Email</label>
              <input id="signup-email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out" type="email" placeholder="tu@email.com" value={email} required onChange={(e) => setEmail(e.target.value)} disabled={loading}/>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="signup-password">Password</label>
              <input id="signup-password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out" type="password" placeholder="Mínimo 6 caracteres" value={password} required onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
            </div>
            <div className="mb-5">
              <button className={`w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
          <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">Inicia Sesión</Link>
          </div>
      </div>
    </div>
  );
}