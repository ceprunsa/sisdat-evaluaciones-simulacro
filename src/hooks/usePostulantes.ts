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
import type { Postulante, PostulantesHookReturn } from "../types";
import { useMemo } from "react";
import toast from "react-hot-toast";

export const usePostulantes = (): PostulantesHookReturn => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Hook para obtener postulante por ID
  const postulanteByIdQuery = (id?: string) => {
    return useQuery({
      queryKey: ["postulantes", id],
      queryFn: () => getPostulanteById(id),
      enabled: !!id,
    });
  };

  // Obtener todos los postulantes
  const postulantesQuery = useQuery({
    queryKey: ["postulantes"],
    queryFn: async (): Promise<Postulante[]> => {
      const postulantesRef = collection(db, "postulantes");
      const snapshot = await getDocs(postulantesRef);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Postulante)
      );
    },
  });

  const getPostulanteById = async (id?: string): Promise<Postulante | null> => {
    if (!id) return null;
    const docRef = doc(db, "postulantes", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Postulante;
    }
    return null;
  };

  const savePostulanteMutation = useMutation({
    mutationFn: async (
      postulanteData: Partial<Postulante>
    ): Promise<Partial<Postulante>> => {
      if (
        !postulanteData.dni ||
        !postulanteData.apellidos ||
        !postulanteData.nombres
      ) {
        throw new Error("DNI, apellidos y nombres son requeridos");
      }

      if (!postulanteData.correoCeprunsa?.endsWith("@cepr.unsa.pe")) {
        throw new Error("El correo debe terminar en @cepr.unsa.pe");
      }

      try {
        if (postulanteData.id) {
          // Actualizar postulante existente
          const postulanteRef = doc(db, "postulantes", postulanteData.id);
          await updateDoc(postulanteRef, {
            dni: postulanteData.dni,
            apellidos: postulanteData.apellidos,
            nombres: postulanteData.nombres,
            carreraPostulacion: postulanteData.carreraPostulacion,
            especialidad: postulanteData.especialidad || null,
            correoCeprunsa: postulanteData.correoCeprunsa,
          });
          toast.success("Postulante actualizado exitosamente");
        } else {
          // Crear nuevo postulante
          await addDoc(collection(db, "postulantes"), {
            dni: postulanteData.dni,
            apellidos: postulanteData.apellidos,
            nombres: postulanteData.nombres,
            carreraPostulacion: postulanteData.carreraPostulacion,
            especialidad: postulanteData.especialidad || null,
            correoCeprunsa: postulanteData.correoCeprunsa,
            createdAt: new Date().toISOString(),
            createdBy: user?.email || "system",
          });
          toast.success("Postulante creado exitosamente");
        }
        return postulanteData;
      } catch (error) {
        console.error("Error en savePostulante:", error);
        toast.error(
          error instanceof Error ? error.message : "Error al guardar postulante"
        );
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postulantes"] });
    },
  });

  const deletePostulanteMutation = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        await deleteDoc(doc(db, "postulantes", id));
        toast.success("Postulante eliminado exitosamente");
        return id;
      } catch (error) {
        console.error("Error al eliminar postulante:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al eliminar postulante"
        );
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postulantes"] });
    },
  });

  const memoizedPostulanteByIdQuery = useMemo(() => postulanteByIdQuery, []);

  return {
    postulantes: postulantesQuery.data || [],
    isLoading: postulantesQuery.isLoading,
    isError: postulantesQuery.isError,
    error: postulantesQuery.error as Error | null,
    postulanteByIdQuery: memoizedPostulanteByIdQuery,
    savePostulante: savePostulanteMutation.mutate,
    deletePostulante: deletePostulanteMutation.mutate,
    isSaving: savePostulanteMutation.isPending,
    isDeleting: deletePostulanteMutation.isPending,
  };
};
