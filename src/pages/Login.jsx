import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Después de un login exitoso, redirige a la página anterior o a /historial por defecto.
  const from = location.state?.from?.pathname || '/historial';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (auth.login(username, password)) { // auth.login ahora solo es para admin
      navigate(from, { replace: true });
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Acceso de Administrador</h2>
        <div className="input-group">
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-button">Acceder</button>
        <div className="separator" style={{ margin: '1rem 0' }}>o</div>
        <Link to="/" className="btn btn-outline-secondary w-100">
          Volver al Inicio
        </Link>
      </form>
    </div>
  );
};

export default Login;
