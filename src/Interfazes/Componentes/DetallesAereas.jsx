import { useParams } from "react-router-dom";

export default function DetallesAereas() {
  const { id } = useParams();

  return (
    <div className="container py-4">

      <h4 className="fw-bold mb-3">
        Detalles del Área
      </h4>

      <p className="text-muted">
        ID del área seleccionada: <strong>{id}</strong>
      </p>

      <div className="alert alert-info">
        Aquí más adelante mostraremos:
        <ul className="mb-0">
          <li>Servicios del área</li>
          <li>Servidores asignados</li>
          <li>Cronograma</li>
        </ul>
      </div>

    </div>
  );
}
