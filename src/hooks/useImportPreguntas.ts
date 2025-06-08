"use client";

import { useState } from "react";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";
import type { Pregunta } from "../types";
import toast from "react-hot-toast";

interface ImportResult {
  success: number;
  errors: Array<{ index: number; error: string; data?: any }>;
  total: number;
}

interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
}

export const useImportPreguntas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
  });

  const validatePregunta = (
    pregunta: any,
    _index: number
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validaciones requeridas
    if (!pregunta.curso || typeof pregunta.curso !== "string") {
      errors.push("Campo 'curso' es requerido y debe ser texto");
    }
    if (!pregunta.tema || typeof pregunta.tema !== "string") {
      errors.push("Campo 'tema' es requerido y debe ser texto");
    }
    if (!pregunta.subtema || typeof pregunta.subtema !== "string") {
      errors.push("Campo 'subtema' es requerido y debe ser texto");
    }
    if (
      !pregunta.area ||
      !["Biomédicas", "Ingenierías", "Sociales"].includes(pregunta.area)
    ) {
      errors.push(
        "Campo 'area' debe ser: 'Biomédicas', 'Ingenierías' o 'Sociales'"
      );
    }
    if (!pregunta.competencia || typeof pregunta.competencia !== "string") {
      errors.push("Campo 'competencia' es requerido y debe ser texto");
    }
    if (
      !pregunta.mensajeComplida ||
      typeof pregunta.mensajeComplida !== "string"
    ) {
      errors.push("Campo 'mensajeComplida' es requerido y debe ser texto");
    }
    if (
      !pregunta.mensajeNoComplida ||
      typeof pregunta.mensajeNoComplida !== "string"
    ) {
      errors.push("Campo 'mensajeNoComplida' es requerido y debe ser texto");
    }

    // Validación de puntaje
    if (typeof pregunta.puntaje !== "number" || pregunta.puntaje <= 0) {
      errors.push("Campo 'puntaje' debe ser un número mayor a 0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateTotalPuntajes = (
    preguntas: any[],
    preguntasExistentes: Pregunta[]
  ): boolean => {
    const totalNuevas = preguntas.reduce((sum, p) => sum + (p.puntaje || 0), 0);
    const totalExistentes = preguntasExistentes.reduce(
      (sum, p) => sum + p.puntaje,
      0
    );
    return totalNuevas + totalExistentes <= 100;
  };

  const importPreguntas = async (
    preguntasData: any[],
    preguntasExistentes: Pregunta[]
  ): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress({ current: 0, total: preguntasData.length, percentage: 0 });

    const result: ImportResult = {
      success: 0,
      errors: [],
      total: preguntasData.length,
    };

    try {
      // Validar formato del array
      if (!Array.isArray(preguntasData)) {
        throw new Error("El archivo debe contener un array de preguntas");
      }

      if (preguntasData.length === 0) {
        throw new Error("El archivo no contiene preguntas");
      }

      // Validar cada pregunta
      const preguntasValidas: any[] = [];
      preguntasData.forEach((pregunta, index) => {
        const validation = validatePregunta(pregunta, index);
        if (validation.isValid) {
          preguntasValidas.push(pregunta);
        } else {
          result.errors.push({
            index: index + 1,
            error: validation.errors.join(", "),
            data: pregunta,
          });
        }
      });

      // Validar total de puntajes
      if (!validateTotalPuntajes(preguntasValidas, preguntasExistentes)) {
        const totalNuevas = preguntasValidas.reduce(
          (sum, p) => sum + p.puntaje,
          0
        );
        const totalExistentes = preguntasExistentes.reduce(
          (sum, p) => sum + p.puntaje,
          0
        );
        throw new Error(
          `El total de puntajes excedería 100. Existentes: ${totalExistentes.toFixed(
            1
          )}, Nuevas: ${totalNuevas.toFixed(1)}, Total: ${(
            totalExistentes + totalNuevas
          ).toFixed(1)}`
        );
      }

      // Importar en lotes (Firebase permite máximo 500 operaciones por batch)
      const batchSize = 500;
      const batches = [];

      for (let i = 0; i < preguntasValidas.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchPreguntas = preguntasValidas.slice(i, i + batchSize);

        batchPreguntas.forEach((pregunta) => {
          const docRef = doc(collection(db, "preguntas"));
          batch.set(docRef, {
            curso: pregunta.curso,
            tema: pregunta.tema,
            subtema: pregunta.subtema,
            area: pregunta.area,
            puntaje: pregunta.puntaje,
            competencia: pregunta.competencia,
            mensajeComplida: pregunta.mensajeComplida,
            mensajeNoComplida: pregunta.mensajeNoComplida,
            createdAt: new Date().toISOString(),
            createdBy: user?.email || "system",
          });
        });

        batches.push({ batch, count: batchPreguntas.length });
      }

      // Ejecutar todos los batches
      let processedCount = 0;
      for (const { batch, count } of batches) {
        await batch.commit();
        processedCount += count;
        result.success += count;

        // Actualizar progreso
        setProgress({
          current: processedCount,
          total: preguntasValidas.length,
          percentage: Math.round(
            (processedCount / preguntasValidas.length) * 100
          ),
        });
      }

      // Invalidar cache para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["preguntas"] });

      toast.success(
        `Importación completada: ${result.success} preguntas importadas${
          result.errors.length > 0 ? `, ${result.errors.length} errores` : ""
        }`
      );
    } catch (error) {
      console.error("Error en importación:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido en la importación";
      toast.error(errorMessage);
      result.errors.push({
        index: 0,
        error: errorMessage,
      });
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }

    return result;
  };

  return {
    importPreguntas,
    isImporting,
    progress,
  };
};
