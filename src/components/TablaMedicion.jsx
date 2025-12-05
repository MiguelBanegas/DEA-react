import React from 'react';

export default function TablaMedicion({ filas, onFilaChange, onSeleccionChange, seleccionados }) {
  
  const handleCheck = (id) => {
    onSeleccionChange(id);
  };

  return (
    <div className="table-responsive">
      <table id="medicionTabla" className="table table-bordered table-striped align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th rowSpan="2" style={{width: '50px'}} className="no-print-pdf">Sel.</th>
            <th rowSpan="2">(22)</th>
            <th rowSpan="2">(23)</th>
            <th rowSpan="2">(24)</th>
            <th rowSpan="2">(25)</th>
            <th rowSpan="2">(26)</th>
            <th colSpan="2">(27)-(28)</th>
            <th colSpan="2">(29)-(30)</th>
            <th rowSpan="2">(31)</th>
            <th rowSpan="2">(32)</th>
          </tr>
          <tr>
            <th>(27)</th>
            <th>(28)</th>
            <th>(29)</th>
            <th>(30)</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, index) => (
            <tr key={fila.id}>
              <td className="no-print-pdf">
                <input 
                  type="checkbox" 
                  checked={seleccionados.includes(fila.id)} 
                  onChange={() => handleCheck(fila.id)} 
                />
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
