import { useState } from "react";
import ModalServicio from "../Componentes/ModalServicio.jsx";

export default function Home() {
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  const hoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const serviciosMock = [
    {
      id: 1,
      fecha: "2026-01-21",
      area: "Sonido",
      servidor: "Carlos Gaviria",
      jornada: "Mañana",
      comentario: "Prueba de sonido general",
      lugar: "Auditorio principal",
    },
    {
      id: 2,
      fecha: "2026-01-21",
      area: "Iluminación",
      servidor: "Yarkit Mendoza",
      jornada: "Mañana",
      comentario: "Luces frontales",
      lugar: "Auditorio principal",
    },
  ];

  return (
    <div className="container py-3">

      {/* TÍTULO */}
      <h4 className="fw-bold text-center mb-1">
        Próximo servicio
      </h4>

      {/* FECHA */}
      <p className="text-center text-muted mb-4">
        {hoy}
      </p>

      {/* TABLA */}
      <div className="table-responsive">
        <table className="table table-hover align-middle text-center">
          <thead className="table-light">
            <tr>
              <th>Área</th>
              <th>Servidor</th>
            </tr>
          </thead>
          <tbody>
            {serviciosMock.map((servicio) => (
              <tr
                key={servicio.id}
                style={{ cursor: "pointer" }}
                onClick={() => setServicioSeleccionado(servicio)}
              >
                <td>{servicio.area}</td>
                <td>{servicio.servidor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {servicioSeleccionado && (
        <ModalServicio
          servicio={servicioSeleccionado}
          onClose={() => setServicioSeleccionado(null)}
        />
      )}
    </div>
  );
}
