"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useExamenes } from "../hooks/useExamenes";
import { usePreguntas } from "../hooks/usePreguntas";
import ImportPreguntasModal from "../components/ImportPreguntasModal";
import toast from "react-hot-toast";
import type {
  ExamenSimulacro,
  Area,
  MatrizConformacion,
  PreguntaEnExamen,
} from "../types";
import {
  Save,
  X,
  Plus,
  Trash2,
  Search,
  Hash,
  ArrowUp,
  ArrowDown,
  Upload,
} from "lucide-react";

const ExamenForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { examenByIdQuery, saveExamen, isSaving } = useExamenes();
  const { preguntas } = usePreguntas();
  const { data: existingExamen, isLoading } = examenByIdQuery(id);

  const [formData, setFormData] = useState<Partial<ExamenSimulacro>>({
    nombre: "",
    proceso: "",
    area: "Biomédicas",
    preguntas: [],
    preguntasOrdenadas: [],
    preguntasData: [],
    matrizConformacion: [],
    estado: "construccion",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchPregunta, setSearchPregunta] = useState("");
  const [filterCurso, setFilterCurso] = useState<string>("todos");
  const [showImportModal, setShowImportModal] = useState(false);

  // Obtener cursos únicos para el filtro
  const cursosUnicos = [...new Set(preguntas.map((p) => p.curso))].sort();

  // Filtrar preguntas disponibles
  const preguntasDisponibles = preguntas.filter((pregunta) => {
    const matchesArea = pregunta.area === formData.area;
    const matchesSearch =
      pregunta.curso.toLowerCase().includes(searchPregunta.toLowerCase()) ||
      pregunta.tema.toLowerCase().includes(searchPregunta.toLowerCase()) ||
      pregunta.competencia.toLowerCase().includes(searchPregunta.toLowerCase());
    const matchesCurso =
      filterCurso === "todos" || pregunta.curso === filterCurso;
    const notSelected = !formData.preguntasOrdenadas?.some(
      (p) => p.preguntaId === pregunta.id
    );

    return matchesArea && matchesSearch && matchesCurso && notSelected;
  });

  // Obtener preguntas seleccionadas con datos completos
  const preguntasSeleccionadas = (formData.preguntasOrdenadas || [])
    .map((item) => {
      // Buscar primero en preguntasData del examen, luego en preguntas generales
      let pregunta = formData.preguntasData?.find(
        (p) => p.id === item.preguntaId
      );
      if (!pregunta) {
        pregunta = preguntas.find((p) => p.id === item.preguntaId);
      }
      return pregunta ? { ...pregunta, numero: item.numero } : null;
    })
    .filter((p) => p !== null)
    .sort((a, b) => a.numero - b.numero);

  useEffect(() => {
    if (existingExamen) {
      // Si el examen existente no tiene preguntasOrdenadas, crearlas desde preguntas
      let preguntasOrdenadas: PreguntaEnExamen[] = [];
      if (
        existingExamen.preguntasOrdenadas &&
        existingExamen.preguntasOrdenadas.length > 0
      ) {
        preguntasOrdenadas = existingExamen.preguntasOrdenadas;
      } else if (
        existingExamen.preguntas &&
        existingExamen.preguntas.length > 0
      ) {
        preguntasOrdenadas = existingExamen.preguntas.map(
          (preguntaId: string, index: number) => ({
            preguntaId,
            numero: index + 1,
          })
        );
      }

      setFormData({
        id: existingExamen.id,
        nombre: existingExamen.nombre || "",
        proceso: existingExamen.proceso || "",
        area: existingExamen.area || "Biomédicas",
        preguntas: existingExamen.preguntas || [],
        preguntasOrdenadas,
        preguntasData: existingExamen.preguntasData || [],
        matrizConformacion: existingExamen.matrizConformacion || [],
        estado: existingExamen.estado || "construccion",
      });
    }
  }, [existingExamen]);

  // Calcular matriz de conformación automáticamente
  useEffect(() => {
    if (formData.preguntasOrdenadas && formData.preguntasOrdenadas.length > 0) {
      const preguntasData = formData.preguntasOrdenadas
        .map((item) => {
          // Buscar en preguntasData del examen primero, luego en preguntas generales
          let pregunta = formData.preguntasData?.find(
            (p) => p.id === item.preguntaId
          );
          if (!pregunta) {
            pregunta = preguntas.find((p) => p.id === item.preguntaId);
          }
          return pregunta;
        })
        .filter((p) => p !== undefined);

      const matrizPorCurso: Record<string, number> = {};

      preguntasData.forEach((pregunta) => {
        if (pregunta) {
          matrizPorCurso[pregunta.curso] =
            (matrizPorCurso[pregunta.curso] || 0) + 1;
        }
      });

      const nuevaMatriz: MatrizConformacion[] = Object.entries(
        matrizPorCurso
      ).map(([curso, cantidad]) => ({
        curso,
        cantidad,
      }));

      setFormData((prev) => ({
        ...prev,
        matrizConformacion: nuevaMatriz,
        preguntas:
          formData.preguntasOrdenadas?.map((item) => item.preguntaId) || [],
      }));
    } else {
      // Si no hay preguntas, limpiar la matriz de conformación
      setFormData((prev) => ({
        ...prev,
        matrizConformacion: [],
        preguntas: [],
      }));
    }
  }, [formData.preguntasOrdenadas, formData.preguntasData, preguntas]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre) newErrors.nombre = "El nombre es requerido";
    if (!formData.proceso) newErrors.proceso = "El proceso es requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Si cambia el área, limpiar preguntas seleccionadas
    if (name === "area") {
      setFormData((prev) => ({
        ...prev,
        preguntas: [],
        preguntasOrdenadas: [],
        preguntasData: [],
        matrizConformacion: [],
      }));
    }
  };

  const handleAgregarPregunta = (preguntaId: string) => {
    const siguienteNumero = (formData.preguntasOrdenadas?.length || 0) + 1;
    const nuevaPregunta: PreguntaEnExamen = {
      preguntaId,
      numero: siguienteNumero,
    };

    // Buscar los datos completos de la pregunta
    const preguntaCompleta = preguntas.find((p) => p.id === preguntaId);

    setFormData((prev) => ({
      ...prev,
      preguntasOrdenadas: [...(prev.preguntasOrdenadas || []), nuevaPregunta],
      preguntas: [...(prev.preguntas || []), preguntaId],
      preguntasData: preguntaCompleta
        ? [...(prev.preguntasData || []), preguntaCompleta]
        : prev.preguntasData,
    }));
  };

  const handleRemoverPregunta = (preguntaId: string) => {
    const preguntasActualizadas = (formData.preguntasOrdenadas || [])
      .filter((item) => item.preguntaId !== preguntaId)
      .map((item, index) => ({
        ...item,
        numero: index + 1, // Renumerar automáticamente
      }));

    const preguntasIdsActualizados = preguntasActualizadas.map(
      (item) => item.preguntaId
    );
    const preguntasDataActualizadas = (formData.preguntasData || []).filter(
      (pregunta) => preguntaId !== pregunta.id
    );

    setFormData((prev) => ({
      ...prev,
      preguntasOrdenadas: preguntasActualizadas,
      preguntas: preguntasIdsActualizados,
      preguntasData: preguntasDataActualizadas,
    }));
  };

  const handleMoverPregunta = (
    preguntaId: string,
    direccion: "up" | "down"
  ) => {
    const preguntasOrdenadas = [...(formData.preguntasOrdenadas || [])];
    const index = preguntasOrdenadas.findIndex(
      (item) => item.preguntaId === preguntaId
    );

    if (index === -1) return;

    const newIndex = direccion === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= preguntasOrdenadas.length) return; // Intercambiar posiciones
    [preguntasOrdenadas[index], preguntasOrdenadas[newIndex]] = [
      preguntasOrdenadas[newIndex],
      preguntasOrdenadas[index],
    ];

    // Renumerar
    const preguntasRenumeradas = preguntasOrdenadas.map((item, idx) => ({
      ...item,
      numero: idx + 1,
    }));

    // Actualizar el array de IDs para mantener el mismo orden
    const preguntasIdsOrdenados = preguntasRenumeradas.map(
      (item) => item.preguntaId
    );

    setFormData((prev) => ({
      ...prev,
      preguntasOrdenadas: preguntasRenumeradas,
      preguntas: preguntasIdsOrdenados,
    }));
  };

  const handleBorrarTodasLasPreguntas = () => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Eliminar todas las preguntas
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Se eliminarán {formData.preguntasOrdenadas?.length || 0}{" "}
                  preguntas del examen. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setFormData((prev) => ({
                  ...prev,
                  preguntasOrdenadas: [],
                  preguntas: [],
                  preguntasData: [],
                  matrizConformacion: [],
                }));
                toast.success(
                  "Todas las preguntas han sido eliminadas del examen"
                );
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Eliminar
            </button>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: Number.POSITIVE_INFINITY,
      }
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    try {
      const examenData: Partial<ExamenSimulacro> = {
        ...formData,
        area: formData.area as Area,
        estado:
          (formData.preguntasOrdenadas?.length || 0) === 80
            ? "listo"
            : "construccion",
      };

      saveExamen(examenData);
      navigate("/examenes");
    } catch (error) {
      console.error("Error al guardar examen:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar examen"
      );
    }
  };

  if (id && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {id ? "Editar Examen" : "Nuevo Examen"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {id
                ? "Actualiza la información del examen simulacro"
                : "Completa la información para crear un nuevo examen simulacro"}
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900">
                Progreso del examen
              </h4>
              <div className="mt-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>
                    Preguntas: {formData.preguntasOrdenadas?.length || 0} / 80
                  </span>
                  <span>
                    {Math.round(
                      ((formData.preguntasOrdenadas?.length || 0) / 80) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="mt-1 w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((formData.preguntasOrdenadas?.length || 0) / 80) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
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
                    <label
                      htmlFor="nombre"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nombre del Examen *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      id="nombre"
                      value={formData.nombre || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.nombre ? "border-red-500" : ""
                      }`}
                      placeholder="Ej: Simulacro General 2024-I"
                    />
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.nombre}
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="proceso"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Proceso *
                    </label>
                    <input
                      type="text"
                      name="proceso"
                      id="proceso"
                      value={formData.proceso || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.proceso ? "border-red-500" : ""
                      }`}
                      placeholder="Ej: Admisión 2024-I"
                    />
                    {errors.proceso && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.proceso}
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="area"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Área *
                    </label>
                    <select
                      name="area"
                      id="area"
                      value={formData.area || "Biomédicas"}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="Biomédicas">Biomédicas</option>
                      <option value="Ingenierías">Ingenierías</option>
                      <option value="Sociales">Sociales</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(formData.preguntasOrdenadas?.length || 0) === 80 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full text-green-600 bg-green-50">
                          Listo (80 preguntas)
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full text-yellow-600 bg-yellow-50">
                          En construcción (
                          {formData.preguntasOrdenadas?.length || 0}/80
                          preguntas)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Matriz de conformación */}
                {formData.matrizConformacion &&
                  formData.matrizConformacion.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Matriz de Conformación
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {formData.matrizConformacion.map((item) => (
                            <div
                              key={item.curso}
                              className="bg-white p-3 rounded-md shadow-sm"
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {item.curso}
                              </div>
                              <div className="text-lg font-semibold text-blue-600">
                                {item.cantidad} preguntas
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Preguntas seleccionadas */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      Preguntas del Examen (
                      {formData.preguntasOrdenadas?.length || 0}/80)
                    </h4>
                    <div className="flex space-x-2">
                      {(formData.preguntasOrdenadas?.length || 0) > 0 && (
                        <button
                          type="button"
                          onClick={handleBorrarTodasLasPreguntas}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Borrar Todas
                        </button>
                      )}
                      {id && (
                        <button
                          type="button"
                          onClick={() => setShowImportModal(true)}
                          disabled={
                            (formData.preguntasOrdenadas?.length || 0) >= 80
                          }
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload size={16} className="mr-2" />
                          Importar Preguntas
                        </button>
                      )}
                    </div>
                  </div>
                  {preguntasSeleccionadas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay preguntas en este examen.{" "}
                      {id
                        ? "Usa el botón 'Importar Preguntas' o agrega preguntas desde la sección de abajo."
                        : "Guarda el examen primero para poder importar preguntas."}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {preguntasSeleccionadas.map((pregunta, index) => (
                          <div
                            key={pregunta.id}
                            className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center bg-blue-100 px-2 py-1 rounded-md">
                                <Hash
                                  size={14}
                                  className="text-blue-600 mr-1"
                                />
                                <span className="text-sm font-bold text-blue-700">
                                  {pregunta.numero}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {pregunta.curso}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {pregunta.tema}
                                </div>
                                <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                                  {pregunta.competencia.length > 60
                                    ? `${pregunta.competencia.substring(
                                        0,
                                        60
                                      )}...`
                                    : pregunta.competencia}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className="text-xs font-semibold text-blue-600">
                                {pregunta.puntaje} pts
                              </span>
                              <div className="flex flex-col space-y-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoverPregunta(pregunta.id, "up")
                                  }
                                  disabled={index === 0}
                                  className="p-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Mover arriba"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoverPregunta(pregunta.id, "down")
                                  }
                                  disabled={
                                    index === preguntasSeleccionadas.length - 1
                                  }
                                  className="p-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Mover abajo"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoverPregunta(pregunta.id)
                                }
                                className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                                title="Remover pregunta"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Agregar preguntas individuales */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    Agregar Preguntas Individuales (Área: {formData.area})
                  </h4>

                  {/* Filtros para preguntas */}
                  <div className="mb-4 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar preguntas por curso, tema o competencia..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={searchPregunta}
                        onChange={(e) => setSearchPregunta(e.target.value)}
                      />
                    </div>

                    <select
                      value={filterCurso}
                      onChange={(e) => setFilterCurso(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="todos">Todos los cursos</option>
                      {cursosUnicos
                        .filter((curso) =>
                          preguntas.some(
                            (p) => p.curso === curso && p.area === formData.area
                          )
                        )
                        .map((curso) => (
                          <option key={curso} value={curso}>
                            {curso}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Lista de preguntas disponibles */}
                  <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {preguntasDisponibles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {preguntas.filter((p) => p.area === formData.area)
                          .length === 0
                          ? `No hay preguntas disponibles para el área ${formData.area}`
                          : "No hay más preguntas disponibles con los filtros actuales"}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {preguntasDisponibles.map((pregunta) => (
                          <div
                            key={pregunta.id}
                            className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {pregunta.curso}
                              </div>
                              <div className="text-xs text-gray-500">
                                {pregunta.tema}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                                {pregunta.competencia.length > 80
                                  ? `${pregunta.competencia.substring(
                                      0,
                                      80
                                    )}...`
                                  : pregunta.competencia}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className="text-xs font-semibold text-blue-600">
                                {pregunta.puntaje} pts
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAgregarPregunta(pregunta.id)
                                }
                                disabled={
                                  (formData.preguntasOrdenadas?.length || 0) >=
                                  80
                                }
                                className="p-1 rounded-md text-green-600 hover:bg-green-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Agregar pregunta"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate("/examenes")}
                  className="btn btn-secondary mr-3 inline-flex items-center"
                >
                  <X size={18} className="mr-2" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
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

      {/* Modal de importación */}
      {showImportModal && id && formData.area && (
        <ImportPreguntasModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          examenId={id}
          areaExamen={formData.area}
          preguntasExistentes={formData.preguntasData || []}
          modo="examen"
        />
      )}
    </div>
  );
};

export default ExamenForm;
