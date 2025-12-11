import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanillas } from '../hooks/usePlanillas';
import toast from 'react-hot-toast';
import { confirmar } from '../utils/confirmationToast';

const Historial = () => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');
  const navigate = useNavigate();
  const { getAllLocal, handleDeletePlanilla, syncQueue } = usePlanillas();

  const cargarInformes = useCallback(async () => {
    try {
      setLoading(true);
      const localData = await getAllLocal();
      const ordenados = localData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setInformes(ordenados);
      setError(null);
    } catch (err) {
      console.error('Error cargando historial local:', err);
      toast.error('Error al cargar historial local.');
      setError('No se pudieron cargar los informes locales.');
    } finally {
      setLoading(false);
    }
  }, [getAllLocal]);

  useEffect(() => {
    cargarInformes();

    // Actualizar al enfocar la ventana (ej. volver de otra pestaña o app)
    const handleFocus = () => {
      cargarInformes();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cargarInformes]);

  const handleSync = async () => {
    const success = await syncQueue(true); // true para indicar que es un trigger manual
    if (success) {
      // Si la sincronización (especialmente el pull) fue exitosa, recargamos los datos
      cargarInformes();
    }
  };

  const handleVerInforme = (informe) => {
    const tipo = informe.meta?.tipo || 'verificacion';
    let ruta = '/verificacion';
    if (tipo === 'puesta-tierra') {
      ruta = '/medicion-puesta-tierra';
    }

    // Corregido: Unir meta y las imágenes de nivel superior para que lleguen a la siguiente pantalla
    const datosCargados = { ...informe.meta, images: informe.images || [] };

    navigate(ruta, { 
      state: { 
        datosCargados: datosCargados, 
        localId: informe.id, 
        remoteId: informe.remoteId,
        // Se mantiene el envío de `files` por si el informe es local y no está sincronizado
        imagenes: informe.files || [] 
      } 
    });
  };

  const handleDelete = async (informe) => {
    const confirmado = await confirmar(
        "¿Eliminar informe?", 
        "Esta acción no se puede deshacer."
    );
    
    if (!confirmado) return;

    try {
        await handleDeletePlanilla(informe);
        // La UI se actualiza al recargar los informes
        cargarInformes();
    } catch (err) {
        console.error(err);
        toast.error("Error al eliminar: " + (err.message || 'Error desconocido'));
    }
  };

  const informesFiltrados = informes.filter(inf => {
    const cliente = inf.meta?.cliente || inf.meta?.razon_social || inf.meta?.razonSocial || 'Sin Cliente';
    const fecha = new Date(inf.createdAt).toLocaleDateString();
    const texto = `${cliente} ${fecha}`.toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  return (
    <>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Historial de Informes</h2>
          <button className="btn btn-primary" onClick={handleSync}>
            <i className="bi bi-arrow-repeat"></i> Sincronizar
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
            <table className="table table-hover table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Cliente / Razón Social</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th style={{ width: '180px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {informesFiltrados.length > 0 ? (
                  informesFiltrados.map((inf) => (
                    <tr key={inf.id} className={inf.syncStatus !== 'synced' ? 'table-warning' : ''}>
                      <td>{new Date(inf.createdAt).toLocaleDateString()} <small className="text-muted">{new Date(inf.createdAt).toLocaleTimeString()}</small></td>
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
                          <span className="badge bg-secondary text-capitalize">{inf.syncStatus}</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                            <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleVerInforme(inf)}
                            title="Ver o Editar"
                            >
                            <i className="bi bi-pencil-square"></i>
                            </button>
                            <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(inf)}
                            title="Eliminar Informe"
                            >
                            <i className="bi bi-trash"></i>
                            </button>
                        </div>
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
