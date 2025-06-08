"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useCalificaciones } from "../hooks/useCalificaciones"
import { usePostulantes } from "../hooks/usePostulantes"
import { useExamenes } from "../hooks/useExamenes"
import toast from "react-hot-toast"
import type { Calificacion } from "../types"
import { Save, X, CheckCircle, XCircle, Calculator } from "lucide-react"

const CalificacionForm = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { calificacionByIdQuery, saveCalificacion, isSaving } = useCalificaciones()
  const { postulantes } = usePostulantes()
  const { examenes } = useExamenes()
  const { data: existingCalificacion, isLoading } = calificacionByIdQuery(id)

  const [formData, setFormData] = useState<Partial<Calificacion>>({
    postulanteId: "",
    examenSimulacroId: "",
    respuestas: new Array(80).fill(0),
    fechaExamen: new Date().toISOString().split("T")[0],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(0)
  const questionsPerPage = 20

  // Obtener examen seleccionado con preguntas
  const examenSeleccionado = examenes.find((e) => e.id === formData.examenSimulacroId)

  useEffect(() => {
    if (existingCalificacion) {
      setFormData({
        id: existingCalificacion.id,
        postulanteId: existingCalificacion.postulanteId || "",
        examenSimulacroId: existingCalificacion.examenSimulacroId || "",
        respuestas: existingCalificacion.respuestas || new Array(80).fill(0),
        fechaExamen: existingCalificacion.fechaExamen
          ? new Date(existingCalificacion.fechaExamen).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      })
    }
  }, [existingCalificacion])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.postulanteId) newErrors.postulanteId = "El postulante es requerido"
    if (!formData.examenSimulacroId) newErrors.examenSimulacroId = "El examen es requerido"
    if (!formData.fechaExamen) newErrors.fechaExamen = "La fecha del examen es requerida"

    // Validar que el examen tenga 80 preguntas
    if (examenSeleccionado && (examenSeleccionado.preguntas?.length || 0) !== 80) {
      newErrors.examenSimulacroId = "El examen seleccionado debe tener exactamente 80 preguntas"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }

    // Si cambia el examen, resetear respuestas
    if (name === "examenSimulacroId") {
      setFormData((prev) => ({
        ...prev,
        respuestas: new Array(80).fill(0),
      }))
      setCurrentPage(0)
    }
  }

  const handleRespuestaChange = (preguntaIndex: number, valor: number) => {
    const nuevasRespuestas = [...(formData.respuestas || [])]
    nuevasRespuestas[preguntaIndex] = valor
    setFormData((prev) => ({
      ...prev,
      respuestas: nuevasRespuestas,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario")
      return
    }

    try {
      const calificacionData: Partial<Calificacion> = {
        ...formData,
        fechaExamen: new Date(formData.fechaExamen!).toISOString(),
      }

      saveCalificacion(calificacionData)
      navigate("/calificaciones")
    } catch (error) {
      console.error("Error al guardar calificación:", error)
      toast.error(error instanceof Error ? error.message : "Error al guardar calificación")
    }
  }

  const calcularEstadisticas = () => {
    const respuestas = formData.respuestas || []
    const correctas = respuestas.filter((r) => r === 1).length
    const incorrectas = respuestas.filter((r) => r === 0).length
    const porcentaje = respuestas.length > 0 ? (correctas / respuestas.length) * 100 : 0

    return { correctas, incorrectas, porcentaje }
  }

  const marcarTodasCorrectas = () => {
    setFormData((prev) => ({
      ...prev,
      respuestas: new Array(80).fill(1),
    }))
  }

  const marcarTodasIncorrectas = () => {
    setFormData((prev) => ({
      ...prev,
      respuestas: new Array(80).fill(0),
    }))
  }

  const limpiarRespuestas = () => {
    setFormData((prev) => ({
      ...prev,
      respuestas: new Array(80).fill(0),
    }))
  }

  if (id && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  const { correctas, incorrectas, porcentaje } = calcularEstadisticas()
  const totalPages = Math.ceil(80 / questionsPerPage)
  const startIndex = currentPage * questionsPerPage
  const endIndex = Math.min(startIndex + questionsPerPage, 80)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {id ? "Editar Calificación" : "Nueva Calificación"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {id
                ? "Actualiza la calificación del examen"
                : "Registra las respuestas del postulante para el examen simulacro"}
            </p>

            {/* Estadísticas */}
            <div className="mt-6 space-y-4">
              <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Estadísticas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Correctas:</span>
                    <span className="text-sm font-semibold text-green-600">{correctas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Incorrectas:</span>
                    <span className="text-sm font-semibold text-red-600">{incorrectas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Porcentaje:</span>
                    <span className="text-sm font-semibold text-blue-600">{porcentaje.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${porcentaje}%` }}
                  ></div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Acciones Rápidas</h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={marcarTodasCorrectas}
                    className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200"
                  >
                    ✓ Marcar todas correctas
                  </button>
                  <button
                    type="button"
                    onClick={marcarTodasIncorrectas}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                  >
                    ✗ Marcar todas incorrectas
                  </button>
                  <button
                    type="button"
                    onClick={limpiarRespuestas}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                  >
                    ↻ Limpiar respuestas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 bg-white sm:p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="postulanteId" className="block text-sm font-medium text-gray-700">
                      Postulante *
                    </label>
                    <select
                      name="postulanteId"
                      id="postulanteId"
                      value={formData.postulanteId || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.postulanteId ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Selecciona un postulante</option>
                      {postulantes.map((postulante) => (
                        <option key={postulante.id} value={postulante.id}>
                          {postulante.apellidos}, {postulante.nombres} - {postulante.dni}
                        </option>
                      ))}
                    </select>
                    {errors.postulanteId && <p className="mt-1 text-sm text-red-600">{errors.postulanteId}</p>}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="examenSimulacroId" className="block text-sm font-medium text-gray-700">
                      Examen Simulacro *
                    </label>
                    <select
                      name="examenSimulacroId"
                      id="examenSimulacroId"
                      value={formData.examenSimulacroId || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.examenSimulacroId ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Selecciona un examen</option>
                      {examenes
                        .filter((examen) => examen.estado === "listo")
                        .map((examen) => (
                          <option key={examen.id} value={examen.id}>
                            {examen.nombre} - {examen.proceso} ({examen.preguntas?.length || 0} preguntas)
                          </option>
                        ))}
                    </select>
                    {errors.examenSimulacroId && (
                      <p className="mt-1 text-sm text-red-600">{errors.examenSimulacroId}</p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="fechaExamen" className="block text-sm font-medium text-gray-700">
                      Fecha del Examen *
                    </label>
                    <input
                      type="date"
                      name="fechaExamen"
                      id="fechaExamen"
                      value={formData.fechaExamen || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.fechaExamen ? "border-red-500" : ""
                      }`}
                    />
                    {errors.fechaExamen && <p className="mt-1 text-sm text-red-600">{errors.fechaExamen}</p>}
                  </div>
                </div>

                {/* Matriz de respuestas */}
                {examenSeleccionado && (examenSeleccionado.preguntas?.length || 0) === 80 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Matriz de Respuestas (Preguntas {startIndex + 1} - {endIndex})
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {correctas} correctas de {formData.respuestas?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Paginación */}
                    <div className="flex justify-center mb-4">
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentPage(i)}
                            className={`px-3 py-1 text-sm rounded-md ${
                              currentPage === i
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {i * questionsPerPage + 1}-{Math.min((i + 1) * questionsPerPage, 80)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid de respuestas */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                        {Array.from({ length: endIndex - startIndex }, (_, i) => {
                          const preguntaIndex = startIndex + i
                          const respuesta = formData.respuestas?.[preguntaIndex] || 0
                          return (
                            <div key={preguntaIndex} className="text-center">
                              <div className="text-xs font-medium text-gray-600 mb-1">{preguntaIndex + 1}</div>
                              <div className="flex space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleRespuestaChange(preguntaIndex, 1)}
                                  className={`w-8 h-8 rounded-md text-xs font-semibold transition-colors duration-200 ${
                                    respuesta === 1
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-200 text-gray-600 hover:bg-green-100"
                                  }`}
                                  title="Correcta"
                                >
                                  <CheckCircle className="h-4 w-4 mx-auto" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespuestaChange(preguntaIndex, 0)}
                                  className={`w-8 h-8 rounded-md text-xs font-semibold transition-colors duration-200 ${
                                    respuesta === 0
                                      ? "bg-red-600 text-white"
                                      : "bg-gray-200 text-gray-600 hover:bg-red-100"
                                  }`}
                                  title="Incorrecta"
                                >
                                  <XCircle className="h-4 w-4 mx-auto" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-600">
                      <p>
                        Haz clic en <CheckCircle className="inline h-4 w-4 text-green-600" /> para marcar como correcta
                        o <XCircle className="inline h-4 w-4 text-red-600" /> para marcar como incorrecta
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensaje si no hay examen seleccionado o no tiene 80 preguntas */}
                {(!examenSeleccionado || (examenSeleccionado.preguntas?.length || 0) !== 80) && (
                  <div className="text-center py-8 text-gray-500">
                    {!examenSeleccionado
                      ? "Selecciona un examen para mostrar la matriz de respuestas"
                      : "El examen seleccionado debe tener exactamente 80 preguntas"}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate("/calificaciones")}
                  className="btn btn-secondary mr-3 inline-flex items-center"
                >
                  <X size={18} className="mr-2" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !examenSeleccionado || (examenSeleccionado.preguntas?.length || 0) !== 80}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  <span>{isSaving ? "Guardando..." : "Guardar"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CalificacionForm
