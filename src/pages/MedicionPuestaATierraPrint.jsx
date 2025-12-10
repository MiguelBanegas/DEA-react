import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MedicionPuestaATierraPrint.css";

export default function MedicionPuestaATierraPrint() {
  const [data, setData] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Leer todos los datos necesarios desde localStorage
    const storedData = localStorage.getItem("medicionFormData");
    const storedImgs = localStorage.getItem("imagenesPAT");
    const reportId = localStorage.getItem("idInformePAT");

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      parsedData.idInformePAT = reportId || "SIN-ID";
      setData(parsedData);
    }

    if (storedImgs) {
      const parsedImgs = JSON.parse(storedImgs);
      setImagenes(parsedImgs);
    }

    setIsLoading(false); // Finaliza la carga

    // Configurar título de la página y disparar la impresión
    const originalTitle = document.title;
    if (reportId) {
      document.title = `Informe PAT - ID: ${reportId}`;
    }

    // Disparar la impresión automáticamente después de un breve retraso
    // para asegurar que todo el contenido y las imágenes se hayan renderizado.
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    // Función de limpieza que se ejecuta cuando el componente se desmonta
    return () => {
      document.title = originalTitle;
      clearTimeout(timer);
    };
  }, []); // El array de dependencias vacío asegura que este efecto se ejecute solo una vez

  if (isLoading) return <div>Cargando datos del informe...</div>;
  if (!data) return <div>No se encontraron datos para generar el informe. Por favor, vuelva y genere el informe nuevamente.</div>;

  const hayImagenes = imagenes && imagenes.length > 0;

  const FirmaSection = () => (
    <div className="firma-box">
      <img src="/img/FIRMADIGITAL.png" alt="Firma" className="firma-img" />
    </div>
  );

  return (
    <>
    <div className="print-actions no-print">
      <div className="d-flex flex-column gap-2">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i> Volver
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <i className="bi bi-printer me-1"></i> Imprimir
        </button>
      </div>
    </div>

    
    <div className="print-container" data-id={data.idInformePAT}>

      {/* ====================== CONTENIDO UNIFICADO ====================== */}
      <div className="print-page">
        <div className="header-print">
          <img src="/img/logo5.jpeg" alt="Logo" className="logo-print" />
          <div>
            <h1 className="titulo-print">Informe de Medición de Puesta a Tierra</h1>
            <p className="fecha-print">Fecha de impresión: {new Date().toLocaleDateString("es-AR")}</p>
          </div>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="section-wrapper">
          <h2 className="section-title">Datos del Cliente</h2>
          <div className="section-box section-grid">
            <p><strong>Razón Social:</strong> {data.razonSocial}</p>
            <p><strong>CUIT:</strong> {data.cuit}</p>
            <p><strong>Dirección:</strong> {data.direccion}</p>
            <p><strong>Localidad:</strong> {data.localidad}</p>
            <p><strong>Provincia:</strong> {data.provincia}</p>
            <p><strong>CP:</strong> {data.cp}</p>
          </div>
        </div>

        {/* DATOS DEL PROFESIONAL */}
        <div className="section-wrapper">
          <h2 className="section-title">Datos del Profesional</h2>
          <div className="section-box section-grid">
            <p className="full-width"><strong>Nombre:</strong> {data.nombreProfesional} {data.apellidoProfesional}</p>
            <p><strong>Matrícula:</strong> {data.matriculaProfesional}</p>
            <p><strong>Incumbencias:</strong> {data.incumbenciasEspecificas}</p>
            <p><strong>Pago Matrícula:</strong> {data.pagoMatricula}</p>
            <p><strong>Seguro Accidentes:</strong> {data.seguroAccidentes}</p>
          </div>
        </div>

        {/* DATOS DEL INSTRUMENTO */}
        <div className="section-wrapper">
          <h2 className="section-title">Instrumento de Medición</h2>
          <div className="section-box section-grid">
            <p><strong>Marca:</strong> {data.marcaInstrumento}</p>
            <p><strong>Modelo:</strong> {data.modeloInstrumento}</p>
            <p><strong>Número Serie:</strong> {data.numeroSerieInstrumento}</p>
            <p><strong>Tipo:</strong> {data.tipoInstrumento}</p>
            <p><strong>Cert. Fabricante:</strong> {data.certificadoFabricante}</p>
            <p><strong>Calibración:</strong> {data.certificadoCalibracion}</p>
            <p><strong>Condiciones de Uso:</strong> {data.condicionesUso}</p>
          </div>
        </div>

        {/* DATOS DE MEDICIÓN */}
        <div className="section-wrapper">
          <h2 className="section-title">Datos de la Medición</h2>
          <div className="section-box section-grid">
            <p className="full-width"><strong>Fecha:</strong> {new Date(data.fechaMedicion + 'T00:00:00').toLocaleDateString('es-AR')}</p>
            <p><strong>Hora Inicio:</strong> {data.horaInicio}</p>
            <p><strong>Hora Fin:</strong> {data.horaFin}</p>
          </div>
        </div>

        {/* METODOLOGÍA */}
        <div className="section-wrapper">
          <h2 className="section-title">Metodología</h2>
          <div className="section-box">
            <p>{data.metodologia}</p>
          </div>
        </div>

        {/* OBSERVACIONES */}
        <div className="section-wrapper">
          <h2 className="section-title">Observaciones</h2>
          <div className="section-box">
            <p>{data.observaciones}</p>
          </div>
        </div>
        
        {/* DOCUMENTACIÓN ADJUNTA */}
        {hayImagenes && (
          <div className="section-wrapper">
              <h2 className="section-title">Documentación Adjunta</h2>
              <div className="imagenes-grid">
                {imagenes.map((img, i) => (
                  <img key={i} src={img} alt={`Foto ${i}`} className="img-print" />
                ))}
              </div>
          </div>
        )}

        {/* FIRMA */}
        <FirmaSection />

      </div>
    </div>
    </>
  );
}
