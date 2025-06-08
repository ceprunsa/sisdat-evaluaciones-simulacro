"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useImportPreguntas } from "../hooks/useImportPreguntas";
import { usePreguntas } from "../hooks/usePreguntas";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";

interface ImportPreguntasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  success: number;
  errors: Array<{ index: number; error: string; data?: any }>;
  total: number;
}

const ImportPreguntasModal = ({
  isOpen,
  onClose,
}: ImportPreguntasModalProps) => {
  const { importPreguntas, isImporting, progress } = useImportPreguntas();
  const { preguntas } = usePreguntas();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
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

  const handleFile = (file: File) => {
    if (file.type !== "application/json") {
      alert("Por favor selecciona un archivo JSON válido");
      return;
    }
    setSelectedFile(file);
    setImportResult(null);
  };

  const processImport = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);
      const result = await importPreguntas(data, preguntas);
      setImportResult(result);
    } catch (error) {
      alert(
        "Error al procesar el archivo JSON: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        curso: "Matemática",
        tema: "Álgebra",
        subtema: "Ecuaciones lineales",
        area: "Ingenierías",
        puntaje: 1.5,
        competencia:
          "Resuelve problemas de ecuaciones lineales aplicando propiedades algebraicas",
        mensajeComplida:
          "¡Excelente! Dominas la resolución de ecuaciones lineales.",
        mensajeNoComplida:
          "Necesitas reforzar los conceptos de ecuaciones lineales y sus propiedades.",
      },
      {
        curso: "Biología",
        tema: "Célula",
        subtema: "Organelos celulares",
        area: "Biomédicas",
        puntaje: 2.0,
        competencia:
          "Identifica y describe las funciones de los organelos celulares",
        mensajeComplida:
          "¡Muy bien! Conoces perfectamente la estructura celular.",
        mensajeNoComplida:
          "Debes estudiar más sobre los organelos y sus funciones específicas.",
      },
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_preguntas.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setSelectedFile(null);
    setImportResult(null);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Importar Preguntas desde JSON
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isImporting}
              >
                <X size={24} />
              </button>
            </div>

            {/* Información y plantilla */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Formato requerido
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                El archivo JSON debe contener un array de objetos con los
                siguientes campos obligatorios:
              </p>
              <ul className="text-xs text-blue-600 space-y-1 mb-3">
                <li>
                  • <strong>curso</strong>: Nombre del curso (texto)
                </li>
                <li>
                  • <strong>tema</strong>: Tema principal (texto)
                </li>
                <li>
                  • <strong>subtema</strong>: Subtema específico (texto)
                </li>
                <li>
                  • <strong>area</strong>: "Biomédicas", "Ingenierías" o
                  "Sociales"
                </li>
                <li>
                  • <strong>puntaje</strong>: Puntaje decimal (número)
                </li>
                <li>
                  • <strong>competencia</strong>: Descripción de la competencia
                  (texto)
                </li>
                <li>
                  • <strong>mensajeComplida</strong>: Mensaje cuando se cumple
                  la competencia (texto)
                </li>
                <li>
                  • <strong>mensajeNoComplida</strong>: Mensaje cuando no se
                  cumple la competencia (texto)
                </li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-white hover:bg-blue-50"
              >
                <Download size={14} className="mr-1" />
                Descargar Plantilla
              </button>
            </div>

            {/* Control de puntajes */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">
                Control de Puntajes
              </h4>
              <p className="text-sm text-yellow-700">
                Puntaje actual:{" "}
                <strong>
                  {preguntas.reduce((sum, p) => sum + p.puntaje, 0).toFixed(1)}{" "}
                  / 100
                </strong>
                <br />
                Disponible:{" "}
                <strong>
                  {(
                    100 - preguntas.reduce((sum, p) => sum + p.puntaje, 0)
                  ).toFixed(1)}{" "}
                  puntos
                </strong>
              </p>
            </div>

            {/* Área de carga de archivos */}
            {!importResult && (
              <div className="mb-6">
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                      ? "border-blue-400 bg-blue-50"
                      : selectedFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    {selectedFile ? (
                      <div className="flex items-center justify-center">
                        <FileText className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {(selectedFile.size / 1024).toFixed(1)} KB - Listo
                            para importar
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer"
                          >
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Arrastra tu archivo JSON aquí o{" "}
                              <span className="text-blue-600 hover:text-blue-500">
                                haz clic para seleccionar
                              </span>
                            </span>
                          </label>
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".json"
                            className="sr-only"
                            onChange={handleFileInput}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Solo archivos JSON hasta 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progreso de importación */}
            {isImporting && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Importando preguntas...</span>
                  <span>
                    {progress.current} / {progress.total} ({progress.percentage}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Resultados de importación */}
            {importResult && (
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  {importResult.success > 0 ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                  )}
                  <h4 className="text-lg font-medium text-gray-900">
                    Resultados de Importación
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.success}
                    </div>
                    <div className="text-sm text-green-700">Exitosas</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.errors.length}
                    </div>
                    <div className="text-sm text-red-700">Errores</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResult.total}
                    </div>
                    <div className="text-sm text-blue-700">Total</div>
                  </div>
                </div>

                {/* Lista de errores */}
                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-red-900 mb-2">
                      Errores encontrados:
                    </h5>
                    <div className="max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          <strong>Fila {error.index}:</strong> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {!importResult ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary sm:ml-3"
                  onClick={processImport}
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? "Importando..." : "Importar Preguntas"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0"
                  onClick={handleClose}
                  disabled={isImporting}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary sm:ml-3"
                  onClick={resetModal}
                >
                  Nueva Importación
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mt-3 sm:mt-0"
                  onClick={handleClose}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPreguntasModal;
