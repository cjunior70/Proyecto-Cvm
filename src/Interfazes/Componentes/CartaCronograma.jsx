export default function CartaCronograma({ servicio, onClick }) {

  // ✅ USAR LA FECHA DEL SERVICIO
  const fechaServicio = new Date(
    servicio.Servicio.Fecha + "T00:00:00"
  ).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="card shadow-sm mb-3"
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      <div className="card-body d-flex justify-content-between align-items-center">

        {/* IZQUIERDA */}
        <div>
          <h6 className="mb-1 text-capitalize">
            {fechaServicio}
          </h6>
          <small className="text-muted">
            Jornada: {servicio.Servicio.Jornada}
          </small>
        </div>

        {/* DERECHA */}
        <span className="badge bg-primary fs-6">
          {servicio.Servidor_Area.Aerea.Nombre}
        </span>

      </div>
    </div>
  );
}
