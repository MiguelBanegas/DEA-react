import React from 'react'
import Home from './pages/Home'
import MedicionPuestaATierra from './pages/MedicionPuestaATierra'
import Verificacion from './pages/Verificacion'
import Historial from './pages/Historial'
import MedicionPuestaATierraPrint from './pages/MedicionPuestaATierraPrint'
import VerificacionPrint from './pages/VerificacionPrint'
import Login from './pages/Login' // Importar Login
import ProtectedRoute from './components/ProtectedRoute' // Importar ProtectedRoute

export const routes = [
  { path: '/', element: <Home />, label: 'Inicio', isPublic: true },
  { path: '/login', element: <Login />, label: 'Login', isPublic: true },
  {
    path: '/medicion-puesta-tierra',
    element: (
      <ProtectedRoute>
        <MedicionPuestaATierra />
      </ProtectedRoute>
    ),
    label: 'Puesta a Tierra',
    adminOnly: true,
  },
  {
    path: '/verificacion',
    element: (
      <ProtectedRoute>
        <Verificacion />
      </ProtectedRoute>
    ),
    label: 'Verificación',
    adminOnly: true,
  },
  {
    path: '/historial',
    element: (
      <ProtectedRoute>
        <Historial />
      </ProtectedRoute>
    ),
    label: 'Historial',
    adminOnly: true,
  },
  {
    path: '/medicion-puesta-tierra-print',
    element: (
      <ProtectedRoute>
        <MedicionPuestaATierraPrint />
      </ProtectedRoute>
    ),
    label: 'Puesta a Tierra impresion',
    hideInNav: true, // Ocultar en la navegación principal
  },
  {
    path: '/verificacion-print',
    element: (
      <ProtectedRoute>
        <VerificacionPrint />
      </ProtectedRoute>
    ),
    label: 'Verificacion impresion',
    hideInNav: true, // Ocultar en la navegación principal
  },
]
