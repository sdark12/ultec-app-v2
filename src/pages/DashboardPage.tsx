// --- src/pages/DashboardPage.tsx ---
// CORREGIDO: Errores de TypeScript y sintaxis

import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { supabase } from '../lib/supabaseClient';
import { format, subDays } from 'date-fns';
import { Pago, Gasto, Curso } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from 'recharts';

// Componente StatCard (Corregida definición)
const StatCard = ({ title, value, change, iconBgColor }: { title: string; value: string | number; change?: string; iconBgColor: string }) => (
  <div className="bg-white shadow-lg rounded-xl p-5 border border-gray-200">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '...'}</p>
        {change && <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{change}</p>}
      </div>
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
      </div>
    </div>
  </div>
);

// Tipo para actividad reciente (Corregido)
type ActividadReciente = {
  id: number;
  tipo: 'pago' | 'inscripcion' | 'gasto';
  descripcion: string;
  fecha: string; // Asegurarse que la propiedad fecha exista
  monto?: number;
}

// Tipo para los datos del gráfico de notas finales (Actualizado para totales)
type TopFinalGradeData = {
  nombreAlumno: string;
  totalBimestre: number;
  bimestre: number;
}

// Colores para las barras del gráfico
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// Componente CustomTooltip para el gráfico
const CustomTooltip = ({ active, payload }: Omit<TooltipProps<number, string>, 'label'>) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <div className="bg-white p-2 border border-gray-200 shadow-lg rounded-lg">
      <p className="font-semibold text-gray-700">{data.nombreAlumno}</p>
      <p className="text-sm text-gray-600">
        Bimestre: {data.bimestre}
      </p>
      <p className="text-sm font-medium text-blue-600">
        Nota: {data.totalBimestre.toFixed(1)} pts
      </p>
    </div>
  );
};

