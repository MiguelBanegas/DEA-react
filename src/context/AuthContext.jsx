
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    // Simulando una llamada a API
    if (username === 'admin' && password === 'admin') { // Ejemplo de login
      const userData = { username: 'admin', role: 'admin' };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData)); // Guardar en localStorage
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Eliminar de localStorage
  };

  const loginAsVisitor = () => {
    const visitorData = { username: 'Visitante', role: 'visitor' };
    setUser(visitorData);
    localStorage.setItem('user', JSON.stringify(visitorData));
    return true;
  };

  // Comprobar si hay un usuario en localStorage al cargar. Si no, iniciar como visitante.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error al parsear el usuario desde localStorage", error);
        localStorage.removeItem('user');
        loginAsVisitor(); // Si los datos están corruptos, iniciar como visitante
      }
    } else {
      // Si no hay usuario guardado, iniciar sesión como visitante por defecto
      loginAsVisitor();
    }
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente.

  return (
    <AuthContext.Provider value={{ user, login, logout, loginAsVisitor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
