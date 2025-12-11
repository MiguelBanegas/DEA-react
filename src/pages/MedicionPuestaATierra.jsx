import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import html2pdf from "html2pdf.js";
import imageCompression from "browser-image-compression";
import { usePlanillas } from "../hooks/usePlanillas";
import toast from 'react-hot-toast';
import { confirmar } from '../utils/confirmationToast';
import { API_BASE, deleteFile } from "../services/api"; // Importamos la base correcta
import "./Verificacion.css";

const API_URL = API_BASE; // Usamos la misma constante mapeada

const MedicionPuestaATierra = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Función para generar un ID temporal único
  const generarIdTemporal = () => {
    return `TEMP-ID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // El ID se inicializa como null. Se asignará en el useEffect de carga.
  // Esto evita usar un ID de localStorage de un informe anterior por error.
  const [idInforme, setIdInforme] = useState(null);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [remoteId, setRemoteId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
    fechaMedicion: new Date().toISOString().split("T")[0],
    horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    horaFin: "",
    metodologia: "",
    observaciones: "",
    certificadoCalibracion: "si",
    planoCroquis: "si",
  });

  const [ubicacion, setUbicacion] = useState({ lat: null, lon: null });
  const [mapaUrl, setMapaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagenesCargando, setImagenesCargando] = useState(false);
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);

  const imagenMapaRef = useRef(null);
  const nuevoModalRef = useRef(null);
  const nuevoModalInstanceRef = useRef(null);
  const mapaModalRef = useRef(null);
  const { saveOrUpdateLocalPlanilla } = usePlanillas();

  // EFECTO PARA MANEJAR EL MODAL DE "NUEVO INFORME" CON BOOTSTRAP JS
  useEffect(() => {
    if (nuevoModalRef.current) {
      nuevoModalInstanceRef.current = new window.bootstrap.Modal(nuevoModalRef.current);
    }
  }, []);

  useEffect(() => {
    const modalInstance = nuevoModalInstanceRef.current;
    if (modalInstance) {
      if (showNuevoModal) {
        modalInstance.show();
      } else {
        modalInstance.hide();
      }
    }
  }, [showNuevoModal]);

  // ================================
  // 1) CARGA INICIAL CENTRALIZADA
  // ================================
  useEffect(() => {
    // CASO 1: Viene desde la página de historial con datos para cargar.
    if (location.state && location.state.datosCargados) {
      // Verificar si hay datos locales más recientes (ej. volviendo de imprimir)
      const storageId = localStorage.getItem('idInformePAT');
      const incomingId = location.state.localId;
      const hayDatosLocales = localStorage.getItem('medicionFormData');

      // Si los IDs coinciden y hay datos locales, preferimos localStorage (saltamos este bloque)
      if (!storageId || !incomingId || String(storageId) !== String(incomingId) || !hayDatosLocales) {
        const datos = location.state.datosCargados;

      if (location.state.localId) {
        setIdInforme(location.state.localId);
      }
      if (location.state.remoteId) {
        setRemoteId(location.state.remoteId);
      }
      
      const updated = { ...formData };
      Object.keys(updated).forEach((k) => {
        if (datos[k] !== undefined) updated[k] = datos[k];
      });

      if (datos.razon_social) updated.razonSocial = datos.razon_social;
      if (datos.nombre_profesional) updated.nombreProfesional = datos.nombre_profesional;

      setFormData(updated);

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
        const mapped = urlObjects.map(imgObj => {
          const url = imgObj.url;
          return { file: null, preview: url };
        });
        setImagenesAdjuntas(mapped);
      };

      if (imagenesDesdeEstado.length > 0) {
        procesarFiles(imagenesDesdeEstado);
      } else if (urlsDesdeMeta.length > 0) {
        procesarUrls(urlsDesdeMeta);
      }
      
      if (datos.latitud && datos.longitud) {
        setUbicacion({ lat: datos.latitud, lon: datos.longitud });
      }

      setIsInitialized(true);
      return;
      }
    }

    // CASO 2: No viene de historial, pero hay datos en localStorage (ej. al volver de la pág de impresión).
    const datosGuardados = localStorage.getItem('medicionFormData');
    const idGuardado = localStorage.getItem('idInformePAT');
    const imagenesGuardadas = localStorage.getItem('imagenesPAT');
    const mapaGuardado = localStorage.getItem('mapaUrlPAT');

    if (datosGuardados) {
      setFormData(JSON.parse(datosGuardados));
      if (idGuardado) {
        setIdInforme(idGuardado);
      }
      if (imagenesGuardadas) {
        try {
          const urls = JSON.parse(imagenesGuardadas);
          if (Array.isArray(urls)) {
            setImagenesAdjuntas(urls.map(url => ({ file: null, preview: url })));
          }
        } catch (e) {
          console.error("Error al parsear imágenes de localStorage:", e);
        }
      }
      if (mapaGuardado) {
        setMapaUrl(mapaGuardado);
      }
      setIsInitialized(true);
      return; // Importante: termina la ejecución aquí para no limpiar.
    }

    // CASO 3: Es un informe completamente nuevo (sin state y sin localStorage).
    limpiarFormulario(true); // Genera un ID temporal nuevo.
    setIsInitialized(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // ================================
  // 2) GUARDADO AUTOMÁTICO LOCAL
  // ================================
  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem("medicionFormData", JSON.stringify(formData));
    if (idInforme) {
      localStorage.setItem("idInformePAT", idInforme);
    }
    if (mapaUrl) {
      localStorage.setItem("mapaUrlPAT", mapaUrl);
    } else {
      localStorage.removeItem("mapaUrlPAT");
    }
  }, [formData, idInforme, mapaUrl, isInitialized]);

  // ================================
  // HANDLERS
  // ================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
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
    const validResults = results.filter(Boolean); // Filtrar los nulos por si hubo errores

    setImagenesAdjuntas((prev) => [...prev, ...validResults]);
    toast.success(`${validResults.length} imágen(es) adjuntada(s).`, { id: 'compressing' });
  };

  const handleDeleteImage = async (index) => {
      if (!await confirmar("¿Borrar imagen?", "Esta imagen se quitará del informe al guardar.")) return;
      
      setImagenesAdjuntas(prev => {
          const newImgs = [...prev];
          const deletedImg = newImgs[index];
          
          // Si la imagen borrada era el mapa actual, limpiamos la preview del mapa también
          let deletedUrl = null;
          if (deletedImg && deletedImg.preview) deletedUrl = deletedImg.preview;
          else if (typeof deletedImg === 'string') deletedUrl = deletedImg;
          
          if (deletedUrl && mapaUrl === deletedUrl) {
              setMapaUrl(null);
          }
          
          // AGREGAR A LISTA DE BORRADO FÍSICO (Solo si viene del backend 'uploads/')
          if (deletedUrl && deletedUrl.includes('uploads/')) {
              const filename = deletedUrl.split('/').pop().split('?')[0];
              if (filename) {
                  setDeletedFiles(curr => [...curr, filename]);
              }
          }

          newImgs.splice(index, 1);
          return newImgs;
      });
  };

  const generarImagenMapa = () => {
    if (!navigator.geolocation) return toast.error("Navegador sin geolocalización");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setUbicacion({ lat, lon });
        
        // FETCH REAL IMAGE URL FROM JSON
        fetch(`${API_URL}/mapa-static?lat=${lat}&lon=${lon}`)
            .then(res => res.json())
            .then(async (data) => {
                if (data.imageUrl) {
                  try {
                    const resp = await fetch(data.imageUrl);
                    const blob = await resp.blob();
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => setMapaUrl(reader.result);
                  } catch (e) {
                    console.error("Error guardando mapa temporal:", e);
                    setMapaUrl(data.imageUrl);
                  }
                }
            })
            .catch(err => toast.error("Error generando mapa"));
      },
      () => toast.error("No se pudo obtener ubicación")
    );
  };

  // ================================
  // INIT MAPA MANUAL
  // ================================
  const initMap = useCallback(async () => {
    try {
      const mapaEl = document.getElementById("mapaInteractivo");
      if (!mapaEl || !window.google) {
        toast.error("La API de Google Maps no está disponible.");
        return;
      }

      // Advanced Markers require the 'marker' library
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

      const map = new window.google.maps.Map(mapaEl, {
        center: ubicacion.lat && ubicacion.lon ? { lat: Number(ubicacion.lat), lng: Number(ubicacion.lon) } : { lat: -34.60, lng: -58.38 },
        zoom: ubicacion.lat && ubicacion.lon ? 15 : 8,
        // Advanced Markers require a map ID. For production, you should create one in Google Cloud.
        mapId: 'DEMO_MAP_ID' 
      });

      let marcador = null;
      
      if (ubicacion.lat && ubicacion.lon) {
          marcador = new AdvancedMarkerElement({ 
              position: { lat: Number(ubicacion.lat), lng: Number(ubicacion.lon) }, 
              map 
          });
      }

      map.addListener("click", (e) => {
        if (marcador) {
            marcador.map = null; // Hide previous marker
        }
        marcador = new AdvancedMarkerElement({ position: e.latLng, map });
      });

      const btn = document.getElementById("confirmarUbicacionBtn");
      if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", () => {
          if (!marcador) return toast.error("Seleccione un punto");

          const lat = marcador.position.lat.toFixed(6);
          const lon = marcador.position.lng.toFixed(6);

          const modalEl = mapaModalRef.current;
          const modal = window.bootstrap.Modal.getInstance(modalEl);

          // Quitar el foco del botón para evitar problemas de accesibilidad
          newBtn.blur();

          const onModalHidden = () => {
              setUbicacion({ lat, lon });

              fetch(`${API_URL}/mapa-static?lat=${lat}&lon=${lon}`)
                  .then(res => res.json())
                  .then(async (data) => {
                      if (data.imageUrl) {
                        try {
                          const resp = await fetch(data.imageUrl);
                          const blob = await resp.blob();
                          const reader = new FileReader();
                          reader.readAsDataURL(blob);
                          reader.onloadend = () => setMapaUrl(reader.result);
                        } catch (e) {
                          console.error("Error guardando mapa manual temporal:", e);
                          setMapaUrl(data.imageUrl);
                        }
                      }
                  })
                  .catch(err => console.error("Error generando mapa manual:", err));
              
              // Forzar limpieza de modal por si Bootstrap no lo hace correctamente
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) backdrop.remove();
              document.body.classList.remove('modal-open');
              document.body.style.overflow = 'auto';
          };

          // Add the listener for the 'hidden' event, to run only once
          modalEl.addEventListener('hidden.bs.modal', onModalHidden, { once: true });

          // Hide the modal, the state update will happen once it's fully hidden
          modal?.hide();
        });
      }
    } catch (err) {
      console.error("initMap error:", err);
      toast.error("Error al inicializar el mapa.");
    }
  }, [API_URL, ubicacion]);

  useEffect(() => {
    const modalEl = mapaModalRef.current;
    if (!modalEl) return;

    const handleShow = () => initMap();

    modalEl.addEventListener('show.bs.modal', handleShow);

    return () => {
      modalEl.removeEventListener('show.bs.modal', handleShow);
    };
  }, [initMap]);

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
    .then(async () => {
      replacements.forEach(({ parent, original, newNode }) => {
        parent.replaceChild(original, newNode);
      });
      hidden.forEach((el) => (el.style.display = ""));
      if (dateEl) dateEl.style.display = "none";
      element.classList.remove("pdf-export");

      if (await confirmar("PDF generado. ¿Desea limpiar el formulario?")) {
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
      toast.error(
        `Los siguientes campos son obligatorios:\n\n${camposVacios.join('\n')}`,
        { duration: 5000, style: { whiteSpace: 'pre-wrap', textAlign: 'left' } }
      );
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

    if (!await confirmar("¿Guardar informe en la base de datos?", "Verifica que todos los datos sean correctos.")) return;

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

      // INTENTAR PERSISTIR EL MAPA
      // Unificado: Si el mapa es nuevo para este informe, lo descargamos y lo tratamos como un archivo nuevo.
      // Verificamos si el mapa actual ya está en la lista de adjuntos (ya sea como URL remota o como archivo local)
      const mapIsAlreadySaved = imagenesAdjuntas.some(img => img.preview === mapaUrl);
      
      if (mapaUrl && !mapIsAlreadySaved) {
        try {
            const resp = await fetch(mapaUrl);
            if (resp.ok) {
                const blob = await resp.blob();
                // Usamos un nombre de archivo consistente para poder identificarlo después.
                const mapFile = new File([blob], "mapa_ubicacion.png", { type: "image/png" });
                newFiles.push(mapFile);
                toast.success("Mapa adjuntado para guardar.");
            } else {
                toast.error(`No se pudo procesar el mapa desde ${mapaUrl}`);
            }
        } catch (e) {
            console.error("Error al adjuntar el mapa:", e);
            toast.error("Error al adjuntar el mapa para el guardado.");
        }
      }

      const meta = {
        ...formData,
        tipo: "puesta-tierra",
        latitud: ubicacion.lat,
        longitud: ubicacion.lon,
        fechaCreacion: new Date().toISOString(),
        // Enviamos las URLs existentes para que el backend las conserve
        images: existingUrls 
      };

      // Guardar y sincronizar (enviamos meta, files y opcionalmente el ID remoto para update)
      // `idInforme` es el ID local (para Dexie), `remoteId` es el ID remoto (para Firebase)
      const result = await saveOrUpdateLocalPlanilla(meta, newFiles, idInforme, remoteId);

      // Verificamos si obtuvimos un ID remoto (guardado exitoso en servidor)
      if (result.remoteId) {
        // ACTUALIZAMOS LOS IDs CON LOS REALES DE LA BD.
        // Es crucial que `idInforme` siga siendo el ID local para futuras ediciones.
        if (result.localId) {
          setIdInforme(result.localId);
          localStorage.setItem("idInformePAT", result.localId);
        }
        // Actualizamos el ID remoto por si era un informe nuevo que ahora ya tiene ID en el servidor.
        setRemoteId(result.remoteId);
        
        // ACTUALIZACIÓN DE IMÁGENES AL INSTANTE (incluyendo mapa nuevo)
        // result.planilla viene del hook modificado
        if (result.planilla && result.planilla.images) {
            // Filtramos las imágenes que están en la cola de borrado para que no reaparezcan
            // si el backend devuelve la lista vieja o combinada.
            
            // Normalizamos la lista por si el backend devuelve objetos en lugar de strings
            const normalizedImages = result.planilla.images.map(img => {
                if (typeof img === 'string') return img;
                if (img && typeof img === 'object' && img.url) return img.url;
                return null;
            }).filter(Boolean);

            const imagenesFiltradas = normalizedImages.filter(url => {
                const fname = url.split('/').pop();
                return !deletedFiles.includes(fname);
            });

            const nuevasImgs = imagenesFiltradas.map(url => ({ file: null, preview: url }));
            setImagenesAdjuntas(nuevasImgs);
            localStorage.setItem("imagenesPAT", JSON.stringify(imagenesFiltradas));
            setMapaUrl(null);
        }

        // PROCESAR BORRADO FÍSICO DE ARCHIVOS HUÉRFANOS
        if (deletedFiles.length > 0) {
            for (const filename of deletedFiles) {
                try {
                    await deleteFile(filename);
                    console.log("Archivo eliminado físicamente:", filename);
                } catch (err) {
                    // Si el error es 404, significa que ya no existe, lo ignoramos.
                    const is404 = (err.message && (err.message.includes('404') || err.message.includes('Not Found'))) || 
                                  (err.response && err.response.status === 404);

                    if (is404) {
                        console.warn(`El archivo ${filename} ya había sido eliminado (404).`);
                    } else {
                        console.error("Error borrando archivo físico:", filename, err);
                    }
                }
            }
            setDeletedFiles([]); // Limpiar cola tras éxito
        }

        toast.success(`Informe guardado y sincronizado exitosamente.`, { duration: 4000 });
      } else {
        // ERROR O SIN CONEXIÓN
        console.warn("Guardado solo localmente:", result.error);
        toast("Guardado LOCALMENTE (Offline).\nSe sincronizará al conectar.", { icon: '⚠️', duration: 5000 });
      }

      // Mostrar el modal para preguntar si quiere crear uno nuevo
      setShowNuevoModal(true);

    } catch (err) {
      console.error(err);
      toast.error("Error crítico al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // LIMPIAR FORMULARIO COMPLETO
  // ================================
  const limpiarFormulario = (generarNuevoId = false) => {
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
      horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
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
    localStorage.removeItem("mapaUrlPAT");

    // Si se indica, se genera un ID nuevo para el próximo informe.
    // Si no, se limpia el ID actual.
    if (generarNuevoId) {
      const nuevoId = generarIdTemporal();
      setIdInforme(nuevoId);
    } else {
      setIdInforme(null);
      setRemoteId(null);
    }
  };
  

return (
    <>
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

                    <div className="col-12">
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
                  </div>

                  {/* BOTONES MAPA */}
                  <div className="row g-2 mt-2 no-print-pdf">
                        <div className="col-md-12">
                          <label className="form-label small mb-1">Ubicación</label>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={generarImagenMapa}
                            >
                              <i className="bi bi-geo-alt-fill me-1"></i> Obtener Ubicación
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              data-bs-toggle="modal"
                              data-bs-target="#modalMapa"
                            >
                              <i className="bi bi-map me-1"></i> Mapa Manual
                            </button>
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

                  {/* BOTON IMAGEN */}
                  <div className="row g-2 mt-2 no-print-pdf">
                    <div className="col-12">
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
                  </div>

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
                          <div key={idx} style={{ position: 'relative' }}>
                              <img
                                src={img.preview}
                                alt="Adjunto"
                                style={{
                                  width: "80px",
                                  height: "80px",
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
              disabled={imagenesCargando}
              onClick={() => {
                // Guardar imágenes en localStorage antes de navegar
                if (imagenesCargando) {
                  toast.error("Espere a que las imágenes terminen de cargar.");
                  return;
                }
                const imagenesBase64 = imagenesAdjuntas.map(img => img.preview);
                localStorage.setItem("imagenesPAT", JSON.stringify(imagenesBase64));
                localStorage.setItem("medicionFormData", JSON.stringify(formData));
                localStorage.setItem("idInformePAT", idInforme);
                
                navigate("/medicion-puesta-tierra-print");
              }}
            >
              {imagenesCargando ? 'Cargando Imágenes...' : 'Vista previa de impresión'}
            </button>
          )}

          {/* Botón para crear un nuevo informe, aparece después de guardar */}
          {idInforme && !idInforme.startsWith("TEMP-ID") && (
             <button className="btn btn-warning" onClick={() => setShowNuevoModal(true)}>Nuevo Informe</button>
          )}

        </div>
      </div>

      {/* MODAL MAPA */}
      <div
        className="modal fade"
        id="modalMapa"
        ref={mapaModalRef}
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

      {/* Modal para confirmar la creación de un nuevo informe */}
      <div className="modal fade" ref={nuevoModalRef} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Informe Guardado</h5>
                <button type="button" className="btn-close" onClick={() => setShowNuevoModal(false)}></button>
              </div>
              <div className="modal-body">
                El informe actual ha sido guardado. ¿Deseas empezar un informe nuevo desde cero?
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowNuevoModal(false)}>No, seguir aquí</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    limpiarFormulario(true); // Limpiar y generar nuevo ID
                    setShowNuevoModal(false);
                  }}
                >
                  Sí, crear nuevo
                </button>
              </div>
            </div>
          </div>
        </div>

    </>
  );
};

export default MedicionPuestaATierra;
