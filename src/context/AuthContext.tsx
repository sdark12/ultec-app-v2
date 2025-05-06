import React, { // React sigue siendo necesario si usas tipos como ReactNode o FC
    useState,
    useEffect,
    createContext,
    useContext, // useContext SÍ es necesario para el hook useAuth al final
    useMemo,
    ReactNode,
} from "react";
// SE ELIMINAN imports de react-router-dom aquí, ya que no se usan en AuthContext
// import { Link, useLocation } from 'react-router-dom';
// Ajusta la ruta a tu cliente Supabase y tipos
import { supabase } from "../lib/supabaseClient"; // Ajusta la ruta
import { Session, User, AuthError } from '@supabase/supabase-js';
import { Usuario } from '../types'; // Ajusta la ruta
// SE ELIMINAN imports de lucide-react aquí, ya que no se usan en AuthContext
// import { LayoutDashboard, Users, BookOpen, ClipboardList, GraduationCap, CalendarCheck, DollarSign, Printer, ShoppingCart, BarChart3, Settings, LucideIcon, X } from 'lucide-react';

// --- 1. AuthContext (Tu código v15 Final Revisado - con Comentarios Añadidos y Imports Limpios) ---

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Usuario | null;
    loading: boolean; // Indica si la carga inicial (sesión + perfil) está en progreso
    logout: () => Promise<void>;
}

// Se usa createContext, así que la importación es necesaria
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }

