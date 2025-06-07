// Tipos de usuario (mantener los existentes)
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL?: string | null;
  role: "admin" | "user";
  createdAt?: string;
  createdBy?: string;
}

// Tipos para el contexto de autenticación (mantener existentes)
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<boolean>;
}

// Tipos para los hooks de usuarios (mantener existentes)
export interface UsersHookReturn {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  userByIdQuery: (id: string | undefined) => any;
  saveUser: (userData: Partial<User>) => void;
  updateUserRole: ({
    userId,
    newRole,
  }: {
    userId: string;
    newRole: "admin" | "user";
  }) => void;
  deleteUser: (id: string) => void;
  isSaving: boolean;
  isUpdatingRole: boolean;
  isDeleting: boolean;
}

// NUEVOS TIPOS PARA EL SISTEMA DE CALIFICACIONES

// Postulante
export interface Postulante {
  id: string;
  dni: string; // Hasta 10 números (puede ser carnet de extranjería)
  apellidos: string;
  nombres: string;
  carreraPostulacion: string;
  especialidad?: string; // Solo si tiene
  correoCeprunsa: string; // Termina en @cepr.unsa.pe
  createdAt: string;
  createdBy: string;
}

// Áreas disponibles
export type Area = "Biomédicas" | "Ingenierías" | "Sociales";

// Competencia
export interface Competencia {
  id: string;
  nombre: string;
  descripcion: string;
  mensajeComplida: string;
  mensajeNoComplida: string;
}

// Pregunta
export interface Pregunta {
  id: string;
  curso: string;
  tema: string;
  subtema: string;
  area: Area;
  puntaje: number;
  competenciaId: string;
  competencia?: Competencia; // Populated field
  enunciado: string;
  alternativas: string[]; // Array de 5 alternativas (A, B, C, D, E)
  respuestaCorrecta: number; // Índice de la respuesta correcta (0-4)
  createdAt: string;
  createdBy: string;
}

// Matriz de conformación de preguntas por curso
export interface MatrizConformacion {
  curso: string;
  cantidad: number;
}

// Examen Simulacro
export interface ExamenSimulacro {
  id: string;
  nombre: string;
  proceso: string;
  area: Area;
  preguntas: string[]; // Array de IDs de preguntas (80 preguntas)
  preguntasData?: Pregunta[]; // Populated field
  matrizConformacion: MatrizConformacion[]; // Cuántas preguntas por curso
  estado: "construccion" | "listo";
  createdAt: string;
  createdBy: string;
}

// Matriz de calificación por curso
export interface MatrizCurso {
  curso: string;
  correctas: number;
  incorrectas: number;
  total: number;
  puntajeObtenido: number;
  puntajeMaximo: number;
}

// Retroalimentación por curso
export interface RetroalimentacionCurso {
  curso: string;
  competenciasCumplidas: string[];
  competenciasNoCumplidas: string[];
}

// Calificación
export interface Calificacion {
  id: string;
  postulanteId: string;
  postulante?: Postulante; // Populated field
  examenSimulacroId: string;
  examenSimulacro?: ExamenSimulacro; // Populated field
  respuestas: number[]; // Array de 80 valores: 1 = correcto, 0 = incorrecto
  calificacionFinal: number; // Suma de correctas y sus valores (autogenerado)
  matrizPorCurso: MatrizCurso[]; // Matriz de correctas/incorrectas por curso (autogenerado)
  retroalimentacion: RetroalimentacionCurso[]; // Mensajes por curso (autogenerado)
  fechaExamen: string;
  createdAt: string;
  createdBy: string;
}

// Tipos para hooks
export interface PostulantesHookReturn {
  postulantes: Postulante[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  postulanteByIdQuery: (id: string | undefined) => any;
  savePostulante: (data: Partial<Postulante>) => void;
  deletePostulante: (id: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}

export interface PreguntasHookReturn {
  preguntas: Pregunta[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  preguntaByIdQuery: (id: string | undefined) => any;
  savePregunta: (data: Partial<Pregunta>) => void;
  deletePregunta: (id: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}

export interface ExamenesHookReturn {
  examenes: ExamenSimulacro[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  examenByIdQuery: (id: string | undefined) => any;
  saveExamen: (data: Partial<ExamenSimulacro>) => void;
  deleteExamen: (id: string) => void;
  updateEstadoExamen: (id: string, estado: "construccion" | "listo") => void;
  isSaving: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
}

export interface CalificacionesHookReturn {
  calificaciones: Calificacion[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  calificacionByIdQuery: (id: string | undefined) => any;
  saveCalificacion: (data: Partial<Calificacion>) => void;
  deleteCalificacion: (id: string) => void;
  exportToExcel: (calificaciones: Calificacion[]) => void;
  isSaving: boolean;
  isDeleting: boolean;
  isExporting: boolean;
}

// Tipos para estadísticas y métricas
export interface EstadisticasPostulante {
  postulanteId: string;
  postulante: Postulante;
  totalExamenes: number;
  promedioGeneral: number;
  mejorCalificacion: number;
  peorCalificacion: number;
  tendencia: "mejorando" | "empeorando" | "estable";
  fortalezas: string[]; // Cursos con mejor rendimiento
  debilidades: string[]; // Cursos con peor rendimiento
}

export interface EstadisticasExamen {
  examenId: string;
  examen: ExamenSimulacro;
  totalPostulantes: number;
  promedioGeneral: number;
  calificacionMaxima: number;
  calificacionMinima: number;
  distribucionNotas: { rango: string; cantidad: number }[];
  rendimientoPorCurso: { curso: string; promedio: number }[];
}
