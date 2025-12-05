import React from 'react'
import Navbar from '../components/Navbar'

export default function Home(){
  return (
    <>
      <Navbar />
      <div className="container py-4">
        {/* <div className="text-center mb-4"> */}
        {/*   <img src="../public/img/logo5.jpeg" alt="Logo DEA" className="img-fluid" style={{maxWidth:160}} /> */}
        {/* </div> */}

        <h1 className="h3 text-center mb-3">DEA Soluciones - Verificaciones Eléctricas</h1>
      <p className="lead text-center">Somos una consultora especializada en verificaciones eléctricas en la República Argentina, brindando servicios profesionales para garantizar la seguridad y el cumplimiento normativo en instalaciones eléctricas.</p>

      <h2 className="text-center my-4">Nuestros Servicios</h2>

      <div className="row align-items-center my-4">
        <div className="col-md-4 text-center">
          <img src="/img/electVerif2.jfif" className="img-fluid rounded shadow" alt="Imagen de servicios eléctricos" />
        </div>
        <div className="col-md-8">
          <ul>
            <li>Auditoría de Instalaciones Eléctricas.</li>
            <li>Sistema de Protección contra el Rayo (Pararrayos).</li>
            <li>Sistemas de Puesta a Tierra.</li>
            <li>RES 900/15 SRT.</li>
            <li>RES 84/12 de SRT.</li>
            <li>Proyectos Eléctricos.</li>
            <li>Dirección Técnica.</li>
            <li>Consultoría.</li>
            <li>Capacitaciones.</li>
          </ul>
        </div>
      </div>

      <div className="row align-items-center my-4">
        <div className="col-md-8">
          <div className="d-grid gap-3">
            <a href="/pages/verificacion.html" className="btn btn-primary btn-lg">Auditoría de Instalación Eléctrica</a>
            <a href="/pages/medicion_puesta_a_tierra.html" className="btn btn-secondary btn-lg">Res 900/15 Superintendencia de Riesgos del Trabajo</a>
          </div>
        </div>
        <div className="col-md-4 text-center mt-3 mt-md-0">
          <img src="/img/electVerif2.jpeg" className="img-fluid rounded shadow" alt="Imagen servicios" />
        </div>
      </div>

      <hr />
      <h2 className="text-center my-4">Sobre Nosotros</h2>
      <div className="mb-4">
        <p>Somos un equipo de jóvenes profesionales especialistas en seguridad eléctrica en el segmento de la industria.</p>
        <p>Iniciamos de manera unipersonal brindando servicios de electricidad domiciliaria y comercial. Transitamos la pandemia con firmeza, profundizando conocimientos a través de capacitaciones específicas, adquirimos nuevas competencias, incorporamos nuevas herramientas e instrumental de calidad lo que le permitió a nuestro proyecto sumar valor agregado, incrementando nuestros servicios para brindar soluciones integrales a nuestros clientes.</p>
      </div>

      <h2 className="text-center my-4">Contáctanos</h2>
      <div className="text-center mb-4">
        <a href="https://www.facebook.com/deasoluciones" className="text-decoration-none me-3 fs-2" target="_blank" rel="noreferrer"><i className="bi bi-facebook"/></a>
        <a href="https://www.instagram.com/dea_soluciones/" className="text-decoration-none me-3 fs-2" target="_blank" rel="noreferrer"><i className="bi bi-instagram"/></a>
        <a href="https://www.linkedin.com/in/diego-aguilar-82a751225/" className="text-decoration-none me-3 fs-2" target="_blank" rel="noreferrer"><i className="bi bi-linkedin"/></a>
        <a href="https://wa.me/+5493813201466" className="text-decoration-none me-3 fs-2" target="_blank" rel="noreferrer"><i className="bi bi-whatsapp"/></a>
      </div>

      <footer className="text-center mt-4">
        <p>&copy; 2024 DEA Soluciones. Todos los derechos reservados.</p>
      </footer>
    </div>
    </>
  )
}
