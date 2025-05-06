import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Encargado } from '../../types';
import FormularioEncargado from './FormularioEncargado';
import AlumnosEncargado from './AlumnosEncargado';
import React from 'react';

export default function ListaEncargados() {
    const [encargados, setEncargados] = useState<Encargado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [encargadoAEditar, setEncargadoAEditar] = useState<Encargado | null>(null);
    const [encargadoSeleccionado, setEncargadoSeleccionado] = useState<Encargado | null>(null);

    // Cargar encargados
    const cargarEncargados = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('encargados')
                .select('*')
                .order('nombres', { ascending: true });

            if (error) throw error;
            setEncargados(data || []);
        } catch (error: any) {
            console.error('Error cargando encargados:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarEncargados();
    }, []);

    // Manejar edición
    const handleEdit = (encargado: Encargado) => {
        setEncargadoAEditar(encargado);
        setShowForm(true);
    };

    // Manejar eliminación
    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este encargado?')) return;

        try {
            const { error } = await supabase
                .from('encargados')
                .delete()
                .eq('id_encargado', id);

            if (error) throw error;
            await cargarEncargados();
            if (encargadoSeleccionado?.id_encargado === id) {
                setEncargadoSeleccionado(null);
            }
        } catch (error: any) {
            console.error('Error eliminando encargado:', error);
            setError(error.message);
        }
    };

    // Manejar cierre del formulario
    const handleFormClose = () => {
        setShowForm(false);
        setEncargadoAEditar(null);
    };

    // Manejar envío exitoso del formulario
    const handleFormSubmit = () => {
        cargarEncargados();
        handleFormClose();
    };

    // Manejar selección de encargado para ver alumnos
    const handleVerAlumnos = (encargado: Encargado) => {
        setEncargadoSeleccionado(encargadoSeleccionado?.id_encargado === encargado.id_encargado ? null : encargado);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Encargados</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Agregar Encargado
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    {encargadoAEditar ? 'Editar Encargado' : 'Nuevo Encargado'}
                                </h2>
                                <button
                                    onClick={handleFormClose}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <FormularioEncargado
                                encargadoAEditar={encargadoAEditar}
                                onFormSubmit={handleFormSubmit}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Teléfono
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Relación
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Correo
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {encargados.map((encargado) => (
                            <React.Fragment key={encargado.id_encargado}>
                                <tr className={encargadoSeleccionado?.id_encargado === encargado.id_encargado ? 'bg-indigo-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {encargado.nombres} {encargado.apellidos}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {encargado.telefono}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {encargado.relacion_parentesco || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {encargado.correo_electronico || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleVerAlumnos(encargado)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            {encargadoSeleccionado?.id_encargado === encargado.id_encargado ? 'Ocultar Alumnos' : 'Ver Alumnos'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(encargado)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(encargado.id_encargado!)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                                {encargadoSeleccionado?.id_encargado === encargado.id_encargado && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4">
                                            <AlumnosEncargado encargado={encargado} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 