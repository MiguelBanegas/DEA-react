import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'
import { routes } from './routes'
import Navbar from './components/Navbar' // Importar Navbar

import { Toaster } from 'react-hot-toast'

// Creamos un componente interno para poder usar useLocation
const AppContent = () => {
  const location = useLocation()
  // No mostramos el Navbar en la página de login
  const showNavbar = location.pathname !== '/login'

  return (
    <>
      {showNavbar && <Navbar />}
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {routes.map((route, idx) => (
          <Route key={idx} path={route.path} element={route.element} />
        ))}
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
