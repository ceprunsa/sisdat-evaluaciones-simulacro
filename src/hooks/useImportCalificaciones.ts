"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import type {
  Postulante,
  Calificacion,
  Alternativa,
  MatrizCurso,
  RetroalimentacionCurso,
} from "../types";
import toast from "react-hot-toast";
import Decimal from "decimal.js";

interface PostulanteImport {
  dni: string;
  apellidos: string;
  nombres: string;
  carreraPostulacion: string;
  especialidad?: string;
  correoCeprunsa: string;
}

interface CalificacionImport {
  postulante: PostulanteImport;
  respuestas: Alternativa[];
  fechaExamen: string;
}

interface ImportCalificacionesParams {
  examenId: string;
  calificaciones: CalificacionImport[];
  onProgress?: (progress: {
    current: number;
    total: number;
    message: string;
  }) => void;
}

interface ImportResult {
  success: boolean;
  calificacionesCreadas: number;
  postulantesCreados: number;
  postulantesActualizados: number;
  errores: string[];
}

// Constantes para optimización
const BATCH_SIZE = 450; // Límite seguro para batch writes (500 - margen de seguridad)
const CHUNK_SIZE = 50; // Procesar en chunks para evitar timeouts

// NOTA: Se usa Decimal.js para cálculos precisos de calificaciones
// Esto evita errores de punto flotante en JavaScript
// Ejemplo: 0.1 + 0.2 = 0.30000000000000004 (JavaScript nativo)
//          new Decimal(0.1).plus(0.2) = 0.3 (con Decimal.js)

