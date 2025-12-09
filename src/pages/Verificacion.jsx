import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import toast from 'react-hot-toast';
import { confirmar } from '../utils/confirmationToast';
import Navbar from "../components/Navbar";
import TablaMedicion from "../components/TablaMedicion";
import { usePlanillas } from "../hooks/usePlanillas";
import "./Verificacion.css";

const Verificacion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cliente: "",
    direccion: "",
    localidad: "",
    provincia: "",
    cuit: "",
    tipoInstalacion: "Industrial",
    sector: "General",
    fecha: "",
    responsableElectrico: "",
    matriculaElectrico: "",
    acompanhaElec: "",
    responsableHsma: "",
    matriculaHsma: "",
    acompanhaHsma: "",
    horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    horaFin: "",
  });

  const [filas, setFilas] = useState([
    { id: Date.now(), numeroToma: '', sector: '', descripcionTerreno: '', usoPuestaTierra: '', esquemaConexion: '', valorResistencia: '', cumple: '', continuidad: '', capacidadCarga: '', proteccionContactos: '', desconexionAutomatica: '' }
  ]);
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]);
  const [imagenesCargando, setImagenesCargando] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState([]);

  const { saveOrUpdateLocalPlanilla } = usePlanillas();
  const location = useLocation();
  const [informeId, setInformeId] = useState(null);

  // Genera un ID temporal para informes nuevos, asegurando que cada uno sea único
  const generarIdTemporal = () => `VERIF-${Date.now()}`;

  useEffect(() => {
    // Si viene desde historial, cargar los datos
    if (location.state && location.state.datosCargados) {
      const datos = location.state.datosCargados;
      const id = location.state.localId;
      
      setInformeId(id);
      
      // Cargar formData
      const newFormData = { ...formData };
      Object.keys(newFormData).forEach(key => {
        if (datos[key] !== undefined) newFormData[key] = datos[key];
      });
      setFormData(newFormData);

      // Cargar filas
      if (datos.filas && Array.isArray(datos.filas)) {
        setFilas(datos.filas);
      }

      // Cargar imágenes
      const imagenesDesdeEstado = location.state.imagenes || [];
      const urlsDesdeMeta = datos.images || [];

      const procesarFiles = async (files) => {
        setImagenesCargando(true);
        const promises = files.map(file => new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve({ file, preview: e.target.result });
          reader.readAsDataURL(file);
        }));
        const processed = await Promise.all(promises);
        setImagenesAdjuntas(processed);
        setImagenesCargando(false);
      };

      const procesarUrls = (urlObjects) => {
        const mapped = urlObjects.map(imgObj => ({
          file: null,
          preview: imgObj.url
        }));
        setImagenesAdjuntas(mapped);
      };

      if (imagenesDesdeEstado.length > 0) {
        procesarFiles(imagenesDesdeEstado);
      } else if (urlsDesdeMeta.length > 0) {
        procesarUrls(urlsDesdeMeta);
      }
      
      window.history.replaceState({}, document.title);
      return;
    }

    // Si es un informe nuevo, limpiar todo y generar un ID temporal
    limpiarDatos(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.loading(`Procesando ${files.length} imágen(es)...`, { id: 'compressing' });

    const promises = Array.from(files).map(async (file) => {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(compressed);
          reader.onloadend = () => {
            resolve({ file: compressed, preview: reader.result });
          };
        });

      } catch (err) {
        console.error("Error comprimiendo imagen:", err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(Boolean);

    setImagenesAdjuntas((prev) => [...prev, ...validResults]);
    toast.success(`${validResults.length} imágen(es) adjuntada(s).`, { id: 'compressing' });
  };

  const handleDeleteImage = async (index) => {
      if (!await confirmar("¿Borrar imagen?", "Esta imagen se quitará del informe al guardar.")) return;
      
      setImagenesAdjuntas(prev => {
          const newImgs = [...prev];
          const deletedImg = newImgs[index];
          
          let deletedUrl = null;
          if (deletedImg && deletedImg.preview) {
              deletedUrl = deletedImg.preview;
          }
          
          if (deletedUrl && deletedUrl.includes('uploads/')) {
              const filename = deletedUrl.split('/').pop();
              if (filename) {
                  setDeletedFiles(curr => [...curr, filename]);
              }
          }

          newImgs.splice(index, 1);
          return newImgs;
      });
  };

  const agregarFila = () => {
    const nuevaFila = {
      id: Date.now() + Math.random(), // Ensure unique ID
      numeroToma: '', sector: '', descripcionTerreno: '', usoPuestaTierra: '', esquemaConexion: '', valorResistencia: '', cumple: '', continuidad: '', capacidadCarga: '', proteccionContactos: '', desconexionAutomatica: ''
    };
    setFilas([...filas, nuevaFila]);
  };

  const handleFilaChange = (index, field, value) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index][field] = value;
    setFilas(nuevasFilas);
  };

  const handleFilaDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta fila?')) {
      setFilas(filas.filter(fila => fila.id !== id));
    }
  };

  const handlePrintPreview = () => {
    // Guardar los datos necesarios para la impresión en localStorage
    localStorage.setItem('verificacionFormData', JSON.stringify(formData));
    localStorage.setItem('verificacionFilas', JSON.stringify(filas));
    localStorage.setItem('verificacionId', informeId);
    
    const imagenesBase64 = imagenesAdjuntas.map(img => img.preview);
    localStorage.setItem('verificacionImagenes', JSON.stringify(imagenesBase64));
    
    navigate("/verificacion-print");
  };

  const limpiarDatos = (generarNuevoId = false) => {
    setFormData({
      cliente: "",
      direccion: "",
      localidad: "",
      provincia: "",
      cuit: "",
      tipoInstalacion: "Industrial",
      sector: "General",
      fecha: new Date().toISOString().split("T")[0],
      responsableElectrico: "",
      matriculaElectrico: "",
      acompanhaElec: "",
      responsableHsma: "",
      matriculaHsma: "",
      acompanhaHsma: "",
      horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      horaFin: "",
    });
    
    setFilas([
      { id: Date.now(), numeroToma: '', sector: '', descripcionTerreno: '', usoPuestaTierra: '', esquemaConexion: '', valorResistencia: '', cumple: '', continuidad: '', capacidadCarga: '', proteccionContactos: '', desconexionAutomatica: '' }
    ]);
    
    setImagenesAdjuntas([]);
    setDeletedFiles([]);
    
    localStorage.removeItem('verificacionFormData'); // For print legacy
    localStorage.removeItem('verificacionFilas');

    if (generarNuevoId) {
      setInformeId(generarIdTemporal());
    } else {
      setInformeId(null);
    }
  };

  const guardarEnFirebase = async () => {
    if (!window.confirm('¿Desea guardar el informe en la base de datos?')) return;

    try {
      const newFiles = imagenesAdjuntas.filter(i => i.file).map(i => i.file);
      const existingUrls = imagenesAdjuntas.filter(i => !i.file).map(i => i.preview);

      const meta = {
        ...formData,
        filas,
        tipo: 'verificacion',
        fechaCreacion: new Date().toISOString(),
        images: existingUrls,
      };
      
      const result = await saveOrUpdateLocalPlanilla(meta, newFiles, informeId);

      if (result.remoteId) {
        setInformeId(result.remoteId);
        
        if (result.planilla && result.planilla.images) {
            const nuevasImgs = result.planilla.images.map(url => ({ file: null, preview: url }));
            setImagenesAdjuntas(nuevasImgs);
        }

        // Logic to delete orphaned files on the server can be added here if needed
        // For now, we just clear the local list.
        setDeletedFiles([]);

        toast.success(`Informe guardado EXITOSAMENTE.\nID: ${result.remoteId}`, { duration: 4000 });
      } else {
        toast("Guardado LOCALMENTE (Offline).\nSe sincronizará al conectar.", { icon: '⚠️', duration: 5000 });
      }

    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar el informe: ' + error.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-4">
        <div id="exportPDF" className="bg-white p-4"> 
          <h2 className="h2" style={{ textAlign: "center" }}> Verificación Eléctrica</h2>
          <div id="pdfDate" style={{ display: 'none', textAlign: 'right', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>
            Fecha: {new Date().toLocaleDateString('es-AR')}
          </div>
              <hr />
          <div className="row mb-3" style={{ padding: '0mm' }}>
            <div className="col-12 mb-3"> 
              <div className="border rounded p-3 bg-light">
                <h5 className="mb-3">Datos del Cliente</h5>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <b>Cliente:</b>
                    <input
                      type="text"
                      name="cliente"
                      value={formData.cliente}
                      onChange={handleChange}
                      className="form-control-plaintext border-bottom d-inline-block w-75 ms-2 pdf-uppercase"
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <b>Dirección:</b>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      className="form-control-plaintext border-bottom d-inline-block w-75 ms-2 pdf-uppercase"
                      placeholder="Dirección"
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <b>Localidad:</b>
                    <input
                      type="text"
                      name="localidad"
                      value={formData.localidad}
                      onChange={handleChange}
                      className="form-control-plaintext border-bottom d-inline-block w-75 ms-2 pdf-uppercase"
                      placeholder="Localidad"
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <b>Pcia.:</b>
                    <input
                      type="text"
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleChange}
                      className="form-control-plaintext border-bottom d-inline-block w-75 ms-2 pdf-uppercase"
                      placeholder="Provincia"
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <b>CUIT:</b>
                    <input
                      type="text"
                      name="cuit"
                      value={formData.cuit}
                      onChange={handleChange}
                      className="form-control-plaintext border-bottom d-inline-block w-75 ms-2 pdf-uppercase"
                      placeholder="CUIT"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 mb-3">
              <div className="border rounded p-3 bg-light">
                <h5 className="mb-3">Relevamiento de Instalación Eléctrica</h5>
                <div className="mb-2"><b>Check list</b></div>
                
                <div className="row mb-2">
                  <div className="col-md-6">
                    <label className="form-label">Tipo de instalación:</label>
                    <select
                      name="tipoInstalacion"
                      value={formData.tipoInstalacion}
                      onChange={handleChange}
                      className="form-select form-select-sm"
                    >
                      <option value="Industrial">Industrial</option>
                      <option value="Nave Industrial">Nave Industrial</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Residencial">Residencial</option>
                      <option value="Depósito">Depósito</option>
                      <option value="Oficinas">Oficinas</option>
                      <option value="Hospitalario">Usos Medicos</option>
                      <option value="Educativo">Educativo</option>
                      <option value="Org. Estatal">Org. Estatal</option>
                      <option value="Rural">Rural</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sector:</label>
                    <input
                      name="sector"
                      type="text"
                      value={formData.sector}
                      onChange={handleChange}
                      className="form-control form-control-sm pdf-uppercase"
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="me-2">Fecha:</label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className="form-control form-control-sm d-inline-block w-auto"
                  />
                </div>

                <div className="border rounded p-2 mb-2 bg-white">
                  <div className="mb-1">
                    <label>Responsable de la instalación eléctrica:</label>
                    <input
                      type="text"
                      name="responsableElectrico"
                      value={formData.responsableElectrico}
                      onChange={handleChange}
                      className="form-control form-control-sm pdf-uppercase"
                    />
                  </div>
                  <div className="mb-1">
                    <label>Matrícula profesional:</label>
                    <input
                      type="text"
                      name="matriculaElectrico"
                      value={formData.matriculaElectrico}
                      onChange={handleChange}
                      className="form-control form-control-sm pdf-uppercase"
                    />
                  </div>
                  <div className="mb-1">
                    <span className="me-2">Acompaña recorrido:</span>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="acompanhaElec" value="Si" onChange={handleChange} checked={formData.acompanhaElec === "Si"} />
                      <label className="form-check-label">Sí</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="acompanhaElec" value="No" onChange={handleChange} checked={formData.acompanhaElec === "No"} />
                      <label className="form-check-label">No</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="acompanhaElec" value="Ausente" onChange={handleChange} checked={formData.acompanhaElec === "Ausente"} />
                      <label className="form-check-label">Ausente</label>
                    </div>
                  </div>
                </div>

                <div className="border rounded p-2 mb-2 bg-white">
                  <div className="mb-1">
                    <label>Responsable HSMA:</label>
                    <input
                      type="text"
                      name="responsableHsma"
                      value={formData.responsableHsma}
                      onChange={handleChange}
                      className="form-control form-control-sm pdf-uppercase"
                    />
                  </div>
                  <div className="mb-1">
                    <label>Matrícula profesional:</label>
                    <input
                      type="text"
                      name="matriculaHsma"
                      value={formData.matriculaHsma}
                      onChange={handleChange}
                      className="form-control form-control-sm pdf-uppercase"
                    />
                  </div>
                  <div className="mb-1">
                    <span className="me-2">Acompaña recorrido:</span>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="acompanhaHsma" value="Si" onChange={handleChange} checked={formData.acompanhaHsma === "Si"} />
                      <label className="form-check-label">Sí</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="acompanhaHsma" value="No" onChange={handleChange} checked={formData.acompanhaHsma === "No"} />
                      <label className="form-check-label">No</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="acompanhaHsma" value="Ausente" onChange={handleChange} checked={formData.acompanhaHsma === "Ausente"} />
                      <label className="form-check-label">Ausente</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-6">
                    <label>Hora inicio:</label>
                    <input
                      type="time"
                      name="horaInicio"
                      value={formData.horaInicio}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <div className="col-6">
                    <label>Hora fin:</label>
                    <input
                      type="time"
                      name="horaFin"
                      value={formData.horaFin}
                      onChange={handleChange}
                      className="form-control form-control-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENTACIÓN ADJUNTA */}
          <div className="card mb-3 no-print-pdf">
            <div className="card-header bg-light py-2 px-3 fw-bold">
              Documentación Adjunta (Fotos)
            </div>
            <div className="card-body py-2 px-3">
              <div>
                <label htmlFor="upload-input" className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-paperclip me-1"></i> Adjuntar Archivo(s)
                </label>
                <input
                  id="upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="d-none"
                  onChange={handleImageUpload}
                />
              </div>

              {/* PREVIEW IMÁGENES */}
              {imagenesAdjuntas.length > 0 && (
                <div className="mt-3">
                  <div className="d-flex flex-wrap gap-2">
                    {imagenesAdjuntas.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                          <img
                            src={img.preview}
                            alt="Adjunto"
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                            }}
                            className="img-thumbnail"
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm p-0 d-flex justify-content-center align-items-center"
                            style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                fontSize: '12px'
                            }}
                            onClick={() => handleDeleteImage(idx)}
                          >
                            &times;
                          </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div id="contenedorTabla" className="my-3">
            <h4>Datos de la Medición</h4>
            <TablaMedicion 
              filas={filas} 
              onFilaChange={handleFilaChange} 
              onFilaDelete={handleFilaDelete}
            />
            
            <div className="mt-3 no-print-pdf">
              <button className="btn btn-primary me-2" onClick={agregarFila}>Agregar Fila</button>
              <button className="btn btn-secondary me-2" onClick={handlePrintPreview} disabled={imagenesCargando}>
                {imagenesCargando ? 'Cargando...' : 'Vista Previa Impresión'}
              </button>
              <button className="btn btn-info" onClick={guardarEnFirebase}>Guardar</button>
            </div>
          </div>

          <div className="pdf-pagebreak"></div>
          
          <div id="referencias" className="my-3">
            <h5>Referencias de columnas</h5>
            <table className="table table-bordered table-sm small">
              <tbody>
                <tr><td><b>(22) N° de toma de tierra:</b></td><td>Indicar mediante un número la toma a tierra donde se realiza la
medición, el cual deberá coincidir con el del plano o croquis
que se adjunta a la medición.</td></tr>
                <tr><td><b>(23) Sector:</b></td><td>Indicar el sector o la sección dentro de la empresa donde se realiza la medición.</td></tr>
                <tr><td><b>(24) Descripción del terreno:</b></td><td>Indicar o describir la condición del terreno al momento de la medición (lecho seco, arenoso seco o húmedo, lluvias recientes,
turba, limo, pantanoso, etc.).</td></tr>
                <tr><td><b>(25) Uso de la puesta a tierra:</b></td><td>Indicar el uso habitual, como puesta a tierra del neutro de transformador, seguridad de masas, protección de equipos
 electrónicos, informática, iluminación, pararrayos, otros.</td></tr>
                <tr><td><b>(26) Esquema de conexión a tierra:</b></td><td>Indicar cuál es el esquema utilizado (TT / TN-S / TN-C / TN-C-S / IT).</td></tr>
                <tr><td><b>(27) Valor obtenido (Ω):</b></td><td>Indicar el valor en Ohm obtenido en la medición de resistencia
de puesta a tierra de las masas.</td></tr>
                <tr><td><b>(28) Cumple con reglamentación:</b></td><td>Indicar si el resultado cumple con la Reglamentación de la
Asociación Argentina de Electrotécnicos para instalaciones eléctricas en inmuebles.</td></tr>
                <tr><td><b>(29) Continuidad del circuito:</b></td><td>Indicar si el circuito de puesta a tierra es continuo y permanente.</td></tr>
                <tr><td><b>(30) Capacidad de conducir corriente de falla:</b></td><td>Indicar si el circuito tiene capacidad de carga y resistencia adecuada para conducir la corriente de falla.</td></tr>
                <tr><td><b>(31) Protección contra contactos indirectos:</b></td><td>Indicar si se usa DD (diferencial), IA (interruptor automático) o FUS (fusible).</td></tr>
                <tr><td><b>(32) Desconexión automática:</b></td><td>Indicar si el dispositivo de protección puede desconectar
automáticamente el circuito dentro de los tiempos establecidos por la normativa.</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mt-5 d-flex justify-content-end">
            <div className="border p-3 d-flex align-items-center justify-content-center" style={{ width: "300px", height: "100px" }}>
              <img src="../public/img/FIRMADIGITAL.png" alt="Firma digital" style={{ maxHeight: "80px", maxWidth: "100%" }} onError={(e) => e.target.style.display = 'none'} />
            </div>
          </div>
        </div>
      </div>
    </> 
  );
};

export default Verificacion;
