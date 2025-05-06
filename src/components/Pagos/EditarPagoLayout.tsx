import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Pago } from '../../types';
import FormularioPago from './FormularioPago';

export default function EditarPagoLayout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pagoAEditar, setPagoAEditar] = useState<Pago | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPago = async () => {
            if (!id) {
                setError('ID de pago no proporcionado');
                setLoading(false);
                return;
            }

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
                console.error('Error al cargar el pago:', error);
                setError(`Error al cargar el pago: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchPago();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center text-gray-500">
                    <div className="mb-2">Cargando datos del pago...</div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <Link to="/pagos" className="text-indigo-600 hover:underline text-sm">
                        &larr; Volver al Historial de Pagos
                    </Link>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-700">{error}</div>
                    <button 
                        onClick={() => navigate('/pagos')}
                        className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
                    >
                        Volver al historial de pagos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4">
                <Link to="/pagos" className="text-indigo-600 hover:underline text-sm">
                    &larr; Volver al Historial de Pagos
                </Link>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Editar Pago
                {pagoAEditar?.numero_recibo && (
                    <span className="text-lg text-gray-500 ml-2">
                        (Recibo #{pagoAEditar.numero_recibo})
                    </span>
                )}
            </h2>
            <FormularioPago 
                pagoAEditar={pagoAEditar}
                onFormSubmit={() => {
                    navigate('/pagos');
                }}
            />
        </div>
    );
} 