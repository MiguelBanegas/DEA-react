import toast from 'react-hot-toast';

export const confirmar = (mensaje, descripcion = "") => {
  return new Promise((resolve) => {
    toast((t) => (
      <div className="d-flex flex-column gap-2" style={{ minWidth: '250px' }}>
        <div className="fw-bold">{mensaje}</div>
        {descripcion && <div className="text-muted small">{descripcion}</div>}
        <div className="d-flex justify-content-end gap-2 mt-2">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity, // No se cierra solo
      position: 'top-center',
      style: {
        background: '#fff',
        color: '#333',
        border: '1px solid #ddd',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    });
  });
};
