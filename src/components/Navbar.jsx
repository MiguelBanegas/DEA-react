import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routes } from '../routes';
import Collapse from 'bootstrap/js/dist/collapse';

export default function Navbar() {
  const auth = useAuth();
  const navigate = useNavigate();

  const collapseRef = useRef(null);
  const collapseInstanceRef = useRef(null);

  // Inicializa la instancia de Collapse de Bootstrap una vez que el componente se monta
  useEffect(() => {
    if (collapseRef.current) {
      collapseInstanceRef.current = new Collapse(collapseRef.current, {
        toggle: false,
      });
    }

    // Limpia la instancia al desmontar
    return () => {
      if (collapseInstanceRef.current) {
        collapseInstanceRef.current.dispose();
      }
    };
  }, []);

  // Manejador de clics para los enlaces de navegación
  const handleLinkClick = (e, to) => {
    e.preventDefault(); // Previene la navegación inmediata del <Link>

    const collapseEl = collapseRef.current;
    if (!collapseEl || !collapseInstanceRef.current) return;

    // Si el menú está abierto, lo cierra y navega después.
    if (collapseEl.classList.contains('show')) {
      // Añade un listener que se ejecuta solo una vez, después de que se oculta el menú
      collapseEl.addEventListener(
        'hidden.bs.collapse',
        () => {
          navigate(to);
        },
        { once: true }
      );
      collapseInstanceRef.current.hide();
    } else {
      // Si el menú ya está cerrado, navega inmediatamente
      navigate(to);
    }
  };
  
  const handleLogout = (e) => {
	e.preventDefault();
	auth.loginAsVisitor();
	navigate('/');
  }

  // Filtrar las rutas que no deben aparecer en la navegación
  const navLinks = routes.filter(route => !route.hideInNav);

  return (
    <nav className="navbar navbar-expand-lg bg-light sticky-top shadow-sm d-print-none">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src="/img/logo5.jpeg" alt="DEA" style={{ height: 48 }} className="me-2 rounded" />
          <span className="fw-bold">DEA Soluciones</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav" ref={collapseRef}>
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {auth.user ? (
              <>
                <li className="nav-item" style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}>
                  <Link className="nav-link" to="/" onClick={(e) => handleLinkClick(e, '/')}>
                    Inicio
                  </Link>
                </li>
                {navLinks
                  .filter(route => !route.isPublic)
                  .filter(route => auth.user.role === 'admin' || !route.adminOnly)
                  .map((route, idx) => (
                    <li key={idx} className="nav-item" style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}>
                      <Link className="nav-link" to={route.path} onClick={(e) => handleLinkClick(e, route.path)}>
                        {route.label}
                      </Link>
                    </li>
                  ))}
                <li className="nav-item">
                  <button
                    className={`btn ms-lg-2 ${auth.user.role === 'admin' ? 'btn-danger' : 'btn-success'}`}
                    onClick={auth.user.role === 'admin' ? handleLogout : (e) => handleLinkClick(e, '/login')}
                  >
                    {auth.user.role === 'admin' ? 'Cerrar Sesión' : 'Acceso Admin'}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item" style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}>
                  <Link className="nav-link" to="/" onClick={(e) => handleLinkClick(e, '/')}>
                    Inicio
                  </Link>
                </li>
                <li className="nav-item" style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}>
                  <Link className="nav-link" to="/login" onClick={(e) => handleLinkClick(e, '/login')}>
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
