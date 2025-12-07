import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Navbar from "../components/Navbar";
import TablaMedicion from "../components/TablaMedicion";
import { usePlanillas } from "../hooks/usePlanillas";
import "./Verificacion.css";

const Verificacion = () => {
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
    horaInicio: "",
    horaFin: "",
  });

  const [filas, setFilas] = useState([
    { id: Date.now(), numeroToma: '', sector: '', descripcionTerreno: '', usoPuestaTierra: '', esquemaConexion: '', valorResistencia: '', cumple: '', continuidad: '', capacidadCarga: '', proteccionContactos: '', desconexionAutomatica: '' }
  ]);
  const [seleccionados, setSeleccionados] = useState([]);
  const { saveOrUpdateLocalPlanilla } = usePlanillas();
  const location = useLocation();
  const [informeId, setInformeId] = useState(null);

  useEffect(() => {
    // Check if data was passed via navigation (from Historial)
    if (location.state && location.state.datosCargados) {
      const datos = location.state.datosCargados;
      const id = location.state.localId;
      console.log("Cargando datos desde historial:", datos);
      
      if(id) {
        setInformeId(id);
      }
      
      // Cargar formData
      const newFormData = { ...formData };
      Object.keys(newFormData).forEach(key => {
        if (datos[key] !== undefined) {
          newFormData[key] = datos[key];
        }
      });
      setFormData(newFormData);

      // Cargar filas si existen
      if (datos.filas && Array.isArray(datos.filas)) {
        setFilas(datos.filas);
      }
      
      // Limpiar el estado de navegación para no recargar al refrescar
      window.history.replaceState({}, document.title);
      return;
    }

    // Load saved data from localStorage
    const savedData = localStorage.getItem('verificacionFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    } else {
      // Set today's date if no saved data
      const today = new Date().toISOString().split("T")[0];
      setFormData((prevData) => ({ ...prevData, fecha: today }));
    }
  }, [location.state]);

  useEffect(() => {
    // Save formData to localStorage whenever it changes
    localStorage.setItem('verificacionFormData', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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

  const handleSeleccionChange = (id) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(sId => sId !== id));
    } else {
      setSeleccionados([...seleccionados, id]);
    }
  };

  const eliminarFilasSeleccionadas = () => {
    if (window.confirm('¿Estás seguro de eliminar las filas seleccionadas?')) {
      setFilas(filas.filter(fila => !seleccionados.includes(fila.id)));
      setSeleccionados([]);
    }
  };

  const guardarComoPDF = () => {
    // DEBUG: Mostrar datos antes de generar PDF
    console.log('=== DATOS ANTES DE GENERAR PDF ===');
    console.log('formData:', formData);
    console.log('filas:', filas);
    console.log('Valores de inputs en DOM:');
    document.querySelectorAll('.pdf-uppercase').forEach((input, i) => {
      console.log(`Input ${i} (${input.name}):`, input.value);
    });
    console.log('===================================');
    
    const element = document.getElementById("exportPDF");
    
    // Ocultar elementos que no queremos en el PDF (como los checkboxes de selección)
    const noPrintElements = document.querySelectorAll('.no-print-pdf');
    noPrintElements.forEach(el => el.style.display = 'none');

    // Mostrar fecha solo para PDF
    const dateElement = document.getElementById('pdfDate');
    if (dateElement) dateElement.style.display = 'block';

    // Agregar clase para estilos específicos de PDF
    element.classList.add('pdf-export');

    // Reemplazar inputs con spans para mejor renderizado en PDF
    const allInputs = element.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="time"], select');
    const inputReplacements = [];
    
    allInputs.forEach((input) => {
      if (input.type === 'checkbox' || input.type === 'radio') return;
      
      const span = document.createElement('span');
      span.className = input.className;
      span.style.cssText = window.getComputedStyle(input).cssText;
      span.style.display = 'inline-block';
      span.style.minHeight = '20px';
      
      let displayValue = input.value;
      
      // Para selects, obtener el texto de la opción seleccionada
      if (input.tagName === 'SELECT') {
        const selectedOption = input.options[input.selectedIndex];
        displayValue = selectedOption ? selectedOption.text : '';
      }
      
      // Aplicar uppercase si tiene la clase pdf-uppercase
      if (input.classList.contains('pdf-uppercase')) {
        displayValue = displayValue.toUpperCase();
      }
      
      span.textContent = displayValue || '\u00A0'; // \u00A0 es un espacio no rompible
      
      inputReplacements.push({
        original: input,
        replacement: span,
        parent: input.parentNode
      });
      
      input.parentNode.replaceChild(span, input);
    });

    const opt = {
      margin: [2, 2, 2, 2],
      filename: `Verificacion_${formData.cliente || 'SinNombre'}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait" 
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: '.no-page-break'
      }
    };

    const worker = html2pdf().set(opt).from(element);
    
    worker.toPdf().get('pdf').then(function(pdf) {
      const totalPages = pdf.internal.getNumberOfPages();
      
      // Agregar número de página a cada página
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 3,
          { align: 'center' }
        );
      }
    }).save().then(() => {
       // Restaurar inputs originales
       inputReplacements.forEach(({ original, replacement, parent }) => {
         parent.replaceChild(original, replacement);
       });
       
       // Restaurar visibilidad
       noPrintElements.forEach(el => el.style.display = '');
       if (dateElement) dateElement.style.display = 'none';
       element.classList.remove('pdf-export');
       
       // Limpiar datos después de generar PDF
       if (window.confirm('PDF generado. ¿Desea limpiar los datos del formulario?')) {
         limpiarDatos();
       }
    });
  };

  const limpiarDatos = () => {
    // Limpiar formData
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
      horaInicio: "",
      horaFin: "",
    });
    
    // Limpiar filas de la tabla
    setFilas([
      { id: Date.now(), numeroToma: '', sector: '', descripcionTerreno: '', usoPuestaTierra: '', esquemaConexion: '', valorResistencia: '', cumple: '', continuidad: '', capacidadCarga: '', proteccionContactos: '', desconexionAutomatica: '' }
    ]);
    
    // Limpiar seleccionados
    setSeleccionados([]);
    
    // Limpiar localStorage
    localStorage.removeItem('verificacionFormData');
  };

  const guardarEnFirebase = async () => {
    if (!window.confirm('¿Desea guardar el informe en la base de datos?')) return;

    try {
      const meta = {
        ...formData,
        filas,
        tipo: 'verificacion',
        fechaCreacion: new Date().toISOString()
      };
      
      await saveOrUpdateLocalPlanilla(meta, [], informeId);
      alert('Informe guardado correctamente en la base de datos.');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el informe: ' + error.message);
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

          <div id="contenedorTabla" className="my-3">
            <h4>Datos de la Medición</h4>
            <TablaMedicion 
              filas={filas} 
              onFilaChange={handleFilaChange} 
              onSeleccionChange={handleSeleccionChange}
              seleccionados={seleccionados}
            />
            
            <div className="mt-3 no-print-pdf">
              <button className="btn btn-primary me-2" onClick={agregarFila}>Agregar Fila</button>
              <button className="btn btn-danger me-2" onClick={eliminarFilasSeleccionadas} disabled={seleccionados.length === 0}>Eliminar Seleccionados</button>
              <button className="btn btn-success me-2" onClick={guardarComoPDF}>Exportar a PDF</button>
              <button className="btn btn-info" onClick={guardarEnFirebase}>Guardar en Firebase</button>
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
