import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import html2pdf from "html2pdf.js";
import imageCompression from "browser-image-compression";
import Navbar from "../components/Navbar";
import { usePlanillas } from "../hooks/usePlanillas";
import "./Verificacion.css"; // Reusing styles for PDF consistency

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MedicionPuestaATierra = () => {
  const navigate = useNavigate();
  const idInforme = localStorage.getItem("idInformePAT");

  const [formData, setFormData] = useState({
    razonSocial: "",
    cuit: "",
    direccion: "",
    localidad: "",
    cp: "",
    provincia: "",
    nombreProfesional: "",
    apellidoProfesional: "",
    matriculaProfesional: "",
    incumbenciasEspecificas: "Técnico eléctrico",
    documentacionIncumbencias: "si",
    rangoKv: "13.2",
    pagoMatricula: "si",
    seguroAccidentes: "si",
    pagoSeguro: "si",
    marcaInstrumento: "",
    modeloInstrumento: "",
    numeroSerieInstrumento: "",
    tipoInstrumento: "MFT",
    cumpleIec: "si",
    certificadoFabricante: "si",
    condicionesUso: "si",
    fechaMedicion: "",
    horaInicio: "",
    horaFin: "",
    metodologia: "",
    observaciones: "",
    certificadoCalibracion: "si",
    planoCroquis: "si",
  });

  const [ubicacion, setUbicacion] = useState({ lat: null, lon: null });
  const [mapaUrl, setMapaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]);
  
  const imagenMapaRef = useRef(null);
  const { saveLocalAndMaybeSync } = usePlanillas();
  const location = useLocation();

  // Load data logic
  useEffect(() => {
    if (location.state && location.state.datosCargados) {
      const datos = location.state.datosCargados;
      console.log("Cargando datos desde historial:", datos);
      const newFormData = { ...formData };
      Object.keys(newFormData).forEach((key) => {
        if (datos[key] !== undefined) {
          newFormData[key] = datos[key];
        }
      });
      // Handle special field mapping if necessary (e.g. camelCase vs snake_case from old DB)
      if (datos.razon_social) newFormData.razonSocial = datos.razon_social;
      if (datos.nombre_profesional) newFormData.nombreProfesional = datos.nombre_profesional;
      // ... add other mappings if the DB uses snake_case

      setFormData(newFormData);
      if (datos.latitud && datos.longitud) {
        setUbicacion({ lat: datos.latitud, lon: datos.longitud });
      }
      
      // Clear navigation state
      window.history.replaceState({}, document.title);
      return;
    }

    const savedData = localStorage.getItem("medicionFormData");
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    } else {
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, fechaMedicion: today }));
    }
  }, [location.state]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("medicionFormData", JSON.stringify(formData));
    localStorage.setItem("idInformePAT", idInforme);
  }, [formData]);

  // Google Maps Init
  useEffect(() => {
    window.initMap = initMap;
    return () => { window.initMap = undefined; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      // For now, just store the file object to be uploaded later or displayed
      // In a real app, you might want to convert to base64 for preview
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        setImagenesAdjuntas((prev) => [...prev, { file: compressedFile, preview: reader.result }]);
      };
    } catch (error) {
      console.error("Error compressing image:", error);
    }
  };

  const generarImagenMapa = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lon = pos.coords.longitude.toFixed(6);
          setUbicacion({ lat, lon });
          
          // Use static map API or backend proxy
          // const apiKey = 'YOUR_API_KEY'; 
          // const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=16&size=400x200&markers=color:red%7C${lat},${lon}&key=${apiKey}`;
          const url = `${API_URL}/mapa-static?lat=${lat}&lon=${lon}`;
          setMapaUrl(url);
        },
        (err) => alert("No se pudo obtener la ubicación.")
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
    }
  };

  const initMap = () => {
    try {
      const mapaInteractivoEl = document.getElementById("mapaInteractivo");
      if (!mapaInteractivoEl || !window.google) return;
      const map = new window.google.maps.Map(mapaInteractivoEl, {
        center: { lat: -34.603722, lng: -58.381592 },
        zoom: 8,
      });
      let marcador = null;
      window.google.maps.event.addListener(map, "click", function (event) {
        if (marcador) marcador.setMap(null);
        marcador = new window.google.maps.Marker({ position: event.latLng, map });
      });

      const confirmarBtn = document.getElementById("confirmarUbicacionBtn");
      if (confirmarBtn) {
        // Clone to remove old listeners if any (simple hack)
        const newBtn = confirmarBtn.cloneNode(true);
        confirmarBtn.parentNode.replaceChild(newBtn, confirmarBtn);
        
        newBtn.addEventListener("click", () => {
          if (marcador) {
            const lat = marcador.getPosition().lat().toFixed(6);
            const lon = marcador.getPosition().lng().toFixed(6);
            setUbicacion({ lat, lon });
            const url = `${API_URL}/mapa-static?lat=${lat}&lon=${lon}`;
            setMapaUrl(url);
            
            // Close modal
            const modalEl = document.getElementById("modalMapa");
            const modal = window.bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
          } else {
            alert("Selecciona una ubicación en el mapa.");
          }
        });
      }
    } catch (err) {
      console.error("Error initMap", err);
    }
  };

  const guardarComoPDF = () => {
    const element = document.getElementById("exportPDF");
    const noPrintElements = document.querySelectorAll(".no-print-pdf");
    noPrintElements.forEach((el) => (el.style.display = "none"));
    
    // Show date for PDF
    const dateElement = document.getElementById('pdfDate');
    if (dateElement) dateElement.style.display = 'block';

    element.classList.add("pdf-export");

    // Input replacement logic (same as Verificacion.jsx)
    const allInputs = element.querySelectorAll('input, select, textarea');
    const inputReplacements = [];

    allInputs.forEach((input) => {
      if (input.type === "checkbox" || input.type === "radio" || input.type === "file" || input.type === "hidden") return;

      const span = document.createElement("span");
      span.className = input.className;
      span.style.cssText = window.getComputedStyle(input).cssText;
      span.style.display = "inline-block";
      span.style.minHeight = "20px";
      span.style.whiteSpace = "pre-wrap"; // Preserve line breaks for textareas

      let displayValue = input.value;
      if (input.tagName === "SELECT") {
        const selectedOption = input.options[input.selectedIndex];
        displayValue = selectedOption ? selectedOption.text : "";
      }
      
      if (input.classList.contains('pdf-uppercase')) {
        displayValue = displayValue.toUpperCase();
      }

      span.textContent = displayValue || "\u00A0";
      
      inputReplacements.push({ original: input, replacement: span, parent: input.parentNode });
      input.parentNode.replaceChild(span, input);
    });

    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Protocolo_PAT_${formData.razonSocial || "SinNombre"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    const worker = html2pdf().set(opt).from(element);

    worker.toPdf().get('pdf').then(function(pdf) {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
    }).save().then(() => {
      inputReplacements.forEach(({ original, replacement, parent }) => {
        parent.replaceChild(original, replacement);
      });
      noPrintElements.forEach((el) => (el.style.display = ""));
      if (dateElement) dateElement.style.display = 'none';
      element.classList.remove("pdf-export");
      
      if (window.confirm('PDF generado. ¿Desea limpiar los datos?')) {
         limpiarFormulario();
      }
    });
  };

  const guardarEnFirebase = async () => {
    if (!window.confirm("¿Guardar informe en base de datos?")) return;
    setLoading(true);
    try {
      const meta = {
        ...formData,
        tipo: "puesta-tierra",
        latitud: ubicacion.lat,
        longitud: ubicacion.lon,
        fechaCreacion: new Date().toISOString(),
      };

      // Pass images as the second argument to be uploaded
      const filesToUpload = imagenesAdjuntas.map(img => img.file);

      await saveLocalAndMaybeSync(meta, filesToUpload);
      alert("Informe guardado correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      razonSocial: "", cuit: "", direccion: "", localidad: "", cp: "", provincia: "",
      nombreProfesional: "", apellidoProfesional: "", matriculaProfesional: "",
      incumbenciasEspecificas: "Técnico eléctrico", documentacionIncumbencias: "si",
      rangoKv: "13.2", pagoMatricula: "si", seguroAccidentes: "si", pagoSeguro: "si",
      marcaInstrumento: "", modeloInstrumento: "", numeroSerieInstrumento: "",
      tipoInstrumento: "MFT", cumpleIec: "si", certificadoFabricante: "si", condicionesUso: "si",
      fechaMedicion: new Date().toISOString().split("T")[0], horaInicio: "", horaFin: "",
      metodologia: "", observaciones: "", certificadoCalibracion: "si", planoCroquis: "si",
    });
    setUbicacion({ lat: null, lon: null });
    setMapaUrl(null);
    setImagenesAdjuntas([]);
    localStorage.removeItem("medicionFormData");
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid py-4 px-5">
        <div id="exportPDF" className="bg-white p-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
             {/* <img src="/img/logo5.jpeg" alt="Logo" style={{ width: "70px" }} /> */}
             <div className="d-flex justify-content-between align-items-center w-100">
                <h2 className="h6 mb-0">Protocolo de Medición de Puesta a Tierra</h2>
                <div id="pdfDate" style={{ display: 'none', fontSize: '11px' }}>
                  Fecha: {new Date().toLocaleDateString('es-AR')}
                </div>
             </div>
          </div>

          <form className="small-form">
            {/* Primera sección - mantener junta */}
            <div className="first-page-content">
              {/* Datos del Cliente */}
              <div className="card mb-2 page-break-keep">
                <div className="card-header bg-light py-1 px-2 fw-bold small">Datos del Cliente</div>
              <div className="card-body py-2 px-3">
                <div className="row g-1">
                  <div className="col-md-4">
                    <label className="form-label small mb-0">Razón Social</label>
                    <input type="text" name="razonSocial" className="form-control form-control-sm pdf-uppercase" value={formData.razonSocial} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">C.U.I.T.</label>
                    <input type="text" name="cuit" className="form-control form-control-sm pdf-uppercase" value={formData.cuit} onChange={handleChange} />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small mb-0">Dirección</label>
                    <input type="text" name="direccion" className="form-control form-control-sm pdf-uppercase" value={formData.direccion} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small mb-0">Localidad</label>
                    <input type="text" name="localidad" className="form-control form-control-sm pdf-uppercase" value={formData.localidad} onChange={handleChange} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">CP</label>
                    <input type="text" name="cp" className="form-control form-control-sm pdf-uppercase" value={formData.cp} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Provincia</label>
                    <select name="provincia" className="form-select form-select-sm" value={formData.provincia} onChange={handleChange}>
                      <option value="">Seleccionar</option>
                      <option value="Buenos Aires">Buenos Aires</option>
                      <option value="CABA">CABA</option>
                      <option value="Córdoba">Córdoba</option>
                      <option value="Santa Fe">Santa Fe</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Fecha Medición</label>
                    <input type="date" name="fechaMedicion" className="form-control form-control-sm" value={formData.fechaMedicion} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del Profesional */}
            <div className="card mb-2 page-break-keep">
              <div className="card-header bg-light py-1 px-2 fw-bold small">Datos del Profesional</div>
              <div className="card-body py-2 px-3">
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Nombre</label>
                    <input type="text" name="nombreProfesional" className="form-control form-control-sm pdf-uppercase" value={formData.nombreProfesional} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Apellido</label>
                    <input type="text" name="apellidoProfesional" className="form-control form-control-sm pdf-uppercase" value={formData.apellidoProfesional} onChange={handleChange} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Matrícula</label>
                    <input type="text" name="matriculaProfesional" className="form-control form-control-sm pdf-uppercase" value={formData.matriculaProfesional} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small mb-0">Incumbencias</label>
                    <select name="incumbenciasEspecificas" className="form-select form-select-sm" value={formData.incumbenciasEspecificas} onChange={handleChange}>
                      <option value="Técnico eléctrico">Técnico eléctrico</option>
                      <option value="Ingeniero eléctrico">Ingeniero eléctrico</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Rango KV</label>
                    <select name="rangoKv" className="form-select form-select-sm" value={formData.rangoKv} onChange={handleChange}>
                      <option value="13.2">13,2 KV técnicos</option>
                      <option value="mas_13.2">Más de 13,2 KV inges.</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Doc. Incumb.</label>
                    <select name="documentacionIncumbencias" className="form-select form-select-sm" value={formData.documentacionIncumbencias} onChange={handleChange}>
                      <option value="si">Si</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Pago Mat.</label>
                    <select name="pagoMatricula" className="form-select form-select-sm" value={formData.pagoMatricula} onChange={handleChange}>
                      <option value="si">Si</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Seguro Acc.</label>
                    <select name="seguroAccidentes" className="form-select form-select-sm" value={formData.seguroAccidentes} onChange={handleChange}>
                      <option value="si">Si</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Pago Seguro</label>
                    <select name="pagoSeguro" className="form-select form-select-sm" value={formData.pagoSeguro} onChange={handleChange}>
                      <option value="si">Si</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del Instrumento */}
            <div className="card mb-2 page-break-keep">
              <div className="card-header bg-light py-1 px-2 fw-bold small">Datos del Instrumento</div>
              <div className="card-body py-2 px-3">
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Marca</label>
                    <input type="text" name="marcaInstrumento" className="form-control form-control-sm pdf-uppercase" value={formData.marcaInstrumento} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Modelo</label>
                    <input type="text" name="modeloInstrumento" className="form-control form-control-sm pdf-uppercase" value={formData.modeloInstrumento} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">N° Serie</label>
                    <input type="text" name="numeroSerieInstrumento" className="form-control form-control-sm pdf-uppercase" value={formData.numeroSerieInstrumento} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Tipo</label>
                    <select name="tipoInstrumento" className="form-select form-select-sm" value={formData.tipoInstrumento} onChange={handleChange}>
                      <option value="MFT">MFT</option>
                      <option value="Telurímetro">Telurímetro</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Cumple IEC 61557</label>
                    <select name="cumpleIec" className="form-select form-select-sm" value={formData.cumpleIec} onChange={handleChange}>
                      <option value="si">Si</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Cert. Fabricante</label>
                    <select name="certificadoFabricante" className="form-select form-select-sm" value={formData.certificadoFabricante} onChange={handleChange}>
                      <option value="si">Si</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Cond. Uso (Nuevo)</label>
                    <select name="condicionesUso" className="form-select form-select-sm" value={formData.condicionesUso} onChange={handleChange}>
                      <option value="si">Si</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                   <div className="col-md-3">
                      <label className="form-label small mb-0">Cert. Calibración</label>
                      <select name="certificadoCalibracion" className="form-select form-select-sm" value={formData.certificadoCalibracion} onChange={handleChange}>
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                   </div>
                </div>
              </div>
            </div>
            </div>

            {/* Segunda sección - puede ir a siguiente página */}
            <div className="second-page-content">
            {/* Datos de la Medición */}
            <div className="card mb-2 page-break-keep">
              <div className="card-header bg-light py-1 px-2 fw-bold small">Datos de la Medición</div>
              <div className="card-body py-2 px-3">
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Hora Inicio</label>
                    <input type="time" name="horaInicio" className="form-control form-control-sm" value={formData.horaInicio} onChange={handleChange} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Hora Fin</label>
                    <input type="time" name="horaFin" className="form-control form-control-sm" value={formData.horaFin} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-0">Metodología</label>
                    <textarea name="metodologia" className="form-control form-control-sm pdf-uppercase" rows="1" value={formData.metodologia} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label small mb-0">Observaciones</label>
                    <textarea name="observaciones" className="form-control form-control-sm pdf-uppercase" rows="2" value={formData.observaciones} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentación Adjunta */}
            <div className="card mb-2">
              <div className="card-header bg-light py-1 px-2 fw-bold small">Documentación Adjunta</div>
              <div className="card-body py-2 px-3">
                <div className="row g-2 align-items-center">
                   <div className="col-md-3">
                      <label className="form-label small mb-0">Plano / Croquis</label>
                      <select name="planoCroquis" className="form-select form-select-sm" value={formData.planoCroquis} onChange={handleChange}>
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                   </div>
                   <div className="col-md-9 no-print-pdf">
                      <div className="d-flex gap-2 align-items-end">
                         <div>
                           <label className="form-label small mb-0">Ubicación</label>
                           <div className="d-flex gap-2">
                             <button type="button" className="btn btn-secondary btn-sm" onClick={generarImagenMapa}>Obtener Ubicación</button>
                             <button type="button" className="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalMapa">Mapa Manual</button>
                           </div>
                         </div>
                         <div>
                           <label className="form-label small mb-0">Adjuntar Imagen</label>
                           <input type="file" accept="image/*" className="form-control form-control-sm" onChange={handleImageUpload} />
                         </div>
                      </div>
                   </div>
                </div>
                
                {mapaUrl && (
                  <div className="mt-2 text-center">
                    <img src={mapaUrl} alt="Mapa Ubicación" style={{ maxWidth: '100%', maxHeight: '150px', border: '1px solid #ccc' }} />
                    <div className="small text-muted mt-1" style={{fontSize: '9px'}}>Lat: {ubicacion.lat}, Lon: {ubicacion.lon}</div>
                  </div>
                )}

                {imagenesAdjuntas.length > 0 && (
                  <div className="mt-2">
                    <div className="small fw-bold mb-1" style={{fontSize: '10px'}}>Archivos Adjuntos:</div>
                    <div className="d-flex flex-wrap gap-2">
                      {imagenesAdjuntas.map((img, idx) => (
                        <img key={idx} src={img.preview} alt="Adjunto" style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="img-thumbnail" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Firma */}
            <div className="mt-2 text-end">
               <img src="/img/FIRMADIGITAL.png" alt="Firma" style={{ width: '120px' }} />
            </div>
            </div>

          </form>
        </div>

        {/* Botones de Acción */}
        <div className="d-flex justify-content-end gap-2 mt-4 no-print-pdf">
           <button className="btn btn-danger" onClick={limpiarFormulario}>Limpiar</button>
           <button className="btn btn-success" onClick={guardarComoPDF}>Exportar PDF</button>
           <button className="btn btn-info text-white" onClick={guardarEnFirebase} disabled={loading}>
             {loading ? 'Guardando...' : 'Guardar en Firebase'}
           </button>
          {idInforme && (
            <button className="btn-imprimir no-print" onClick={() => navigate("/medicion-puesta-tierra-print")}>Vista previa de impresión</button>
          )}

        </div>

      </div>

      {/* Modal Mapa */}
      <div className="modal fade" id="modalMapa" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Seleccionar Ubicación</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div id="mapaInteractivo" style={{ height: "400px", width: "100%" }}></div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" className="btn btn-primary" id="confirmarUbicacionBtn">Confirmar Ubicación</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MedicionPuestaATierra;
