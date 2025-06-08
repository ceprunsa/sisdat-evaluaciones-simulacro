"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { collection, getDocs, doc, getDoc, deleteDoc, addDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "./useAuth"
import type { ExamenSimulacro, ExamenesHookReturn } from "../types"
import { useMemo } from "react"
import toast from "react-hot-toast"

export const useExamenes = (): ExamenesHookReturn => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // React Query hooks
  const examenesQuery = useQuery({
    queryKey: ["examenes"],
    queryFn: async (): Promise<ExamenSimulacro[]> => {
      const examenesRef = collection(db, "examenes")
      const snapshot = await getDocs(examenesRef)
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as ExamenSimulacro,
      )
    },
  })

  const examenByIdQueryFn = async (id?: string): Promise<ExamenSimulacro | null> => {
    if (!id) return null
    const docRef = doc(db, "examenes", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ExamenSimulacro
    }
    return null
  }

  const examenByIdQuery = (id?: string) => {
    return useQuery({
      queryKey: ["examenes", id],
      queryFn: () => examenByIdQueryFn(id),
      enabled: !!id,
    })
  }

  const saveExamenMutation = useMutation({
    mutationFn: async (examenData: Partial<ExamenSimulacro>): Promise<Partial<ExamenSimulacro>> => {
      if (!examenData.nombre || !examenData.proceso || !examenData.area) {
        throw new Error("Nombre, proceso y área son requeridos")
      }

      try {
        if (examenData.id) {
          // Actualizar examen existente
          const examenRef = doc(db, "examenes", examenData.id)
          await updateDoc(examenRef, {
            nombre: examenData.nombre,
            proceso: examenData.proceso,
            area: examenData.area,
            preguntas: examenData.preguntas || [],
            matrizConformacion: examenData.matrizConformacion || [],
            estado: examenData.estado || "construccion",
          })
          toast.success("Examen actualizado exitosamente")
        } else {
          // Crear nuevo examen
          await addDoc(collection(db, "examenes"), {
            nombre: examenData.nombre,
            proceso: examenData.proceso,
            area: examenData.area,
            preguntas: [],
            matrizConformacion: [],
            estado: "construccion",
            createdAt: new Date().toISOString(),
            createdBy: user?.email || "system",
          })
          toast.success("Examen creado exitosamente")
        }
        return examenData
      } catch (error) {
        console.error("Error en saveExamen:", error)
        toast.error(error instanceof Error ? error.message : "Error al guardar examen")
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examenes"] })
    },
  })

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: "construccion" | "listo" }): Promise<void> => {
      try {
        const examenRef = doc(db, "examenes", id)
        await updateDoc(examenRef, { estado })
        toast.success(`Examen marcado como ${estado === "listo" ? "listo" : "en construcción"}`)
      } catch (error) {
        console.error("Error al actualizar estado:", error)
        toast.error("Error al actualizar estado del examen")
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examenes"] })
    },
  })

  const deleteExamenMutation = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        await deleteDoc(doc(db, "examenes", id))
        toast.success("Examen eliminado exitosamente")
        return id
      } catch (error) {
        console.error("Error al eliminar examen:", error)
        toast.error(error instanceof Error ? error.message : "Error al eliminar examen")
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examenes"] })
    },
  })

  const memoizedExamenByIdQuery = useMemo(() => examenByIdQuery, [])

  return {
    examenes: examenesQuery.data || [],
    isLoading: examenesQuery.isLoading,
    isError: examenesQuery.isError,
    error: examenesQuery.error as Error | null,
    examenByIdQuery: memoizedExamenByIdQuery,
    saveExamen: saveExamenMutation.mutate,
    deleteExamen: deleteExamenMutation.mutate,
    updateEstadoExamen: (id: string, estado: "construccion" | "listo") => updateEstadoMutation.mutate({ id, estado }),
    isSaving: saveExamenMutation.isPending,
    isDeleting: deleteExamenMutation.isPending,
    isUpdating: updateEstadoMutation.isPending,
  }
}
