"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { usePostulantes } from "../hooks/usePostulantes"
import toast from "react-hot-toast"
import type { Postulante } from "../types"
import { Save, X } from "lucide-react"

const PostulanteForm = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { postulanteByIdQuery, savePostulante, isSaving } = usePostulantes()
  const { data: existingPostulante, isLoading } = postulanteByIdQuery(id)

  const [formData, setFormData] = useState<Partial<Postulante>>({
    dni: "",
    apellidos: "",
    nombres: "",
    carreraPostulacion: "",
    especialidad: "",
    correoCeprunsa: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existingPostulante) {
      setFormData({
        id: existingPostulante.id,
        dni: existingPostulante.dni || "",
        apellidos: existingPostulante.apellidos || "",
        nombres: existingPostulante.nombres || "",
        carreraPostulacion: existingPostulante.carreraPostulacion || "",
        especialidad: existingPostulante.especialidad || "",
        correoCeprunsa: existingPostulante.correoCeprunsa || "",
      })
    }
  }, [existingPostulante])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar DNI
    if (!formData.dni) {
      newErrors.dni = "El DNI es requerido"
    } else if (!/^\d{8,10}$/.test(formData.dni)) {
      newErrors.dni = "El DNI debe tener entre 8 y 10 dígitos"
    }

    // Validar apellidos
    if (!formData.apellidos) {
      newErrors.apellidos = "Los apellidos son requeridos"
    }

    // Validar nombres
    if (!formData.nombres) {
      newErrors.nombres = "Los nombres son requeridos"
    }

    // Validar carrera
    if (!formData.carreraPostulacion) {
      newErrors.carreraPostulacion = "La carrera de postulación es requerida"
    }

    // Validar correo CEPRUNSA
    if (!formData.correoCeprunsa) {
      newErrors.correoCeprunsa = "El correo CEPRUNSA es requerido"
    } else if (!formData.correoCeprunsa.endsWith("@cepr.unsa.pe")) {
      newErrors.correoCeprunsa = "El correo debe terminar en @cepr.unsa.pe"
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

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario")
      return
    }

    try {
      const postulanteData: Partial<Postulante> = {
        ...formData,
        // Limpiar especialidad si está vacía
        especialidad: formData.especialidad?.trim() || undefined,
      }

      savePostulante(postulanteData)
      navigate("/postulantes")
    } catch (error) {
      console.error("Error al guardar postulante:", error)
      toast.error(error instanceof Error ? error.message : "Error al guardar postulante")
    }
  }

  if (id && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {id ? "Editar Postulante" : "Nuevo Postulante"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {id
                ? "Actualiza la información del postulante"
                : "Completa la información para registrar un nuevo postulante"}
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  {/* DNI */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="dni" className="block text-sm font-medium text-gray-700">
                      DNI / Carnet de Extranjería *
                    </label>
                    <input
                      type="text"
                      name="dni"
                      id="dni"
                      value={formData.dni || ""}
                      onChange={handleChange}
                      maxLength={10}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.dni ? "border-red-500" : ""
                      }`}
                      placeholder="Ingrese DNI o carnet de extranjería"
                    />
                    {errors.dni && <p className="mt-1 text-sm text-red-600">{errors.dni}</p>}
                  </div>

                  {/* Apellidos */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      id="apellidos"
                      value={formData.apellidos || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.apellidos ? "border-red-500" : ""
                      }`}
                      placeholder="Ingrese apellidos"
                    />
                    {errors.apellidos && <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>}
                  </div>

                  {/* Nombres */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="nombres" className="block text-sm font-medium text-gray-700">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      id="nombres"
                      value={formData.nombres || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.nombres ? "border-red-500" : ""
                      }`}
                      placeholder="Ingrese nombres"
                    />
                    {errors.nombres && <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>}
                  </div>

                  {/* Carrera de Postulación */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="carreraPostulacion" className="block text-sm font-medium text-gray-700">
                      Carrera de Postulación *
                    </label>
                    <input
                      type="text"
                      name="carreraPostulacion"
                      id="carreraPostulacion"
                      value={formData.carreraPostulacion || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.carreraPostulacion ? "border-red-500" : ""
                      }`}
                      placeholder="Ej: Ingeniería de Sistemas"
                    />
                    {errors.carreraPostulacion && (
                      <p className="mt-1 text-sm text-red-600">{errors.carreraPostulacion}</p>
                    )}
                  </div>

                  {/* Especialidad */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700">
                      Especialidad (opcional)
                    </label>
                    <input
                      type="text"
                      name="especialidad"
                      id="especialidad"
                      value={formData.especialidad || ""}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ej: Redes y Comunicaciones"
                    />
                  </div>

                  {/* Correo CEPRUNSA */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="correoCeprunsa" className="block text-sm font-medium text-gray-700">
                      Correo CEPRUNSA *
                    </label>
                    <input
                      type="email"
                      name="correoCeprunsa"
                      id="correoCeprunsa"
                      value={formData.correoCeprunsa || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.correoCeprunsa ? "border-red-500" : ""
                      }`}
                      placeholder="usuario@cepr.unsa.pe"
                    />
                    {errors.correoCeprunsa && <p className="mt-1 text-sm text-red-600">{errors.correoCeprunsa}</p>}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate("/postulantes")}
                  className="btn btn-secondary mr-3 inline-flex items-center"
                >
                  <X size={18} className="mr-2" />
                  <span>Cancelar</span>
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary inline-flex items-center">
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

export default PostulanteForm
