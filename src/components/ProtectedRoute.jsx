import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.user) {
    // Redirige al usuario a la página de login, pero guarda la ubicación a la que
    // intentaba ir para que podamos enviarlo allí después de iniciar sesión.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si el usuario no es admin, muestra un mensaje de no autorizado.
  if (auth.user.role !== 'admin') {
    return (
      <div>
        <h1>No autorizado</h1>
        <p>No tienes permiso para ver esta página.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
