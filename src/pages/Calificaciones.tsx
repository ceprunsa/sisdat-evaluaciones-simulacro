"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useCalificaciones } from "../hooks/useCalificaciones";
import type { Calificacion } from "../types";
import { Plus, Trash2, Search, Eye, FileSpreadsheet } from "lucide-react";
import ImportCalificacionesModal from "../components/ImportCalificacionesModal";

const Calificaciones = () => {
  const {
    calificaciones,
    isLoading,
    isError,
    deleteCalificacion,
    isDeleting,
    exportToExcel,
    isExporting,
  } = useCalificaciones();
  const [calificacionToDelete, setCalificacionToDelete] =
    useState<Calificacion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // Filtrar calificaciones por término de búsqueda
  const filteredCalificaciones = calificaciones.filter(
    (calificacion) =>
      calificacion.postulante?.apellidos
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      calificacion.postulante?.nombres
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      calificacion.postulante?.dni.includes(searchTerm) ||
      calificacion.examenSimulacro?.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      calificacion.examenSimulacro?.proceso
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

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
          No se pudieron cargar las calificaciones.
        </span>
      </div>
    );
  }

  const handleDeleteClick = (calificacion: Calificacion) => {
    setCalificacionToDelete(calificacion);
  };

  const confirmDelete = async () => {
    if (!calificacionToDelete?.id) return;

    try {
      await deleteCalificacion(calificacionToDelete.id);
      setCalificacionToDelete(null);
    } catch (error) {
      console.error("Error al eliminar calificación:", error);
    }
  };

  const cancelDelete = () => {
    setCalificacionToDelete(null);
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredCalificaciones);
  };

  const getNotaColor = (nota: number, maxNota: number) => {
    const percentage = maxNota > 0 ? (nota / maxNota) * 100 : 0;
    if (percentage >= 65) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 52)
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (percentage >= 45) return "text-red-600 bg-red-50 border-red-200";
    //morado
    return "text-purple-600 bg-purple-50 border-purple-200";
  };

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Calificaciones
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting || filteredCalificaciones.length === 0}
            className="btn btn-secondary inline-flex items-center"
          >
            <FileSpreadsheet size={18} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">
              {isExporting ? "Exportando..." : "Exportar Excel"}
            </span>
            <span className="sm:hidden">{isExporting ? "..." : "Excel"}</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-secondary inline-flex items-center"
          >
            <Plus size={18} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">Importar JSON</span>
            <span className="sm:hidden">Importar</span>
          </button>
          <Link
            to="/calificaciones/new"
            className="btn btn-primary inline-flex items-center"
          >
            <Plus size={18} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">Nueva Calificación</span>
            <span className="sm:hidden">Nueva</span>
          </Link>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por postulante, DNI, examen o proceso..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de calificaciones */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        {filteredCalificaciones.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm
              ? "No se encontraron calificaciones que coincidan con la búsqueda"
              : "No hay calificaciones registradas"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
            <div className="hidden xl:grid xl:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
              <div className="xl:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Postulante
              </div>
              <div className="xl:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Examen
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calificación
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Examen
              </div>
              <div className="xl:col-span-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </div>
            </div>

            {/* Filas de calificaciones */}
            {filteredCalificaciones.map(
              (calificacion: Calificacion, index: number) => {
                const maxNota =
                  calificacion.examenSimulacro?.preguntasData?.reduce(
                    (sum, p) => sum + p.puntaje,
                    0
                  ) || 100;

                return (
                  <div
                    key={calificacion.id}
                    className={`p-4 xl:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                      index === filteredCalificaciones.length - 1
                        ? "rounded-b-lg"
                        : ""
                    }`}
                  >
                    {/* Vista para pantallas grandes */}
                    <div className="hidden xl:grid xl:grid-cols-12 xl:items-center xl:px-6 xl:py-4">
                      <div className="xl:col-span-3">
                        <div className="text-sm font-medium text-gray-900">
                          {calificacion.postulante?.apellidos},{" "}
                          {calificacion.postulante?.nombres}
                        </div>
                        <div className="text-sm text-gray-500">
                          DNI: {calificacion.postulante?.dni}
                        </div>
                      </div>
                      <div className="xl:col-span-3">
                        <div className="text-sm font-medium text-gray-900">
                          {calificacion.examenSimulacro?.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {calificacion.examenSimulacro?.proceso}
                        </div>
                      </div>
                      <div className="xl:col-span-2">
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${getNotaColor(
                            calificacion.calificacionFinal,
                            maxNota
                          )}`}
                        >
                          {calificacion.calificacionFinal} / {maxNota}
                        </span>
                      </div>
                      <div className="xl:col-span-2 text-sm text-gray-500">
                        {new Date(
                          calificacion.fechaExamen
                        ).toLocaleDateString()}
                      </div>
                      <div className="xl:col-span-2 text-right flex justify-end space-x-2">
                        <Link
                          to={`/calificaciones/${calificacion.id}/detalle`}
                          className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(calificacion)}
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                          title="Eliminar calificación"
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
                            {calificacion.postulante?.apellidos},{" "}
                            {calificacion.postulante?.nombres}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {calificacion.postulante?.dni}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Link
                            to={`/calificaciones/${calificacion.id}/detalle`}
                            className="p-2 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(calificacion)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          {calificacion.examenSimulacro?.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {calificacion.examenSimulacro?.proceso}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${getNotaColor(
                            calificacion.calificacionFinal,
                            maxNota
                          )}`}
                        >
                          {calificacion.calificacionFinal.toFixed(2)} /{" "}
                          {maxNota}
                        </span>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          {new Date(
                            calificacion.fechaExamen
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {calificacionToDelete && (
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
                      Eliminar calificación
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar la calificación de{" "}
                        <span className="font-semibold">
                          {calificacionToDelete.postulante?.apellidos},{" "}
                          {calificacionToDelete.postulante?.nombres}
                        </span>{" "}
                        para el examen{" "}
                        <span className="font-semibold">
                          {calificacionToDelete.examenSimulacro?.nombre}
                        </span>
                        ? Esta acción no se puede deshacer.
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
      {/* Modal de importación de calificaciones */}
      <ImportCalificacionesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default Calificaciones;
