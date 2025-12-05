import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar(){
  return (
    <nav className="navbar navbar-expand-lg bg-light sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src="../public/img/logo5.jpeg" alt="DEA" style={{height:48}} className="me-2 rounded" />
          <span className="fw-bold">DEA Soluciones</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item" style={{textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}><Link className="nav-link" to="/">Inicio</Link></li>
            <li className="nav-item" style={{textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}><Link className="nav-link" to="/medicion-puesta-tierra">Puesta a Tierra</Link></li>
            <li className="nav-item" style={{textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}><Link className="nav-link" to="/verificacion">Verificación</Link></li>            
            <li className="nav-item" style={{textTransform: 'uppercase', fontSize: '14px', fontWeight: 'bold' }}><Link className="nav-link" to="/historial">Historial</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
