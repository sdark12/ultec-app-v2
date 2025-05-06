// --- src/components/Cursos/ListaCursosAdmin.tsx ---
// CORREGIDO: Código completo y correcto

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Necesario
import { Curso } from '../../types'; // Necesario
import { Link } from 'react-router-dom'; // Necesario

interface Filtros {
    busqueda: string;
    tipoCurso: string;
    modalidad: string;
    estado: string;
}

export default function ListaCursosAdmin() {
  // Estados que SÍ se usan
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursosFiltrados, setCursosFiltrados] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Estado para filtros
  const [filtros, setFiltros] = useState<Filtros>({
      busqueda: '',
      tipoCurso: '',
      modalidad: '',
      estado: ''
  });

  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const cursosPorPagina = 10;
  const [tiposCurso, setTiposCurso] = useState<string[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);

  // Función que SÍ usa setLoading, setErrorMsg, supabase, setCursos
  const fetchCursos = async () => {
    setLoading(true); setErrorMsg(null);
    const { data, error } = await supabase
      .from('cursos')
      .select(`
          id_curso, 
          nombre_curso, 
          descripcion, 
          duracion_horas, 
          nivel_academico, 
          activo,
          modalidad_horario, 
          tipos_curso ( nombre ) 
      `)
      .order('nombre_curso', { ascending: true });

    if (error) {
      console.error('Error fetching cursos:', error);
      setErrorMsg(`Error al cargar cursos: ${error.message}. Verifica RLS.`);
      setCursos([]);
    } else if (data) {
      setCursos(data as any[]);
      // Extraer tipos de curso y modalidades únicas
      const tipos = [...new Set(data.map(curso => (curso as any).tipos_curso?.nombre).filter(Boolean))];
      const mods = [...new Set(data.map(curso => curso.modalidad_horario).filter(Boolean))];
      setTiposCurso(tipos);
      setModalidades(mods);
    }
    setLoading(false);
  };

  // useEffect que SÍ llama a fetchCursos
  useEffect(() => { fetchCursos(); }, []);

  // Efecto para aplicar filtros
  useEffect(() => {
    const aplicarFiltros = () => {
      let resultado = [...cursos];

      // Filtrar por búsqueda
      if (filtros.busqueda) {
        const busquedaLower = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(curso => 
          curso.nombre_curso.toLowerCase().includes(busquedaLower) ||
          curso.descripcion?.toLowerCase().includes(busquedaLower) ||
          curso.nivel_academico?.toLowerCase().includes(busquedaLower)
        );
      }

      // Filtrar por tipo de curso
      if (filtros.tipoCurso) {
        resultado = resultado.filter(curso => 
          (curso as any).tipos_curso?.nombre === filtros.tipoCurso
        );
      }

      // Filtrar por modalidad
      if (filtros.modalidad) {
        resultado = resultado.filter(curso => 
          curso.modalidad_horario === filtros.modalidad
        );
      }

      // Filtrar por estado
      if (filtros.estado !== '') {
        const estadoActivo = filtros.estado === 'activo';
        resultado = resultado.filter(curso => 
          curso.activo === estadoActivo
        );
      }

      setCursosFiltrados(resultado);
      setPaginaActual(1); // Resetear a primera página al filtrar
    };

    aplicarFiltros();
  }, [filtros, cursos]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      tipoCurso: '',
      modalidad: '',
      estado: ''
    });
  };

  // Función que SÍ usa id, nombre, setDeletingId, setErrorMsg, supabase, setCursos
  const handleDelete = async (id: number | undefined, nombre: string) => {
    if (id === undefined) return;
    if (!window.confirm(`¿Eliminar el curso "${nombre}"? Esto podría afectar inscripciones existentes.`)) return;

    setDeletingId(id); setErrorMsg(null);
    try {
      const { error } = await supabase.from('cursos').delete().eq('id_curso', id);
      if (error) throw error;
      setCursos(prevCursos => prevCursos.filter(c => c.id_curso !== id));
      alert(`Curso "${nombre}" eliminado.`);
    } catch (error: any) {
      console.error("Error eliminando curso:", error);
      setErrorMsg(`Error al eliminar: ${error.message}. Verifica permisos y dependencias.`);
    } finally { setDeletingId(null); }
  };

  // Cálculos para paginación
  const totalPaginas = Math.ceil(cursosFiltrados.length / cursosPorPagina);
  const indiceInicial = (paginaActual - 1) * cursosPorPagina;
  const cursosPaginados = cursosFiltrados.slice(indiceInicial, indiceInicial + cursosPorPagina);

  // Renderizado que SÍ usa loading, errorMsg, cursos, Link, deletingId, handleDelete
  if (loading && cursos.length === 0) return <div className="p-6 text-center text-gray-500">Cargando lista de cursos...</div>;
  if (errorMsg && cursos.length === 0) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{errorMsg}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Gestionar Cursos</h3>
        <Link to="/cursos/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
          + Añadir Curso
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            name="busqueda"
            id="busqueda"
            value={filtros.busqueda}
            onChange={handleFiltroChange}
            placeholder="Nombre, descripción o nivel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="tipoCurso" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Curso
          </label>
          <select
            name="tipoCurso"
            id="tipoCurso"
            value={filtros.tipoCurso}
            onChange={handleFiltroChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
          >
            <option value="">Todos los tipos</option>
            {tiposCurso.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700 mb-1">
            Modalidad
          </label>
          <select
            name="modalidad"
            id="modalidad"
            value={filtros.modalidad}
            onChange={handleFiltroChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
          >
            <option value="">Todas las modalidades</option>
            {modalidades.map(modalidad => (
              <option key={modalidad} value={modalidad}>{modalidad}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            name="estado"
            id="estado"
            value={filtros.estado}
            onChange={handleFiltroChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={limpiarFiltros}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}

      {cursosFiltrados.length === 0 && !loading ? (
        <p className="text-center text-gray-500 py-4">No hay cursos que coincidan con los filtros.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Curso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cursosPaginados.map((curso) => (
                  <tr key={curso.id_curso} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{curso.nombre_curso}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(curso as any).tipos_curso?.nombre || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{curso.modalidad_horario || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${curso.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {curso.activo ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <Link to={`/cursos/editar/${curso.id_curso}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">Editar</Link>
                      <span className="text-gray-300">|</span>
                      <Link to={`/cursos/${curso.id_curso}/gestion`} className="text-purple-600 hover:text-purple-900 hover:underline">Evaluaciones</Link>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => handleDelete(curso.id_curso, curso.nombre_curso)} disabled={deletingId === curso.id_curso} className={`text-red-600 hover:text-red-900 hover:underline disabled:opacity-50`}>
                        {deletingId === curso.id_curso ? 'Borrando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Mostrando {indiceInicial + 1} a {Math.min(indiceInicial + cursosPorPagina, cursosFiltrados.length)} de {cursosFiltrados.length} cursos
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