export const useImportCalificaciones = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const importCalificacionesInternal = async ({
    examenId,
    calificaciones,
    onProgress,
  }: ImportCalificacionesParams): Promise<ImportResult> => {
    if (!user?.email) {
      throw new Error("Usuario no autenticado");
    }

    const result: ImportResult = {
      success: false,
      calificacionesCreadas: 0,
      postulantesCreados: 0,
      postulantesActualizados: 0,
      errores: [],
    };

    try {
      onProgress?.({
        current: 0,
        total: calificaciones.length,
        message: "Validando examen...",
      });

      // Validar que el examen existe y tiene 80 preguntas
      const examenDoc = await getDoc(doc(db, "examenes", examenId));
      if (!examenDoc.exists()) {
        throw new Error("Examen no encontrado");
      }

      const examenData = examenDoc.data();
      if (!examenData.preguntas || examenData.preguntas.length !== 80) {
        throw new Error("El examen debe tener exactamente 80 preguntas");
      }

      onProgress?.({
        current: 0,
        total: calificaciones.length,
        message: "Cargando preguntas del examen...",
      });

      // Obtener preguntas del examen para cálculos
      const preguntasPromises = examenData.preguntas.map(
        async (preguntaId: string) => {
          const preguntaDoc = await getDoc(doc(db, "preguntas", preguntaId));
          return preguntaDoc.exists()
            ? { id: preguntaDoc.id, ...preguntaDoc.data() }
            : null;
        }
      );
      const preguntas = (await Promise.all(preguntasPromises)).filter(Boolean);

      if (preguntas.length !== 80) {
        throw new Error("No se pudieron cargar todas las preguntas del examen");
      }

      onProgress?.({
        current: 0,
        total: calificaciones.length,
        message: "Validando datos...",
      });

      // Validar calificaciones en chunks para evitar bloqueo de UI
      const errores: string[] = [];
      for (let i = 0; i < calificaciones.length; i += CHUNK_SIZE) {
        const chunk = calificaciones.slice(i, i + CHUNK_SIZE);
        chunk.forEach((cal, chunkIndex) => {
          const fila = i + chunkIndex + 1;
          const validationErrors = validateCalificacion(cal, fila);
          errores.push(...validationErrors);
        });

        onProgress?.({
          current: Math.min(i + CHUNK_SIZE, calificaciones.length),
          total: calificaciones.length,
          message: `Validando datos... (${Math.min(
            i + CHUNK_SIZE,
            calificaciones.length
          )}/${calificaciones.length})`,
        });

        // Pequeña pausa para no bloquear la UI
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      if (errores.length > 0) {
        result.errores = errores;
        throw new Error(`Errores de validación encontrados: ${errores.length}`);
      }

      onProgress?.({
        current: 0,
        total: calificaciones.length,
        message: "Optimizando consultas de postulantes...",
      });

      // Optimizar consultas de postulantes - buscar todos los DNIs de una vez
      const dnis = [
        ...new Set(calificaciones.map((cal) => cal.postulante.dni)),
      ];
      const postulantesExistentes = new Map<string, any>();

      // Consultar postulantes en lotes para evitar límites de Firestore
      for (let i = 0; i < dnis.length; i += 10) {
        const dniChunk = dnis.slice(i, i + 10);
        const postulantesQuery = query(
          collection(db, "postulantes"),
          where("dni", "in", dniChunk)
        );
        const snapshot = await getDocs(postulantesQuery);

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          postulantesExistentes.set(data.dni, { id: doc.id, ...data });
        });

        onProgress?.({
          current: Math.min(i + 10, dnis.length),
          total: dnis.length,
          message: `Consultando postulantes existentes... (${Math.min(
            i + 10,
            dnis.length
          )}/${dnis.length})`,
        });
      }

      onProgress?.({
        current: 0,
        total: calificaciones.length,
        message: "Procesando importación...",
      });

      // Procesar en chunks y múltiples batches
      let totalProcessed = 0;
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationsInBatch = 0;

      for (let i = 0; i < calificaciones.length; i += CHUNK_SIZE) {
        const chunk = calificaciones.slice(i, i + CHUNK_SIZE);

        for (const calData of chunk) {
          try {
            // Si el batch está lleno, guardarlo y crear uno nuevo
            if (operationsInBatch >= BATCH_SIZE) {
              batches.push(currentBatch);
              currentBatch = writeBatch(db);
              operationsInBatch = 0;
            }

            const postulanteExistente = postulantesExistentes.get(
              calData.postulante.dni
            );
            let postulanteId: string;

            if (!postulanteExistente) {
              // Crear nuevo postulante
              const nuevoPostulanteRef = doc(collection(db, "postulantes"));
              postulanteId = nuevoPostulanteRef.id;

              const postulanteData: Omit<Postulante, "id"> = {
                dni: calData.postulante.dni,
                apellidos: calData.postulante.apellidos.trim(),
                nombres: calData.postulante.nombres.trim(),
                carreraPostulacion:
                  calData.postulante.carreraPostulacion.trim(),
                especialidad: calData.postulante.especialidad?.trim() || "",
                correoCeprunsa: calData.postulante.correoCeprunsa.trim(),
                createdAt: new Date().toISOString(),
                createdBy: user.email,
              };

              currentBatch.set(nuevoPostulanteRef, postulanteData);
              operationsInBatch++;
              result.postulantesCreados++;

              // Actualizar cache local para evitar duplicados en el mismo lote
              postulantesExistentes.set(calData.postulante.dni, {
                id: postulanteId,
                ...postulanteData,
              });
            } else {
              // Actualizar postulante existente
              postulanteId = postulanteExistente.id;

              const datosActualizados = {
                apellidos: calData.postulante.apellidos.trim(),
                nombres: calData.postulante.nombres.trim(),
                carreraPostulacion:
                  calData.postulante.carreraPostulacion.trim(),
                especialidad: calData.postulante.especialidad?.trim() || "",
                correoCeprunsa: calData.postulante.correoCeprunsa.trim(),
              };

              currentBatch.update(
                doc(db, "postulantes", postulanteId),
                datosActualizados
              );
              operationsInBatch++;
              result.postulantesActualizados++;
            }

            // Calcular calificación final con precisión decimal
            const calificacionFinal = calData.respuestas.reduce(
              (total, respuesta, index) => {
                const puntajePregunta = preguntas[index]?.puntaje || 0;
                const esCorrecta =
                  respuesta === preguntas[index]?.alternativaCorrecta;
                const puntajeObtenido = esCorrecta ? puntajePregunta : 0;

                return new Decimal(total)
                  .plus(new Decimal(puntajeObtenido))
                  .toNumber();
              },
              0
            );

            // Calcular preguntas acertadas
            const preguntasAcertadas = calData.respuestas.reduce(
              (total, respuesta, index) => {
                const esCorrecta =
                  respuesta === preguntas[index]?.alternativaCorrecta;
                return total + (esCorrecta ? 1 : 0);
              },
              0
            );

            // Calcular matriz por curso y retroalimentación
            const { matrizPorCurso, retroalimentacion } =
              calcularMatrizYRetroalimentacion(calData.respuestas, preguntas);

            // Crear calificación
            const nuevaCalificacionRef = doc(collection(db, "calificaciones"));
            const calificacionCompleta: Omit<Calificacion, "id"> = {
              postulanteId,
              examenSimulacroId: examenId,
              respuestas: calData.respuestas,
              preguntasAcertadas, // ✅ Nuevo campo agregado
              calificacionFinal,
              matrizPorCurso,
              retroalimentacion,
              fechaExamen: new Date(calData.fechaExamen).toISOString(),
              createdAt: new Date().toISOString(),
              createdBy: user.email,
            };

            currentBatch.set(nuevaCalificacionRef, calificacionCompleta);
            operationsInBatch++;
            result.calificacionesCreadas++;

            totalProcessed++;

            // Actualizar progreso cada 10 registros
            if (totalProcessed % 10 === 0) {
              onProgress?.({
                current: totalProcessed,
                total: calificaciones.length,
                message: `Procesando... (${totalProcessed}/${calificaciones.length})`,
              });
            }
          } catch (error) {
            const errorMsg = `Error procesando calificación para DNI ${
              calData.postulante.dni
            }: ${error instanceof Error ? error.message : "Error desconocido"}`;
            result.errores.push(errorMsg);
            console.error(errorMsg, error);
          }
        }

        // Pequeña pausa entre chunks
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Agregar el último batch si tiene operaciones
      if (operationsInBatch > 0) {
        batches.push(currentBatch);
      }

      onProgress?.({
        current: totalProcessed,
        total: calificaciones.length,
        message: "Ejecutando operaciones...",
      });

      // Ejecutar todos los batches
      const batchPromises = batches.map(async (batch, index) => {
        try {
          await batch.commit();
          onProgress?.({
            current: totalProcessed,
            total: calificaciones.length,
            message: `Ejecutando lote ${index + 1}/${batches.length}...`,
          });
        } catch (error) {
          const errorMsg = `Error ejecutando lote ${index + 1}: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`;
          result.errores.push(errorMsg);
          throw error;
        }
      });

      await Promise.all(batchPromises);

      result.success = true;

      // Mensaje de éxito detallado
      const successMessage = [
        `✅ Importación completada exitosamente:`,
        `📊 ${result.calificacionesCreadas} calificaciones creadas`,
        `👤 ${result.postulantesCreados} postulantes nuevos`,
        `🔄 ${result.postulantesActualizados} postulantes actualizados`,
      ].join("\n");

      toast.success(successMessage, { duration: 6000 });

      return result;
    } catch (error) {
      console.error("Error en importación masiva:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido en la importación";

      if (result.errores.length > 0) {
        toast.error(
          `${errorMessage}\n\nPrimeros errores:\n${result.errores
            .slice(0, 3)
            .join("\n")}`,
          {
            duration: 8000,
          }
        );
      } else {
        toast.error(errorMessage);
      }

      throw error;
    }
  };

  const importMutation = useMutation({
    mutationFn: importCalificacionesInternal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calificaciones"] });
      queryClient.invalidateQueries({ queryKey: ["postulantes"] });
    },
    onError: (error) => {
      console.error("Error en importación:", error);
    },
  });

  return {
    importCalificaciones: importMutation.mutateAsync, // Cambio clave: mutateAsync en lugar de mutate
    isImporting: importMutation.isPending,
  };
};

