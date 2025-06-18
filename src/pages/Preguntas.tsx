"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePreguntas } from "../hooks/usePreguntas";
import { useExamenes } from "../hooks/useExamenes";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";
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
  Brain,
  AlertCircle,
  Eye,
} from "lucide-react";

const Preguntas = () => {
  const { preguntas, isError, deletePregunta, isDeleting } = usePreguntas();
  const { examenes, isLoading: loadingExamenes } = useExamenes();
  const [preguntaToDelete, setPreguntaToDelete] = useState<Pregunta | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<string>("todas");
  const [filterCurso, setFilterCurso] = useState<string>("todos");
  const [filterNivelCognitivo, setFilterNivelCognitivo] =
    useState<string>("todos");
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedExamen, setSelectedExamen] = useState<string>("");
  const [consultedExamen, setConsultedExamen] = useState<string>("");
  const [isConsulting, setIsConsulting] = useState(false);

  const isLoading = loadingExamenes;

  // ✅ Solo filtrar si se ha consultado un examen
  const preguntasDelExamen = consultedExamen
    ? preguntas.filter((pregunta) => {
        const examen = examenes.find((ex) => ex.id === consultedExamen);
        return examen?.preguntas.includes(pregunta.id);
      })
    : [];

  // Obtener valores únicos para los filtros (solo del examen consultado)
  const cursosUnicos = [
    ...new Set(preguntasDelExamen.map((p) => p.curso)),
  ].sort();
  const nivelesCognitivosUnicos = [
    ...new Set(preguntasDelExamen.map((p) => p.nivelCognitivo)),
  ].sort();

  // Filtrar preguntas
  const preguntasFiltradas = preguntasDelExamen.filter((pregunta) => {
    const matchesSearch =
      pregunta.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pregunta.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pregunta.competencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pregunta.nivelCognitivo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = filterArea === "todas" || pregunta.area === filterArea;
    const matchesCurso =
      filterCurso === "todos" || pregunta.curso === filterCurso;
    const matchesNivelCognitivo =
      filterNivelCognitivo === "todos" ||
      pregunta.nivelCognitivo === filterNivelCognitivo;

    return (
      matchesSearch && matchesArea && matchesCurso && matchesNivelCognitivo
    );
  });

  // ✅ Ordenar preguntas por curso y tema (orden alfabético ascendente)
  const preguntasOrdenadas = preguntasFiltradas.sort((a, b) => {
    const cursoComparison = a.curso.localeCompare(b.curso);
    if (cursoComparison !== 0) {
      return cursoComparison;
    }
    return a.tema.localeCompare(b.tema);
  });

  // ✅ Paginación de preguntas filtradas y ordenadas
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedPreguntas,
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
    data: preguntasOrdenadas,
    itemsPerPage: 30,
  });

  // ✅ Reset página cuando cambian los filtros
  useEffect(() => {
    goToPage(1);
  }, [
    consultedExamen,
    searchTerm,
    filterArea,
    filterCurso,
    filterNivelCognitivo,
  ]);

  // ✅ Reset filtros cuando se consulta un nuevo examen
  useEffect(() => {
    if (consultedExamen) {
      setFilterArea("todas");
      setFilterCurso("todos");
      setFilterNivelCognitivo("todos");
      setSearchTerm("");
    }
  }, [consultedExamen]);

  // ✅ Función para consultar datos del examen
  const handleConsultarExamen = async () => {
    if (!selectedExamen) return;

    setIsConsulting(true);
    try {
      // Simular un pequeño delay para mostrar el estado de carga
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConsultedExamen(selectedExamen);
    } catch (error) {
      console.error("Error al consultar examen:", error);
    } finally {
      setIsConsulting(false);
    }
  };

  // Calcular estadísticas basadas en preguntas filtradas (no paginadas)
  const totalPuntaje = preguntasFiltradas.reduce(
    (sum, p) => sum + p.puntaje,
    0
  );

  // Estadísticas por nivel cognitivo
  const estadisticasNivelCognitivo = nivelesCognitivosUnicos.map((nivel) => ({
    nivel,
    cantidad: preguntasFiltradas.filter((p) => p.nivelCognitivo === nivel)
      .length,
  }));

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

  // Función para obtener color del nivel cognitivo basado en Bloom
  const getNivelCognitivoColor = (nivel: string) => {
    const nivelLower = nivel.toLowerCase();

    // Colores específicos para niveles de Bloom
    if (nivelLower.includes("recordar")) return "bg-gray-100 text-gray-800";
    if (nivelLower.includes("comprender")) return "bg-blue-100 text-blue-800";
    if (nivelLower.includes("aplicar")) return "bg-green-100 text-green-800";
    if (nivelLower.includes("analizar")) return "bg-yellow-100 text-yellow-800";
    if (nivelLower.includes("evaluar")) return "bg-orange-100 text-orange-800";
    if (nivelLower.includes("crear")) return "bg-purple-100 text-purple-800";

    // Color por defecto para otros niveles
    return "bg-indigo-100 text-indigo-800";
  };

  // ✅ Obtener datos del examen consultado
  const examenConsultado = consultedExamen
    ? examenes.find((ex) => ex.id === consultedExamen)
    : null;

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Banco de Preguntas
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
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
                  {examen.nombre} - {examen.area}-{examen.proceso}
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
              Selecciona un examen y presiona "Consultar" para ver las preguntas
              correspondientes.
            </span>
          </div>
        </div>
      )}

      {/* ✅ Mostrar contenido solo si se ha consultado un examen */}
      {consultedExamen && (
        <>
          {/* Filtros */}
          <div className="mb-6 space-y-4">
            {/* Barra de búsqueda */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por curso, tema, competencia o nivel cognitivo..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros por área, curso y nivel cognitivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <select
                value={filterNivelCognitivo}
                onChange={(e) => setFilterNivelCognitivo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los niveles</option>
                {nivelesCognitivosUnicos.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
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
                    Preguntas del Examen
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
                  <p className="text-sm font-medium text-gray-500">
                    Puntaje Total
                  </p>
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
                <Brain className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Niveles Cognitivos
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {filterNivelCognitivo === "todos"
                      ? nivelesCognitivosUnicos.length
                      : 1}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Distribución por nivel cognitivo */}
          {estadisticasNivelCognitivo.length > 0 && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                Distribución por Nivel Cognitivo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {estadisticasNivelCognitivo.map(({ nivel, cantidad }) => (
                  <div key={nivel} className="text-center">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getNivelCognitivoColor(
                        nivel
                      )}`}
                    >
                      {nivel}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {cantidad}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Información de paginación con indicador de ordenamiento */}
          {totalItems > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Página {currentPage} de {totalPages} • {totalItems} preguntas
              encontradas • Ordenadas por curso y tema ↑
            </div>
          )}

          {/* ✅ Paginación superior */}
          {totalItems > 0 && (
            <div className="mb-6">
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

          {/* Lista de preguntas */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
            {paginatedPreguntas.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ||
                filterArea !== "todas" ||
                filterCurso !== "todos" ||
                filterNivelCognitivo !== "todos"
                  ? "No se encontraron preguntas que coincidan con los filtros en este examen"
                  : "No hay preguntas registradas para este examen"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
                <div className="hidden xl:grid xl:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
                  <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso ↑
                  </div>
                  <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tema ↑
                  </div>
                  <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competencia
                  </div>
                  <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área
                  </div>
                  <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel Cognitivo
                  </div>
                  <div className="xl:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntaje
                  </div>
                  <div className="xl:col-span-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </div>
                </div>

                {/* ✅ Filas de preguntas paginadas */}
                {paginatedPreguntas.map((pregunta, index) => (
                  <div
                    key={pregunta.id}
                    className={`p-4 xl:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                      index === paginatedPreguntas.length - 1
                        ? "rounded-b-lg"
                        : ""
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
                        <div className="text-sm text-gray-900">
                          {pregunta.tema}
                        </div>
                      </div>
                      <div className="xl:col-span-2">
                        <div className="text-sm text-gray-900 line-clamp-2">
                          {pregunta.competencia.length > 80
                            ? `${pregunta.competencia.substring(0, 80)}...`
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
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getNivelCognitivoColor(
                            pregunta.nivelCognitivo
                          )}`}
                        >
                          {pregunta.nivelCognitivo}
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
                        <div className="flex space-x-2 flex-wrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {pregunta.area}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getNivelCognitivoColor(
                              pregunta.nivelCognitivo
                            )}`}
                          >
                            {pregunta.nivelCognitivo}
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
        modo="banco"
      />
    </div>
  );
};

export default Preguntas;
