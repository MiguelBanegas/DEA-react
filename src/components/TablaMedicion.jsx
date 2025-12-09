import React from 'react';

export default function TablaMedicion({ filas, onFilaChange, onFilaDelete }) {

  return (
    <div className="table-responsive">
      <table id="medicionTabla" className="table table-bordered table-striped align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th rowSpan="2" data-tooltip-align="left" data-tooltip="N° de toma de tierra: Indicar mediante un número la toma a tierra donde se realiza la medición, el cual deberá coincidir con el del plano o croquis que se adjunta a la medición.">(22)</th>
            <th rowSpan="2" data-tooltip-align="left" data-tooltip="Sector: Indicar el sector o la sección dentro de la empresa donde se realiza la medición.">(23)</th>
            <th rowSpan="2" data-tooltip-align="left" data-tooltip="Descripción del terreno: Indicar o describir la condición del terreno al momento de la medición (lecho seco, arenoso seco o húmedo, lluvias recientes, turba, limo, pantanoso, etc.).">(24)</th>
            <th rowSpan="2" data-tooltip-align="center" data-tooltip="Uso de la puesta a tierra: Indicar el uso habitual, como puesta a tierra del neutro de transformador, seguridad de masas, protección de equipos electrónicos, informática, iluminación, pararrayos, otros.">(25)</th>
            <th rowSpan="2" data-tooltip-align="center" data-tooltip="Esquema de conexión a tierra: Indicar cuál es el esquema utilizado (TT / TN-S / TN-C / TN-C-S / IT).">(26)</th>
            <th colSpan="2" data-tooltip-align="center" data-tooltip="Valor obtenido y cumplimiento de la reglamentación">(27)-(28)</th>
            <th colSpan="2" data-tooltip-align="center" data-tooltip="Continuidad y capacidad de conducción">(29)-(30)</th>
            <th rowSpan="2" data-tooltip-align="right" data-tooltip="Protección contra contactos indirectos: Indicar si se usa DD (diferencial), IA (interruptor automático) o FUS (fusible).">(31)</th>
            <th rowSpan="2" data-tooltip-align="right" data-tooltip="Desconexión automática: Indicar si el dispositivo de protección puede desconectar automáticamente el circuito dentro de los tiempos establecidos por la normativa.">(32)</th>
            <th rowSpan="2" style={{width: '80px'}} className="no-print-pdf">Acciones</th>
          </tr>
          <tr>
            <th data-tooltip-align="center" data-tooltip="Valor obtenido (Ω): Indicar el valor en Ohm obtenido en la medición de resistencia de puesta a tierra de las masas.">(27)</th>
            <th data-tooltip-align="center" data-tooltip="Cumple con reglamentación: Indicar si el resultado cumple con la Reglamentación de la Asociación Argentina de Electrotécnicos para instalaciones eléctricas en inmuebles.">(28)</th>
            <th data-tooltip-align="center" data-tooltip="Continuidad del circuito: Indicar si el circuito de puesta a tierra es continuo y permanente.">(29)</th>
            <th data-tooltip-align="center" data-tooltip="Capacidad de conducir corriente de falla: Indicar si el circuito tiene capacidad de carga y resistencia adecuada para conducir la corriente de falla.">(30)</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, index) => (
            <tr key={fila.id}>
              <td>
                <input 
                  type="number" 
                  className="form-control form-control-sm input-compact"
                  value={fila.numeroToma || ''} 
                  onChange={(e) => onFilaChange(index, 'numeroToma', e.target.value)} 
                />
              </td>
              <td>
                <input 
                  type="text" 
                  className="form-control form-control-sm input-compact"
                  value={fila.sector || ''} 
                  onChange={(e) => onFilaChange(index, 'sector', e.target.value)} 
                />
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.descripcionTerreno || ''} 
                  onChange={(e) => onFilaChange(index, 'descripcionTerreno', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="Lecho seco">Lecho seco</option>
                  <option value="Arenoso seco">Arenoso seco</option>
                  <option value="Arenoso húmedo">Arenoso húmedo</option>
                  <option value="Lluvias recientes">Lluvias recientes</option>
                  <option value="Turba">Turba</option>
                  <option value="Limo">Limo</option>
                  <option value="Pantanoso">Pantanoso</option>
                  <option value="Otro">Otro</option>
                </select>
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.usoPuestaTierra || ''} 
                  onChange={(e) => onFilaChange(index, 'usoPuestaTierra', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="Neutro de transformador">Neutro de transformador</option>
                  <option value="Seguridad de masas">Seguridad de masas</option>
                  <option value="Protección de equipos electrónicos">Protección de equipos electrónicos</option>
                  <option value="Informática">Informática</option>
                  <option value="Iluminación">Iluminación</option>
                  <option value="Pararrayos">Pararrayos</option>
                  <option value="Otro">Otro</option>
                </select>
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.esquemaConexion || ''} 
                  onChange={(e) => onFilaChange(index, 'esquemaConexion', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="TT">TT</option>
                  <option value="TN-S">TN-S</option>
                  <option value="TN-C">TN-C</option>
                  <option value="TN-C-S">TN-C-S</option>
                  <option value="IT">IT</option>
                </select>
              </td>
              <td>
                <input 
                  type="number" 
                  className="form-control form-control-sm input-compact"
                  value={fila.valorResistencia || ''} 
                  onChange={(e) => onFilaChange(index, 'valorResistencia', e.target.value)} 
                />
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.cumple || ''} 
                  onChange={(e) => onFilaChange(index, 'cumple', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.continuidad || ''} 
                  onChange={(e) => onFilaChange(index, 'continuidad', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.capacidadCarga || ''} 
                  onChange={(e) => onFilaChange(index, 'capacidadCarga', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.proteccionContactos || ''} 
                  onChange={(e) => onFilaChange(index, 'proteccionContactos', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="DD">DD</option>
                  <option value="IA">IA</option>
                  <option value="FUS">FUS</option>
                </select>
              </td>
              <td>
                <select 
                  className="form-select form-select-sm input-compact"
                  value={fila.desconexionAutomatica || ''} 
                  onChange={(e) => onFilaChange(index, 'desconexionAutomatica', e.target.value)}
                >
                  <option value="">Sel.</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </td>
              <td className="no-print-pdf">
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => onFilaDelete(fila.id)}
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
