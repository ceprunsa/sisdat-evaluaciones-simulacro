"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useImportCalificaciones } from "../hooks/useImportCalificaciones";
import { useExamenes } from "../hooks/useExamenes";
import {
  X,
  Upload,
  FileText,
  Users,
  Calculator,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ImportCalificacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProgressInfo {
  current: number;
  total: number;
  message: string;
}

const ImportCalificacionesModal = ({
  isOpen,
  onClose,
}: ImportCalificacionesModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedExamenId, setSelectedExamenId] = useState<string>("");
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { importCalificaciones, isImporting } = useImportCalificaciones();
  const { examenes } = useExamenes();

  // Filtrar solo exámenes listos con 80 preguntas
  const examenesDisponibles = examenes.filter(
    (examen) =>
      examen.estado === "listo" &&
      examen.preguntas &&
      examen.preguntas.length === 80
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/json") {
      setSelectedFile(file);
      setImportResult(null);
      setProgress(null);
    } else {
      alert("Por favor selecciona un archivo JSON válido");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedExamenId) {
      alert("Por favor selecciona un examen y un archivo JSON");
      return;
    }

    let result = null;

    try {
      const fileContent = await selectedFile.text();
      const calificaciones = JSON.parse(fileContent);

      if (!Array.isArray(calificaciones)) {
        throw new Error(
          "El archivo JSON debe contener un array de calificaciones"
        );
      }

      if (calificaciones.length === 0) {
        throw new Error("El archivo JSON está vacío");
      }

      // Mostrar advertencia para importaciones grandes
      if (calificaciones.length > 100) {
        const confirmLarge = window.confirm(
          `Vas a importar ${calificaciones.length} calificaciones. Esto puede tomar varios minutos. ¿Deseas continuar?`
        );
        if (!confirmLarge) return;
      }

      setProgress({
        current: 0,
        total: calificaciones.length,
        message: "Iniciando importación...",
      });
      setImportResult(null);

      result = await importCalificaciones({
        examenId: selectedExamenId,
        calificaciones,
        onProgress: setProgress,
      });

      setImportResult(result);
      setProgress(null);

      // Limpiar formulario y cerrar modal si fue exitoso
      if (result && result.success) {
        setSelectedFile(null);
        setSelectedExamenId("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Cerrar modal después de un breve delay para mostrar el resultado
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error al procesar archivo:", error);
      setProgress(null);

      const errorResult = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al procesar el archivo JSON",
      };

      setImportResult(errorResult);
      result = errorResult;
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null);
      setSelectedExamenId("");
      setProgress(null);
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const plantillaEjemplo = [
    {
      postulante: {
        dni: "12345678",
        apellidos: "García López",
        nombres: "Juan Carlos",
        carreraPostulacion: "Ingeniería de Sistemas",
        especialidad: "Sistemas de Información",
        correoCeprunsa: "juan.garcia@cepr.unsa.pe",
      },
      respuestas: Array(80).fill("A"),
      fechaExamen: "2024-01-15",
    },
    {
      postulante: {
        dni: "87654321",
        apellidos: "Rodríguez Pérez",
        nombres: "María Elena",
        carreraPostulacion: "Medicina Humana",
        correoCeprunsa: "maria.rodriguez@cepr.unsa.pe",
      },
      respuestas: Array(80).fill("B"),
      fechaExamen: "2024-01-15",
    },
  ];

  const descargarPlantilla = () => {
    const dataStr = JSON.stringify(plantillaEjemplo, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-calificaciones.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Importar Calificaciones Masivamente
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Importa hasta 1000+ calificaciones y datos de postulantes
                    desde un archivo JSON. Optimizado para importaciones
                    masivas.
                  </p>
                </div>

                {/* Barra de progreso */}
                {progress && (
                  <div className="mt-4 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Calculator className="animate-spin h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">
                        {progress.message}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (progress.current / progress.total) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {progress.current} de {progress.total} (
                      {Math.round((progress.current / progress.total) * 100)}%)
                    </div>
                  </div>
                )}

                {/* Resultado de importación */}
                {importResult && (
                  <div
                    className={`mt-4 rounded-lg p-4 ${
                      importResult.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {importResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h4
                          className={`text-sm font-medium ${
                            importResult.success
                              ? "text-green-800"
                              : "text-red-800"
                          }`}
                        >
                          {importResult.success
                            ? "Importación Exitosa"
                            : "Error en Importación"}
                        </h4>
                        {importResult.success ? (
                          <div className={`mt-2 text-sm text-green-700`}>
                            <ul className="list-disc list-inside space-y-1">
                              <li>
                                ✅ {importResult.calificacionesCreadas || 0}{" "}
                                calificaciones creadas
                              </li>
                              <li>
                                👤 {importResult.postulantesCreados || 0}{" "}
                                postulantes nuevos
                              </li>
                              <li>
                                🔄 {importResult.postulantesActualizados || 0}{" "}
                                postulantes actualizados
                              </li>
                            </ul>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-red-700">
                            <p>{importResult.error}</p>
                            {importResult.errores &&
                              importResult.errores.length > 0 && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer font-medium">
                                    Ver errores ({importResult.errores.length})
                                  </summary>
                                  <ul className="mt-1 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                                    {importResult.errores
                                      .slice(0, 10)
                                      .map((error: string, index: number) => (
                                        <li key={index} className="text-xs">
                                          {error}
                                        </li>
                                      ))}
                                    {importResult.errores.length > 10 && (
                                      <li className="text-xs font-medium">
                                        ... y {importResult.errores.length - 10}{" "}
                                        errores más
                                      </li>
                                    )}
                                  </ul>
                                </details>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!progress && !importResult && (
                  <div className="mt-6 space-y-6">
                    {/* Selección de examen */}
                    <div>
                      <label
                        htmlFor="examen-select"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Seleccionar Examen *
                      </label>
                      <select
                        id="examen-select"
                        value={selectedExamenId}
                        onChange={(e) => setSelectedExamenId(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isImporting}
                      >
                        <option value="">Selecciona un examen</option>
                        {examenesDisponibles.map((examen) => (
                          <option key={examen.id} value={examen.id}>
                            {examen.nombre} - {examen.proceso} ({examen.area})
                          </option>
                        ))}
                      </select>
                      {examenesDisponibles.length === 0 && (
                        <p className="mt-1 text-sm text-red-600">
                          No hay exámenes disponibles. Los exámenes deben estar
                          en estado "listo" y tener 80 preguntas.
                        </p>
                      )}
                    </div>

                    {/* Selección de archivo */}
                    <div>
                      <label
                        htmlFor="file-upload"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Archivo JSON *
                      </label>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        disabled={isImporting}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                      {selectedFile && (
                        <div className="mt-2 text-sm">
                          <p className="text-green-600">
                            ✅ Archivo seleccionado: {selectedFile.name}
                          </p>
                          <p className="text-gray-500">
                            Tamaño:{" "}
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Información de optimización */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">
                            Importación Masiva Optimizada
                          </h4>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>✅ Soporta hasta 1000+ calificaciones</li>
                              <li>⚡ Procesamiento en lotes optimizado</li>
                              <li>🔄 Barra de progreso en tiempo real</li>
                              <li>🛡️ Validación robusta de datos</li>
                              <li>📊 Reporte detallado de resultados</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del formato */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">
                            Formato del archivo JSON
                          </h4>
                          <div className="mt-2 text-sm text-blue-700">
                            <p className="mb-2">
                              Array con objetos que incluyan:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>
                                <strong>postulante:</strong> DNI, nombres,
                                apellidos, carrera, correo
                              </li>
                              <li>
                                <strong>respuestas:</strong> Array de 80
                                respuestas (A, B, C, D, E)
                              </li>
                              <li>
                                <strong>fechaExamen:</strong> Fecha del examen
                                (YYYY-MM-DD)
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Beneficios */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Users className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">
                            Beneficios de la importación
                          </h4>
                          <ul className="mt-2 text-sm text-green-700 list-disc list-inside space-y-1">
                            <li>
                              Crea postulantes automáticamente si no existen
                            </li>
                            <li>Actualiza datos de postulantes existentes</li>
                            <li>Calcula calificaciones automáticamente</li>
                            <li>Genera matriz por curso y retroalimentación</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Botón de plantilla */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={descargarPlantilla}
                        disabled={isImporting}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Descargar Plantilla de Ejemplo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {!importResult?.success && (
              <button
                type="button"
                onClick={handleImport}
                disabled={
                  isImporting ||
                  !selectedFile ||
                  !selectedExamenId ||
                  !!progress
                }
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting || progress ? (
                  <>
                    <Calculator className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    {progress ? "Importando..." : "Procesando..."}
                  </>
                ) : (
                  <>
                    <Upload className="-ml-1 mr-2 h-5 w-5" />
                    Importar Calificaciones
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting || !!progress}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              <X className="-ml-1 mr-2 h-5 w-5" />
              {importResult?.success ? "Cerrar" : "Cancelar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCalificacionesModal;
