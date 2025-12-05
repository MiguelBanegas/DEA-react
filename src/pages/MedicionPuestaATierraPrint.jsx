import React, { useEffect, useState } from "react";
import "./MedicionPuestaATierraPrint.css";

export default function MedicionPuestaATierraPrint() {
  const [data, setData] = useState(null);
  const [imagenes, setImagenes] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("medicionFormData");
    const imgs = localStorage.getItem("imagenesPAT");
    const id = localStorage.getItem("idInformePAT");

    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.idInformePAT = id || "SIN-ID";
      setData(parsed);
    }

    if (imgs) {
      setImagenes(JSON.parse(imgs));
    }
  }, []);

  if (!data) return <div>Cargando datos...</div>;

  // Separar observaciones por si son largas
  const obsLargas = data.observaciones && data.observaciones.length > 350;

  // Dividir imágenes en grupos de 3 por página
  const gruposImagenes = [];
  for (let i = 0; i < imagenes.length; i += 3) {
    gruposImagenes.push(imagenes.slice(i, i + 3));
  }

  // Calcular número total de páginas
  const totalPaginas = 1 + (obsLargas ? 1 : 0) + gruposImagenes.length;

  const FirmaSection = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', paddingRight: '10px' }}>
       <div className="firma-box">
          <img src="/img/FIRMADIGITAL.png" alt="Firma" className="firma-img" />
       </div>
    </div>
  );

  // Componente de footer para cada página
  const PageFooter = ({ pageNum }) => (
    <div className="page-footer">
      <strong>ID: {data.idInformePAT}</strong> | Página {pageNum} de {totalPaginas}
    </div>
  );

  return (
    <>
    <div className="print-actions">
      <button 
          className="btn-imprimir"
          onClick={() => window.history.back()}>
          Volver
      </button>
      <button onClick={() => window.print()} className="btn-imprimir">
        Imprimir
      </button>
    </div>

    
    <div className="print-container" data-id={data.idInformePAT}>

      {/* ====================== PÁGINA 1 ====================== */}
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
            <p><strong>Fecha:</strong> {data.fechaMedicion}</p>
            <p><strong>Hora Inicio:</strong> {data.horaInicio}</p>
            <p className="full-width"><strong>Hora Fin:</strong> {data.horaFin}</p>
          </div>
        </div>

        {/* METODOLOGÍA Y OBSERVACIONES */}
        <div className="section-wrapper">
          <h2 className="section-title">Metodología</h2>
          <div className="section-box">
            <p>{data.metodologia}</p>
          </div>
        </div>

        {!obsLargas && (
          <div className="section-wrapper">
            <h2 className="section-title">Observaciones</h2>
            <div className="section-box">
              <p>{data.observaciones}</p>
            </div>
          </div>
        )}
        {!obsLargas && gruposImagenes.length === 0 && <FirmaSection />}
        <PageFooter pageNum={1} />
      </div>

      {/* ====================== PÁGINA 2 (OBSERVACIONES LARGAS) ====================== */}
      {obsLargas && (
        <div className="print-page">
          <div className="section-wrapper">
            <h2 className="section-title">Observaciones</h2>
            <div className="section-box">
              <p>{data.observaciones}</p>
            </div>
          </div>
          {gruposImagenes.length === 0 && <FirmaSection />}
          <PageFooter pageNum={2} />
        </div>
      )}

      {/* ====================== IMÁGENES (3 POR PÁGINA) ====================== */}
      {gruposImagenes.map((grupo, index) => (
        <div key={index} className="print-page">
          <div className="section-wrapper">
            <h2 className="section-title">Documentación Adjunta</h2>
            <div className="imagenes-grid">
              {grupo.map((img, i) => (
                <img key={i} src={img} alt={`Foto ${i}`} className="img-print" />
              ))}
            </div>
          </div>
          {index === gruposImagenes.length - 1 && <FirmaSection />}
          <PageFooter pageNum={obsLargas ? 3 : 2 + index} />
        </div>
      ))}



    </div>
    </>
  );
}
