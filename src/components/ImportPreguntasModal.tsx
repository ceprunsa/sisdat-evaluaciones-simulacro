"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { useImportPreguntas } from "../hooks/useImportPreguntas";
import type { Pregunta, Area, Alternativa, Curso } from "../types";
import Decimal from "decimal.js";
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface ImportPreguntasModalProps {
  isOpen: boolean;
  onClose: () => void;
  examenId?: string; // Opcional para modo banco
  areaExamen?: Area; // Opcional para modo banco
  preguntasExistentes?: Pregunta[]; // Opcional para modo banco
  modo?: "examen" | "banco"; // Nuevo prop para determinar el modo
}

const ImportPreguntasModal = ({
  isOpen,
  onClose,
  examenId,
  areaExamen,
  preguntasExistentes = [],
  modo = "banco", // Por defecto modo banco
}: ImportPreguntasModalProps) => {
  const {
    importPreguntasToExamen,
    importPreguntasToBanco,
    isImporting,
    progress,
    results,
  } = useImportPreguntas();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Calcular puntaje usado con precisión decimal
  const puntajeUsado = preguntasExistentes
    .reduce((totalDecimal, pregunta) => {
      const puntajePregunta = new Decimal(pregunta.puntaje || 0);
      return totalDecimal.plus(puntajePregunta);
    }, new Decimal(0))
    .toNumber();

  // ✅ Calcular puntaje disponible con precisión decimal
  const puntajeDisponible = new Decimal(100)
    .minus(new Decimal(puntajeUsado))
    .toNumber();

  const preguntasDisponibles = 80 - preguntasExistentes.length;

  // ✅ Calcular porcentaje de progreso con precisión decimal
  const porcentajePreguntas = new Decimal(preguntasExistentes.length)
    .dividedBy(new Decimal(80))
    .times(new Decimal(100))
    .toNumber();

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (file.type !== "application/json") {
      alert("Por favor, selecciona un archivo JSON válido");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (modo === "examen" && examenId && areaExamen) {
        await importPreguntasToExamen(
          data,
          examenId,
          areaExamen,
          preguntasExistentes
        );
      } else {
        await importPreguntasToBanco(data);
      }
    } catch (error) {
      console.error("Error al procesar archivo:", error);
      alert("Error al procesar el archivo JSON");
    }
  };

  const generateTemplate = () => {
    const template: Partial<Pregunta>[] =
      modo === "examen"
        ? [
            {
              curso: "Matemática - Algebra" as Curso,
              tema: "Ecuaciones - Ecuaciones lineales",
              area: areaExamen,
              nivelCognitivo: "Aplicar",
              puntaje: 1.5,
              competencia:
                "Resuelve problemas de ecuaciones lineales aplicando propiedades algebraicas",
              mensajeComplida:
                "¡Excelente! Dominas las ecuaciones lineales y sus aplicaciones.",
              mensajeNoComplida:
                "Necesitas reforzar el tema de ecuaciones lineales. Practica más ejercicios.",
              alternativaCorrecta: "A" as Alternativa,
            },
            {
              curso: "Física" as Curso,
              tema: "Mecánica - Cinemática",
              area: areaExamen,
              nivelCognitivo: "Analizar",
              puntaje: 2.0,
              competencia:
                "Analiza el movimiento de los cuerpos aplicando las leyes de la cinemática",
              mensajeComplida:
                "¡Muy bien! Comprendes los conceptos de cinemática correctamente.",
              mensajeNoComplida:
                "Debes repasar los conceptos básicos de cinemática y sus fórmulas.",
              alternativaCorrecta: "B" as Alternativa,
            },
            {
              curso: "Química" as Curso,
              tema: "Química General - Tabla Periódica",
              area: areaExamen,
              nivelCognitivo: "Recordar",
              puntaje: 1.25,
              competencia:
                "Identifica las propiedades de los elementos químicos según su ubicación en la tabla periódica",
              mensajeComplida:
                "¡Perfecto! Manejas bien la tabla periódica y las propiedades de los elementos.",
              mensajeNoComplida:
                "Es importante que estudies más sobre la tabla periódica y las propiedades periódicas.",
              alternativaCorrecta: "C" as Alternativa,
            },
          ]
        : [
            {
              curso: "Matemática - Algebra" as Curso,
              tema: "Ecuaciones - Ecuaciones lineales",
              area: "Ingenierías" as Area,
              nivelCognitivo: "Aplicar",
              puntaje: 1.5,
              competencia:
                "Resuelve problemas de ecuaciones lineales aplicando propiedades algebraicas",
              mensajeComplida:
                "¡Excelente! Dominas las ecuaciones lineales y sus aplicaciones.",
              mensajeNoComplida:
                "Necesitas reforzar el tema de ecuaciones lineales. Practica más ejercicios.",
              alternativaCorrecta: "A" as Alternativa,
            },
            {
              curso: "Biología" as Curso,
              tema: "Célula - Estructura celular",
              area: "Biomédicas" as Area,
              nivelCognitivo: "Recordar",
              puntaje: 2.0,
              competencia:
                "Identifica las estructuras celulares y sus funciones básicas",
              mensajeComplida: "¡Perfecto! Conoces bien la estructura celular.",
              mensajeNoComplida:
                "Debes estudiar más sobre las estructuras celulares y sus funciones.",
              alternativaCorrecta: "B" as Alternativa,
            },
            {
              curso: "Historia" as Curso,
              tema: "Historia del Perú - Independencia",
              area: "Sociales" as Area,
              nivelCognitivo: "Analizar",
              puntaje: 1.25,
              competencia:
                "Analiza los procesos históricos de la independencia del Perú",
              mensajeComplida:
                "¡Excelente! Comprendes los procesos de independencia.",
              mensajeNoComplida:
                "Necesitas repasar los eventos de la independencia del Perú.",
              alternativaCorrecta: "C" as Alternativa,
            },
          ];

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      modo === "examen"
        ? `plantilla-preguntas-${areaExamen?.toLowerCase()}.json`
        : `plantilla-preguntas-banco-general.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (!isImporting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {modo === "examen"
                ? "Importar Preguntas al Examen"
                : "Importar Preguntas al Banco"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {modo === "examen"
                ? `Área: ${areaExamen}`
                : "Banco general de preguntas"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del examen */}
          {modo === "examen" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Estado del Examen
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Preguntas:</span>
                  <div className="font-semibold text-blue-900">
                    {preguntasExistentes.length} / 80
                  </div>
                </div>
                <div>
                  <span className="text-blue-700">Disponibles:</span>
                  <div
                    className={`font-semibold ${
                      preguntasDisponibles <= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {preguntasDisponibles}
                  </div>
                </div>
                <div>
                  <span className="text-blue-700">Puntaje usado:</span>
                  <div className="font-semibold text-blue-900">
                    {new Decimal(puntajeUsado).toFixed(2)} / 100
                  </div>
                </div>
                <div>
                  <span className="text-blue-700">Puntaje disponible:</span>
                  <div
                    className={`font-semibold ${
                      puntajeDisponible < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {new Decimal(puntajeDisponible).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs text-blue-700">
                  <span>Progreso de preguntas</span>
                  <span>{new Decimal(porcentajePreguntas).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      preguntasExistentes.length === 80
                        ? "bg-green-500"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${Math.min(porcentajePreguntas, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Restricciones importantes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">
              {modo === "examen"
                ? "⚠️ Restricciones Importantes"
                : "📝 Información de Importación"}
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              {modo === "examen" ? (
                <>
                  <li>
                    • Todas las preguntas deben pertenecer al área{" "}
                    <strong>{areaExamen}</strong>
                  </li>
                  <li>• El examen no puede exceder 80 preguntas total</li>
                  <li>• El puntaje total no puede exceder 100 puntos</li>
                  <li>
                    • Las preguntas se agregarán al examen{" "}
                    <strong>y al banco general de preguntas</strong>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    • Las preguntas pueden ser de cualquier área (Biomédicas,
                    Ingenierías, Sociales)
                  </li>
                  <li>
                    • No hay límite en la cantidad de preguntas a importar
                  </li>
                  <li>• No hay restricciones de puntaje total</li>
                  <li>
                    • Las preguntas se agregarán al banco general para uso en
                    exámenes
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Información adicional */}

          {modo === "examen" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">
                ✅ Beneficios de la Importación
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>
                  • Las preguntas estarán disponibles en este examen específico
                </li>
                <li>
                  • También se agregarán al banco general para uso en otros
                  exámenes
                </li>
                <li>• Podrás reutilizar estas preguntas en futuros exámenes</li>
                <li>
                  • Se mantendrá la consistencia entre el examen y el banco de
                  preguntas
                </li>
              </ul>
            </div>
          )}

          {/* Plantilla */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Plantilla JSON {modo === "examen" && <>para {areaExamen}</>}
              </h3>
              <p className="text-sm text-gray-600">
                Descarga una plantilla específica para esta área
              </p>
            </div>
            <button
              onClick={generateTemplate}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              <Download size={16} className="mr-2" />
              Descargar Plantilla
            </button>
          </div>

          {/* Área de carga */}
          {!results && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : isImporting
                  ? "border-gray-200 bg-gray-50"
                  : preguntasDisponibles <= 0
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileInput}
                className="hidden"
                disabled={isImporting || preguntasDisponibles <= 0}
              />

              <div className="space-y-4">
                <div
                  className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                    preguntasDisponibles <= 0 ? "bg-red-100" : "bg-blue-100"
                  }`}
                >
                  <Upload
                    className={`w-6 h-6 ${
                      preguntasDisponibles <= 0
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {isImporting
                      ? "Importando preguntas..."
                      : preguntasDisponibles <= 0
                      ? "Examen completo (80/80 preguntas)"
                      : "Arrastra tu archivo JSON aquí"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isImporting
                      ? "Agregando preguntas al examen y al banco general"
                      : preguntasDisponibles <= 0
                      ? "No se pueden agregar más preguntas a este examen"
                      : "o haz clic para seleccionar"}
                  </p>
                </div>

                {!isImporting && preguntasDisponibles > 0 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <FileText size={16} className="mr-2" />
                    Seleccionar Archivo
                  </button>
                )}

                {/* Barra de progreso */}
                {isImporting && (
                  <div className="w-full max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>{new Decimal(progress).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Resultados de la Importación
                </h3>
                <button
                  onClick={handleClose}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Cerrar
                </button>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {results.exitosos}
                  </div>
                  <div className="text-sm text-green-700">
                    Agregadas al examen
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-900">
                    {results.errores}
                  </div>
                  <div className="text-sm text-red-700">Errores</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {results.total}
                  </div>
                  <div className="text-sm text-blue-700">Total procesadas</div>
                </div>
              </div>

              {/* Detalles de errores */}
              {results.detalles.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <h4 className="text-sm font-medium text-yellow-900">
                      Detalles de Errores
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.detalles.map((detalle, index) => (
                      <div
                        key={index}
                        className="text-sm text-yellow-800 bg-yellow-100 rounded p-2"
                      >
                        <strong>Fila {detalle.fila}:</strong> {detalle.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje de éxito */}
              {results.exitosos > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">
                      Se agregaron exitosamente {results.exitosos} preguntas al
                      examen y al banco general de preguntas. Total de preguntas
                      en el examen:{" "}
                      {preguntasExistentes.length + results.exitosos}/80
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formato esperado */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Formato JSON Esperado
            </h3>
            <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
              {modo === "examen"
                ? `[
  {
    "curso": "Matemática - Algebra",
    "tema": "Ecuaciones - Ecuaciones lineales", 
    "area": "${areaExamen}",
    "nivelCognitivo": "Aplicar",
    "puntaje": 1.5,
    "competencia": "Resuelve problemas de ecuaciones lineales",
    "mensajeComplida": "¡Excelente! Dominas las ecuaciones.",
    "mensajeNoComplida": "Necesitas reforzar ecuaciones lineales.",
    "alternativaCorrecta": "A"
  }
]`
                : `[
  {
    "curso": "Matemática - Algebra",
    "tema": "Ecuaciones - Ecuaciones lineales", 
    "area": "Ingenierías",
    "nivelCognitivo": "Aplicar",
    "puntaje": 1.5,
    "competencia": "Resuelve problemas de ecuaciones lineales",
    "mensajeComplida": "¡Excelente! Dominas las ecuaciones.",
    "mensajeNoComplida": "Necesitas reforzar ecuaciones lineales.",
    "alternativaCorrecta": "A"
  }
]`}
            </pre>
            <div className="mt-2 text-xs text-gray-600">
              {modo === "examen" ? (
                <>
                  <p>
                    <strong>Importante:</strong> Todas las preguntas deben tener
                    area: "{areaExamen}"
                  </p>
                  <p>
                    <strong>Cursos válidos:</strong> "Biología", "Cívica",
                    "Filosofía", "Física", "Geografía", "Historia", "Inglés -
                    Lectura", "Inglés - Gramática", "Lenguaje", "Literatura",
                    "Matemática - Aritmética", "Matemática - Algebra",
                    "Matemática - Geometría", "Matemática - Trigonometría",
                    "Psicología", "Química", "Razonamiento Lógico",
                    "Razonamiento Matemático", "Comprensión Lectora",
                    "Razonamiento Verbal"
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Áreas válidas:</strong> "Biomédicas", "Ingenierías",
                    "Sociales"
                  </p>
                  <p>
                    <strong>Cursos válidos:</strong> "Biología", "Cívica",
                    "Filosofía", "Física", "Geografía", "Historia", "Inglés -
                    Lectura", "Inglés - Gramática", "Lenguaje", "Literatura",
                    "Matemática - Aritmética", "Matemática - Algebra",
                    "Matemática - Geometría", "Matemática - Trigonometría",
                    "Psicología", "Química", "Razonamiento Lógico",
                    "Razonamiento Matemático", "Comprensión Lectora",
                    "Razonamiento Verbal"
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {results ? "Cerrar" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPreguntasModal;
