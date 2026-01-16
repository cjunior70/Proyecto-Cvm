export default function ModalServicio({ servicio, onClose }) {
  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">
              Detalle del servicio
            </h5>
            <button
              className="btn-close"
              onClick={onClose}
            />
          </div>

          <div className="modal-body text-start">
            <p><strong>Área:</strong> {servicio.area}</p>
            <p><strong>Servidor:</strong> {servicio.servidor}</p>
            <p><strong>Fecha:</strong> {servicio.fecha}</p>
            <p><strong>Jornada:</strong> {servicio.jornada}</p>
            <p><strong>Lugar:</strong> {servicio.lugar}</p>
            <p><strong>Comentario:</strong> {servicio.comentario}</p>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary w-100"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
