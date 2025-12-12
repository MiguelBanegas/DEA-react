import React from 'react';
import './Home.css'; 

export default function Home() {
  return (
    <div className="home-container">
      {/* Carrusel de ImágeneS */}
      <div id="carouselExampleCaptions" className="carousel slide" data-bs-ride="carousel" style={{ maxWidth: '1000px', margin: '80px auto 0' }}>
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
          <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="1" aria-label="Slide 2"></button>
          <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="2" aria-label="Slide 3"></button>
        </div>
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="/img/electr2.jpg" className="d-block w-100" alt="Auditorías" style={{ height: '600px', objectFit: 'cover' }} />
            <div className="carousel-caption d-none d-md-block">
              <h3>Auditorías de Instalaciones Eléctricas</h3>
              <p>Garantizamos la seguridad y el cumplimiento normativo de sus instalaciones.</p>
            </div>
          </div>
          <div className="carousel-item">
            <img src="/img/electr1.jpg" className="d-block w-100" alt="Mediciones" style={{ height: '600px', objectFit: 'cover' }} />
            <div className="carousel-caption d-none d-md-block">
              <h3>Mediciones de Puesta a Tierra</h3>
              <p>Servicios profesionales para sistemas de protección según RES 900/15 SRT.</p>
            </div>
          </div>
          <div className="carousel-item">
            <img src="/img/electr3.jpg" className="d-block w-100" alt="Soluciones" style={{ height: '600px', objectFit: 'cover' }} />
            <div className="carousel-caption d-none d-md-block">
              <h3>DEA Soluciones Integrales</h3>
              <p>Su aliado estratégico en seguridad eléctrica industrial.</p>
            </div>
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>

      {/* Sección de bienvenida */}
      <div className="container text-center my-5">
        <h1 className="display-4">Bienvenido a DEA Soluciones</h1>
        <p className="lead">
          Especialistas en seguridad eléctrica para la industria. Ofrecemos servicios de auditorías, mediciones de puesta a tierra y verificaciones de instalaciones para garantizar el cumplimiento normativo y la máxima seguridad.
        </p>
      </div>
      
      {/* Sección de Servicios */}
      <div className="container my-5">
        <h2 className="text-center mb-4">Nuestros Servicios</h2>
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card h-100 shadow-sm text-center">
              <div className="card-body">
                <i className="bi bi-shield-check feature-icon mb-3"></i>
                <h5 className="card-title">Protocolo de Puesta a Tierra</h5>
                <p className="card-text">Realizamos mediciones y emitimos el protocolo correspondiente según la Resolución 900/15 de la SRT, asegurando la protección de sus trabajadores y equipos.</p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card h-100 shadow-sm text-center">
              <div className="card-body">
                <i className="bi bi-card-checklist feature-icon mb-3"></i>
                <h5 className="card-title">Verificación de Instalaciones</h5>
                <p className="card-text">Auditamos sus instalaciones eléctricas para verificar que cumplan con la normativa vigente, identificando riesgos y recomendando mejoras.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-light text-center text-lg-start mt-auto">
        <div className="container p-4">
          <div className="row">
            <div className="col-lg-6 col-md-12 mb-4 mb-md-0">
              <h5 className="text-uppercase">DEA Soluciones</h5>
              <p>
                Somos un equipo de jóvenes profesionales especialistas en seguridad eléctrica en el segmento de la industria, comprometidos con la calidad y la seguridad.
              </p>
            </div>
            <div className="col-lg-6 col-md-12 mb-4 mb-md-0 text-center">
              <h5 className="text-uppercase">Contacto</h5>
              <a href="https://wa.me/+5493813201466" className="text-dark me-3 fs-2" target="_blank" rel="noreferrer"><i className="bi bi-whatsapp"></i></a>
              <a href="https://www.instagram.com/dea_soluciones/" className="text-dark me-3 fs-2" target="_blank" rel="noreferrer"><i className="bi bi-instagram"></i></a>
              <a href="https://www.linkedin.com/in/diego-aguilar-82a751225/" className="text-dark me-3 fs-2" target="_blank" rel="noreferrer"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>
        </div>
        <div className="text-center p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          &copy; {new Date().getFullYear()} DEA Soluciones. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}