export default function DashboardPage() {
  // Estados (Corregido tipo inicial de stats)
  const [stats, setStats] = useState<{
    alumnosActivos: number | null;
    cursosActivos: number | null;
    ingresosSemana: number | null;
    gastosSemana: number | null;
  }>({ alumnosActivos: null, cursosActivos: null, ingresosSemana: null, gastosSemana: null });
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<number | string>('');
  const [topFinalGrades, setTopFinalGrades] = useState<TopFinalGradeData[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Formateador de moneda (Corregido tipo de retorno)
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'N/A';
    return `Q${amount.toFixed(2)}`;
  }

  // useEffect para cargar datos generales
  useEffect(() => {
    console.log('🔵 useEffect inicial - Iniciando carga de datos generales');
    const fetchDashboardData = async () => {
      setLoadingStats(true); 
      setErrorMsg(null);
      try {
        console.log('🔵 Iniciando fetchDashboardData');
        const haceUnaSemana = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        const hoy = format(new Date(), 'yyyy-MM-dd');

        const [
          alumnosCountRes,
          cursosCountRes,
          ingresosRes,
          gastosRes,
          actividadPagosRes,
          actividadInscRes,
          cursosListRes
        ] = await Promise.all([
          supabase.from('alumnos').select('id_alumno', { count: 'exact', head: true }),
          supabase.from('cursos').select('id_curso', { count: 'exact', head: true }).eq('activo', true),
          supabase.from('pagos').select('monto').gte('fecha_pago', haceUnaSemana).lte('fecha_pago', hoy),
          supabase.from('gastos').select('monto').gte('fecha_gasto', haceUnaSemana).lte('fecha_gasto', hoy),
          supabase.from('pagos').select('id_pago, fecha_pago, monto, concepto, alumnos(nombres, apellidos)').order('fecha_pago', { ascending: false }).limit(3),
          supabase.from('inscripciones').select('id_inscripcion, fecha_inscripcion_curso, alumnos(nombres, apellidos), cursos(nombre_curso)').order('fecha_inscripcion_curso', { ascending: false }).limit(3),
          supabase.from('cursos').select('id_curso, nombre_curso').eq('activo', true).order('nombre_curso')
        ]);

        // Manejo de errores
        if (alumnosCountRes.error) console.error("Error contando alumnos:", alumnosCountRes.error);
        if (cursosCountRes.error) console.error("Error contando cursos:", cursosCountRes.error);
        if (ingresosRes.error) console.error("Error sumando ingresos:", ingresosRes.error);
        if (gastosRes.error) console.error("Error sumando gastos:", gastosRes.error);
        if (actividadPagosRes.error) console.error("Error obteniendo pagos recientes:", actividadPagosRes.error);
        if (actividadInscRes.error) console.error("Error obteniendo inscripciones recientes:", actividadInscRes.error);
        if (cursosListRes.error) { console.error("Error fetching cursos list:", cursosListRes.error); throw cursosListRes.error; }

        const ingresosSemanaCalc = (ingresosRes.data as Pago[] || []).reduce((sum, p) => sum + (p.monto || 0), 0);
        const gastosSemanaCalc = (gastosRes.data as Gasto[] || []).reduce((sum, g) => sum + (g.monto || 0), 0);

        setStats({
          alumnosActivos: alumnosCountRes.count ?? 0,
          cursosActivos: cursosCountRes.count ?? 0,
          ingresosSemana: ingresosSemanaCalc,
          gastosSemana: gastosSemanaCalc,
        });

        // CORRECCIÓN: Asegurar que 'fecha' exista antes de usarla en sort
        const pagosRecientes: ActividadReciente[] = (actividadPagosRes.data || []).map((p: any) => ({ id: p.id_pago, tipo: 'pago', descripcion: `Pago ${p.concepto} de ${p.alumnos?.nombres || ''} ${p.alumnos?.apellidos || ''}`, fecha: p.fecha_pago || '', monto: p.monto }));
        const inscRecientes: ActividadReciente[] = (actividadInscRes.data || []).map((i: any) => ({ id: i.id_inscripcion, tipo: 'inscripcion', descripcion: `Inscripción de ${i.alumnos?.nombres || ''} ${i.alumnos?.apellidos || ''} a ${i.cursos?.nombre_curso || ''}`, fecha: i.fecha_inscripcion_curso || '' }));
        const actividadCombinada = [...pagosRecientes, ...inscRecientes];
        // Filtrar elementos sin fecha válida antes de ordenar
        actividadCombinada.filter(act => act.fecha).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setActividadReciente(actividadCombinada.slice(0, 5));

        console.log('✅ Cursos cargados:', cursosListRes.data);
        setCursos(cursosListRes.data || []);
        if (cursosListRes.data && cursosListRes.data.length > 0) {
          console.log('📌 Estableciendo curso inicial:', cursosListRes.data[0].id_curso);
          setSelectedCursoId(cursosListRes.data[0].id_curso);
        }
        setIsInitialLoad(false);
      } catch (error: any) {
        console.error("❌ Error cargando datos dashboard:", error);
        setErrorMsg("No se pudieron cargar los datos del dashboard.");
      } finally {
        setLoadingStats(false);
        console.log('🏁 Finalizando fetchDashboardData');
      }
    };
    fetchDashboardData();
  }, []);

  // useEffect para cargar notas
  useEffect(() => {
    console.log('📊 useEffect notas - selectedCursoId:', selectedCursoId, 'isInitialLoad:', isInitialLoad);
    const fetchTopTotalGrades = async () => {
      if (!selectedCursoId || selectedCursoId === '') { 
        console.log('⚠️ No hay curso seleccionado, limpiando notas');
        setTopFinalGrades([]); 
        return; 
      }
      setLoadingGrades(true);
      setErrorMsg(null);
      
      try {
        console.log('📥 Iniciando carga de notas para curso:', selectedCursoId);
        const { data: calificacionesData, error: calificacionesError } = await supabase
          .from('calificaciones')
          .select(`
            nota_obtenida,
            evaluaciones(
              id_curso,
              bimestre,
              nombre
            ),
            inscripciones(
              id_inscripcion,
              alumnos(
                nombres,
                apellidos
              )
            )
          `)
          .eq('evaluaciones.id_curso', selectedCursoId)
          .order('evaluaciones(bimestre)', { ascending: true });

        if (calificacionesError) {
          console.error('❌ Error en calificaciones:', calificacionesError);
          throw new Error(`Error al cargar calificaciones: ${calificacionesError.message}`);
        }

        console.log('📊 Datos de calificaciones recibidos:', calificacionesData);

        // Validación inicial de datos
        if (!Array.isArray(calificacionesData)) {
          console.error('❌ Los datos de calificaciones no son un array:', calificacionesData);
          throw new Error('Formato de datos inválido');
        }

        if (!calificacionesData || calificacionesData.length === 0) {
          console.log('ℹ️ No hay calificaciones para este curso');
          setTopFinalGrades([]);
          return;
        }

        // Procesamiento de datos con validación adicional
        const totalesPorAlumno = calificacionesData.reduce((acc: any, cal: any) => {
          // Validación exhaustiva de la estructura de datos
          if (!cal || typeof cal !== 'object') {
            console.log('⚠️ Calificación inválida:', cal);
            return acc;
          }

          if (!cal.inscripciones?.alumnos || !cal.evaluaciones) {
            console.log('⚠️ Datos incompletos en calificación:', cal);
            return acc;
          }

          const alumno = cal.inscripciones.alumnos;
          const evaluacion = cal.evaluaciones;

          if (!alumno.nombres || !alumno.apellidos || !evaluacion.bimestre) {
            console.log('⚠️ Datos faltantes en alumno o evaluación:', { alumno, evaluacion });
            return acc;
          }

          const idInscripcion = cal.inscripciones.id_inscripcion;
          const nombreCompleto = `${alumno.apellidos}, ${alumno.nombres}`.trim();
          const bimestre = Number(evaluacion.bimestre) || 1;
          
          if (isNaN(bimestre)) {
            console.log('⚠️ Bimestre inválido:', evaluacion.bimestre);
            return acc;
          }

          const key = `${idInscripcion}-${bimestre}`;
          if (!acc[key]) {
            acc[key] = {
              nombreAlumno: nombreCompleto,
              bimestre: bimestre,
              total: 0,
              count: 0,
              evaluaciones: []
            };
          }
          
          // Validación de nota_obtenida
          const nota = Number(cal.nota_obtenida);
          if (typeof nota === 'number' && !isNaN(nota) && nota >= 0 && nota <= 100) {
            acc[key].total += nota;
            acc[key].count += 1;
            acc[key].evaluaciones.push({
              nombre: evaluacion.nombre,
              nota: nota
            });
          } else {
            console.log('⚠️ Nota inválida:', cal.nota_obtenida);
          }
          
          return acc;
        }, {});

        console.log('📈 Totales por alumno calculados:', totalesPorAlumno);

        // Transformación a array con validaciones
        const totalesArray = Object.values(totalesPorAlumno).map((alumno: any) => {
          const promedio = alumno.count > 0 ? alumno.total / alumno.count : 0;
          return {
            nombreAlumno: alumno.nombreAlumno,
            totalBimestre: Number(promedio.toFixed(1)), // Aseguramos que sea número y con 1 decimal
            bimestre: alumno.bimestre,
            evaluaciones: alumno.evaluaciones
          };
        }).filter(entry => {
          const isValid = 
            typeof entry.nombreAlumno === 'string' && 
            entry.nombreAlumno.trim() !== '' &&
            typeof entry.totalBimestre === 'number' && 
            !isNaN(entry.totalBimestre) &&
            entry.totalBimestre >= 0 &&
            entry.totalBimestre <= 100 &&
            typeof entry.bimestre === 'number' &&
            entry.bimestre > 0;

          if (!isValid) {
            console.log('⚠️ Entrada filtrada por datos inválidos:', entry);
          }
          return isValid;
        }).sort((a, b) => {
          if (a.bimestre !== b.bimestre) {
            return a.bimestre - b.bimestre;
          }
          return b.totalBimestre - a.totalBimestre;
        });

        console.log('📊 Notas finales procesadas:', totalesArray);
        
        // Validación final antes de actualizar el estado
        if (Array.isArray(totalesArray) && totalesArray.every(item => 
          item && 
          typeof item === 'object' && 
          'nombreAlumno' in item && 
          'totalBimestre' in item && 
          'bimestre' in item
        )) {
          setTopFinalGrades(totalesArray);
        } else {
          console.error('❌ Datos procesados inválidos:', totalesArray);
          throw new Error('Error en el procesamiento de datos');
        }
      } catch (error: any) {
        console.error("❌ Error al cargar notas totales:", error);
        setErrorMsg(`Error al cargar notas totales: ${error.message}`);
        setTopFinalGrades([]);
      } finally {
        setLoadingGrades(false);
        console.log('🏁 Finalizando carga de notas');
      }
    };

    if (!isInitialLoad) {
      console.log('🔄 Iniciando fetchTopTotalGrades');
      fetchTopTotalGrades();
    } else {
      console.log('⏳ Esperando carga inicial');
    }
  }, [selectedCursoId, isInitialLoad]);

  // Agregar depuración para el renderizado
  console.log('🎨 Renderizando Dashboard:', {
    selectedCursoId,
    loadingGrades,
    topFinalGradesLength: topFinalGrades.length,
    isInitialLoad,
    errorMsg
  });

  // JSX (Corregido acceso a stats y renderizado de actividad)
  return (
    <MainLayout>
      <div className="space-y-8">
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{errorMsg}</div>}

        {/* Sección de Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Acceder a stats correctamente */}
          <StatCard title="Alumnos Registrados" value={stats.alumnosActivos ?? '...'} iconBgColor="bg-blue-500" />
          <StatCard title="Cursos Activos" value={stats.cursosActivos ?? '...'} iconBgColor="bg-green-500" />
          <StatCard title="Ingresos (Últ. 7 días)" value={formatCurrency(stats.ingresosSemana)} iconBgColor="bg-yellow-500" />
          <StatCard title="Gastos (Últ. 7 días)" value={formatCurrency(stats.gastosSemana)} iconBgColor="bg-pink-500" />
        </div>

        {/* Sección de Gráficos y Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Gráfico de Notas por Bimestre */}
          <div className="lg:col-span-2 bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Notas por Bimestre</h3>
              <select
                value={selectedCursoId}
                onChange={(e) => setSelectedCursoId(e.target.value)}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                disabled={loadingStats || cursos.length === 0}
              >
                <option value="">Seleccionar Curso</option>
                {cursos.map(curso => (
                  <option key={curso.id_curso} value={curso.id_curso}>
                    {curso.nombre_curso}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="h-64">
              {loadingGrades ? (
                <div className="flex items-center justify-center h-full text-gray-500">Cargando notas...</div>
              ) : topFinalGrades.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">No hay notas registradas para este curso.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topFinalGrades.filter(entry => 
                      typeof entry.totalBimestre === 'number' && 
                      !isNaN(entry.totalBimestre) &&
                      typeof entry.bimestre === 'number' &&
                      entry.nombreAlumno
                    )} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <YAxis 
                      type="category" 
                      dataKey="nombreAlumno" 
                      width={120} 
                      tick={{ fontSize: 10 }} 
                      interval={0} 
                    />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="totalBimestre" 
                      name="Total" 
                      barSize={20}
                    >
                      {topFinalGrades.map((entry, index) => (
                        <Cell 
                          key={`cell-${entry.nombreAlumno}-${entry.bimestre}-${index}`} 
                          fill={COLORS[(entry.bimestre - 1) % COLORS.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
            {loadingStats ? (<p>Cargando actividad...</p>) :
              actividadReciente.length === 0 ? (<p className="text-sm text-gray-500">No hay actividad reciente.</p>) : (
                <ul className="space-y-3 text-sm text-gray-600">
                  {/* Acceder a propiedades de 'act' correctamente */}
                  {actividadReciente.map(act => (
                    <li key={`${act.tipo}-${act.id}`} className="border-b pb-2 last:border-b-0">
                      <p className="font-medium">{act.descripcion}</p>
                      <p className="text-xs text-gray-500">
                        {/* Asegurarse que act.fecha es válida antes de formatear */}
                        {act.fecha ? format(new Date(act.fecha + 'T00:00:00'), 'dd/MM/yyyy') : 'Fecha no disponible'}
                        {/* Corregido renderizado condicional de monto */}
                        {act.monto != null && <span className="ml-2 font-semibold">{formatCurrency(act.monto)}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}