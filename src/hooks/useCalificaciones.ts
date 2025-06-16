"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import type {
  Calificacion,
  CalificacionesHookReturn,
  MatrizCurso,
  RetroalimentacionCurso,
  Alternativa,
} from "../types";
import { useMemo } from "react";
import toast from "react-hot-toast";
import Decimal from "decimal.js";

export const useCalificaciones = (): CalificacionesHookReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const calificacionesQuery = useQuery({
    queryKey: ["calificaciones"],
    queryFn: getCalificaciones,
  });

  const calificacionByIdQuery = (id?: string) => {
    return useQuery({
      queryKey: ["calificaciones", id],
      queryFn: () => getCalificacionById(id),
      enabled: !!id,
    });
  };

  const saveCalificacion = async (
    calificacionData: Partial<Calificacion>
  ): Promise<Partial<Calificacion>> => {
    if (
      !calificacionData.postulanteId ||
      !calificacionData.examenSimulacroId ||
      !calificacionData.respuestas
    ) {
      throw new Error("Postulante, examen y respuestas son requeridos");
    }

    try {
      // Obtener preguntas del examen para calcular calificación
      const examenDoc = await getDoc(
        doc(db, "examenes", calificacionData.examenSimulacroId)
      );
      if (!examenDoc.exists()) {
        throw new Error("Examen no encontrado");
      }

      const examenData = examenDoc.data();
      const preguntasPromises = examenData.preguntas.map(
        async (preguntaId: string) => {
          const preguntaDoc = await getDoc(doc(db, "preguntas", preguntaId));
          return preguntaDoc.exists()
            ? { id: preguntaDoc.id, ...preguntaDoc.data() }
            : null;
        }
      );
      const preguntas = (await Promise.all(preguntasPromises)).filter(Boolean);

      // ✅ Calcular calificación final con Decimal.js para precisión exacta
      let calificacionFinalDecimal = new Decimal(0);
      let preguntasAcertadas = 0;

      calificacionData.respuestas.forEach((respuesta, index) => {
        const pregunta = preguntas[index];
        if (pregunta) {
          const esCorrecta = respuesta === pregunta.alternativaCorrecta;

          if (esCorrecta) {
            preguntasAcertadas++;
            // ✅ Suma precisa con Decimal
            const puntajePregunta = new Decimal(pregunta.puntaje || 0);
            calificacionFinalDecimal =
              calificacionFinalDecimal.plus(puntajePregunta);
          }
        }
      });

      // ✅ Convertir a number para almacenar en Firebase
      const calificacionFinal = calificacionFinalDecimal.toNumber();

      // Calcular matriz por curso y retroalimentación con Decimal
      const { matrizPorCurso, retroalimentacion } =
        calcularMatrizYRetroalimentacion(
          calificacionData.respuestas as Alternativa[],
          preguntas
        );

      const calificacionCompleta = {
        postulanteId: calificacionData.postulanteId,
        examenSimulacroId: calificacionData.examenSimulacroId,
        respuestas: calificacionData.respuestas,
        preguntasAcertadas, // ✅ Cantidad de preguntas correctas
        calificacionFinal, // ✅ Puntaje calculado con precisión decimal
        matrizPorCurso,
        retroalimentacion,
        fechaExamen: calificacionData.fechaExamen || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user?.email || "system",
      };

      // ✅ Log de precisión para debugging
      console.log(`Calificación calculada con precisión:`);
      console.log(`- Preguntas acertadas: ${preguntasAcertadas}`);
      console.log(
        `- Puntaje final (Decimal): ${calificacionFinalDecimal.toString()}`
      );
      console.log(`- Puntaje final (almacenado): ${calificacionFinal}`);

      if (calificacionData.id) {
        // Actualizar calificación existente
        const calificacionRef = doc(db, "calificaciones", calificacionData.id);
        await updateDoc(calificacionRef, calificacionCompleta);
        toast.success("Calificación actualizada exitosamente");
      } else {
        // Crear nueva calificación
        await addDoc(collection(db, "calificaciones"), calificacionCompleta);
        toast.success("Calificación creada exitosamente");
      }

      return calificacionData;
    } catch (error) {
      console.error("Error en saveCalificacion:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar calificación"
      );
      throw error;
    }
  };

  const deleteCalificacion = async (id: string): Promise<string> => {
    try {
      await deleteDoc(doc(db, "calificaciones", id));
      toast.success("Calificación eliminada exitosamente");
      return id;
    } catch (error) {
      console.error("Error al eliminar calificación:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar calificación"
      );
      throw error;
    }
  };

  const exportToExcel = async (
    calificaciones: Calificacion[]
  ): Promise<void> => {
    try {
      // Aquí iría la lógica real de exportación a Excel
      // Por ahora, simularemos la exportación
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Crear datos para exportar
      const dataToExport = calificaciones.map((cal) => ({
        DNI: cal.postulante?.dni,
        Apellidos: cal.postulante?.apellidos,
        Nombres: cal.postulante?.nombres,
        Carrera: cal.postulante?.carreraPostulacion,
        Especialidad: cal.postulante?.especialidad || "",
        Correo: cal.postulante?.correoCeprunsa,
        Examen: cal.examenSimulacro?.nombre,
        Proceso: cal.examenSimulacro?.proceso,
        Área: cal.examenSimulacro?.area,
        "Preguntas Acertadas": cal.preguntasAcertadas, // ✅ Nuevo campo
        "Preguntas Incorrectas": 80 - cal.preguntasAcertadas, // ✅ Calculado
        "Porcentaje Aciertos": `${((cal.preguntasAcertadas / 80) * 100).toFixed(
          1
        )}%`, // ✅ Porcentaje
        "Calificación Final": cal.calificacionFinal,
        "Fecha Examen": new Date(cal.fechaExamen).toLocaleDateString(),
      }));

      console.log("Datos para exportar:", dataToExport);
      toast.success(
        `${calificaciones.length} calificaciones exportadas exitosamente`
      );
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al exportar a Excel"
      );
      throw error;
    }
  };

  const saveMutation = useMutation({
    mutationFn: saveCalificacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calificaciones"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalificacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calificaciones"] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: exportToExcel,
  });

  const calificaciones = useMemo(
    () => calificacionesQuery.data || [],
    [calificacionesQuery.data]
  );

  return {
    calificaciones,
    isLoading: calificacionesQuery.isLoading,
    isError: calificacionesQuery.isError,
    error: calificacionesQuery.error,
    calificacionByIdQuery,
    saveCalificacion: saveMutation.mutate,
    deleteCalificacion: deleteMutation.mutate,
    exportToExcel: exportMutation.mutate,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExporting: exportMutation.isPending,
  };
};

