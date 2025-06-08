"use client"

import { useState } from "react"
import { useCalificaciones } from "../hooks/useCalificaciones"
import { usePostulantes } from "../hooks/usePostulantes"
import { useExamenes } from "../hooks/useExamenes"
import { BarChart3, TrendingUp, TrendingDown, Users, FileText, Award, AlertCircle } from "lucide-react"

const Estadisticas = () => {
  const { calificaciones, isLoading: loadingCalificaciones } = useCalificaciones()
  const { postulantes, isLoading: loadingPostulantes } = usePostulantes()
  const { examenes, isLoading: loadingExamenes } = useExamenes()
  const [selectedArea, setSelectedArea] = useState<string>("todas")

  const isLoading = loadingCalificaciones || loadingPostulantes || loadingExamenes

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  // Filtrar calificaciones por área si se selecciona
  const calificacionesFiltradas =
    selectedArea === "todas"
      ? calificaciones
      : calificaciones.filter((cal) => cal.examenSimulacro?.area === selectedArea)

  // Estadísticas generales
  const totalPostulantes = postulantes.length
  const totalExamenes = examenes.length
  const totalCalificaciones = calificacionesFiltradas.length

  const promedioGeneral =
    calificacionesFiltradas.length > 0
      ? calificacionesFiltradas.reduce((sum, cal) => sum + cal.calificacionFinal, 0) / calificacionesFiltradas.length
      : 0

  // Top 5 mejores calificaciones
  const mejoresCalificaciones = [...calificacionesFiltradas]
    .sort((a, b) => b.calificacionFinal - a.calificacionFinal)
    .slice(0, 5)

  // Distribución por área
  const distribucionPorArea = examenes.reduce(
    (acc, examen) => {
      acc[examen.area] = (acc[examen.area] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Rendimiento por carrera
  const rendimientoPorCarrera = postulantes.reduce(
    (acc, postulante) => {
      const calificacionesPostulante = calificacionesFiltradas.filter((cal) => cal.postulanteId === postulante.id)
      if (calificacionesPostulante.length > 0) {
        const promedio =
          calificacionesPostulante.reduce((sum, cal) => sum + cal.calificacionFinal, 0) /
          calificacionesPostulante.length
        acc[postulante.carreraPostulacion] = {
          promedio: (acc[postulante.carreraPostulacion]?.promedio || 0) + promedio,
          count: (acc[postulante.carreraPostulante]?.count || 0) + 1,
        }
      }
      return acc
    },
    {} as Record<string, { promedio: number; count: number }>,
  )

  // Calcular promedios finales por carrera
  const promediosPorCarrera = Object.entries(rendimientoPorCarrera)
    .map(([carrera, data]) => ({
      carrera,
      promedio: data.promedio / data.count,
      postulantes: data.count,
    }))
    .sort((a, b) => b.promedio - a.promedio)

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Estadísticas y Métricas</h1>

        {/* Filtro por área */}
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todas">Todas las áreas</option>
          <option value="Biomédicas">Biomédicas</option>
          <option value="Ingenierías">Ingenierías</option>
          <option value="Sociales">Sociales</option>
        </select>
      </div>

      {/* Tarjetas de estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Postulantes</p>
              <p className="text-2xl font-semibold text-gray-900">{totalPostulantes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Exámenes</p>
              <p className="text-2xl font-semibold text-gray-900">{totalExamenes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Calificaciones</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCalificaciones}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Promedio General</p>
              <p className="text-2xl font-semibold text-gray-900">{promedioGeneral.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mejores calificaciones */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            Top 5 Mejores Calificaciones
          </h3>
          {mejoresCalificaciones.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay calificaciones disponibles</p>
          ) : (
            <div className="space-y-3">
              {mejoresCalificaciones.map((calificacion, index) => (
                <div key={calificacion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                        {calificacion.postulante?.apellidos}, {calificacion.postulante?.nombres}
                      </p>
                      <p className="text-xs text-gray-500">{calificacion.examenSimulacro?.nombre}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{calificacion.calificacionFinal.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(calificacion.fechaExamen).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribución por área */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
            Distribución de Exámenes por Área
          </h3>
          <div className="space-y-4">
            {Object.entries(distribucionPorArea).map(([area, cantidad]) => (
              <div key={area} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{area}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(cantidad / totalExamenes) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rendimiento por carrera */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
            Rendimiento Promedio por Carrera
          </h3>
          {promediosPorCarrera.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay datos de rendimiento disponibles</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carrera
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Postulantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rendimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promediosPorCarrera.map((item, index) => (
                    <tr key={item.carrera} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.carrera}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.promedio.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.postulantes}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.promedio >= 80
                                  ? "bg-green-500"
                                  : item.promedio >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min((item.promedio / 100) * 100, 100)}%` }}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Estadisticas
