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

// Cursos disponibles
export type Curso =
  | "Biología"
  | "Cívica"
  | "Filosofía"
  | "Física"
  | "Geografía"
  | "Historia"
  | "Inglés - Lectura"
  | "Inglés - Gramática"
  | "Lenguaje"
  | "Literatura"
  | "Matemática - Aritmética"
  | "Matemática - Algebra"
  | "Matemática - Geometría"
  | "Matemática - Trigonometría"
  | "Psicología"
  | "Química"
  | "Razonamiento Lógico"
  | "Razonamiento Matemático"
  | "Comprensión Lectora"
  | "Razonamiento Verbal";

// Tipo para alternativas
export type Alternativa = "A" | "B" | "C" | "D" | "E";

// Pregunta (ACTUALIZADA - incluye nivel cognitivo como texto libre)
export interface Pregunta {
  id: string;
  curso: Curso; // Cambiado de string a Curso
  tema: string; // Incluye tema y subtema combinados
  area: Area;
  nivelCognitivo: string; // Campo de texto libre para nivel cognitivo
  puntaje: number; // Decimal que sumado con todas las preguntas debe dar 100
  competencia: string; // Texto literal de la competencia
  mensajeComplida: string; // Mensaje cuando la competencia se cumple
  mensajeNoComplida: string; // Mensaje cuando la competencia no se cumple
  alternativaCorrecta: Alternativa; // Alternativa correcta (A, B, C, D, E)
  createdAt: string;
  createdBy: string;
}

// Matriz de conformación de preguntas por curso
export interface MatrizConformacion {
  curso: string;
  cantidad: number;
}

// Mapeo de pregunta con su número en el examen
export interface PreguntaEnExamen {
  preguntaId: string;
  numero: number; // Número de la pregunta en el examen (1-80)
}

// Examen Simulacro
export interface ExamenSimulacro {
  id: string;
  nombre: string;
  proceso: string;
  area: Area;
  preguntas: string[]; // Array de IDs de preguntas (80 preguntas) - MANTENER PARA COMPATIBILIDAD
  preguntasOrdenadas: PreguntaEnExamen[]; // Array con orden específico de preguntas
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

// Calificación (ACTUALIZADA - incluye preguntasAcertadas)
export interface Calificacion {
  id: string;
  postulanteId: string;
  postulante?: Postulante; // Populated field
  examenSimulacroId: string;
  examenSimulacro?: ExamenSimulacro; // Populated field
  respuestas: Alternativa[]; // Array de 80 valores: "A", "B", "C", "D", "E"
  preguntasAcertadas: number; // Cantidad de preguntas correctas (autogenerado)
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
  postulantesByExamenQuery: (examenId?: string) => any; // Nueva función para obtener postulantes por examen
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
  calificacionesByExamenQuery: (examenId?: string) => any; // Nueva función para obtener calificaciones por examen
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
