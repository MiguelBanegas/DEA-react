import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import html2pdf from "html2pdf.js";
import imageCompression from "browser-image-compression";
import Navbar from "../components/Navbar";
import { usePlanillas } from "../hooks/usePlanillas";
import "./Verificacion.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MedicionPuestaATierra = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Función para generar un ID temporal único
  const generarIdTemporal = () => {
    return `TEMP-ID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Nuevo: id real del informe cargado desde historial (corregido el nombre del parámetro)
  const idInformeFromHistorial = location.state?.informeId || location.state?.idInforme || null;

  // Nuevo: id almacenado localmente (si estás en un formulario que ya venías completando)
  const idLocal = localStorage.getItem("idInformePAT");

  // Nuevo: selecciona el id correcto según la lógica, o genera uno temporal
  const [idInforme, setIdInforme] = useState(idInformeFromHistorial || idLocal || generarIdTemporal());

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

  // ================================
  // 1) CARGA INICIAL SEGÚN SI ES NUEVO O DESDE HISTORIAL
  // ================================
  useEffect(() => {
    // Si viene desde historial
    if (location.state && location.state.datosCargados) {
      const datos = location.state.datosCargados;

      setIdInforme(idInformeFromHistorial);
      localStorage.setItem("idInformePAT", idInformeFromHistorial);

      const updated = { ...formData };
      Object.keys(updated).forEach((k) => {
        if (datos[k] !== undefined) updated[k] = datos[k];
      });

      if (datos.razon_social) updated.razonSocial = datos.razon_social;
      if (datos.nombre_profesional) updated.nombreProfesional = datos.nombre_profesional;

      setFormData(updated);

      if (datos.latitud && datos.longitud) {
        setUbicacion({ lat: datos.latitud, lon: datos.longitud });
      }

      // CARGAR IMÁGENES EXISTENTES
      const imgsStorage = localStorage.getItem("imagenesPAT");
      
      // Corregido: Si datos.images existe pero está vacío, intentar usar localStorage
      let imgsArray = [];
      if (datos.images && datos.images.length > 0) {
        imgsArray = datos.images;
      } else if (imgsStorage) {
        imgsArray = JSON.parse(imgsStorage);
      }
      
      if (Array.isArray(imgsArray) && imgsArray.length > 0) {
        const mappedImgs = imgsArray.map(img => {
          // Caso 1: String directo (URL)
          if (typeof img === 'string') return { file: null, preview: img };
          
          // Caso 2: Objeto del backend (filename, url, etc) -> Usar .url
          if (img && img.url) return { file: null, preview: img.url };
          
          // Caso 3: Objeto nuestro {file, preview} -> Usar .preview
          if (img && img.preview) return { file: null, preview: img.preview };
          
          return null;
        }).filter(Boolean); // Eliminar nulos
        
        setImagenesAdjuntas(mappedImgs);
      }

      window.history.replaceState({}, document.title);
      return;
    }

    const saved = localStorage.getItem("medicionFormData");
    const localID = localStorage.getItem("idInformePAT");

    // Si había datos guardados localmente, avisamos si desea continuar
    if (saved && !idInformeFromHistorial) {
      if (window.confirm("Se encontró un informe en progreso. ¿Desea continuar?")) {
        try {
          setFormData(JSON.parse(saved));
          setIdInforme(localID || null);
        } catch {}
      } else {
        limpiarFormulario();
      }
      return;
    }

    // Si no había nada, colocar fecha por default y generar ID temporal
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, fechaMedicion: today }));
    
    // Asegurar que siempre haya un ID
    if (!idInforme) {
      const nuevoId = generarIdTemporal();
      setIdInforme(nuevoId);
      localStorage.setItem("idInformePAT", nuevoId);
    }
  }, [location.state]);

  // ================================
  // 2) GUARDADO AUTOMÁTICO LOCAL
  // ================================
  useEffect(() => {
    localStorage.setItem("medicionFormData", JSON.stringify(formData));
    if (idInforme) {
      localStorage.setItem("idInformePAT", idInforme);
    }
  }, [formData, idInforme]);

  // ================================
  // HANDLERS
  // ================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.readAsDataURL(compressed);
      reader.onloadend = () => {
        setImagenesAdjuntas((prev) => [...prev, { file: compressed, preview: reader.result }]);
      };
    } catch (err) {
      console.error("Error imagen:", err);
    }
  };

  const generarImagenMapa = () => {
    if (!navigator.geolocation) return alert("Navegador sin geolocalización");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setUbicacion({ lat, lon });
        setMapaUrl(`${API_URL}/mapa-static?lat=${lat}&lon=${lon}`);
      },
      () => alert("No se pudo obtener ubicación")
    );
  };

  // ================================
  // INIT MAPA MANUAL
  // ================================
  useEffect(() => {
    window.initMap = initMap;
    return () => (window.initMap = undefined);
  }, []);

  const initMap = () => {
    try {
      const mapaEl = document.getElementById("mapaInteractivo");
      if (!mapaEl || !window.google) return;

      const map = new window.google.maps.Map(mapaEl, {
        center: { lat: -34.60, lng: -58.38 },
        zoom: 8,
      });

      let marcador = null;

      window.google.maps.event.addListener(map, "click", (e) => {
        if (marcador) marcador.setMap(null);
        marcador = new window.google.maps.Marker({ position: e.latLng, map });
      });

      const btn = document.getElementById("confirmarUbicacionBtn");
      if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", () => {
          if (!marcador) return alert("Seleccione un punto");

          const lat = marcador.getPosition().lat().toFixed(6);
          const lon = marcador.getPosition().lng().toFixed(6);

          setUbicacion({ lat, lon });
          setMapaUrl(`${API_URL}/mapa-static?lat=${lat}&lon=${lon}`);

          const modalEl = document.getElementById("modalMapa");
          const modal = window.bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        });
      }
    } catch (err) {
      console.error("initMap error:", err);
    }
  };

  // ================================
  // EXPORTAR PDF
  // ================================
  const guardarComoPDF = () => {
    const element = document.getElementById("exportPDF");
    const hidden = document.querySelectorAll(".no-print-pdf");
    hidden.forEach((el) => (el.style.display = "none"));

    const dateEl = document.getElementById("pdfDate");
    if (dateEl) dateEl.style.display = "block";

    element.classList.add("pdf-export");

    const allInputs = element.querySelectorAll("input, select, textarea");
    const replacements = [];

    allInputs.forEach((input) => {
      if (["checkbox", "radio", "file", "hidden"].includes(input.type)) return;

      const span = document.createElement("span");
      span.className = input.className;
      span.style.cssText = window.getComputedStyle(input).cssText;
      span.style.display = "inline-block";
      span.style.whiteSpace = "pre-wrap";

      let txt = input.value;
      if (input.tagName === "SELECT") {
        const opt = input.options[input.selectedIndex];
        txt = opt ? opt.text : "";
      }

      if (input.classList.contains("pdf-uppercase")) {
        txt = txt.toUpperCase();
      }

      span.textContent = txt || "\u00A0";

      replacements.push({ parent: input.parentNode, original: input, newNode: span });
      input.parentNode.replaceChild(span, input);
    });

    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Protocolo_PAT_${formData.razonSocial || "SinNombre"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    const worker = html2pdf().set(opt).from(element);

    worker.toPdf().get("pdf").then((pdf) => {
      const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.text(`Página ${i} de ${total}`, pdf.internal.pageSize.getWidth() / 2, 
                 pdf.internal.pageSize.getHeight() - 8, { align: "center" });
      }
    })
    .save()
    .then(() => {
      replacements.forEach(({ parent, original, newNode }) => {
        parent.replaceChild(original, newNode);
      });
      hidden.forEach((el) => (el.style.display = ""));
      if (dateEl) dateEl.style.display = "none";
      element.classList.remove("pdf-export");

      if (window.confirm("PDF generado. ¿Desea limpiar el formulario?")) {
        limpiarFormulario();
      }
    });
  };

  // ================================
  // VALIDAR CAMPOS OBLIGATORIOS
  // ================================
  const validarCamposObligatorios = () => {
    const camposVacios = [];

    // Validar Datos del Cliente
    if (!formData.razonSocial.trim()) camposVacios.push("Razón Social");
    if (!formData.cuit.trim()) camposVacios.push("CUIT");
    if (!formData.direccion.trim()) camposVacios.push("Dirección");
    if (!formData.localidad.trim()) camposVacios.push("Localidad");
    if (!formData.provincia.trim()) camposVacios.push("Provincia");
    if (!formData.cp.trim()) camposVacios.push("CP");

    // Validar Datos del Profesional
    if (!formData.nombreProfesional.trim()) camposVacios.push("Nombre del Profesional");
    if (!formData.apellidoProfesional.trim()) camposVacios.push("Apellido del Profesional");
    if (!formData.matriculaProfesional.trim()) camposVacios.push("Matrícula del Profesional");

    // Validar Datos del Instrumento
    if (!formData.marcaInstrumento.trim()) camposVacios.push("Marca del Instrumento");
    if (!formData.modeloInstrumento.trim()) camposVacios.push("Modelo del Instrumento");
    if (!formData.numeroSerieInstrumento.trim()) camposVacios.push("Número de Serie del Instrumento");

    // Validar Datos de la Medición
    if (!formData.fechaMedicion) camposVacios.push("Fecha de Medición");
    if (!formData.horaInicio.trim()) camposVacios.push("Hora de Inicio");
    if (!formData.horaFin.trim()) camposVacios.push("Hora de Fin");
    if (!formData.metodologia.trim()) camposVacios.push("Metodología");

    if (camposVacios.length > 0) {
      const mensaje = `Los siguientes campos son obligatorios:\n\n${camposVacios.join('\n')}`;
      alert(mensaje);
      return false;
    }

    return true;
  };

  // ================================
  // GUARDAR EN FIREBASE
  // ================================
  const guardarEnFirebase = async () => {
    // Validar campos obligatorios primero
    if (!validarCamposObligatorios()) {
      return;
    }

    if (!window.confirm("¿Guardar informe en la base de datos?")) return;

    setLoading(true);

    try {
      // SEPARAR IMÁGENES NUEVAS DE EXISTENTES
      // Nuevas: tienen propiedad 'file' (objeto File)
      // Existentes: propiedad 'file' es null, y 'preview' es la URL
      const newFiles = imagenesAdjuntas
        .filter(i => i.file !== null)
        .map(i => i.file);

      const existingUrls = imagenesAdjuntas
        .filter(i => i.file === null)
        .map(i => i.preview); // La URL está en preview

      const meta = {
        ...formData,
        tipo: "puesta-tierra",
        latitud: ubicacion.lat,
        longitud: ubicacion.lon,
        fechaCreacion: new Date().toISOString(),
        // Enviamos las URLs existentes para que el backend las conserve
        images: existingUrls 
      };

      // Detectar si tenemos un ID real de servidor para ACTUALIZAR en vez de CREAR
      let targetRemoteId = null;
      if (idInforme && !idInforme.startsWith("TEMP-ID") && !idInforme.startsWith("PAT-")) {
        targetRemoteId = idInforme;
      }

      // Guardar y sincronizar (enviamos meta, files y opcionalmente el ID remoto para update)
      const result = await saveLocalAndMaybeSync(meta, newFiles, targetRemoteId);

      // Verificamos si obtuvimos un ID remoto (guardado exitoso en servidor)
      if (result.remoteId) {
        // ACTUALIZAMOS EL ID CON EL REAL DE LA BD
        setIdInforme(result.remoteId);
        localStorage.setItem("idInformePAT", result.remoteId);
        
        alert(`Informe guardado EXITOSAMENTE en el servidor.\n\nCódigo de Informe: ${result.remoteId}`);
      } else {
        // ERROR O SIN CONEXIÓN
        console.warn("Guardado solo localmente:", result.error);
        alert("El informe se guardó LOCALMENTE porque no hay conexión o hubo un error.\n\nSe imprimirá con un ID TEMPORAL y se sincronizará automáticamente cuando vuelva la conexión.");
      }

      // PREGUNTAR ANTES DE LIMPIAR
      // Esto permite que el usuario imprima el informe con el ID recién generado (o temporal)
      if (window.confirm("¿Desea limpiar el formulario para comenzar uno nuevo?\n\n(Haga click en CANCELAR si desea IMPRIMIR este informe ahora)")) {
        limpiarFormulario();
      }

    } catch (err) {
      console.error(err);
      alert("Error crítico al procesar el guardado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // LIMPIAR FORMULARIO COMPLETO
  // ================================
  const limpiarFormulario = () => {
    setFormData({
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
      fechaMedicion: new Date().toISOString().split("T")[0],
      horaInicio: "",
      horaFin: "",
      metodologia: "",
      observaciones: "",
      certificadoCalibracion: "si",
      planoCroquis: "si",
    });

    setUbicacion({ lat: null, lon: null });
    setMapaUrl(null);
    setImagenesAdjuntas([]);

    localStorage.removeItem("medicionFormData");
    localStorage.removeItem("idInformePAT");

    setIdInforme(null);
  };
  

return (
    <>
      <Navbar />

      <div className="container-fluid py-4 px-5">
        <div id="exportPDF" className="bg-white p-4">

          {/* ENCABEZADO */}
          <div className="d-flex justify-content-between align-items-center mb-1">
            <div className="d-flex justify-content-between align-items-center w-100">
              <h2 className="h6 mb-0">Protocolo de Medición de Puesta a Tierra</h2>

              <div id="pdfDate" style={{ display: "none", fontSize: "11px" }}>
                Fecha: {new Date().toLocaleDateString("es-AR")}
              </div>
            </div>
          </div>

          {/* FORMULARIO */}
          <form className="small-form">

            {/* PRIMERA PÁGINA */}
            <div className="first-page-content">

              {/* DATOS DEL CLIENTE */}
              <div className="card mb-2 page-break-keep">
                <div className="card-header bg-light py-1 px-2 fw-bold small">
                  Datos del Cliente
                </div>
                <div className="card-body py-2 px-3">
                  <div className="row g-1">
                    <div className="col-md-4">
                      <label className="form-label small mb-0">Razón Social</label>
                      <input
                        type="text"
                        name="razonSocial"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.razonSocial}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">C.U.I.T.</label>
                      <input
                        type="text"
                        name="cuit"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.cuit}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-5">
                      <label className="form-label small mb-0">Dirección</label>
                      <input
                        type="text"
                        name="direccion"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.direccion}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small mb-0">Localidad</label>
                      <input
                        type="text"
                        name="localidad"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.localidad}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small mb-0">CP</label>
                      <input
                        type="text"
                        name="cp"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.cp}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Provincia</label>
                      <select
                        name="provincia"
                        className="form-select form-select-sm"
                        value={formData.provincia}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar</option>
                        <option value="Buenos Aires">Buenos Aires</option>
                        <option value="CABA">CABA</option>
                        <option value="Córdoba">Córdoba</option>
                        <option value="Santa Fe">Santa Fe</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Fecha Medición</label>
                      <input
                        type="date"
                        name="fechaMedicion"
                        className="form-control form-control-sm"
                        value={formData.fechaMedicion}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* DATOS DEL PROFESIONAL */}
              <div className="card mb-2 page-break-keep">
                <div className="card-header bg-light py-1 px-2 fw-bold small">
                  Datos del Profesional
                </div>
                <div className="card-body py-2 px-3">
                  <div className="row g-2">

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Nombre</label>
                      <input
                        type="text"
                        name="nombreProfesional"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.nombreProfesional}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Apellido</label>
                      <input
                        type="text"
                        name="apellidoProfesional"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.apellidoProfesional}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small mb-0">Matrícula</label>
                      <input
                        type="text"
                        name="matriculaProfesional"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.matriculaProfesional}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small mb-0">Incumbencias</label>
                      <select
                        name="incumbenciasEspecificas"
                        className="form-select form-select-sm"
                        value={formData.incumbenciasEspecificas}
                        onChange={handleChange}
                      >
                        <option value="Técnico eléctrico">Técnico eléctrico</option>
                        <option value="Ingeniero eléctrico">Ingeniero eléctrico</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Rango KV</label>
                      <select
                        name="rangoKv"
                        className="form-select form-select-sm"
                        value={formData.rangoKv}
                        onChange={handleChange}
                      >
                        <option value="13.2">13,2 KV técnicos</option>
                        <option value="mas_13.2">Más de 13,2 KV inges.</option>
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small mb-0">Doc. Incumb.</label>
                      <select
                        name="documentacionIncumbencias"
                        className="form-select form-select-sm"
                        value={formData.documentacionIncumbencias}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small mb-0">Pago Mat.</label>
                      <select
                        name="pagoMatricula"
                        className="form-select form-select-sm"
                        value={formData.pagoMatricula}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small mb-0">Seguro Acc.</label>
                      <select
                        name="seguroAccidentes"
                        className="form-select form-select-sm"
                        value={formData.seguroAccidentes}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Pago Seguro</label>
                      <select
                        name="pagoSeguro"
                        className="form-select form-select-sm"
                        value={formData.pagoSeguro}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                  </div>
                </div>
              </div>

              {/* DATOS DEL INSTRUMENTO */}
              <div className="card mb-2 page-break-keep">
                <div className="card-header bg-light py-1 px-2 fw-bold small">
                  Datos del Instrumento
                </div>
                <div className="card-body py-2 px-3">
                  <div className="row g-2">

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Marca</label>
                      <input
                        type="text"
                        name="marcaInstrumento"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.marcaInstrumento}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Modelo</label>
                      <input
                        type="text"
                        name="modeloInstrumento"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.modeloInstrumento}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">N° Serie</label>
                      <input
                        type="text"
                        name="numeroSerieInstrumento"
                        className="form-control form-control-sm pdf-uppercase"
                        value={formData.numeroSerieInstrumento}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Tipo</label>
                      <select
                        name="tipoInstrumento"
                        className="form-select form-select-sm"
                        value={formData.tipoInstrumento}
                        onChange={handleChange}
                      >
                        <option value="MFT">MFT</option>
                        <option value="Telurímetro">Telurímetro</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Cumple IEC 61557</label>
                      <select
                        name="cumpleIec"
                        className="form-select form-select-sm"
                        value={formData.cumpleIec}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Cert. Fabricante</label>
                      <select
                        name="certificadoFabricante"
                        className="form-select form-select-sm"
                        value={formData.certificadoFabricante}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Cond. Uso</label>
                      <select
                        name="condicionesUso"
                        className="form-select form-select-sm"
                        value={formData.condicionesUso}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Cert. Calibración</label>
                      <select
                        name="certificadoCalibracion"
                        className="form-select form-select-sm"
                        value={formData.certificadoCalibracion}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* SEGUNDA PÁGINA */}
            <div className="second-page-content">

              {/* DATOS DE LA MEDICIÓN */}
              <div className="card mb-2 page-break-keep">
                <div className="card-header bg-light py-1 px-2 fw-bold small">
                  Datos de la Medición
                </div>

                <div className="card-body py-2 px-3">
                  <div className="row g-2">

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Hora Inicio</label>
                      <input
                        type="time"
                        name="horaInicio"
                        className="form-control form-control-sm"
                        value={formData.horaInicio}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Hora Fin</label>
                      <input
                        type="time"
                        name="horaFin"
                        className="form-control form-control-sm"
                        value={formData.horaFin}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small mb-0">Metodología</label>
                      <textarea
                        name="metodologia"
                        className="form-control form-control-sm pdf-uppercase"
                        rows="1"
                        value={formData.metodologia}
                        onChange={handleChange}
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <label className="form-label small mb-0">Observaciones</label>
                      <textarea
                        name="observaciones"
                        className="form-control form-control-sm pdf-uppercase"
                        rows="2"
                        value={formData.observaciones}
                        onChange={handleChange}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* DOCUMENTACIÓN ADJUNTA */}
              <div className="card mb-2">
                <div className="card-header bg-light py-1 px-2 fw-bold small">
                  Documentación Adjunta
                </div>

                <div className="card-body py-2 px-3">

                  <div className="row g-2 align-items-center">

                    <div className="col-md-3">
                      <label className="form-label small mb-0">Plano / Croquis</label>
                      <select
                        name="planoCroquis"
                        className="form-select form-select-sm"
                        value={formData.planoCroquis}
                        onChange={handleChange}
                      >
                        <option value="si">Si</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    {/* BOTONES MAPA + IMAGEN */}
                    <div className="col-md-9 no-print-pdf">
                      <div className="d-flex gap-2 align-items-end">

                        <div>
                          <label className="form-label small mb-0">Ubicación</label>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={generarImagenMapa}
                            >
                              Obtener Ubicación
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              data-bs-toggle="modal"
                              data-bs-target="#modalMapa"
                            >
                              Mapa Manual
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="form-label small mb-0">Adjuntar Imagen</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm"
                            onChange={handleImageUpload}
                          />
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* PREVIEW MAPA */}
                  {mapaUrl && (
                    <div className="mt-2 text-center">
                      <img
                        src={mapaUrl}
                        alt="Mapa Ubicación"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "150px",
                          border: "1px solid #ccc",
                        }}
                      />
                      <div
                        className="small text-muted mt-1"
                        style={{ fontSize: "9px" }}
                      >
                        Lat: {ubicacion.lat} | Lon: {ubicacion.lon}
                      </div>
                    </div>
                  )}

                  {/* PREVIEW IMÁGENES */}
                  {imagenesAdjuntas.length > 0 && (
                    <div className="mt-2">
                      <div
                        className="small fw-bold mb-1"
                        style={{ fontSize: "10px" }}
                      >
                        Archivos Adjuntos:
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {imagenesAdjuntas.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.preview}
                            alt="Adjunto"
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                            }}
                            className="img-thumbnail"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* FIRMA */}
              <div className="mt-2 text-end">
                <img
                  src="/img/FIRMADIGITAL.png"
                  alt="Firma"
                  style={{ width: "120px" }}
                />
              </div>

            </div>

          </form>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="d-flex justify-content-end gap-2 mt-4 no-print-pdf">

          <button className="btn btn-danger" onClick={limpiarFormulario}>
            Limpiar
          </button>

          {/* <button className="btn btn-success" disabled> */} 
          {/*   Exportar PDF */}
          {/* </button> */}

          <button
            className="btn btn-info text-white"
            onClick={guardarEnFirebase}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar en Firebase"}
          </button>

          {/* NUEVO: botón imprimir solo si hay id */}
          {idInforme && (
            <button
              className="btn btn-primary"
              onClick={() => {
                // Guardar imágenes en localStorage antes de navegar
                const imagenesBase64 = imagenesAdjuntas.map(img => img.preview);
                localStorage.setItem("imagenesPAT", JSON.stringify(imagenesBase64));
                localStorage.setItem("medicionFormData", JSON.stringify(formData));
                localStorage.setItem("idInformePAT", idInforme);
                
                navigate("/medicion-puesta-tierra-print");
              }}
            >
              Vista previa de impresión
            </button>
          )}

        </div>
      </div>

      {/* MODAL MAPA */}
      <div
        className="modal fade"
        id="modalMapa"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">Seleccionar Ubicación</h5>
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <div
                id="mapaInteractivo"
                style={{ height: "400px", width: "100%" }}
              ></div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cerrar
              </button>

              <button
                type="button"
                className="btn btn-primary"
                id="confirmarUbicacionBtn"
              >
                Confirmar Ubicación
              </button>
            </div>

          </div>
        </div>
      </div>

    </>
  );
};

export default MedicionPuestaATierra;
