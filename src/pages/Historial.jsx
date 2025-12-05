import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { listPlanillas } from '../services/api';

const Historial = () => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cargarInformes();
  }, []);

  const cargarInformes = async () => {
    try {
      setLoading(true);
      const data = await listPlanillas();
      console.log(data);
      // La API devuelve { planillas: [...] }
      // Ordenar por fecha de creación descendente (más reciente primero)
      const ordenados = (data.planillas || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setInformes(ordenados);
      setError(null);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError('No se pudieron cargar los informes. Asegúrate de que el servidor API esté corriendo.');
    } finally {
      setLoading(false);
    }
  };
const handleVerInforme = (informe) => {
  // 1. Guardar ID real de la planilla
  localStorage.setItem("idInformePAT", informe.id);

  // 2. Guardar datos principales (meta)
  localStorage.setItem("MedicionPuestaATierra", JSON.stringify(informe.meta || {}));

  // 3. Guardar imágenes (si existen)
  localStorage.setItem("imagenesPAT", JSON.stringify(informe.images || []));

  // 4. Detectar tipo de planilla
  const tipo = informe.meta?.tipo || 'verificacion';

  let ruta = '/verificacion';
  if (tipo === 'puesta-tierra') {
    ruta = '/medicion-puesta-tierra';
  }

  // 5. Navegar mandando datos para editar si hace falta
  navigate(ruta, { state: { datosCargados: informe.meta, informeId: informe.id } });
};


  const informesFiltrados = informes.filter(inf => {
    const cliente = inf.meta?.cliente || inf.meta?.razon_social || inf.meta?.razonSocial || 'Sin Cliente';
    const fecha = new Date(inf.createdAt).toLocaleDateString();
    const texto = `${cliente} ${fecha}`.toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Historial de Informes</h2>
          <button className="btn btn-outline-primary" onClick={cargarInformes}>
            <i className="bi bi-arrow-clockwise"></i> Actualizar
          </button>
        </div>

        {error && (
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por cliente o fecha..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2">Cargando informes...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Cliente / Razón Social</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {informesFiltrados.length > 0 ? (
                  informesFiltrados.map((inf) => (
                    <tr key={inf.id}>
                      <td>{new Date(inf.createdAt).toLocaleDateString()} {new Date(inf.createdAt).toLocaleTimeString()}</td>
                      <td className="fw-bold">
                        {inf.meta?.cliente || inf.meta?.razon_social || inf.meta?.razonSocial || 'Sin Nombre'}
                      </td>
                      <td>
                        {inf.meta?.tipo === 'verificacion' ? (
                          <span className="badge bg-info text-dark">Verificación</span>
                        ) : (
                          <span className="badge bg-warning text-dark">Puesta a Tierra</span>
                        )}
                      </td>
                      <td>
                        {inf.syncStatus === 'synced' ? (
                          <span className="badge bg-success">Sincronizado</span>
                        ) : (
                          <span className="badge bg-secondary">{inf.syncStatus}</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerInforme(inf)}
                        >
                          Ver / Editar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No se encontraron informes guardados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Historial;
