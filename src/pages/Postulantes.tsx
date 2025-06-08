"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { usePostulantes } from "../hooks/usePostulantes"
import type { Postulante } from "../types"
import { Plus, Trash2, Edit, Search, Mail, BadgeIcon as IdCard } from "lucide-react"

const Postulantes = () => {
  const { postulantes, isLoading, isError, deletePostulante, isDeleting } = usePostulantes()
  const [postulanteToDelete, setPostulanteToDelete] = useState<Postulante | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar postulantes por término de búsqueda
  const filteredPostulantes = postulantes.filter(
    (postulante) =>
      postulante.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulante.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulante.dni.includes(searchTerm) ||
      postulante.correoCeprunsa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulante.carreraPostulacion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> No se pudieron cargar los postulantes.</span>
      </div>
    )
  }

  const handleDeleteClick = (postulante: Postulante) => {
    setPostulanteToDelete(postulante)
  }

  const confirmDelete = async () => {
    if (!postulanteToDelete?.id) return

    try {
      await deletePostulante(postulanteToDelete.id)
      setPostulanteToDelete(null)
    } catch (error) {
      console.error("Error al eliminar postulante:", error)
    }
  }

  const cancelDelete = () => {
    setPostulanteToDelete(null)
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Postulantes</h1>
        <Link to="/postulantes/new" className="btn btn-primary inline-flex items-center">
          <Plus size={18} className="mr-1 md:mr-2" />
          <span className="hidden sm:inline">Nuevo Postulante</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

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

      {/* Lista de postulantes */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        {filteredPostulantes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm
              ? "No se encontraron postulantes que coincidan con la búsqueda"
              : "No hay postulantes registrados"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Encabezado de la tabla (solo visible en pantallas grandes) */}
            <div className="hidden xl:grid xl:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-lg">
              <div className="xl:col-span-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DNI
              </div>
              <div className="xl:col-span-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Apellidos y Nombres
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

            {/* Filas de postulantes */}
            {filteredPostulantes.map((postulante, index) => (
              <div
                key={postulante.id}
                className={`p-4 xl:p-0 hover:bg-gray-50 transition-colors duration-150 ${
                  index === filteredPostulantes.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                {/* Vista para pantallas grandes */}
                <div className="hidden xl:grid xl:grid-cols-12 xl:items-center xl:px-6 xl:py-4">
                  <div className="xl:col-span-2">
                    <div className="flex items-center">
                      <IdCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{postulante.dni}</span>
                    </div>
                  </div>
                  <div className="xl:col-span-3">
                    <div className="text-sm font-medium text-gray-900">
                      {postulante.apellidos}, {postulante.nombres}
                    </div>
                  </div>
                  <div className="xl:col-span-3 text-sm text-gray-900">{postulante.carreraPostulacion}</div>
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
                      <span className="font-medium text-gray-900">{postulante.dni}</span>
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
                    <div className="text-sm text-gray-600">{postulante.carreraPostulacion}</div>
                    {postulante.especialidad && (
                      <div className="text-sm text-gray-500">Especialidad: {postulante.especialidad}</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <a
                      href={`mailto:${postulante.correoCeprunsa}`}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      <span className="truncate max-w-48">{postulante.correoCeprunsa}</span>
                    </a>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      {postulante.createdAt ? new Date(postulante.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {postulanteToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Eliminar postulante</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar al postulante{" "}
                        <span className="font-semibold">
                          {postulanteToDelete.apellidos}, {postulanteToDelete.nombres}
                        </span>
                        ? Esta acción no se puede deshacer y se eliminarán todas las calificaciones asociadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="btn btn-danger sm:ml-3" onClick={confirmDelete} disabled={isDeleting}>
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
  )
}

export default Postulantes
