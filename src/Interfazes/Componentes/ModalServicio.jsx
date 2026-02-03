export default function ModalServicio({ servicio, onClose }) {
  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">📋 Detalle del servicio</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body text-start">
            <p><strong>Área:</strong> {servicio.area}</p>
            <p><strong>Servidor:</strong> {servicio.servidor}</p>
            <p><strong>Jornada:</strong> {servicio.Jornada}</p>
            <p><strong>Tipo:</strong> {servicio.Tipo}</p>
            <p><strong>Estado:</strong> {servicio.Estado}</p>
            <p><strong>Comentario:</strong> {servicio.Comentario}</p>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
