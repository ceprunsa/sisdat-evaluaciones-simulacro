"use client";

import { useParams, Link } from "react-router-dom";
import { useCalificaciones } from "../hooks/useCalificaciones";
import {
  ArrowLeft,
  User,
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";

const CalificacionDetalle = () => {
  const { id } = useParams<{ id: string }>();

  // Usar el hook useCalificaciones para obtener los datos
  const { calificacionByIdQuery } = useCalificaciones();
  const calificacionQuery = calificacionByIdQuery(id);

  // Extraer datos y estados de la query
  const calificacion = calificacionQuery?.data;
  const isLoading = calificacionQuery?.isLoading;
  const error = calificacionQuery?.error;

  // Datos poblados que vienen del hook
  const postulante = calificacion?.postulante;
  const examen = calificacion?.examenSimulacro;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !calificacion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error?.message || "Calificación no encontrada"}</span>
          </div>
          <div className="mt-4">
            <Link
              to="/calificaciones"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <ArrowLeft size={18} className="mr-2" />
              Volver a Calificaciones
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calcular estadísticas usando los datos poblados
  const totalPreguntas = calificacion.respuestas?.length || 0;
  const preguntasExamen = examen?.preguntasData || [];

  // Calcular respuestas correctas

  const porcentajeGeneral =
    totalPreguntas > 0
      ? (calificacion.preguntasAcertadas / totalPreguntas) * 100
      : 0;
  const maxNota =
    preguntasExamen.reduce(
      (sum: number, p: any) => sum + (p.puntaje || 0),
      0
    ) || 100;

  // Agrupar por curso usando matrizPorCurso
  const estadisticasPorCurso: Record<string, any> = {};

  if (
    calificacion.matrizPorCurso &&
    Array.isArray(calificacion.matrizPorCurso)
  ) {
    calificacion.matrizPorCurso.forEach(
      (item: {
        curso: string | number;
        correctas: any;
        incorrectas: any;
        total: any;
        puntajeObtenido: any;
        puntajeMaximo: any;
      }) => {
        if (item && item.curso) {
          if (!estadisticasPorCurso[item.curso]) {
            estadisticasPorCurso[item.curso] = {
              curso: item.curso,
              correctas: 0,
              incorrectas: 0,
              total: 0,
              puntajeObtenido: 0,
              puntajeMaximo: 0,
              competenciasCumplidas: [],
              competenciasNoCumplidas: [],
            };
          }

          estadisticasPorCurso[item.curso].correctas += item.correctas || 0;
          estadisticasPorCurso[item.curso].incorrectas += item.incorrectas || 0;
          estadisticasPorCurso[item.curso].total += item.total || 0;
          estadisticasPorCurso[item.curso].puntajeObtenido +=
            item.puntajeObtenido || 0;
          estadisticasPorCurso[item.curso].puntajeMaximo +=
            item.puntajeMaximo || 0;
        }
      }
    );
  }

  // Agregar retroalimentación usando la interfaz RetroalimentacionCurso
  if (
    calificacion.retroalimentacion &&
    Array.isArray(calificacion.retroalimentacion)
  ) {
    calificacion.retroalimentacion.forEach(
      (retro: {
        curso: string | number;
        competenciasCumplidas: any[];
        competenciasNoCumplidas: any[];
      }) => {
        if (retro && retro.curso && estadisticasPorCurso[retro.curso]) {
          // Agregar competencias cumplidas
          if (
            retro.competenciasCumplidas &&
            Array.isArray(retro.competenciasCumplidas)
          ) {
            retro.competenciasCumplidas.forEach((mensaje: any) => {
              if (mensaje) {
                estadisticasPorCurso[retro.curso].competenciasCumplidas.push(
                  mensaje
                );
              }
            });
          }

          // Agregar competencias no cumplidas
          if (
            retro.competenciasNoCumplidas &&
            Array.isArray(retro.competenciasNoCumplidas)
          ) {
            retro.competenciasNoCumplidas.forEach((mensaje: any) => {
              if (mensaje) {
                estadisticasPorCurso[retro.curso].competenciasNoCumplidas.push(
                  mensaje
                );
              }
            });
          }
        }
      }
    );
  }

  // Convertir a array y ordenar
  const cursosOrdenados = Object.values(estadisticasPorCurso)
    .filter((curso: any) => curso && typeof curso === "object" && curso.curso)
    .sort(
      (a: any, b: any) => (b.puntajeObtenido || 0) - (a.puntajeObtenido || 0)
    );

  const getNotaColor = (nota: number, maxNota: number) => {
    const percentage = maxNota > 0 ? (nota / maxNota) * 100 : 0;
    if (percentage >= 65) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 52)
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (percentage >= 45) return "text-red-600 bg-red-50 border-red-200";
    //morado
    return "text-purple-600 bg-purple-50 border-purple-200";
  };

  const getPorcentajeColor = (porcentaje: number) => {
    if (porcentaje >= 65) return "bg-green-500";
    if (porcentaje >= 52) return "bg-yellow-500";
    if (porcentaje >= 45) return "bg-red-500";
    return "bg-purple-500";
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/calificaciones"
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Detalle de Calificación
          </h1>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/calificaciones/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos del Postulante - Usando datos poblados del hook */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Postulante</h2>
          </div>
          {postulante ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombres y Apellidos</p>
                <p className="font-medium text-gray-900">
                  {postulante.nombres && postulante.apellidos
                    ? `${postulante.nombres} ${postulante.apellidos}`
                    : "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="font-medium text-gray-900">
                  {postulante.dni || "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Carrera</p>
                <p className="font-medium text-gray-900">
                  {postulante.carreraPostulacion || "No disponible"}
                </p>
              </div>
              {postulante.especialidad && (
                <div>
                  <p className="text-sm text-gray-500">Especialidad</p>
                  <p className="font-medium text-gray-900">
                    {postulante.especialidad}
                  </p>
                </div>
              )}
              {postulante.correoCeprunsa && (
                <div>
                  <p className="text-sm text-gray-500">Correo CEPRUNSA</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {postulante.correoCeprunsa}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                No se pudo cargar la información del postulante.
              </p>
            </div>
          )}
        </div>

        {/* Datos del Examen - Usando datos poblados del hook */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Examen</h2>
          </div>
          {examen ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">
                  {examen.nombre || "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Proceso</p>
                <p className="font-medium text-gray-900">
                  {examen.proceso || "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Área</p>
                <p className="font-medium text-gray-900">
                  {examen.area || "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium text-gray-900">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      examen.estado === "listo"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {examen.estado === "listo" ? "Listo" : "En Construcción"}
                  </span>
                </p>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de Examen</p>
                  <p className="font-medium text-gray-900">
                    {calificacion.fechaExamen
                      ? new Date(calificacion.fechaExamen).toLocaleDateString(
                          "es-ES",
                          {
                            timeZone: "UTC",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "No disponible"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Preguntas</p>
                <p className="font-medium text-gray-900">
                  {examen.preguntas?.length || totalPreguntas} preguntas
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                No se pudo cargar la información del examen.
              </p>
            </div>
          )}
        </div>

        {/* Calificación Final */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Award className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Calificación
            </h2>
          </div>
          <div className="text-center">
            <div
              className={`inline-flex items-center px-6 py-3 rounded-lg border-2 ${getNotaColor(
                calificacion.calificacionFinal,
                maxNota
              )}`}
            >
              <span className="text-3xl font-bold">
                {calificacion.calificacionFinal}
              </span>
              <span className="text-lg ml-2">/ {maxNota.toFixed(2)}</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Porcentaje General:</span>
                <span className="font-semibold text-blue-600">
                  {porcentajeGeneral.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Respuestas Correctas:</span>
                <span className="font-semibold text-green-600">
                  {calificacion.preguntasAcertadas} / {totalPreguntas}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Respuestas Incorrectas:</span>
                <span className="font-semibold text-red-600">
                  {totalPreguntas - calificacion.preguntasAcertadas} /{" "}
                  {totalPreguntas}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fecha de Calificación:</span>
                <span className="font-semibold text-gray-600">
                  {calificacion.createdAt
                    ? new Date(calificacion.createdAt).toLocaleDateString(
                        "es-ES"
                      )
                    : "No disponible"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Adicionales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Estadísticas Generales
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {porcentajeGeneral.toFixed(2)}%
            </div>
            <div className="text-sm text-blue-600">Aciertos Generales</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {calificacion.preguntasAcertadas}
            </div>
            <div className="text-sm text-green-600">Respuestas Correctas</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {cursosOrdenados.length}
            </div>
            <div className="text-sm text-purple-600">Cursos Evaluados</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {
                cursosOrdenados.filter(
                  (c: any) =>
                    c &&
                    c.puntajeMaximo > 0 &&
                    (c.puntajeObtenido / c.puntajeMaximo) * 100 >= 70
                ).length
              }
            </div>
            <div className="text-sm text-orange-600">Cursos Aprobados</div>
          </div>
        </div>
      </div>

      {/* Matriz por Curso */}
      {cursosOrdenados.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Target className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Matriz de Aciertos y Desaciertos por Curso
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correctas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incorrectas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntaje
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Porcentaje
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cursosOrdenados.map((curso: any, index) => {
                  const porcentajeCurso =
                    curso.puntajeMaximo > 0
                      ? (curso.puntajeObtenido / curso.puntajeMaximo) * 100
                      : 0;
                  return (
                    <tr
                      key={`curso-${index}-${curso.curso}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {curso.curso}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm font-semibold text-green-600">
                            {curso.correctas}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm font-semibold text-red-600">
                            {curso.incorrectas}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {curso.total}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {curso.puntajeObtenido} / {curso.puntajeMaximo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            porcentajeCurso >= 65
                              ? "bg-green-100 text-green-800"
                              : porcentajeCurso >= 52
                              ? "bg-yellow-100 text-yellow-800"
                              : porcentajeCurso >= 45
                              ? "bg-red-100 text-red-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {porcentajeCurso.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getPorcentajeColor(
                              porcentajeCurso
                            )}`}
                            style={{
                              width: `${Math.min(porcentajeCurso, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No hay datos de matriz por curso disponibles.
            </p>
          </div>
        </div>
      )}

      {/* Retroalimentación por Curso */}
      {cursosOrdenados.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Retroalimentación por Curso
            </h2>
          </div>
          <div className="space-y-6">
            {cursosOrdenados.map((curso: any, index) => (
              <div
                key={`retro-${index}-${curso.curso}`}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {curso.curso}
                </h3>

                {/* Competencias Cumplidas */}
                {curso.competenciasCumplidas &&
                  curso.competenciasCumplidas.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <h4 className="text-sm font-medium text-green-700">
                          Competencias Cumplidas
                        </h4>
                      </div>
                      <div className="space-y-1">
                        {curso.competenciasCumplidas.map(
                          (mensaje: string, msgIndex: number) => (
                            <div
                              key={`cumplida-${msgIndex}`}
                              className="bg-green-50 border border-green-200 rounded-md p-3"
                            >
                              <p className="text-sm text-green-800">
                                {mensaje}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Competencias No Cumplidas */}
                {curso.competenciasNoCumplidas &&
                  curso.competenciasNoCumplidas.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <h4 className="text-sm font-medium text-red-700">
                          Áreas de Mejora
                        </h4>
                      </div>
                      <div className="space-y-1">
                        {curso.competenciasNoCumplidas.map(
                          (mensaje: string, msgIndex: number) => (
                            <div
                              key={`no-cumplida-${msgIndex}`}
                              className="bg-red-50 border border-red-200 rounded-md p-3"
                            >
                              <p className="text-sm text-red-800">{mensaje}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Si no hay retroalimentación */}
                {(!curso.competenciasCumplidas ||
                  curso.competenciasCumplidas.length === 0) &&
                  (!curso.competenciasNoCumplidas ||
                    curso.competenciasNoCumplidas.length === 0) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-sm text-gray-600">
                        No hay retroalimentación disponible para este curso.
                      </p>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No hay datos de retroalimentación disponibles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalificacionDetalle;
