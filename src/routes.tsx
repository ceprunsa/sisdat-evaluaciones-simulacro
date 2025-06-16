import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserForm from "./pages/UserForm";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Profile from "./pages/Profile";

// Importar las páginas del sistema de calificaciones
import Postulantes from "./pages/Postulantes";
import PostulanteForm from "./pages/PostulanteForm";
import Preguntas from "./pages/Preguntas";
import PreguntaForm from "./pages/PreguntaForm";
import Examenes from "./pages/Examenes";
import ExamenForm from "./pages/ExamenForm";
import ExamenDetalle from "./pages/ExamenDetalle";
import Calificaciones from "./pages/Calificaciones";
import CalificacionForm from "./pages/CalificacionForm";
import CalificacionDetalle from "./pages/CalificacionDetalle";
import Estadisticas from "./pages/Estadisticas";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <AdminRoute>
            <Users />
          </AdminRoute>
        ),
      },
      {
        path: "users/new",
        element: (
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        ),
      },
      {
        path: "users/:id",
        element: (
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      // Rutas del sistema de calificaciones
      {
        path: "postulantes",
        element: (
          <ProtectedRoute>
            <Postulantes />
          </ProtectedRoute>
        ),
      },
      {
        path: "postulantes/new",
        element: (
          <ProtectedRoute>
            <PostulanteForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "postulantes/:id",
        element: (
          <ProtectedRoute>
            <PostulanteForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "preguntas",
        element: (
          <AdminRoute>
            <Preguntas />
          </AdminRoute>
        ),
      },
      {
        path: "preguntas/new",
        element: (
          <AdminRoute>
            <PreguntaForm />
          </AdminRoute>
        ),
      },
      {
        path: "preguntas/:id",
        element: (
          <AdminRoute>
            <PreguntaForm />
          </AdminRoute>
        ),
      },
      {
        path: "examenes",
        element: (
          <AdminRoute>
            <Examenes />
          </AdminRoute>
        ),
      },
      {
        path: "examenes/new",
        element: (
          <AdminRoute>
            <ExamenForm />
          </AdminRoute>
        ),
      },
      {
        path: "examenes/:id",
        element: (
          <ProtectedRoute>
            <ExamenDetalle />
          </ProtectedRoute>
        ),
      },
      {
        path: "examenes/:id/edit",
        element: (
          <AdminRoute>
            <ExamenForm />
          </AdminRoute>
        ),
      },
      {
        path: "calificaciones",
        element: (
          <ProtectedRoute>
            <Calificaciones />
          </ProtectedRoute>
        ),
      },
      {
        path: "calificaciones/new",
        element: (
          <ProtectedRoute>
            <CalificacionForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "calificaciones/:id",
        element: (
          <ProtectedRoute>
            <CalificacionForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "calificaciones/:id/detalle",
        element: (
          <ProtectedRoute>
            <CalificacionDetalle />
          </ProtectedRoute>
        ),
      },
      {
        path: "calificaciones/:id/edit",
        element: (
          <ProtectedRoute>
            <CalificacionForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "estadisticas",
        element: (
          <ProtectedRoute>
            <Estadisticas />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