// Función de validación optimizada
const validateCalificacion = (
  cal: CalificacionImport,
  fila: number
): string[] => {
  const errores: string[] = [];

  // Validar postulante
  if (!cal.postulante?.dni) {
    errores.push(`Fila ${fila}: DNI del postulante es requerido`);
  } else if (!/^\d{8,10}$/.test(cal.postulante.dni)) {
    errores.push(`Fila ${fila}: DNI debe tener entre 8 y 10 dígitos`);
  }

  if (!cal.postulante?.apellidos?.trim()) {
    errores.push(`Fila ${fila}: Apellidos del postulante son requeridos`);
  }

  if (!cal.postulante?.nombres?.trim()) {
    errores.push(`Fila ${fila}: Nombres del postulante son requeridos`);
  }

  if (!cal.postulante?.carreraPostulacion?.trim()) {
    errores.push(`Fila ${fila}: Carrera de postulación es requerida`);
  }

  if (!cal.postulante?.correoCeprunsa?.trim()) {
    errores.push(`Fila ${fila}: Correo CEPRUNSA es requerido`);
  } else if (!cal.postulante.correoCeprunsa.endsWith("@cepr.unsa.pe")) {
    errores.push(`Fila ${fila}: Correo debe terminar en @cepr.unsa.pe`);
  }

  // Validar respuestas
  if (!Array.isArray(cal.respuestas)) {
    errores.push(`Fila ${fila}: Respuestas debe ser un array`);
  } else if (cal.respuestas.length !== 80) {
    errores.push(`Fila ${fila}: Debe tener exactamente 80 respuestas`);
  } else {
    cal.respuestas.forEach((resp, respIndex) => {
      if (!["A", "B", "C", "D", "E"].includes(resp)) {
        errores.push(
          `Fila ${fila}, Respuesta ${respIndex + 1}: Debe ser A, B, C, D o E`
        );
      }
    });
  }

  // Validar fecha
  if (!cal.fechaExamen) {
    errores.push(`Fila ${fila}: Fecha del examen es requerida`);
  } else if (isNaN(Date.parse(cal.fechaExamen))) {
    errores.push(`Fila ${fila}: Fecha del examen no es válida`);
  }

  return errores;
};

