// --- src/components/ListaCursos.tsx ---
// Componente para mostrar la lista de cursos

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Ajusta la ruta si es necesario

// Define un tipo para los datos del curso que esperamos recibir
type Curso = {
  id_curso: number;
  nombre_curso: string;
  descripcion: string | null;
  duracion_horas: number | null; // Permitir nulo si puede serlo
  nivel_academico: string | null;
  // Añade otras columnas si las necesitas mostrar
};

export default function ListaCursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCursos() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('cursos')
        .select('id_curso, nombre_curso, descripcion, duracion_horas, nivel_academico')
        .order('nombre_curso', { ascending: true }); 

      if (error) {
        console.error('Error fetching cursos:', error);
        setErrorMsg(`Error al cargar cursos: ${error.message}. Verifica los permisos RLS.`);
        setCursos([]);
      } else if (data) {
        setCursos(data);
        console.log('Cursos obtenidos:', data);
      }
      setLoading(false);
    }

    fetchCursos();
  }, []); 

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando lista de cursos...</div>;
  }

  if (errorMsg) {
    return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;
  }

  if (cursos.length === 0) {
      return <div className="p-6 text-center text-gray-500">No hay cursos disponibles para mostrar.</div>;
  }

  return (
    // No añadir padding aquí si el contenedor padre ya lo tiene
    <div> 
      <h3 className="text-xl font-semibold mb-4 text-gray-800 px-6 pt-6">Cursos Disponibles</h3> {/* Padding para el título */}
      <ul className="divide-y divide-gray-200"> {/* Divide los elementos */}
        {cursos.map((curso) => (
          <li key={curso.id_curso} className="p-4 hover:bg-gray-50 transition duration-150 ease-in-out flex justify-between items-start sm:items-center flex-col sm:flex-row px-6"> {/* Padding horizontal */}
            <div className="flex-grow mb-2 sm:mb-0">
                <h4 className="font-bold text-lg text-indigo-700">{curso.nombre_curso}</h4>
                {curso.descripcion && (
                <p className="text-sm text-gray-600 mt-1">{curso.descripcion}</p>
                )}
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-500 w-full sm:w-auto">
                {curso.duracion_horas && (
                    <span className="mb-1 sm:mb-0">Duración: {curso.duracion_horas} horas</span>
                )}
                {curso.nivel_academico && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full self-start sm:self-center">{curso.nivel_academico}</span>
                )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
