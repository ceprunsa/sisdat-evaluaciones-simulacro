"use client";

import { useParams, Link } from "react-router-dom";
import { useExamenes } from "../hooks/useExamenes";
import { usePreguntas } from "../hooks/usePreguntas";
import { ArrowLeft, Edit, FileText, BarChart3, Hash } from "lucide-react";
import type { MatrizConformacion, Pregunta, PreguntaEnExamen } from "../types";

const ExamenDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { examenByIdQuery } = useExamenes();
  const { preguntas } = usePreguntas();
  const { data: examen, isLoading, isError } = examenByIdQuery(id);

  // Obtener preguntas del examen con numeración
  const getPreguntasConNumeracion = (): (Pregunta & { numero: number })[] => {
    if (!examen) return [];

    // Si existe preguntasOrdenadas, usar ese orden
    if (examen.preguntasOrdenadas && examen.preguntasOrdenadas.length > 0) {
      return examen.preguntasOrdenadas
        .map((item: PreguntaEnExamen) => {
          const pregunta = preguntas.find((p) => p.id === item.preguntaId);
          return pregunta ? { ...pregunta, numero: item.numero } : null;
        })
        .filter((p: Pregunta): p is Pregunta & { numero: number } => p !== null)
        .sort(
          (a: PreguntaEnExamen, b: PreguntaEnExamen) => a.numero - b.numero
        );
    }

    // Fallback: usar el array de preguntas simple con numeración automática
    return preguntas
      .filter((pregunta) => examen.preguntas?.includes(pregunta.id))
      .map((pregunta, index) => ({ ...pregunta, numero: index + 1 }));
  };

  const preguntasDelExamen = getPreguntasConNumeracion();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !examen) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> No se pudo cargar el examen.</span>
      </div>
    );
  }

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

  const totalPuntaje = preguntasDelExamen.reduce(
    (sum, pregunta) => sum + pregunta.puntaje,
    0
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/examenes"
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {examen.nombre}
              </h1>
              <p className="text-gray-600">{examen.proceso}</p>
            </div>
          </div>
          <Link
            to={`/examenes/${examen.id}/edit`}
            className="btn btn-primary inline-flex items-center"
          >
            <Edit size={18} className="mr-2" />
            Editar Examen
          </Link>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tarjeta principal */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Nombre
              </label>
              <p className="mt-1 text-sm text-gray-900">{examen.nombre}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Proceso
              </label>
              <p className="mt-1 text-sm text-gray-900">{examen.proceso}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Área
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAreaColor(
                  examen.area
                )}`}
              >
                {examen.area}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Estado
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(
                  examen.estado
                )}`}
              >
                {examen.estado === "listo" ? "Listo" : "En construcción"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Fecha de Creación
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {examen.createdAt
                  ? new Date(examen.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Creado por
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {examen.createdBy || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  Total Preguntas
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {preguntasDelExamen.length} / 80
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progreso</span>
                <span>
                  {Math.round((preguntasDelExamen.length / 80) * 100)}%
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (preguntasDelExamen.length / 80) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  Puntaje Total
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalPuntaje.toFixed(1)} / 100
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Completado</span>
                <span>{Math.round(totalPuntaje)}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    totalPuntaje > 100
                      ? "bg-red-600"
                      : totalPuntaje === 100
                      ? "bg-green-600"
                      : "bg-yellow-600"
                  }`}
                  style={{ width: `${Math.min(totalPuntaje, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matriz de Conformación */}
      {examen.matrizConformacion && examen.matrizConformacion.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Matriz de Conformación
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {examen.matrizConformacion.map(
              (item: MatrizConformacion, index: number) => (
                <div
                  key={`${item.curso}-${index}`}
                  className="bg-gray-50 p-4 rounded-lg text-center"
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {item.curso}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {item.cantidad}
                  </div>
                  <div className="text-xs text-gray-500">preguntas</div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Lista de Preguntas */}
      <div className="bg-white rounded-lg shadow border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Preguntas del Examen ({preguntasDelExamen.length})
          </h2>
        </div>

        {preguntasDelExamen.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              No hay preguntas asignadas
            </p>
            <p className="text-gray-500 mb-4">
              Este examen aún no tiene preguntas asignadas.
            </p>
            <Link
              to={`/examenes/${examen.id}/edit`}
              className="btn btn-primary inline-flex items-center"
            >
              <Edit size={18} className="mr-2" />
              Agregar Preguntas
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Encabezado de tabla (solo visible en pantallas grandes) */}
            <div className="hidden lg:grid lg:grid-cols-12 bg-gray-50 px-6 py-3">
              <div className="lg:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </div>
              <div className="lg:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curso
              </div>
              <div className="lg:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tema
              </div>
              <div className="lg:col-span-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Competencia
              </div>
              <div className="lg:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puntaje
              </div>
              <div className="lg:col-span-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </div>
            </div>

            {/* Filas de preguntas */}
            {preguntasDelExamen.map((pregunta, index) => (
              <div
                key={pregunta.id}
                className={`p-4 lg:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                  index === preguntasDelExamen.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                {/* Vista para pantallas grandes */}
                <div className="hidden lg:grid lg:grid-cols-12 lg:items-center lg:px-6 lg:py-4">
                  <div className="lg:col-span-1">
                    <div className="flex items-center">
                      <Hash size={14} className="text-gray-400 mr-1" />
                      <span className="text-sm font-bold text-gray-900">
                        {pregunta.numero}
                      </span>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <div className="text-sm font-medium text-gray-900">
                      {pregunta.curso}
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <div className="text-sm text-gray-900">{pregunta.tema}</div>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {pregunta.competencia}
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600">
                      {pregunta.puntaje} pts
                    </span>
                  </div>
                  <div className="lg:col-span-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAreaColor(
                        pregunta.area
                      )}`}
                    >
                      {pregunta.area}
                    </span>
                  </div>
                </div>

                {/* Vista para pantallas pequeñas y medianas */}
                <div className="lg:hidden">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                        <Hash size={14} className="text-gray-500 mr-1" />
                        <span className="text-sm font-bold text-gray-700">
                          {pregunta.numero}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {pregunta.curso}
                        </div>
                        <div className="text-sm text-gray-600">
                          {pregunta.tema}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600">
                        {pregunta.puntaje} pts
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAreaColor(
                          pregunta.area
                        )}`}
                      >
                        {pregunta.area}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-2">
                    <strong>Competencia:</strong> {pregunta.competencia}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamenDetalle;
