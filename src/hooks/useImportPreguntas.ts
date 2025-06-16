"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  writeBatch,
  collection,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";
import type { Pregunta, PreguntaEnExamen } from "../types";
import toast from "react-hot-toast";
import Decimal from "decimal.js";

interface ImportResult {
  exitosos: number;
  errores: number;
  total: number;
  detalles: Array<{ fila: number; error: string }>;
}

export const useImportPreguntas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult | null>(null);

  const validatePregunta = (
    pregunta: any,
    _index: number
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    const cursosValidos = [
      "Biología",
      "Cívica",
      "Filosofía",
      "Física",
      "Geografía",
      "Historia",
      "Inglés - Lectura",
      "Inglés - Gramática",
      "Lenguaje",
      "Literatura",
      "Matemática - Aritmética",
      "Matemática - Algebra",
      "Matemática - Geometría",
      "Matemática - Trigonometría",
      "Psicología",
      "Química",
      "Razonamiento Lógico",
      "Razonamiento Matemático",
      "Comprensión Lectora",
      "Razonamiento Verbal",
    ];

    // Validaciones requeridas
    if (!pregunta.curso || !cursosValidos.includes(pregunta.curso)) {
      errors.push(`Campo 'curso' debe ser uno de: ${cursosValidos.join(", ")}`);
    }
    if (!pregunta.tema || typeof pregunta.tema !== "string") {
      errors.push("Campo 'tema' es requerido y debe ser texto");
    }
    if (
      !pregunta.area ||
      !["Biomédicas", "Ingenierías", "Sociales"].includes(pregunta.area)
    ) {
      errors.push(
        "Campo 'area' debe ser: 'Biomédicas', 'Ingenierías' o 'Sociales'"
      );
    }
    if (
      !pregunta.nivelCognitivo ||
      typeof pregunta.nivelCognitivo !== "string"
    ) {
      errors.push("Campo 'nivelCognitivo' es requerido y debe ser texto");
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

    // Validación de puntaje con Decimal
    if (
      typeof pregunta.puntaje !== "number" ||
      new Decimal(pregunta.puntaje).lessThanOrEqualTo(0)
    ) {
      errors.push("Campo 'puntaje' debe ser un número mayor a 0");
    }

    // Validación de alternativa correcta
    if (
      !pregunta.alternativaCorrecta ||
      !["A", "B", "C", "D", "E"].includes(pregunta.alternativaCorrecta)
    ) {
      errors.push(
        "Campo 'alternativaCorrecta' debe ser: 'A', 'B', 'C', 'D' o 'E'"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateTotalPuntajes = (
    preguntasNuevas: any[],
    preguntasExistentes: Pregunta[]
  ): boolean => {
    const totalNuevasDecimal = preguntasNuevas.reduce(
      (totalDecimal, pregunta) => {
        const puntajePregunta = new Decimal(pregunta.puntaje || 0);
        return totalDecimal.plus(puntajePregunta);
      },
      new Decimal(0)
    );

    const totalExistentesDecimal = preguntasExistentes.reduce(
      (totalDecimal, pregunta) => {
        const puntajePregunta = new Decimal(pregunta.puntaje || 0);
        return totalDecimal.plus(puntajePregunta);
      },
      new Decimal(0)
    );

    const totalCombinado = totalNuevasDecimal.plus(totalExistentesDecimal);
    console.log(totalCombinado.toNumber());
    return totalCombinado.lessThanOrEqualTo(new Decimal(100));
  };

  const validateAreaConsistencia = (
    preguntasNuevas: any[],
    areaExamen: string
  ): boolean => {
    return preguntasNuevas.every((pregunta) => pregunta.area === areaExamen);
  };

  const importPreguntasToExamen = async (
    preguntasData: any[],
    examenId: string,
    areaExamen: string,
    preguntasExistentes: Pregunta[]
  ): Promise<void> => {
    setIsImporting(true);
    setProgress(0);
    setResults(null);

    const result: ImportResult = {
      exitosos: 0,
      errores: 0,
      total: preguntasData.length,
      detalles: [],
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
          result.errores++;
          result.detalles.push({
            fila: index + 1,
            error: validation.errors.join(", "),
          });
        }
      });

      // Validar consistencia de área
      if (!validateAreaConsistencia(preguntasValidas, areaExamen)) {
        throw new Error(
          `Todas las preguntas deben pertenecer al área "${areaExamen}" del examen`
        );
      }

      // Validar total de puntajes con Decimal
      if (!validateTotalPuntajes(preguntasValidas, preguntasExistentes)) {
        const totalNuevasDecimal = preguntasValidas.reduce(
          (totalDecimal, pregunta) => {
            const puntajePregunta = new Decimal(pregunta.puntaje || 0);
            return totalDecimal.plus(puntajePregunta);
          },
          new Decimal(0)
        );

        const totalExistentesDecimal = preguntasExistentes.reduce(
          (totalDecimal, pregunta) => {
            const puntajePregunta = new Decimal(pregunta.puntaje || 0);
            return totalDecimal.plus(puntajePregunta);
          },
          new Decimal(0)
        );

        const totalCombinadoDecimal = totalNuevasDecimal.plus(
          totalExistentesDecimal
        );

        throw new Error(
          `El total de puntajes excedería 100. Existentes: ${totalExistentesDecimal.toFixed(
            2
          )}, Nuevas: ${totalNuevasDecimal.toFixed(
            2
          )}, Total: ${totalCombinadoDecimal.toFixed(2)}`
        );
      }

      // Validar que no exceda 80 preguntas
      const totalPreguntas =
        preguntasExistentes.length + preguntasValidas.length;
      if (totalPreguntas > 80) {
        throw new Error(
          `El examen no puede tener más de 80 preguntas. Existentes: ${preguntasExistentes.length}, Nuevas: ${preguntasValidas.length}, Total: ${totalPreguntas}`
        );
      }

      // Crear las preguntas con IDs únicos y agregarlas tanto al examen como a la colección general
      const preguntasParaAgregar: Pregunta[] = [];
      const preguntasOrdenadas: PreguntaEnExamen[] = [];

      // Crear batch para la colección de preguntas
      const batch = writeBatch(db);

      preguntasValidas.forEach((pregunta, index) => {
        const preguntaId = `${examenId}_pregunta_${Date.now()}_${index}`;
        const numeroOrden = preguntasExistentes.length + index + 1;

        const nuevaPregunta: Pregunta = {
          id: preguntaId,
          curso: pregunta.curso,
          tema: pregunta.tema,
          area: pregunta.area,
          nivelCognitivo: pregunta.nivelCognitivo,
          puntaje: pregunta.puntaje, // Mantener el valor original sin redondeo
          competencia: pregunta.competencia,
          mensajeComplida: pregunta.mensajeComplida,
          mensajeNoComplida: pregunta.mensajeNoComplida,
          alternativaCorrecta: pregunta.alternativaCorrecta,
          createdAt: new Date().toISOString(),
          createdBy: user?.email || "system",
        };

        preguntasParaAgregar.push(nuevaPregunta);
        preguntasOrdenadas.push({
          preguntaId: preguntaId,
          numero: numeroOrden,
        });

        // Agregar a la colección general de preguntas
        const preguntaRef = doc(collection(db, "preguntas"), preguntaId);
        batch.set(preguntaRef, nuevaPregunta);

        // Actualizar progreso
        const progressPercentage = Math.round(
          ((index + 1) / preguntasValidas.length) * 100
        );
        setProgress(progressPercentage);
      });

      // Ejecutar batch para crear preguntas en la colección general
      await batch.commit();

      // Actualizar el documento del examen
      const examenRef = doc(db, "examenes", examenId);

      // Calcular nueva matriz de conformación
      const matrizPorCurso: Record<string, number> = {};

      // Contar preguntas existentes
      preguntasExistentes.forEach((pregunta) => {
        matrizPorCurso[pregunta.curso] =
          (matrizPorCurso[pregunta.curso] || 0) + 1;
      });

      // Contar preguntas nuevas
      preguntasParaAgregar.forEach((pregunta) => {
        matrizPorCurso[pregunta.curso] =
          (matrizPorCurso[pregunta.curso] || 0) + 1;
      });

      const nuevaMatriz = Object.entries(matrizPorCurso).map(
        ([curso, cantidad]) => ({
          curso,
          cantidad,
        })
      );

      // Obtener preguntas ordenadas existentes
      const preguntasOrdenadaExistentes = preguntasExistentes.map(
        (pregunta, index) => ({
          preguntaId: pregunta.id,
          numero: index + 1,
        })
      );

      const todasLasPreguntasOrdenadas = [
        ...preguntasOrdenadaExistentes,
        ...preguntasOrdenadas,
      ];
      const todosLosIds = [
        ...preguntasExistentes.map((p) => p.id),
        ...preguntasParaAgregar.map((p) => p.id),
      ];

      await updateDoc(examenRef, {
        preguntasData: arrayUnion(...preguntasParaAgregar),
        preguntasOrdenadas: todasLasPreguntasOrdenadas,
        preguntas: todosLosIds,
        matrizConformacion: nuevaMatriz,
        estado:
          todasLasPreguntasOrdenadas.length === 80 ? "listo" : "construccion",
      });

      result.exitosos = preguntasValidas.length;

      // Invalidar cache para refrescar las listas
      queryClient.invalidateQueries({ queryKey: ["examenes"] });
      queryClient.invalidateQueries({ queryKey: ["examen", examenId] });
      queryClient.invalidateQueries({ queryKey: ["preguntas"] });

      // Calcular total final para el mensaje
      const totalFinalDecimal = preguntasExistentes
        .reduce((totalDecimal, pregunta) => {
          return totalDecimal.plus(new Decimal(pregunta.puntaje || 0));
        }, new Decimal(0))
        .plus(
          preguntasParaAgregar.reduce((totalDecimal, pregunta) => {
            return totalDecimal.plus(new Decimal(pregunta.puntaje || 0));
          }, new Decimal(0))
        );

      toast.success(
        `Importación completada: ${
          result.exitosos
        } preguntas agregadas al examen y al banco de preguntas. Total de puntajes: ${totalFinalDecimal.toFixed(
          2
        )}/100.00${result.errores > 0 ? `, ${result.errores} errores` : ""}`
      );
    } catch (error) {
      console.error("Error en importación:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido en la importación";
      toast.error(errorMessage);
      result.detalles.push({
        fila: 0,
        error: errorMessage,
      });
      result.errores++;
    } finally {
      setIsImporting(false);
      setResults(result);
    }
  };

  const importPreguntasToBanco = async (
    preguntasData: any[]
  ): Promise<void> => {
    setIsImporting(true);
    setProgress(0);
    setResults(null);

    const result: ImportResult = {
      exitosos: 0,
      errores: 0,
      total: preguntasData.length,
      detalles: [],
    };

    try {
      // Validar formato del array
      if (!Array.isArray(preguntasData)) {
        throw new Error("El archivo debe contener un array de preguntas");
      }

      if (preguntasData.length === 0) {
        throw new Error("El archivo no contiene preguntas");
      }

      // Validar cada pregunta (sin restricciones de área, puntaje o cantidad)
      const preguntasValidas: any[] = [];
      preguntasData.forEach((pregunta, index) => {
        const validation = validatePregunta(pregunta, index);
        if (validation.isValid) {
          preguntasValidas.push(pregunta);
        } else {
          result.errores++;
          result.detalles.push({
            fila: index + 1,
            error: validation.errors.join(", "),
          });
        }
      });

      // Crear batch para la colección de preguntas
      const batch = writeBatch(db);

      preguntasValidas.forEach((pregunta, index) => {
        const preguntaId = `banco_pregunta_${Date.now()}_${index}`;

        const nuevaPregunta: Pregunta = {
          id: preguntaId,
          curso: pregunta.curso,
          tema: pregunta.tema,
          area: pregunta.area,
          nivelCognitivo: pregunta.nivelCognitivo,
          puntaje: pregunta.puntaje,
          competencia: pregunta.competencia,
          mensajeComplida: pregunta.mensajeComplida,
          mensajeNoComplida: pregunta.mensajeNoComplida,
          alternativaCorrecta: pregunta.alternativaCorrecta,
          createdAt: new Date().toISOString(),
          createdBy: user?.email || "system",
        };

        // Agregar a la colección general de preguntas
        const preguntaRef = doc(collection(db, "preguntas"), preguntaId);
        batch.set(preguntaRef, nuevaPregunta);

        // Actualizar progreso
        const progressPercentage = Math.round(
          ((index + 1) / preguntasValidas.length) * 100
        );
        setProgress(progressPercentage);
      });

      // Ejecutar batch para crear preguntas en la colección general
      await batch.commit();

      result.exitosos = preguntasValidas.length;

      // Invalidar cache para refrescar la lista de preguntas
      queryClient.invalidateQueries({ queryKey: ["preguntas"] });

      // Calcular total de puntajes para el mensaje
      const totalPuntajesDecimal = preguntasValidas.reduce(
        (totalDecimal, pregunta) => {
          return totalDecimal.plus(new Decimal(pregunta.puntaje || 0));
        },
        new Decimal(0)
      );

      toast.success(
        `Importación completada: ${
          result.exitosos
        } preguntas agregadas al banco de preguntas. Total de puntajes: ${totalPuntajesDecimal.toFixed(
          2
        )}${result.errores > 0 ? `, ${result.errores} errores` : ""}`
      );
    } catch (error) {
      console.error("Error en importación:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido en la importación";
      toast.error(errorMessage);
      result.detalles.push({
        fila: 0,
        error: errorMessage,
      });
      result.errores++;
    } finally {
      setIsImporting(false);
      setResults(result);
    }
  };

  const resetResults = () => {
    setResults(null);
    setProgress(0);
  };

  return {
    importPreguntasToExamen,
    importPreguntasToBanco,
    isImporting,
    progress,
    results,
    resetResults,
  };
};
