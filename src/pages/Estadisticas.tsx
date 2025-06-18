"use client";

import { useState } from "react";
import { useCalificaciones } from "../hooks/useCalificaciones";
import { usePostulantes } from "../hooks/usePostulantes";
import { useExamenes } from "../hooks/useExamenes";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calificacion } from "../types";

const Estadisticas = () => {
  // ✅ Solo cargar examenes al inicio (son pocos datos)
  const { examenes, isLoading: loadingExamenes } = useExamenes();

  // ✅ No cargar todos los postulantes y calificaciones automáticamente
  const { postulantesByExamenQuery } = usePostulantes();
  const { calificacionesByExamenQuery } = useCalificaciones();

  // ✅ Estados para control de consulta
  const [selectedExamen, setSelectedExamen] = useState<string>("");
  const [consultedExamen, setConsultedExamen] = useState<string>("");
  const [isConsulting, setIsConsulting] = useState(false);

  // ✅ Queries específicas por examen (solo se ejecutan cuando consultedExamen tiene valor)
  const postulantesQuery = postulantesByExamenQuery(consultedExamen);
  const calificacionesQuery = calificacionesByExamenQuery(consultedExamen);

  // ✅ Estados de carga específicos
  const isLoadingData =
    postulantesQuery.isLoading || calificacionesQuery.isLoading;

  // ✅ Función para consultar examen
  const handleConsultarExamen = async () => {
    if (!selectedExamen) return;

    setIsConsulting(true);
    try {
      // Simular delay para mostrar estado de carga
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConsultedExamen(selectedExamen);
    } catch (error) {
      console.error("Error al consultar examen:", error);
    } finally {
      setIsConsulting(false);
    }
  };

  if (loadingExamenes) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  // ✅ Datos específicos del examen consultado
  const calificacionesFiltradas = calificacionesQuery.data || [];
  const postulantesDelExamen = postulantesQuery.data || [];
  const examenSeleccionado = consultedExamen
    ? examenes.find((ex) => ex.id === consultedExamen)
    : null;

  // Estadísticas generales del examen seleccionado
  const totalPostulantes = postulantesDelExamen.length;
  const totalCalificaciones = calificacionesFiltradas.length;

  const promedioGeneral =
    calificacionesFiltradas.length > 0
      ? calificacionesFiltradas.reduce(
          (sum: any, cal: { calificacionFinal: any }) =>
            sum + cal.calificacionFinal,
          0
        ) / calificacionesFiltradas.length
      : 0;

  // Top 5 mejores calificaciones del examen
  const mejoresCalificaciones = [...calificacionesFiltradas]
    .sort((a, b) => b.calificacionFinal - a.calificacionFinal)
    .slice(0, 5);

  // Rendimiento por carrera en el examen seleccionado
  const rendimientoPorCarrera = postulantesDelExamen.reduce(
    (
      acc: { [x: string]: { count: number; promedio: number; total: number } },
      postulante: { id: any; carreraPostulacion: string | number }
    ) => {
      const calificacionPostulante = calificacionesFiltradas.find(
        (cal: { postulanteId: any }) => cal.postulanteId === postulante.id
      );
      if (calificacionPostulante) {
        if (!acc[postulante.carreraPostulacion]) {
          acc[postulante.carreraPostulacion] = {
            promedio: 0,
            count: 0,
            total: 0,
          };
        }
        acc[postulante.carreraPostulacion].total +=
          calificacionPostulante.calificacionFinal;
        acc[postulante.carreraPostulacion].count += 1;
        acc[postulante.carreraPostulacion].promedio =
          acc[postulante.carreraPostulacion].total /
          acc[postulante.carreraPostulacion].count;
      }
      return acc;
    },
    {} as Record<string, { promedio: number; count: number; total: number }>
  );

  // Calcular promedios finales por carrera
  const promediosPorCarrera = Object.entries(rendimientoPorCarrera)
    .map(([carrera, data]) => ({
      carrera,
      promedio: (data as { promedio: number; count: number; total: number })
        .promedio,
      postulantes: (data as { promedio: number; count: number; total: number })
        .count,
    }))
    .sort((a, b) => b.promedio - a.promedio);

  // Análisis de respuestas por pregunta
  const analisisPorPregunta =
    consultedExamen && examenSeleccionado?.preguntas
      ? examenSeleccionado.preguntas.map((preguntaId, index) => {
          const pregunta = examenSeleccionado.preguntasData?.find(
            (p) => p.id === preguntaId
          );
          const numeroP = index + 1;

          let correctas = 0;
          let incorrectas = 0;

          calificacionesFiltradas.forEach((calificacion: Calificacion) => {
            const respuestaEstudiante = calificacion.respuestas[index];
            if (respuestaEstudiante === pregunta?.alternativaCorrecta) {
              correctas++;
            } else {
              incorrectas++;
            }
          });

          const total = correctas + incorrectas;

          return {
            pregunta: `P${numeroP}`,
            curso: pregunta?.curso || "N/A",
            correctas,
            incorrectas,
            total,
            porcentajeAcierto:
              total > 0 ? ((correctas / total) * 100).toFixed(1) : "0",
          };
        })
      : [];

  // Top 3 por carrera
  const top3PorCarrera = Object.entries(rendimientoPorCarrera).reduce(
    (acc, [carrera, _data]) => {
      const calificacionesCarrera = calificacionesFiltradas
        .filter(
          (cal: { postulante: { carreraPostulacion: string } }) =>
            cal.postulante?.carreraPostulacion === carrera
        )
        .sort(
          (
            a: { calificacionFinal: number },
            b: { calificacionFinal: number }
          ) => b.calificacionFinal - a.calificacionFinal
        )
        .slice(0, 3);

      if (calificacionesCarrera.length > 0) {
        acc[carrera] = calificacionesCarrera;
      }

      return acc;
    },
    {} as Record<string, typeof calificacionesFiltradas>
  );

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Estadísticas y Métricas
        </h1>

        {/* ✅ Selector de examen con botón consultar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <select
            value={selectedExamen}
            onChange={(e) => setSelectedExamen(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-64"
          >
            <option value="">Seleccionar examen</option>
            {examenes.map((examen) => (
              <option key={examen.id} value={examen.id}>
                {examen.nombre} - {examen.proceso} ({examen.area})
              </option>
            ))}
          </select>

          {/* ✅ Botón consultar */}
          <button
            onClick={handleConsultarExamen}
            disabled={!selectedExamen || isConsulting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center min-w-[120px]"
          >
            <Eye size={18} className="mr-1 md:mr-2" />
            <span className="hidden sm:inline">
              {isConsulting ? "Consultando..." : "Consultar"}
            </span>
            <span className="sm:hidden">{isConsulting ? "..." : "Ver"}</span>
          </button>
        </div>
      </div>

      {/* ✅ Mostrar mensaje si no hay examen consultado */}
      {!consultedExamen && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">
              Selecciona un examen y presiona "Consultar" para ver las
              estadísticas correspondientes.
            </span>
          </div>
        </div>
      )}

      {/* ✅ Mostrar loading cuando se están cargando los datos específicos */}
      {consultedExamen && isLoadingData && (
        <div className="flex justify-center items-center h-64">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Cargando datos del examen...
          </span>
        </div>
      )}

      {/* ✅ Mostrar estadísticas solo si hay examen consultado y datos cargados */}
      {consultedExamen && !isLoadingData && (
        <>
          {/* Información del examen seleccionado */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Examen Consultado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p className="text-lg font-semibold text-gray-900">
                  {examenSeleccionado?.nombre}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Proceso</p>
                <p className="text-lg font-semibold text-gray-900">
                  {examenSeleccionado?.proceso}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Área</p>
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {examenSeleccionado?.area}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjetas de estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Postulantes Participantes
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalPostulantes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Calificaciones
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalCalificaciones}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Promedio General
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {promedioGeneral.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de análisis por pregunta */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              Análisis de Respuestas por Pregunta
            </h3>
            {analisisPorPregunta.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay datos de preguntas disponibles para este examen
              </p>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analisisPorPregunta}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="pregunta"
                      fontSize={12}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "Correctas" ? "Correctas" : "Incorrectas",
                      ]}
                      labelFormatter={(label) => {
                        const pregunta = analisisPorPregunta.find(
                          (p) => p.pregunta === label
                        );
                        return `${label} - ${pregunta?.curso || "N/A"}`;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="correctas" fill="#10b981" name="Correctas" />
                    <Bar
                      dataKey="incorrectas"
                      fill="#ef4444"
                      name="Incorrectas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Mejores calificaciones del examen */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                Top 5 Mejores Calificaciones
              </h3>
              {mejoresCalificaciones.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay calificaciones disponibles para este examen
                </p>
              ) : (
                <div className="space-y-3">
                  {mejoresCalificaciones.map((calificacion, index) => (
                    <div
                      key={calificacion.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : index === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {calificacion.postulante?.apellidos},{" "}
                            {calificacion.postulante?.nombres}
                          </p>
                          <p className="text-xs text-gray-500">
                            {calificacion.postulante?.carreraPostulacion}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {calificacion.calificacionFinal}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            calificacion.fechaExamen
                          ).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rendimiento por carrera en el examen */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                Rendimiento por Carrera
              </h3>
              {promediosPorCarrera.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay datos de rendimiento disponibles para este examen
                </p>
              ) : (
                <div className="space-y-3">
                  {promediosPorCarrera.map((item, _index) => (
                    <div
                      key={item.carrera}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.carrera}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.postulantes} postulantes
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {item.promedio.toFixed(2)}
                          </p>
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.promedio >= 80
                                ? "bg-green-500"
                                : item.promedio >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (item.promedio / 100) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        {item.promedio >= 80 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : item.promedio >= 60 ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top 3 por carrera */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Award className="h-5 w-5 text-yellow-600 mr-2" />
              Top 3 por Carrera
            </h3>
            {Object.keys(top3PorCarrera).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay datos suficientes para mostrar el top por carrera
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(top3PorCarrera).map(
                  ([carrera, calificaciones]) => (
                    <div
                      key={carrera}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="font-semibold text-gray-900 mb-3 text-center border-b pb-2">
                        {carrera}
                      </h4>
                      <div className="space-y-3">
                        {calificaciones.map(
                          (calificacion: Calificacion, index: number) => (
                            <div
                              key={calificacion.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mr-3 ${
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-800"
                                      : index === 1
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {calificacion.postulante?.apellidos},{" "}
                                    {calificacion.postulante?.nombres}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {calificacion.preguntasAcertadas}/80
                                    preguntas
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {calificacion.calificacionFinal}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(
                                    (calificacion.preguntasAcertadas / 80) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Estadisticas;
