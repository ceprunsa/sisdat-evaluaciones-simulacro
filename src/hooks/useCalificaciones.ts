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
  query,
  where,
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const useCalificaciones = (): CalificacionesHookReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const calificacionesQuery = useQuery({
    queryKey: ["calificaciones"],
    queryFn: getCalificaciones,
  });

  const calificacionesByExamenQuery = (examenId?: string) => {
    return useQuery({
      queryKey: ["calificaciones", "byExamen", examenId],
      queryFn: async (): Promise<Calificacion[]> => {
        if (!examenId) return [];

        const calificacionesRef = collection(db, "calificaciones");
        const calificacionesQuery = query(
          calificacionesRef,
          where("examenSimulacroId", "==", examenId)
        );
        const snapshot = await getDocs(calificacionesQuery);

        const calificaciones = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

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
          })
        );

        return calificaciones.sort(
          (a, b) => b.calificacionFinal - a.calificacionFinal
        );
      },
      enabled: !!examenId,
    });
  };

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

      let calificacionFinalDecimal = new Decimal(0);
      let preguntasAcertadas = 0;

      calificacionData.respuestas.forEach((respuesta, index) => {
        const pregunta = preguntas[index];
        if (pregunta) {
          const esCorrecta = respuesta === pregunta.alternativaCorrecta;

          if (esCorrecta) {
            preguntasAcertadas++;
            const puntajePregunta = new Decimal(pregunta.puntaje || 0);
            calificacionFinalDecimal =
              calificacionFinalDecimal.plus(puntajePregunta);
          }
        }
      });

      const calificacionFinal = calificacionFinalDecimal.toNumber();

      const { matrizPorCurso, retroalimentacion } =
        calcularMatrizYRetroalimentacion(
          calificacionData.respuestas as Alternativa[],
          preguntas
        );

      const calificacionCompleta = {
        postulanteId: calificacionData.postulanteId,
        examenSimulacroId: calificacionData.examenSimulacroId,
        respuestas: calificacionData.respuestas,
        preguntasAcertadas,
        calificacionFinal,
        matrizPorCurso,
        retroalimentacion,
        fechaExamen: calificacionData.fechaExamen || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user?.email || "system",
      };

      console.log(`Calificación calculada con precisión:`);
      console.log(`- Preguntas acertadas: ${preguntasAcertadas}`);
      console.log(
        `- Puntaje final (Decimal): ${calificacionFinalDecimal.toString()}`
      );
      console.log(`- Puntaje final (almacenado): ${calificacionFinal}`);

      if (calificacionData.id) {
        const calificacionRef = doc(db, "calificaciones", calificacionData.id);
        await updateDoc(calificacionRef, calificacionCompleta);
        toast.success("Calificación actualizada exitosamente");
      } else {
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
      if (calificaciones.length === 0) {
        toast.error("No hay calificaciones para exportar");
        return;
      }

      // Obtener todos los cursos únicos de todas las calificaciones
      const todosLosCursos = new Set<string>();
      calificaciones.forEach((cal) => {
        cal.matrizPorCurso?.forEach((matriz) => {
          todosLosCursos.add(matriz.curso);
        });
      });
      const cursosOrdenados = Array.from(todosLosCursos).sort();

      // Preparar datos para la hoja principal
      const datosGenerales = calificaciones.map((cal, index) => {
        const fila: any = {
          "N°": index + 1,
          DNI: cal.postulante?.dni || "",
          Apellidos: cal.postulante?.apellidos || "",
          Nombres: cal.postulante?.nombres || "",
          "Carrera Postulación": cal.postulante?.carreraPostulacion || "",
          Especialidad: cal.postulante?.especialidad || "",
          "Correo CEPRUNSA": cal.postulante?.correoCeprunsa || "",
          Examen: cal.examenSimulacro?.nombre || "",
          Proceso: cal.examenSimulacro?.proceso || "",
          Área: cal.examenSimulacro?.area || "",
          "Preguntas Acertadas": cal.preguntasAcertadas || 0,
          "Preguntas Incorrectas": 80 - (cal.preguntasAcertadas || 0),
          "Porcentaje Aciertos": `${(
            ((cal.preguntasAcertadas || 0) / 80) *
            100
          ).toFixed(1)}%`,
          "Calificación Final": cal.calificacionFinal || 0,
          "Fecha Examen": cal.fechaExamen
            ? new Date(cal.fechaExamen).toLocaleDateString()
            : "",
        };

        // Agregar matriz por curso
        cursosOrdenados.forEach((curso) => {
          const matrizCurso = cal.matrizPorCurso?.find(
            (m) => m.curso === curso
          );
          fila[`${curso} - Correctas`] = matrizCurso?.correctas || 0;
          fila[`${curso} - Incorrectas`] = matrizCurso?.incorrectas || 0;
          fila[`${curso} - Total`] = matrizCurso?.total || 0;
          fila[`${curso} - Puntaje Obtenido`] =
            matrizCurso?.puntajeObtenido || 0;
          fila[`${curso} - Puntaje Máximo`] = matrizCurso?.puntajeMaximo || 0;
          fila[`${curso} - Porcentaje`] = matrizCurso?.total
            ? `${((matrizCurso.correctas / matrizCurso.total) * 100).toFixed(
                1
              )}%`
            : "0%";
        });

        return fila;
      });

      // Preparar datos para la hoja de retroalimentación
      const datosRetroalimentacion: any[] = [];
      calificaciones.forEach((cal, calIndex) => {
        cal.retroalimentacion?.forEach((retro) => {
          // Competencias cumplidas
          retro.competenciasCumplidas.forEach((competencia) => {
            datosRetroalimentacion.push({
              "N° Postulante": calIndex + 1,
              DNI: cal.postulante?.dni || "",
              Apellidos: cal.postulante?.apellidos || "",
              Nombres: cal.postulante?.nombres || "",
              Curso: retro.curso,
              Tipo: "Competencia Cumplida",
              Mensaje: competencia,
            });
          });

          // Competencias no cumplidas
          retro.competenciasNoCumplidas.forEach((competencia) => {
            datosRetroalimentacion.push({
              "N° Postulante": calIndex + 1,
              DNI: cal.postulante?.dni || "",
              Apellidos: cal.postulante?.apellidos || "",
              Nombres: cal.postulante?.nombres || "",
              Curso: retro.curso,
              Tipo: "Competencia No Cumplida",
              Mensaje: competencia,
            });
          });
        });
      });

      // Crear el libro de Excel
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Datos generales y matriz por curso
      const worksheetGeneral = XLSX.utils.json_to_sheet(datosGenerales);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 5 }, // N°
        { wch: 12 }, // DNI
        { wch: 25 }, // Apellidos
        { wch: 25 }, // Nombres
        { wch: 30 }, // Carrera
        { wch: 20 }, // Especialidad
        { wch: 35 }, // Correo
        { wch: 30 }, // Examen
        { wch: 20 }, // Proceso
        { wch: 12 }, // Área
        { wch: 15 }, // Preguntas Acertadas
        { wch: 15 }, // Preguntas Incorrectas
        { wch: 15 }, // Porcentaje Aciertos
        { wch: 15 }, // Calificación Final
        { wch: 12 }, // Fecha Examen
      ];

      // Agregar anchos para columnas de cursos
      cursosOrdenados.forEach(() => {
        colWidths.push(
          { wch: 12 }, // Correctas
          { wch: 12 }, // Incorrectas
          { wch: 10 }, // Total
          { wch: 15 }, // Puntaje Obtenido
          { wch: 15 }, // Puntaje Máximo
          { wch: 12 } // Porcentaje
        );
      });

      worksheetGeneral["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(
        workbook,
        worksheetGeneral,
        "Calificaciones y Matriz"
      );

      // Hoja 2: Retroalimentación
      if (datosRetroalimentacion.length > 0) {
        const worksheetRetro = XLSX.utils.json_to_sheet(datosRetroalimentacion);
        worksheetRetro["!cols"] = [
          { wch: 12 }, // N° Postulante
          { wch: 12 }, // DNI
          { wch: 25 }, // Apellidos
          { wch: 25 }, // Nombres
          { wch: 20 }, // Curso
          { wch: 25 }, // Tipo
          { wch: 60 }, // Mensaje
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          worksheetRetro,
          "Retroalimentación"
        );
      }

      // Hoja 3: Resumen estadístico
      const resumenEstadistico = cursosOrdenados.map((curso) => {
        const datosDelCurso = calificaciones
          .map((cal) => cal.matrizPorCurso?.find((m) => m.curso === curso))
          .filter(Boolean);

        const totalPostulantes = datosDelCurso.length;
        const promedioCorrectas =
          totalPostulantes > 0
            ? datosDelCurso.reduce((sum, m) => sum + (m?.correctas || 0), 0) /
              totalPostulantes
            : 0;
        const promedioPorcentaje =
          totalPostulantes > 0
            ? datosDelCurso.reduce(
                (sum, m) => sum + ((m?.correctas || 0) / (m?.total || 1)) * 100,
                0
              ) / totalPostulantes
            : 0;

        return {
          Curso: curso,
          "Total Postulantes": totalPostulantes,
          "Promedio Correctas": promedioCorrectas.toFixed(2),
          "Promedio Porcentaje": `${promedioPorcentaje.toFixed(1)}%`,
          "Mejor Puntaje": Math.max(
            ...datosDelCurso.map((m) => m?.correctas || 0)
          ),
          "Peor Puntaje": Math.min(
            ...datosDelCurso.map((m) => m?.correctas || 0)
          ),
        };
      });

      const worksheetResumen = XLSX.utils.json_to_sheet(resumenEstadistico);
      worksheetResumen["!cols"] = [
        { wch: 25 }, // Curso
        { wch: 15 }, // Total Postulantes
        { wch: 15 }, // Promedio Correctas
        { wch: 18 }, // Promedio Porcentaje
        { wch: 12 }, // Mejor Puntaje
        { wch: 12 }, // Peor Puntaje
      ];
      XLSX.utils.book_append_sheet(
        workbook,
        worksheetResumen,
        "Resumen por Curso"
      );

      // Generar el archivo
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Generar nombre del archivo
      const examenNombre =
        calificaciones[0]?.examenSimulacro?.nombre || "Examen";
      const proceso = calificaciones[0]?.examenSimulacro?.proceso || "Proceso";
      const fecha = new Date().toISOString().split("T")[0];
      const nombreArchivo = `Calificaciones_${examenNombre}_${proceso}_${fecha}.xlsx`;

      // Descargar el archivo
      saveAs(blob, nombreArchivo);

      toast.success(
        `Excel exportado exitosamente: ${calificaciones.length} calificaciones`
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
    calificacionesByExamenQuery,
    saveCalificacion: saveMutation.mutate,
    deleteCalificacion: deleteMutation.mutate,
    exportToExcel: exportMutation.mutate,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExporting: exportMutation.isPending,
  };
};

const getCalificaciones = async (): Promise<Calificacion[]> => {
  const calificacionesRef = collection(db, "calificaciones");
  const snapshot = await getDocs(calificacionesRef);

  const calificaciones = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

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
    })
  );

  return calificaciones.sort(
    (a, b) => b.calificacionFinal - a.calificacionFinal
  );
};

const getCalificacionById = async (
  id?: string
): Promise<Calificacion | null> => {
  if (!id) return null;
  const docRef = doc(db, "calificaciones", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();

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

    console.log(`Curso ${curso}:`);
    console.log(
      `- Puntaje obtenido (Decimal): ${puntajeObtenidoDecimal.toString()}`
    );
    console.log(
      `- Puntaje máximo (Decimal): ${puntajeMaximoDecimal.toString()}`
    );

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

export default useCalificaciones;
