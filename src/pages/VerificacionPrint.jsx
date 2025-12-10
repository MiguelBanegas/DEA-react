import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import TablaMedicion from "../components/TablaMedicion";
import "./VerificacionPrint.css"; // Usaremos un CSS dedicado

export default function VerificacionPrint() {
  const [data, setData] = useState(null);
  const [filas, setFilas] = useState([]);
  const [imagenes, setImagenes] = useState([]);

  useEffect(() => {
    // Cargar datos desde localStorage
    const storedData = localStorage.getItem("verificacionFormData");
    const storedFilas = localStorage.getItem("verificacionFilas");
    const storedImgs = localStorage.getItem("verificacionImagenes");
    const id = localStorage.getItem("verificacionId");
    const originalTitle = document.title;

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      parsedData.id = id || "SIN-ID";
      setData(parsedData);
      document.title = `Verificación Eléctrica - ID: ${parsedData.id}`;
    }
    if (storedFilas) {
      setFilas(JSON.parse(storedFilas));
    }
    if (storedImgs) {
      setImagenes(JSON.parse(storedImgs));
    }

    // Disparar la impresión automáticamente después de un breve retraso
    // para asegurar que el contenido se haya renderizado.
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    // Función de limpieza
    return () => {
      document.title = originalTitle;
      clearTimeout(timer);
    };
  }, []);

  if (!data) {
    return <div>Cargando datos para impresión...</div>;
  }
  
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
          <button className="btn btn-secondary" onClick={() => window.history.back()}>
            Volver
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>

      <div className="print-container">
        <div className="print-page-layout">
          <div className="print-content">

            {/* Encabezado */}
            <div className="header-print">
              <img src="/img/logo5.jpeg" alt="Logo" className="logo-print" />
              <div>
                <h1 className="titulo-print">Verificación de Instalación Eléctrica</h1>
                <p className="fecha-print">Fecha de impresión: {new Date().toLocaleDateString("es-AR")}</p>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="section-wrapper">
              <h2 className="section-title">Datos del Cliente</h2>
              <div className="section-box section-grid-print">
                <p><strong>Cliente:</strong> {data.cliente}</p>
                <p><strong>CUIT:</strong> {data.cuit}</p>
                <p><strong>Dirección:</strong> {data.direccion}</p>
                <p><strong>Localidad:</strong> {data.localidad}</p>
                <p><strong>Provincia:</strong> {data.provincia}</p>
              </div>
            </div>
            
            {/* Relevamiento */}
            <div className="section-wrapper">
              <h2 className="section-title">Datos del Relevamiento</h2>
              <div className="section-box section-grid-print">
                  <p><strong>Tipo Instalación:</strong> {data.tipoInstalacion}</p>
                  <p><strong>Sector:</strong> {data.sector}</p>
                  <p><strong>Fecha:</strong> {new Date(data.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</p>
                  <p><strong>Hora Inicio:</strong> {data.horaInicio}</p>
                  <p><strong>Hora Fin:</strong> {data.horaFin}</p>
              </div>
            </div>

            {/* Responsables */}
            <div className="section-wrapper">
              <h2 className="section-title">Datos de Responsables</h2>
              <div className="section-box section-grid-print">
                  <p><strong>Resp. Eléctrico:</strong> {data.responsableElectrico} ({data.matriculaElectrico})</p>
                  <p><strong>Acompaña:</strong> {data.acompanhaElec}</p>
                  <p><strong>Resp. HSMA:</strong> {data.responsableHsma} ({data.matriculaHsma})</p>
                  <p><strong>Acompaña:</strong> {data.acompanhaHsma}</p>
              </div>
            </div>

            {/* Tabla de Mediciones */}
            <div className="section-wrapper">
              <h2 className="section-title">Datos de la Medición</h2>
              <div className="section-box">
                  <table className="table table-bordered table-sm">
                      <thead className="table-light">
                          <tr>
                              <th>(22)</th><th>(23)</th><th>(24)</th><th>(25)</th><th>(26)</th><th>(27)</th>
                              <th>(28)</th><th>(29)</th><th>(30)</th><th>(31)</th><th>(32)</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filas.map(fila => (
                              <tr key={fila.id}>
                                  <td>{fila.numeroToma}</td><td>{fila.sector}</td><td>{fila.descripcionTerreno}</td>
                                  <td>{fila.usoPuestaTierra}</td><td>{fila.esquemaConexion}</td><td>{fila.valorResistencia}</td>
                                  <td>{fila.cumple}</td><td>{fila.continuidad}</td><td>{fila.capacidadCarga}</td>
                                  <td>{fila.proteccionContactos}</td><td>{fila.desconexionAutomatica}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </div>

            {/* Referencias */}
            <div className="section-wrapper">
                <h2 className="section-title">Referencias de columnas</h2>
                <table className="table table-bordered table-sm small">
                  <tbody>
                    <tr><td><b>(22) N° de toma de tierra:</b></td><td>Indicar mediante un número la toma a tierra donde se realiza la medición.</td></tr>
                    <tr><td><b>(23) Sector:</b></td><td>Indicar el sector o la sección dentro de la empresa donde se realiza la medición.</td></tr>
                    <tr><td><b>(24) Descripción del terreno:</b></td><td>Indicar la condición del terreno al momento de la medición.</td></tr>
                    <tr><td><b>(25) Uso de la puesta a tierra:</b></td><td>Indicar el uso habitual (neutro, masas, equipos, etc.).</td></tr>
                    <tr><td><b>(26) Esquema de conexión a tierra:</b></td><td>Indicar cuál es el esquema utilizado (TT / TN-S / TN-C / TN-C-S / IT).</td></tr>
                    <tr><td><b>(27) Valor obtenido (Ω):</b></td><td>Indicar el valor en Ohm obtenido en la medición.</td></tr>
                    <tr><td><b>(28) Cumple con reglamentación:</b></td><td>Indicar si el resultado cumple con la Reglamentación AEA.</td></tr>
                    <tr><td><b>(29) Continuidad del circuito:</b></td><td>Indicar si el circuito de puesta a tierra es continuo y permanente.</td></tr>
                    <tr><td><b>(30) Capacidad de conducir corriente de falla:</b></td><td>Indicar si el circuito tiene capacidad de carga y resistencia adecuada.</td></tr>
                    <tr><td><b>(31) Protección contra contactos indirectos:</b></td><td>Indicar si se usa DD (diferencial), IA (interruptor automático) o FUS (fusible).</td></tr>
                    <tr><td><b>(32) Desconexión automática:</b></td><td>Indicar si el dispositivo de protección puede desconectar automáticamente el circuito.</td></tr>
                  </tbody>
                </table>
            </div>

            {/* Pagina de Imagenes (si las hay) */}
            {hayImagenes && (
                <div className="section-wrapper break-before">
                    <h2 className="section-title">Documentación Adjunta</h2>
                    <div className="imagenes-grid">
                        {imagenes.map((img, i) => (
                        <img key={i} src={img} alt={`Foto ${i}`} className="img-print" />
                        ))}
                    </div>
                </div>
            )}
          </div>
          
          <FirmaSection />
        </div>
      </div>
    </>
  );
}