import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Pago } from '../../types';
import FormularioPago from './FormularioPago';

export default function NuevoPagoLayout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pagoAEditar, setPagoAEditar] = useState<Pago | null>(null);
    const [loading, setLoading] = useState(!!id);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const fetchPago = async () => {
                try {
                    const { data, error } = await supabase
                        .from('pagos')
                        .select(`
                            *,
                            alumnos (
                                nombres,
                                apellidos
                            ),
                            inscripciones (
                                cursos (
                                    nombre_curso
                                )
                            )
                        `)
                        .eq('id_pago', id)
                        .single();

                    if (error) throw error;
                    if (data) {
                        setPagoAEditar(data);
                    } else {
                        setError('Pago no encontrado');
                    }
                } catch (error: any) {
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchPago();
        }
    }, [id]);

    if (loading) return <div className="p-6 text-center text-gray-500">Cargando...</div>;
    if (error) return <div className="m-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4">
                <Link to="/pagos" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al Historial de Pagos
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {id ? 'Editar Pago' : 'Registrar Nuevo Pago'}
            </h2>
            <FormularioPago 
                pagoAEditar={pagoAEditar}
                onFormSubmit={() => navigate('/pagos')}
            />
        </div>
    );
} 