export default function ModalGenerarDeLosServicios({ visible, onClose, onConfirm }) {
  if (!visible) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ background: "rgba(0,0,0,.4)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4">

          <div className="modal-header border-0">
            <h6 className="fw-bold m-0">
              Generar Servicios
            </h6>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body text-center">
            ¿Deseas generar automáticamente los servicios
            del mes actual?
          </div>

          <div className="modal-footer border-0">
            <button
              className="btn btn-outline-secondary w-50"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary w-50"
              onClick={onConfirm}
            >
              Generar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