// Obtener todas las calificaciones con datos poblados
const getCalificaciones = async (): Promise<Calificacion[]> => {
  const calificacionesRef = collection(db, "calificaciones");
  const snapshot = await getDocs(calificacionesRef);

  const calificaciones = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

      // Obtener datos del postulante
      let postulante = null;
      if (data.postulanteId) {
        const postulanteDoc = await getDoc(
          doc(db, "postulantes", data.postulanteId)
        );
        if (postulanteDoc.exists()) {
          postulante = { id: postulanteDoc.id, ...postulanteDoc.data() };
        }
      }

      // Obtener datos del examen
      let examenSimulacro = null;
      if (data.examenSimulacroId) {
        const examenDoc = await getDoc(
          doc(db, "examenes", data.examenSimulacroId)
        );
        if (examenDoc.exists()) {
          const examenData = examenDoc.data();

          // Obtener preguntas del examen
          let preguntasData = [];
          if (examenData.preguntas && examenData.preguntas.length > 0) {
            const preguntasPromises = examenData.preguntas.map(
              async (preguntaId: string) => {
                const preguntaDoc = await getDoc(
                  doc(db, "preguntas", preguntaId)
                );
                return preguntaDoc.exists()
                  ? { id: preguntaDoc.id, ...preguntaDoc.data() }
                  : null;
              }
            );
            preguntasData = (await Promise.all(preguntasPromises)).filter(
              Boolean
            );
          }

          examenSimulacro = {
            id: examenDoc.id,
            ...examenData,
            preguntasData,
          };
        }
      }

      return {
        id: docSnap.id,
        ...data,
        postulante,
        examenSimulacro,
      } as Calificacion;
    })
  );

  return calificaciones;
};