// Se usa React.FC, así que la importación de React es necesaria
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // Se usan useState, useEffect, useMemo
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true); // Estado de carga inicial

    // --- Función para obtener el perfil del usuario desde la tabla 'usuarios' ---
    const fetchUserProfile = async (userId: string | undefined): Promise<Usuario | null> => {
        if (!userId) return null;
        console.log("AuthContext: Fetching profile for:", userId);
        try {
            const { data, error, status } = await supabase
                .from('usuarios') // Nombre de tu tabla de perfiles
                .select('*') // O especifica columnas: 'id_usuario, nombres, apellidos, rol, correo_electronico'
                .eq('auth_user_id', userId) // Columna que vincula con auth.users.id
                .single();
            // Ignora el error 406 (Not Found) si .single() no encuentra fila
            if (error && status !== 406) {
                console.error('AuthContext: Error fetching profile:', error);
                return null;
            }
            console.log("AuthContext: Profile data:", data);
            return data ? data as Usuario : null; // Devuelve el perfil o null
        } catch (error) {
            console.error('AuthContext: Exception fetching profile:', error);
            return null;
        }
    };

    // --- Efecto para la carga inicial ---
    useEffect(() => {
        console.log("AuthProvider: Running initial session check effect...");
        let isMounted = true; // Flag para evitar actualizaciones de estado si el componente se desmonta

        const checkInitialSession = async () => {
            setLoading(true); // Indicar que la carga inicial está en curso
            try {
                // Intenta obtener la sesión actual de Supabase
                const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError; // Manejar error de getSession
                console.log("AuthProvider: Initial session data:", initialSession);

                // Si el componente sigue montado después de getSession...
                if (isMounted) {
                    const currentUser = initialSession?.user ?? null;
                    // IMPORTANTE: Esperar (await) a que el perfil se cargue
                    const userProfile = await fetchUserProfile(currentUser?.id);

                    // Si el componente sigue montado después de fetchUserProfile...
                    // Actualizar todos los estados relacionados a la vez
                    if (isMounted) {
                        setSession(initialSession);
                        setUser(currentUser);
                        setProfile(userProfile);
                        setLoading(false); // <--- Marcar la carga inicial como completa SOLO AQUI
                        console.log("AuthProvider: Initial load complete (session & profile). Loading set to false.");
                    }
                }
            } catch (error) {
                console.error("AuthProvider: Error during initial session check:", error);
                // Si hubo un error, asegurar que el estado quede limpio y la carga termine
                if (isMounted) {
                    setSession(null); setUser(null); setProfile(null);
                    setLoading(false);
                }
            }
        };

        checkInitialSession();

        // Función de limpieza: se ejecuta si AuthProvider se desmonta ANTES de que checkInitialSession termine
        return () => {
            isMounted = false;
            console.log("AuthProvider: Initial check effect cleanup.");
        };
    }, []); // Array de dependencias vacío asegura que se ejecute solo al montar

    // --- Efecto SEPARADO para escuchar cambios DESPUÉS de la carga inicial ---
    useEffect(() => {
        // No hacer nada si la carga inicial aún está en progreso
        if (loading) {
            console.log("AuthProvider: Listener setup skipped, initial loading.");
            return;
        }

        console.log("AuthProvider: Setting up onAuthStateChange listener...");
        let isMounted = true; // Flag para este efecto específico

        // Suscribirse a los cambios de estado de autenticación de Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            if (!isMounted) return; // Salir si el componente se desmontó
            console.log("AuthContext: onAuthStateChange triggered (event, session):", _event, currentSession);

            // Actualizar siempre el estado de la sesión
            setSession(currentSession);
            const currentUser = currentSession?.user ?? null;
            const currentUserId = currentUser?.id;
            const previousUserId = user?.id; // Usar el estado 'user' para comparar

            // Si el ID del usuario ha cambiado (login, logout, cambio de usuario)
            if (currentUserId !== previousUserId) {
                setUser(currentUser); // Actualizar el estado del usuario
                console.log("AuthContext: User ID changed or became null/non-null, fetching profile...");
                // Volver a buscar el perfil asociado al nuevo usuario (o null si no hay usuario)
                const userProfile = await fetchUserProfile(currentUserId);
                if (isMounted) { setProfile(userProfile); } // Actualizar el estado del perfil
            }
            // Caso especial: Si el ID no cambió pero ahora no hay usuario (ej. token expiró sin evento SIGNED_OUT explícito)
            // y todavía teníamos un perfil cargado, limpiarlo.
            else if (!currentUser && profile !== null) {
                console.log("AuthContext: No user session, clearing profile.");
                setProfile(null);
            }
        });

        // Función de limpieza: desuscribirse del listener cuando el componente se desmonte
        return () => {
            isMounted = false;
            console.log("AuthProvider: Unsubscribing from auth changes listener.");
            subscription?.unsubscribe();
        };
    }, [loading]); // <-- DEPENDENCIA SIMPLIFICADA

    // --- Función de Logout ---
    const logout = async () => {
        console.log("AuthContext: Attempting logout...");
        try {
            const { error } = await supabase.auth.signOut();
            if (error && (error as AuthError).name !== 'AuthSessionMissingError') {
                console.error("AuthContext: Error logging out:", error);
            } else if (error) {
                console.info("AuthContext: Logout called but session was already missing.");
            } else {
                console.log("AuthContext: Logout successful via signOut.");
            }
        } catch (e) {
            console.error("AuthContext: Unexpected exception during logout:", e);
        } finally {
            // Limpiar estados locales SIEMPRE al intentar logout
            console.log("AuthContext: Clearing local state after logout attempt.");
            setSession(null);
            setUser(null);
            setProfile(null);
        }
    };

    // --- Valor del Contexto ---
    const value = useMemo(() => ({ session, user, profile, loading, logout }), [session, user, profile, loading]);

    return (
        <AuthContext.Provider value={value}>
            {/* Muestra un loader global mientras la carga inicial está en progreso */}
            {loading ? (
                <div className="min-h-screen flex flex-col items-center justify-center text-center">
                    {/* Loader SVG */}
                    <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg font-medium text-gray-700">Cargando aplicación...</p>
                    <p className="text-sm text-gray-500">Por favor, espere mientras verificamos su sesión.</p>
                </div>
            ) : (
                // Renderiza los componentes hijos solo cuando la carga inicial ha terminado
                children
            )}
        </AuthContext.Provider>
    );
};

// --- Hook personalizado para usar el contexto ---
// Se usa useContext, así que la importación es necesaria
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) { throw new Error('useAuth debe ser usado dentro de un AuthProvider'); }
    return context;
};

