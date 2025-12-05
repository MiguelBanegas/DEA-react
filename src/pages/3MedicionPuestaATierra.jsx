import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import html2pdf from "html2pdf.js";
import imageCompression from "browser-image-compression";
import Navbar from "../components/Navbar";
import { usePlanillas } from "../hooks/usePlanillas";
import "./Verificacion.css"; // Reusing styles for PDF consistency

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MedicionPuestaATierra = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // -------------------------
  // Estados principales
  // -------------------------
  const [idInforme, setIdInforme] = useState(localStorage.getItem("idInformePAT") || "");
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

  // imagenesAdjuntas: array de { file, preview }
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]);
  const imagenMapaRef = useRef(null);

  // Modal / UI state
  const [showNuevoModal, setShowNuevoModal] = useState(false);

  const { saveLocalAndMaybeSync } = usePlanillas();

  // -------------------------
  // Carga inicial (historial | localStorage)
  // -------------------------
  useEffect(() => {
    // 1) Si vengo desde historial con datos en location.state
    if (location.state && location.state.datosCargados) {
      const datos = location.state.datosCargados;
      console.log("Cargando datos desde historial:", datos);

      // Mapear campos sin romper formData existente
      const newFormData = { ...formData };
      Object.keys(newFormData).forEach((key) => {
        if (datos[key] !== undefined) {
          newFormData[key] = datos[key];
        }
      });

      // Especial: compatibilidad snake_case -> camelCase
      if (datos.razon_social) newFormData.razonSocial = datos.razon_social;
      if (datos.nombre_profesional) newFormData.nombreProfesional = datos.nombre_profesional;
      if (datos.apellido_profesional) newFormData.apellidoProfesional = datos.apellido_profesional;
      if (datos.numero_serie_instrumento) newFormData.numeroSerieInstrumento = datos.numero_serie_instrumento;

      setFormData(newFormData);

      // Ubicación si viene
      if (datos.latitud && datos.longitud) {
        setUbicacion({ lat: datos.latitud, lon: datos.longitud });
        const url = `${API_URL}/mapa-static?lat=${datos.latitud}&lon=${datos.longitud}`;
        setMapaUrl(url);
      }

      // Si location.state incluye id (mejor), usarlo y persistir
      if (location.state.id) {
        setIdInforme(location.state.id);
        localStorage.setItem("idInformePAT", location.state.id);
      } else if (datos.id) {
        // algunos endpoints devuelven id dentro del objeto meta
        setIdInforme(datos.id);
        localStorage.setItem("idInformePAT", datos.id);
      }

      // Si vienen imágenes en la planilla (por ejemplo historial)
      if (datos.images && Array.isArray(datos.images) && datos.images.length > 0) {
        // asumimos que son URLs
        const imgs = datos.images.map((url) => ({ file: null, preview: url }));
        setImagenesAdjuntas(imgs);
        localStorage.setItem("imagenesPAT", JSON.stringify(imgs.map(i => i.preview)));
      }

      // Clear navigation state para evitar re-carga accidental
      window.history.replaceState({}, document.title);
      return;
    }

    // 2) Si no, cargar desde localStorage si existe (modo "continuar")
    const savedData = localStorage.getItem("medicionFormData") || localStorage.getItem("MedicionPuestaATierra");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    } else {
      // default fecha si no hay nada
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, fechaMedicion: today }));
    }

    // Cargar ID guardado si existe
    const savedId = localStorage.getItem("idInformePAT");
    if (savedId) {
      setIdInforme(savedId);
    }

    // Cargar imágenes guardadas (previews)
    const imgsSaved = localStorage.getItem("imagenesPAT");
    if (imgsSaved) {
      try {
        const arr = JSON.parse(imgsSaved);
        const imgs = Array.isArray(arr) ? arr.map(url => ({ file: null, preview: url })) : [];
        setImagenesAdjuntas(imgs);
      } catch (err) {
        console.error("Error parsing imagenesPAT:", err);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]); // se ejecuta al montar y cuando location.state cambie

  // -------------------------
  // Persistencia: guardar formulario e id en localStorage (sin sobrescribir con null)
  // -------------------------
  useEffect(() => {
    try {
      localStorage.setItem("medicionFormData", JSON.stringify(formData));
      if (idInforme) {
        localStorage.setItem("idInformePAT", idInforme);
      }
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
  }, [formData, idInforme]);

  // Sincronizar previews de imágenes a localStorage (solo previews / URLs)
  useEffect(() => {
    try {
      const previews = imagenesAdjuntas.map(i => i.preview).filter(Boolean);
      localStorage.setItem("imagenesPAT", JSON.stringify(previews));
    } catch (err) {
      console.error("Error saving imagenesPAT:", err);
    }
  }, [imagenesAdjuntas]);

  // -------------------------
  // Google Maps Init
  // -------------------------
  useEffect(() => {
    window.initMap = initMap;
    return () => { window.initMap = undefined; };
  }, []);

  // -------------------------
  // Handlers
  // -------------------------
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

      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        // guardamos el objeto con preview (para mostrar) pero NO intentamos guardar el File en localStorage
        setImagenesAdjuntas((prev) => {
          const next = [...prev, { file: compressedFile, preview: reader.result }];
          return next;
        });
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
        const newBtn = confirmarBtn.cloneNode(true);
        confirmarBtn.parentNode.replaceChild(newBtn, confirmarBtn);

        newBtn.addEventListener("click", () => {
          if (marcador) {
            const lat = marcador.getPosition().lat().toFixed(6);
            const lon = marcador.getPosition().lng().toFixed(6);
            setUbicacion({ lat, lon });
            const url = `${API_URL}/mapa-static?lat=${lat}&lon=${lon}`;
            setMapaUrl(url);

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

  // -------------------------
  // Exportar a PDF con html2pdf
  // -------------------------
  const guardarComoPDF = () => {
    const element = document.getElementById("exportPDF");
    const noPrintElements = document.querySelectorAll(".no-print-pdf");
    noPrintElements.forEach((el) => (el.style.display = "none"));

    const dateElement = document.getElementById('pdfDate');
    if (dateElement) dateElement.style.display = 'block';

    element.classList.add("pdf-export");

    const allInputs = element.querySelectorAll('input, select, textarea');
    const inputReplacements = [];

    allInputs.forEach((input) => {
      if (input.type === "checkbox" || input.type === "radio" || input.type === "file" || input.type === "hidden") return;

      const span = document.createElement("span");
      span.className = input.className;
      span.style.cssText = window.getComputedStyle(input).cssText;
      span.style.display = "inline-block";
      span.style.minHeight = "20px";
      span.style.whiteSpace = "pre-wrap";

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

  // -------------------------
  // Guardado en Firebase / local sync
  // -------------------------
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

      // files para subir: solo los File objects
      const filesToUpload = imagenesAdjuntas.map(img => img.file).filter(Boolean);

      // saveLocalAndMaybeSync devuelve el id local (uuid) según tu hook
      const localId = await saveLocalAndMaybeSync(meta, filesToUpload);

      // Guardamos el id local como idInforme (esto permite imprimir/reimprimir aunque el remoteId llegue despues)
      if (localId) {
        setIdInforme(localId);
        localStorage.setItem("idInformePAT", localId);
      }

      alert("Informe guardado correctamente (local). Si estás online, se sincronizará.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Limpiar formulario
  // -------------------------
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
    localStorage.removeItem("imagenesPAT");
    // NOT removing id here (use Nuevo Informe flow to clear ID if desired)
  };

  const limpiarFormularioTotal = () => {
    limpiarFormulario();
    setIdInforme("");
    localStorage.removeItem("idInformePAT");
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <>
      <Navbar />
      <div className="container-fluid py-4 px-5">
        <div id="exportPDF" className="bg-white p-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
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
                      <div className="small text-muted mt-1" style={{ fontSize: '9px' }}>Lat: {ubicacion.lat}, Lon: {ubicacion.lon}</div>
                    </div>
                  )}

                  {imagenesAdjuntas.length > 0 && (
                    <div className="mt-2">
                      <div className="small fw-bold mb-1" style={{ fontSize: '10px' }}>Archivos Adjuntos:</div>
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

          {/* Vista previa de impresión: solo si hay idInforme */}
          {idInforme && (
            <button className="btn-imprimir no-print" onClick={() => navigate("/medicion-puesta-tierra-print")}>Vista previa de impresión</button>
          )}

          {/* Nuevo informe: solo si hay idInforme (según tu pedido) */}
          {idInforme && (
            <button className="btn btn-warning" onClick={() => setShowNuevoModal(true)}>Nuevo Informe</button>
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

      {/* Modal Nuevo Informe (simple) */}
      {showNuevoModal && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo Informe</h5>
                <button type="button" className="btn-close" onClick={() => setShowNuevoModal(false)}></button>
              </div>
              <div className="modal-body">
                ¿Querés limpiar todo y crear un informe nuevo desde cero?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowNuevoModal(false)}>Cancelar</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    limpiarFormularioTotal();
                    setShowNuevoModal(false);
                  }}
                >
                  Sí, crear nuevo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicionPuestaATierra;