// Obtener una calificación por ID
const getCalificacionById = async (
  id?: string
): Promise<Calificacion | null> => {
  if (!id) return null;
  const docRef = doc(db, "calificaciones", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();

    // Obtener datos poblados igual que en getCalificaciones
    let postulante = null;
    if (data.postulanteId) {
      const postulanteDoc = await getDoc(
        doc(db, "postulantes", data.postulanteId)
      );
      if (postulanteDoc.exists()) {
        postulante = { id: postulanteDoc.id, ...postulanteDoc.data() };
      }
    }

    let examenSimulacro = null;
    if (data.examenSimulacroId) {
      const examenDoc = await getDoc(
        doc(db, "examenes", data.examenSimulacroId)
      );
      if (examenDoc.exists()) {
        const examenData = examenDoc.data();

        let preguntasData = [];
        if (examenData.preguntas && examenData.preguntas.length > 0) {
          const preguntasPromises = examenData.preguntas.map(
            async (preguntaId: string) => {
              const preguntaDoc = await getDoc(
                doc(db, "preguntas", preguntaId)
              );
              return preguntaDoc.exists()
                ? { id: preguntaDoc.id, ...preguntaDoc.data() }
                : null;
            }
          );
          preguntasData = (await Promise.all(preguntasPromises)).filter(
            Boolean
          );
        }

        examenSimulacro = {
          id: examenDoc.id,
          ...examenData,
          preguntasData,
        };
      }
    }

    return {
      id: docSnap.id,
      ...data,
      postulante,
      examenSimulacro,
    } as Calificacion;
  }
  return null;
};

const calcularMatrizYRetroalimentacion = (
  respuestas: Alternativa[],
  preguntas: any[]
) => {
  const matrizPorCurso: MatrizCurso[] = [];
  const retroalimentacion: RetroalimentacionCurso[] = [];

  // Agrupar por curso
  const cursos = [...new Set(preguntas.map((p) => p.curso))];

  cursos.forEach((curso) => {
    const preguntasCurso = preguntas.filter((p) => p.curso === curso);
    let correctas = 0;

    let puntajeObtenidoDecimal = new Decimal(0);
    let puntajeMaximoDecimal = new Decimal(0);

    const competenciasCumplidas: string[] = [];
    const competenciasNoCumplidas: string[] = [];

    preguntasCurso.forEach((pregunta, _index) => {
      const preguntaIndex = preguntas.findIndex((p) => p.id === pregunta.id);
      const esCorrecta =
        respuestas[preguntaIndex] === pregunta.alternativaCorrecta;

      const puntajePregunta = new Decimal(pregunta.puntaje || 0);
      puntajeMaximoDecimal = puntajeMaximoDecimal.plus(puntajePregunta);

      if (esCorrecta) {
        correctas++;

        puntajeObtenidoDecimal = puntajeObtenidoDecimal.plus(puntajePregunta);

        if (
          pregunta.mensajeComplida &&
          !competenciasCumplidas.includes(pregunta.mensajeComplida)
        ) {
          competenciasCumplidas.push(pregunta.mensajeComplida);
        }
      } else {
        if (
          pregunta.mensajeNoComplida &&
          !competenciasNoCumplidas.includes(pregunta.mensajeNoComplida)
        ) {
          competenciasNoCumplidas.push(pregunta.mensajeNoComplida);
        }
      }
    });

    matrizPorCurso.push({
      curso,
      correctas,
      incorrectas: preguntasCurso.length - correctas,
      total: preguntasCurso.length,
      puntajeObtenido: puntajeObtenidoDecimal.toNumber(),
      puntajeMaximo: puntajeMaximoDecimal.toNumber(),
    });

    retroalimentacion.push({
      curso,
      competenciasCumplidas,
      competenciasNoCumplidas,
    });
  });

  return { matrizPorCurso, retroalimentacion };
};
