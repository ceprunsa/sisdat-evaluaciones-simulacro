"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePostulantes } from "../hooks/usePostulantes";
import { useExamenes } from "../hooks/useExamenes";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";
import type { Postulante } from "../types";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Mail,
  BadgeIcon as IdCard,
  AlertCircle,
  Eye,
} from "lucide-react";

const Postulantes = () => {
  // ✅ Solo cargar examenes inicialmente (datos ligeros)
  const { examenes, isLoading: loadingExamenes } = useExamenes();

  // ✅ Usar hooks optimizados que no cargan datos automáticamente
  const { postulantesByExamenQuery, deletePostulante, isDeleting } =
    usePostulantes();

  const [postulanteToDelete, setPostulanteToDelete] =
    useState<Postulante | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamen, setSelectedExamen] = useState<string>("");
  const [consultedExamen, setConsultedExamen] = useState<string>("");
  const [isConsulting, setIsConsulting] = useState(false);

  // ✅ Query específica que solo se ejecuta cuando hay examen consultado
  const postulantesQuery = postulantesByExamenQuery(consultedExamen);

  // ✅ Estados de carga específicos
  const isLoadingData = postulantesQuery.isLoading;
  const isError = postulantesQuery.isError;
  const postulantesDelExamen = postulantesQuery.data || [];

  // Filtrar postulantes por término de búsqueda
  const filteredPostulantes = postulantesDelExamen.filter(
    (postulante: Postulante) =>
      postulante.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulante.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulante.dni.includes(searchTerm) ||
      postulante.correoCeprunsa
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      postulante.carreraPostulacion
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // ✅ Ordenar postulantes por apellidos y nombres (orden alfabético ascendente)
  const postulantesOrdenados = filteredPostulantes.sort(
    (
      a: { apellidos: string; nombres: string },
      b: { apellidos: any; nombres: any }
    ) => {
      const apellidosComparison = a.apellidos.localeCompare(b.apellidos);
      if (apellidosComparison !== 0) {
        return apellidosComparison;
      }
      return a.nombres.localeCompare(b.nombres);
    }
  );

  // ✅ Paginación de postulantes filtrados y ordenados
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedPostulantes,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({
    data: postulantesOrdenados as Postulante[],
    itemsPerPage: 30,
  });

  // ✅ Reset página cuando cambian los filtros
  useEffect(() => {
    goToPage(1);
  }, [consultedExamen, searchTerm]);

  // ✅ Función para consultar datos del examen
  const handleConsultarExamen = async () => {
    if (!selectedExamen) return;

    setIsConsulting(true);
    try {
      // Simular un pequeño delay para mostrar el estado de carga
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConsultedExamen(selectedExamen);
      setSearchTerm(""); // Limpiar búsqueda al consultar nuevo examen
    } catch (error) {
      console.error("Error al consultar examen:", error);
    } finally {
      setIsConsulting(false);
    }
  };

  // ✅ Loading inicial solo para examenes
  if (loadingExamenes) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Cargando examenes...</span>
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
          No se pudieron cargar los postulantes del examen.
        </span>
      </div>
    );
  }

  const handleDeleteClick = (postulante: Postulante) => {
    setPostulanteToDelete(postulante);
  };

  const confirmDelete = async () => {
    if (!postulanteToDelete?.id) return;

    try {
      await deletePostulante(postulanteToDelete.id);
      setPostulanteToDelete(null);
    } catch (error) {
      console.error("Error al eliminar postulante:", error);
    }
  };

  const cancelDelete = () => {
    setPostulanteToDelete(null);
  };

  // ✅ Obtener datos del examen consultado
  const examenConsultado = consultedExamen
    ? examenes.find((ex) => ex.id === consultedExamen)
    : null;

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Postulantes
        </h1>
        <div className="flex gap-2">
          {/* ✅ Selector de examen con botón consultar */}
          <div className="flex gap-2">
            <select
              value={selectedExamen}
              onChange={(e) => setSelectedExamen(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-48"
            >
              <option value="">Seleccionar examen</option>
              {examenes.map((examen) => (
                <option key={examen.id} value={examen.id}>
                  {examen.nombre} - {examen.area} - {examen.proceso}
                </option>
              ))}
            </select>
            <button
              onClick={handleConsultarExamen}
              disabled={!selectedExamen || isConsulting}
              className="btn btn-secondary inline-flex items-center"
            >
              <Eye size={18} className="mr-1 md:mr-2" />
              <span className="hidden sm:inline">
                {isConsulting ? "Consultando..." : "Consultar"}
              </span>
              <span className="sm:hidden">{isConsulting ? "..." : "Ver"}</span>
            </button>
          </div>
          <Link
            to="/postulantes/new"
            className="btn btn-primary inline-flex items-center"
          >
            <Plus size={18} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">Nuevo Postulante</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        </div>
      </div>

      {/* ✅ Mostrar información del examen consultado */}
      {consultedExamen && examenConsultado && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Examen Consultado
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Nombre</p>
              <p className="text-base font-semibold text-gray-900">
                {examenConsultado.nombre}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Proceso</p>
              <p className="text-base font-semibold text-gray-900">
                {examenConsultado.proceso}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Área</p>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                {examenConsultado.area}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Mostrar mensaje si no se ha consultado ningún examen */}
      {!consultedExamen && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">
              Selecciona un examen y presiona "Consultar" para ver los
              postulantes que participaron.
            </span>
          </div>
        </div>
      )}

      {/* ✅ Loading específico para datos del examen */}
      {consultedExamen && isLoadingData && (
        <div className="flex justify-center items-center h-64">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Cargando postulantes del examen...
          </span>
        </div>
      )}

      {/* ✅ Mostrar contenido solo si se ha consultado un examen y no está cargando */}
      {consultedExamen && !isLoadingData && (
        <>
          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por apellidos, nombres, DNI, correo o carrera..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* ✅ Información de paginación con indicador de ordenamiento */}
          {totalItems > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Página {currentPage} de {totalPages} • {totalItems} postulantes
              encontrados • Ordenados por apellidos (A-Z)
            </div>
          )}

          {/* ✅ Paginación superior */}
          {totalItems > 0 && (
            <div className="mb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                onNextPage={goToNextPage}
                onPreviousPage={goToPreviousPage}
                onFirstPage={goToFirstPage}
                onLastPage={goToLastPage}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
              />
            </div>
          )}

          {/* Lista de postulantes */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
            {paginatedPostulantes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm
                  ? "No se encontraron postulantes que coincidan con la búsqueda en este examen"
                  : "No hay postulantes registrados para este examen"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
                <div className="hidden xl:grid xl:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
                  <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </div>
                  <div className="xl:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apellidos y Nombres ↑
                  </div>
                  <div className="xl:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrera
                  </div>
                  <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </div>
                  <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </div>
                  <div className="xl:col-span-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </div>
                </div>

                {/* ✅ Filas de postulantes paginados */}
                {paginatedPostulantes.map((postulante, index) => (
                  <div
                    key={postulante.id}
                    className={`p-4 xl:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                      index === paginatedPostulantes.length - 1
                        ? "rounded-b-lg"
                        : ""
                    }`}
                  >
                    {/* Vista para pantallas grandes */}
                    <div className="hidden xl:grid xl:grid-cols-12 xl:items-center xl:px-6 xl:py-4">
                      <div className="xl:col-span-2">
                        <div className="flex items-center">
                          <IdCard className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {postulante.dni}
                          </span>
                        </div>
                      </div>
                      <div className="xl:col-span-3">
                        <div className="text-sm font-medium text-gray-900">
                          {postulante.apellidos}, {postulante.nombres}
                        </div>
                      </div>
                      <div className="xl:col-span-3 text-sm text-gray-900">
                        {postulante.carreraPostulacion}
                      </div>
                      <div className="xl:col-span-2 text-sm text-gray-500">
                        {postulante.especialidad || "Sin especialidad"}
                      </div>
                      <div className="xl:col-span-1">
                        <a
                          href={`mailto:${postulante.correoCeprunsa}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title={postulante.correoCeprunsa}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="xl:col-span-1 text-right flex justify-end space-x-2">
                        <Link
                          to={`/postulantes/${postulante.id}`}
                          className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          title="Editar postulante"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(postulante)}
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                          title="Eliminar postulante"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Vista para pantallas pequeñas y medianas */}
                    <div className="xl:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <IdCard className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {postulante.dni}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <Link
                            to={`/postulantes/${postulante.id}`}
                            className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(postulante)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="font-medium text-gray-900">
                          {postulante.apellidos}, {postulante.nombres}
                        </div>
                        <div className="text-sm text-gray-600">
                          {postulante.carreraPostulacion}
                        </div>
                        {postulante.especialidad && (
                          <div className="text-sm text-gray-500">
                            Especialidad: {postulante.especialidad}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <a
                          href={`mailto:${postulante.correoCeprunsa}`}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          <span className="truncate max-w-48">
                            {postulante.correoCeprunsa}
                          </span>
                        </a>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          {postulante.createdAt
                            ? new Date(
                                postulante.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ Paginación inferior */}
          {totalItems > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                onNextPage={goToNextPage}
                onPreviousPage={goToPreviousPage}
                onFirstPage={goToFirstPage}
                onLastPage={goToLastPage}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
              />
            </div>
          )}
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      {postulanteToDelete && (
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
                      Eliminar postulante
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar al postulante{" "}
                        <span className="font-semibold">
                          {postulanteToDelete.apellidos},{" "}
                          {postulanteToDelete.nombres}
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

export default Postulantes;
