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
import type { Pregunta, PreguntasHookReturn } from "../types";
import { useMemo } from "react";
import toast from "react-hot-toast";

export const usePreguntas = (): PreguntasHookReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const preguntaByIdQuery = (id?: string) => {
    return useQuery({
      queryKey: ["preguntas", id],
      queryFn: () => getPreguntaById(id),
      enabled: !!id,
    });
  };

  const preguntasQuery = useQuery({
    queryKey: ["preguntas"],
    queryFn: async (): Promise<Pregunta[]> => {
      const preguntasRef = collection(db, "preguntas");
      const snapshot = await getDocs(preguntasRef);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Pregunta)
      );
    },
  });

  const getPreguntaById = async (id?: string): Promise<Pregunta | null> => {
    if (!id) return null;
    const docRef = doc(db, "preguntas", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Pregunta;
    }
    return null;
  };

  const savePreguntaMutation = useMutation({
    mutationFn: async (
      preguntaData: Partial<Pregunta>
    ): Promise<Partial<Pregunta>> => {
      if (!preguntaData.curso || !preguntaData.tema || !preguntaData.subtema) {
        throw new Error("Curso, tema y subtema son requeridos");
      }

      if (
        !preguntaData.competencia ||
        !preguntaData.mensajeComplida ||
        !preguntaData.mensajeNoComplida
      ) {
        throw new Error("Competencia y mensajes son requeridos");
      }

      if (!preguntaData.puntaje || preguntaData.puntaje <= 0) {
        throw new Error("El puntaje debe ser mayor a 0");
      }

      try {
        if (preguntaData.id) {
          // Actualizar pregunta existente
          const preguntaRef = doc(db, "preguntas", preguntaData.id);
          await updateDoc(preguntaRef, {
            curso: preguntaData.curso,
            tema: preguntaData.tema,
            subtema: preguntaData.subtema,
            area: preguntaData.area,
            puntaje: preguntaData.puntaje,
            competencia: preguntaData.competencia,
            mensajeComplida: preguntaData.mensajeComplida,
            mensajeNoComplida: preguntaData.mensajeNoComplida,
          });
          toast.success("Pregunta actualizada exitosamente");
        } else {
          // Crear nueva pregunta
          await addDoc(collection(db, "preguntas"), {
            curso: preguntaData.curso,
            tema: preguntaData.tema,
            subtema: preguntaData.subtema,
            area: preguntaData.area,
            puntaje: preguntaData.puntaje,
            competencia: preguntaData.competencia,
            mensajeComplida: preguntaData.mensajeComplida,
            mensajeNoComplida: preguntaData.mensajeNoComplida,
            createdAt: new Date().toISOString(),
            createdBy: user?.email || "system",
          });
          toast.success("Pregunta creada exitosamente");
        }
        return preguntaData;
      } catch (error) {
        console.error("Error en savePregunta:", error);
        toast.error(
          error instanceof Error ? error.message : "Error al guardar pregunta"
        );
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preguntas"] });
    },
  });

  const deletePreguntaMutation = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        await deleteDoc(doc(db, "preguntas", id));
        toast.success("Pregunta eliminada exitosamente");
        return id;
      } catch (error) {
        console.error("Error al eliminar pregunta:", error);
        toast.error(
          error instanceof Error ? error.message : "Error al eliminar pregunta"
        );
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preguntas"] });
    },
  });

  const memoizedPreguntaByIdQuery = useMemo(() => preguntaByIdQuery, []);

  return {
    preguntas: preguntasQuery.data || [],
    isLoading: preguntasQuery.isLoading,
    isError: preguntasQuery.isError,
    error: preguntasQuery.error as Error | null,
    preguntaByIdQuery: memoizedPreguntaByIdQuery,
    savePregunta: savePreguntaMutation.mutate,
    deletePregunta: deletePreguntaMutation.mutate,
    isSaving: savePreguntaMutation.isPending,
    isDeleting: deletePreguntaMutation.isPending,
  };
};
