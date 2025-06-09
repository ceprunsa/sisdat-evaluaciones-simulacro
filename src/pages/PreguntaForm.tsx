"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePreguntas } from "../hooks/usePreguntas";
import toast from "react-hot-toast";
import type { Pregunta, Area, Alternativa } from "../types";
import { Save, X, Brain, Info } from "lucide-react";

const PreguntaForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { preguntaByIdQuery, savePregunta, isSaving } = usePreguntas();
  const { data: existingPregunta, isLoading } = preguntaByIdQuery(id);

  const [formData, setFormData] = useState<Partial<Pregunta>>({
    curso: undefined,
    tema: "",
    area: "Biomédicas",
    nivelCognitivo: "",
    puntaje: 1.0,
    competencia: "",
    mensajeComplida: "",
    mensajeNoComplida: "",
    alternativaCorrecta: "A",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sugerencias de niveles cognitivos basados en Bloom
  const sugerenciasBloom = [
    "Recordar",
    "Comprender",
    "Aplicar",
    "Analizar",
    "Evaluar",
    "Crear",
  ];

  useEffect(() => {
    if (existingPregunta) {
      setFormData({
        id: existingPregunta.id,
        curso: existingPregunta.curso || "",
        tema: existingPregunta.tema || "",
        area: existingPregunta.area || "Biomédicas",
        nivelCognitivo: existingPregunta.nivelCognitivo || "",
        puntaje: existingPregunta.puntaje || 1.0,
        competencia: existingPregunta.competencia || "",
        mensajeComplida: existingPregunta.mensajeComplida || "",
        mensajeNoComplida: existingPregunta.mensajeNoComplida || "",
        alternativaCorrecta: existingPregunta.alternativaCorrecta || "A",
      });
    }
  }, [existingPregunta]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.curso) newErrors.curso = "El curso es requerido";
    if (!formData.tema) newErrors.tema = "El tema es requerido";
    if (!formData.nivelCognitivo)
      newErrors.nivelCognitivo = "El nivel cognitivo es requerido";
    if (!formData.competencia)
      newErrors.competencia = "La competencia es requerida";
    if (!formData.mensajeComplida)
      newErrors.mensajeComplida =
        "El mensaje de competencia cumplida es requerido";
    if (!formData.mensajeNoComplida)
      newErrors.mensajeNoComplida =
        "El mensaje de competencia no cumplida es requerido";
    if (!formData.alternativaCorrecta)
      newErrors.alternativaCorrecta = "La alternativa correcta es requerida";

    // Validar puntaje
    if (!formData.puntaje || formData.puntaje <= 0) {
      newErrors.puntaje = "El puntaje debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "puntaje" ? Number.parseFloat(value) || 0 : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSugerenciaClick = (sugerencia: string) => {
    setFormData((prev) => ({
      ...prev,
      nivelCognitivo: sugerencia,
    }));

    // Limpiar error si existe
    if (errors.nivelCognitivo) {
      setErrors((prev) => ({
        ...prev,
        nivelCognitivo: "",
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    try {
      const preguntaData: Partial<Pregunta> = {
        ...formData,
        area: formData.area as Area,
        alternativaCorrecta: formData.alternativaCorrecta as Alternativa,
      };

      savePregunta(preguntaData);
      navigate("/preguntas");
    } catch (error) {
      console.error("Error al guardar pregunta:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar pregunta"
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
              {id ? "Editar Pregunta" : "Nueva Pregunta"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {id
                ? "Actualiza la información de la pregunta"
                : "Completa la información para crear una nueva pregunta"}
            </p>

            {/* Información sobre taxonomía de Bloom */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-900 flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                Taxonomía de Bloom
              </h4>
              <p className="mt-1 text-xs text-purple-700">
                Se recomienda usar los niveles de la taxonomía de Bloom para
                clasificar las preguntas según su complejidad cognitiva.
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-purple-600 font-medium">
                  Niveles recomendados:
                </p>
                <div className="flex flex-wrap gap-1">
                  {sugerenciasBloom.map((nivel) => (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => handleSugerenciaClick(nivel)}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors duration-200"
                    >
                      {nivel}
                    </button>
                  ))}
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
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="curso"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Curso *
                    </label>
                    <select
                      name="curso"
                      id="curso"
                      value={formData.curso || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.curso ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Selecciona un curso</option>
                      <option value="Biología">Biología</option>
                      <option value="Cívica">Cívica</option>
                      <option value="Filosofía">Filosofía</option>
                      <option value="Física">Física</option>
                      <option value="Geografía">Geografía</option>
                      <option value="Historia">Historia</option>
                      <option value="Inglés - Lectura">Inglés - Lectura</option>
                      <option value="Inglés - Gramática">
                        Inglés - Gramática
                      </option>
                      <option value="Lenguaje">Lenguaje</option>
                      <option value="Literatura">Literatura</option>
                      <option value="Matemática - Aritmética">
                        Matemática - Aritmética
                      </option>
                      <option value="Matemática - Algebra">
                        Matemática - Algebra
                      </option>
                      <option value="Matemática - Geometría">
                        Matemática - Geometría
                      </option>
                      <option value="Matemática - Trigonometría">
                        Matemática - Trigonometría
                      </option>
                      <option value="Psicología">Psicología</option>
                      <option value="Química">Química</option>
                      <option value="Razonamiento Lógico">
                        Razonamiento Lógico
                      </option>
                      <option value="Razonamiento Matemático">
                        Razonamiento Matemático
                      </option>
                      <option value="Comprensión Lectora">
                        Comprensión Lectora
                      </option>
                      <option value="Razonamiento Verbal">
                        Razonamiento Verbal
                      </option>
                    </select>
                    {errors.curso && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.curso}
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-2">
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

                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor="puntaje"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Puntaje *
                    </label>
                    <input
                      type="number"
                      name="puntaje"
                      id="puntaje"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={formData.puntaje || 1.0}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.puntaje ? "border-red-500" : ""
                      }`}
                    />
                    {errors.puntaje && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.puntaje}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      El total de todas las preguntas debe sumar exactamente 100
                      puntos
                    </p>
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="tema"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Tema *
                    </label>
                    <input
                      type="text"
                      name="tema"
                      id="tema"
                      value={formData.tema || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.tema ? "border-red-500" : ""
                      }`}
                      placeholder="Ej: Célula - Estructura celular, Ecuaciones - Sistemas lineales"
                    />
                    {errors.tema && (
                      <p className="mt-1 text-sm text-red-600">{errors.tema}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Incluye el tema principal y subtema separados por guión
                      (Ej: Célula - Estructura celular)
                    </p>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="nivelCognitivo"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nivel Cognitivo *
                    </label>
                    <input
                      type="text"
                      name="nivelCognitivo"
                      id="nivelCognitivo"
                      value={formData.nivelCognitivo || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.nivelCognitivo ? "border-red-500" : ""
                      }`}
                      placeholder="Ej: Recordar, Comprender, Aplicar..."
                    />
                    {errors.nivelCognitivo && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.nivelCognitivo}
                      </p>
                    )}
                    <div className="mt-1 flex items-start space-x-1">
                      <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-600">
                        Se recomienda usar los niveles de Bloom. Haz clic en las
                        sugerencias del panel lateral.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="alternativaCorrecta"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Alternativa Correcta *
                    </label>
                    <div className="mt-2 flex space-x-4">
                      {["A", "B", "C", "D", "E"].map((alt) => (
                        <label key={alt} className="inline-flex items-center">
                          <input
                            type="radio"
                            name="alternativaCorrecta"
                            value={alt}
                            checked={formData.alternativaCorrecta === alt}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {alt}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.alternativaCorrecta && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.alternativaCorrecta}
                      </p>
                    )}
                  </div>
                </div>

                {/* Competencia */}
                <div>
                  <label
                    htmlFor="competencia"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Competencia *
                  </label>
                  <textarea
                    name="competencia"
                    id="competencia"
                    rows={3}
                    value={formData.competencia || ""}
                    onChange={handleChange}
                    className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                      errors.competencia ? "border-red-500" : ""
                    }`}
                    placeholder="Describe la competencia que evalúa esta pregunta..."
                  />
                  {errors.competencia && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.competencia}
                    </p>
                  )}
                </div>

                {/* Mensajes de competencia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="mensajeComplida"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Mensaje - Competencia Cumplida *
                    </label>
                    <textarea
                      name="mensajeComplida"
                      id="mensajeComplida"
                      rows={4}
                      value={formData.mensajeComplida || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.mensajeComplida ? "border-red-500" : ""
                      }`}
                      placeholder="Mensaje que se mostrará cuando el estudiante responda correctamente..."
                    />
                    {errors.mensajeComplida && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.mensajeComplida}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="mensajeNoComplida"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Mensaje - Competencia No Cumplida *
                    </label>
                    <textarea
                      name="mensajeNoComplida"
                      id="mensajeNoComplida"
                      rows={4}
                      value={formData.mensajeNoComplida || ""}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.mensajeNoComplida ? "border-red-500" : ""
                      }`}
                      placeholder="Mensaje que se mostrará cuando el estudiante responda incorrectamente..."
                    />
                    {errors.mensajeNoComplida && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.mensajeNoComplida}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nota informativa */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Información importante
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          • El enunciado y las alternativas de la pregunta se
                          agregarán posteriormente
                          <br />• Los puntajes deben sumar exactamente 100
                          puntos entre todas las preguntas
                          <br />• Selecciona la alternativa correcta (A, B, C, D
                          o E)
                          <br />• En el tema incluye tanto el tema principal
                          como el subtema
                          <br />•{" "}
                          <strong>
                            Se recomienda usar la taxonomía de Bloom
                          </strong>{" "}
                          para el nivel cognitivo (Recordar, Comprender,
                          Aplicar, Analizar, Evaluar, Crear)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate("/preguntas")}
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
    </div>
  );
};

export default PreguntaForm;