// Función auxiliar para calcular matriz y retroalimentación (con precisión decimal)
const calcularMatrizYRetroalimentacion = (
  respuestas: Alternativa[],
  preguntas: any[]
) => {
  const matrizPorCurso: MatrizCurso[] = [];
  const retroalimentacion: RetroalimentacionCurso[] = [];

  // Agrupar por curso de manera eficiente
  const cursoMap = new Map<string, any[]>();
  preguntas.forEach((pregunta) => {
    if (!cursoMap.has(pregunta.curso)) {
      cursoMap.set(pregunta.curso, []);
    }
    cursoMap.get(pregunta.curso)!.push(pregunta);
  });

  cursoMap.forEach((preguntasCurso, curso) => {
    let correctas = 0;
    let puntajeObtenidoDecimal = new Decimal(0);
    let puntajeMaximoDecimal = new Decimal(0);
    const competenciasCumplidas = new Set<string>();
    const competenciasNoCumplidas = new Set<string>();

    preguntasCurso.forEach((pregunta) => {
      const preguntaIndex = preguntas.findIndex((p) => p.id === pregunta.id);
      const esCorrecta =
        respuestas[preguntaIndex] === pregunta.alternativaCorrecta;
      const puntajePregunta = new Decimal(pregunta.puntaje || 0);

      // Sumar al puntaje máximo con precisión decimal
      puntajeMaximoDecimal = puntajeMaximoDecimal.plus(puntajePregunta);

      if (esCorrecta) {
        correctas++;
        // Sumar al puntaje obtenido con precisión decimal
        puntajeObtenidoDecimal = puntajeObtenidoDecimal.plus(puntajePregunta);

        if (pregunta.mensajeComplida) {
          competenciasCumplidas.add(pregunta.mensajeComplida);
        }
      } else {
        if (pregunta.mensajeNoComplida) {
          competenciasNoCumplidas.add(pregunta.mensajeNoComplida);
        }
      }
    });

    matrizPorCurso.push({
      curso,
      correctas,
      incorrectas: preguntasCurso.length - correctas,
      total: preguntasCurso.length,
      puntajeObtenido: puntajeObtenidoDecimal.toNumber(), // Convertir a number para almacenar
      puntajeMaximo: puntajeMaximoDecimal.toNumber(), // Convertir a number para almacenar
    });

    retroalimentacion.push({
      curso,
      competenciasCumplidas: Array.from(competenciasCumplidas),
      competenciasNoCumplidas: Array.from(competenciasNoCumplidas),
    });
  });

  return { matrizPorCurso, retroalimentacion };
};
