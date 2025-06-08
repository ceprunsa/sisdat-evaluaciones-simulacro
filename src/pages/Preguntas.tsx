"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { usePreguntas } from "../hooks/usePreguntas";
import ImportPreguntasModal from "../components/ImportPreguntasModal";
import type { Pregunta } from "../types";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  BookOpen,
  Target,
  Calculator,
  Upload,
} from "lucide-react";

const Preguntas = () => {
  const { preguntas, isLoading, isError, deletePregunta, isDeleting } =
    usePreguntas();
  const [preguntaToDelete, setPreguntaToDelete] = useState<Pregunta | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<string>("todas");
  const [filterCurso, setFilterCurso] = useState<string>("todos");
  const [showImportModal, setShowImportModal] = useState(false);

  // Obtener cursos únicos para el filtro
  const cursosUnicos = [...new Set(preguntas.map((p) => p.curso))].sort();

  // Filtrar preguntas
  const preguntasFiltradas = preguntas.filter((pregunta) => {
    const matchesSearch =
      pregunta.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pregunta.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pregunta.subtema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pregunta.competencia.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = filterArea === "todas" || pregunta.area === filterArea;
    const matchesCurso =
      filterCurso === "todos" || pregunta.curso === filterCurso;

    return matchesSearch && matchesArea && matchesCurso;
  });

  // Calcular estadísticas
  const totalPuntaje = preguntasFiltradas.reduce(
    (sum, p) => sum + p.puntaje,
    0
  );
  const promedioPuntaje =
    preguntasFiltradas.length > 0
      ? totalPuntaje / preguntasFiltradas.length
      : 0;

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
          No se pudieron cargar las preguntas.
        </span>
      </div>
    );
  }

  const handleDeleteClick = (pregunta: Pregunta) => {
    setPreguntaToDelete(pregunta);
  };

  const confirmDelete = async () => {
    if (!preguntaToDelete?.id) return;

    try {
      await deletePregunta(preguntaToDelete.id);
      setPreguntaToDelete(null);
    } catch (error) {
      console.error("Error al eliminar pregunta:", error);
    }
  };

  const cancelDelete = () => {
    setPreguntaToDelete(null);
  };

  const getPuntajeColor = (puntaje: number) => {
    if (puntaje >= 2) return "text-green-600 bg-green-50";
    if (puntaje >= 1) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Banco de Preguntas
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-secondary inline-flex items-center"
          >
            <Upload size={18} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">Importar JSON</span>
            <span className="sm:hidden">Importar</span>
          </button>
          <Link
            to="/preguntas/new"
            className="btn btn-primary inline-flex items-center"
          >
            <Plus size={18} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">Nueva Pregunta</span>
            <span className="sm:hidden">Nueva</span>
          </Link>
        </div>
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
            placeholder="Buscar por curso, tema, subtema o competencia..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros por área y curso */}
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
            value={filterCurso}
            onChange={(e) => setFilterCurso(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos los cursos</option>
            {cursosUnicos.map((curso) => (
              <option key={curso} value={curso}>
                {curso}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Total Preguntas
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {preguntasFiltradas.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Cursos</p>
              <p className="text-xl font-semibold text-gray-900">
                {filterCurso === "todos" ? cursosUnicos.length : 1}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Puntaje Total</p>
              <p
                className={`text-xl font-semibold ${
                  totalPuntaje === 100
                    ? "text-green-600"
                    : totalPuntaje > 100
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                {totalPuntaje.toFixed(1)} / 100
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">⌀</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Puntaje Promedio
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {promedioPuntaje.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de control de puntajes */}
      {totalPuntaje !== 100 && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            totalPuntaje > 100
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-yellow-50 border-yellow-200 text-yellow-700"
          }`}
        >
          <div className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            <span className="font-medium">
              {totalPuntaje > 100
                ? `⚠️ El puntaje total excede 100 puntos (${totalPuntaje.toFixed(
                    1
                  )})`
                : `📝 Faltan ${(100 - totalPuntaje).toFixed(
                    1
                  )} puntos para completar 100`}
            </span>
          </div>
        </div>
      )}

      {/* Lista de preguntas */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        {preguntasFiltradas.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm || filterArea !== "todas" || filterCurso !== "todos"
              ? "No se encontraron preguntas que coincidan con los filtros"
              : "No hay preguntas registradas"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
            <div className="hidden xl:grid xl:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curso
              </div>
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tema
              </div>
              <div className="xl:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Competencia
              </div>
              <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </div>
              <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puntaje
              </div>
              <div className="xl:col-span-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </div>
            </div>

            {/* Filas de preguntas */}
            {preguntasFiltradas.map((pregunta, index) => (
              <div
                key={pregunta.id}
                className={`p-4 xl:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                  index === preguntasFiltradas.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                {/* Vista para pantallas grandes */}
                <div className="hidden xl:grid xl:grid-cols-12 xl:items-center xl:px-6 xl:py-4">
                  <div className="xl:col-span-2">
                    <div className="text-sm font-medium text-gray-900">
                      {pregunta.curso}
                    </div>
                  </div>
                  <div className="xl:col-span-2">
                    <div className="text-sm text-gray-900">{pregunta.tema}</div>
                    <div className="text-xs text-gray-500">
                      {pregunta.subtema}
                    </div>
                  </div>
                  <div className="xl:col-span-3">
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {pregunta.competencia.length > 100
                        ? `${pregunta.competencia.substring(0, 100)}...`
                        : pregunta.competencia}
                    </div>
                  </div>
                  <div className="xl:col-span-1">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {pregunta.area}
                    </span>
                  </div>
                  <div className="xl:col-span-1">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPuntajeColor(
                        pregunta.puntaje
                      )}`}
                    >
                      {pregunta.puntaje} pts
                    </span>
                  </div>
                  <div className="xl:col-span-3 text-right flex justify-end space-x-2">
                    <Link
                      to={`/preguntas/${pregunta.id}`}
                      className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                      title="Editar pregunta"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(pregunta)}
                      className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                      title="Eliminar pregunta"
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
                        {pregunta.curso}
                      </div>
                      <div className="text-sm text-gray-600">
                        {pregunta.tema}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pregunta.subtema}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Link
                        to={`/preguntas/${pregunta.id}`}
                        className="p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(pregunta)}
                        className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm text-gray-700 line-clamp-2">
                      {pregunta.competencia.length > 80
                        ? `${pregunta.competencia.substring(0, 80)}...`
                        : pregunta.competencia}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {pregunta.area}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPuntajeColor(
                          pregunta.puntaje
                        )}`}
                      >
                        {pregunta.puntaje} pts
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      {pregunta.createdAt
                        ? new Date(pregunta.createdAt).toLocaleDateString()
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
      {preguntaToDelete && (
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
                      Eliminar pregunta
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar la pregunta de{" "}
                        <span className="font-semibold">
                          {preguntaToDelete.curso}
                        </span>{" "}
                        sobre{" "}
                        <span className="font-semibold">
                          {preguntaToDelete.tema}
                        </span>
                        ? Esta acción no se puede deshacer y afectará a los
                        exámenes que la contengan.
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

      {/* Modal de importación */}
      <ImportPreguntasModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default Preguntas;
