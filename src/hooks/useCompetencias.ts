"use client"

import { useQuery } from "@tanstack/react-query"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase/config"
import type { Competencia } from "../types"

export const useCompetencias = () => {
  const competenciasQuery = useQuery({
    queryKey: ["competencias"],
    queryFn: async (): Promise<Competencia[]> => {
      const competenciasRef = collection(db, "competencias")
      const snapshot = await getDocs(competenciasRef)
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Competencia,
      )
    },
  })

  return {
    competencias: competenciasQuery.data || [],
    isLoading: competenciasQuery.isLoading,
    isError: competenciasQuery.isError,
    error: competenciasQuery.error as Error | null,
  }
}
