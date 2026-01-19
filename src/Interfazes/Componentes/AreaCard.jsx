export default function AreaCard({ area, mostrarBoton = false, onRegistrar }) {
  return (
    <div
      className="card border-0 shadow-sm"
      style={{ minWidth: "180px" }}
    >
      <img
        src={area.Foto}
        className="card-img-top"
        alt={area.Nombre}
        style={{ height: "120px", objectFit: "cover" }}
      />

      <div className="card-body text-center p-2">
        <h6 className="fw-bold mb-1">{area.Nombre}</h6>

        <p className="text-muted small mb-2">
          {area.Descripcion}
        </p>

        {mostrarBoton && (
          <button
            className="btn btn-outline-dark btn-sm w-100"
            onClick={() => onRegistrar(area)}
          >
            Registrarme
          </button>
        )}
      </div>
    </div>
  );
}
