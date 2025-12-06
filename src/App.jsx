import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { routes } from './routes'

import { Toaster } from 'react-hot-toast'

export default function App(){
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {routes.map((route, idx) => (
          <Route key={idx} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Router>
  )
}
