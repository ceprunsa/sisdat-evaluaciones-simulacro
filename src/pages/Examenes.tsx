"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useExamenes } from "../hooks/useExamenes";
import type { ExamenSimulacro } from "../types";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  FileText,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";

const Examenes = () => {
  const {
    examenes,
    isLoading,
    isError,
    deleteExamen,
    isDeleting,
    updateEstadoExamen,
    isUpdating,
  } = useExamenes();
  const [examenToDelete, setExamenToDelete] = useState<ExamenSimulacro | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<string>("todas");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Filtrar exámenes
  const examenesFiltrados = examenes.filter((examen) => {
    const matchesSearch =
      examen.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      examen.proceso.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = filterArea === "todas" || examen.area === filterArea;
    const matchesEstado =
      filterEstado === "todos" || examen.estado === filterEstado;

    return matchesSearch && matchesArea && matchesEstado;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline">
          {" "}
          No se pudieron cargar los exámenes.
        </span>
      </div>
    );
  }

  const handleDeleteClick = (examen: ExamenSimulacro) => {
    setExamenToDelete(examen);
  };

  const confirmDelete = async () => {
    if (!examenToDelete?.id) return;

    try {
      await deleteExamen(examenToDelete.id);
      setExamenToDelete(null);
    } catch (error) {
      console.error("Error al eliminar examen:", error);
    }
  };

  const cancelDelete = () => {
    setExamenToDelete(null);
  };

  const handleToggleEstado = (examen: ExamenSimulacro) => {
    const nuevoEstado =
      examen.estado === "construccion" ? "listo" : "construccion";
    updateEstadoExamen(examen.id, nuevoEstado);
  };

  const getEstadoColor = (estado: string) => {
    return estado === "listo"
      ? "text-green-600 bg-green-50"
      : "text-yellow-600 bg-yellow-50";
  };

  const getAreaColor = (area: string) => {
    switch (area) {
      case "Biomédicas":
        return "text-red-600 bg-red-50";
      case "Ingenierías":
        return "text-blue-600 bg-blue-50";
      case "Sociales":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Exámenes Simulacro
        </h1>
        <Link
          to="/examenes/new"
          className="btn btn-primary inline-flex items-center"
        >
          <Plus size={18} className="mr-1 md:mr-2" />
          <span className="hidden sm:inline">Nuevo Examen</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o proceso..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros por área y estado */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todas">Todas las áreas</option>
            <option value="Biomédicas">Biomédicas</option>
            <option value="Ingenierías">Ingenierías</option>
            <option value="Sociales">Sociales</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="construccion">En construcción</option>
            <option value="listo">Listo</option>
          </select>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Total Exámenes
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {examenesFiltrados.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Listos</p>
              <p className="text-xl font-semibold text-gray-900">
                {examenesFiltrados.filter((e) => e.estado === "listo").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                En Construcción
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {
                  examenesFiltrados.filter((e) => e.estado === "construccion")
                    .length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">?</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Preguntas Totales
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {examenesFiltrados.reduce(
                  (sum, e) => sum + (e.preguntas?.length || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de exámenes */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        {examenesFiltrados.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm || filterArea !== "todas" || filterEstado !== "todos"
              ? "No se encontraron exámenes que coincidan con los filtros"
              : "No hay exámenes registrados"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
            <div className="hidden xl:grid xl:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
              <div className="xl:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proceso
              </div>
              <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </div>
              <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preguntas
              </div>
              <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Creación
              </div>
              <div className="xl:col-span-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </div>
            </div>

            {/* Filas de exámenes */}
            {examenesFiltrados.map((examen, index) => (
              <div
                key={examen.id}
                className={`p-4 xl:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                  index === examenesFiltrados.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                {/* Vista para pantallas grandes */}
                <div className="hidden xl:grid xl:grid-cols-12 xl:items-center xl:px-6 xl:py-4">
                  <div className="xl:col-span-3">
                    <div className="text-sm font-medium text-gray-900">
                      {examen.nombre}
                    </div>
                  </div>
                  <div className="xl:col-span-2">
                    <div className="text-sm text-gray-900">
                      {examen.proceso}
                    </div>
                  </div>
                  <div className="xl:col-span-1">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getAreaColor(
                        examen.area
                      )}`}
                    >
                      {examen.area}
                    </span>
                  </div>
                  <div className="xl:col-span-1">
                    <div className="text-sm text-gray-900">
                      {examen.preguntas?.length || 0} / 80
                      {(examen.preguntas?.length || 0) === 80 && (
                        <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" />
                      )}
                    </div>
                  </div>
                  <div className="xl:col-span-1">
                    <button
                      onClick={() => handleToggleEstado(examen)}
                      disabled={isUpdating}
                      className={`px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getEstadoColor(
                        examen.estado
                      )}`}
                    >
                      {examen.estado === "listo" ? "Listo" : "En construcción"}
                    </button>
                  </div>
                  <div className="xl:col-span-2 text-sm text-gray-500">
                    {examen.createdAt
                      ? new Date(examen.createdAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div className="xl:col-span-2 text-right flex justify-end space-x-2">
                    <Link
                      to={`/examenes/${examen.id}`}
                      className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </Link>
                    <Link
                      to={`/examenes/${examen.id}/edit`}
                      className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                      title="Editar examen"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(examen)}
                      className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                      title="Eliminar examen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Vista para pantallas pequeñas y medianas */}
                <div className="xl:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {examen.nombre}
                      </div>
                      <div className="text-sm text-gray-600">
                        {examen.proceso}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Link
                        to={`/examenes/${examen.id}`}
                        className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        to={`/examenes/${examen.id}/edit`}
                        className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(examen)}
                        className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-700">
                      Preguntas: {examen.preguntas?.length || 0} / 80
                      {(examen.preguntas?.length || 0) === 80 && (
                        <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getAreaColor(
                          examen.area
                        )}`}
                      >
                        {examen.area}
                      </span>
                      <button
                        onClick={() => handleToggleEstado(examen)}
                        disabled={isUpdating}
                        className={`px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getEstadoColor(
                          examen.estado
                        )}`}
                      >
                        {examen.estado === "listo"
                          ? "Listo"
                          : "En construcción"}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      {examen.createdAt
                        ? new Date(examen.createdAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {examenToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar examen
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar el examen{" "}
                        <span className="font-semibold">
                          {examenToDelete.nombre}
                        </span>
                        ? Esta acción no se puede deshacer y se eliminarán todas
                        las calificaciones asociadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn btn-danger sm:ml-3"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0 sm:ml-3"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Examenes;
