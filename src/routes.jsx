import React from 'react'
import Home from './pages/Home'
import MedicionPuestaATierra from './pages/MedicionPuestaATierra'
import Verificacion from './pages/Verificacion' 
import Historial from './pages/Historial'
import MedicionPuestaATierraPrint from './pages/MedicionPuestaATierraPrint'

export const routes = [
  { path: '/', element: <Home />, label: 'Inicio' },
  { path: '/medicion-puesta-tierra', element: <MedicionPuestaATierra />, label: 'Puesta a Tierra' },
  { path: '/verificacion', element: <Verificacion />, label: 'Verificación' },
  { path: '/historial', element: <Historial />, label: 'Historial' },
  { path: '/medicion-puesta-tierra-print', element: <MedicionPuestaATierraPrint />, label: 'Puesta a Tierra impresion' },
]
