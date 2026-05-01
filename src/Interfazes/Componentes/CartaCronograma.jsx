import React, { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";

export default function CartaCronograma({ servicio }) {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUid(data.user?.id);
    });
  }, []);

  // 1. Validamos que el servicio exista para evitar el "blanco"
  if (!servicio) return null;

  // 2. Extraemos la fecha (ajustado a la estructura que viene del Home)
  const fechaServicio = new Date(servicio.Fecha + "T00:00:00").toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );

  // 3. Identificamos si el usuario es Apoyo o Titular en este servicio
  const miAsignacion = servicio.Cronograma?.find(
    (c) => c.IdServidorExtra === uid || c.Servidor_Area?.IdServidor === uid
  );

  const esApoyo = miAsignacion?.IdServidorExtra === uid;
  const nombreArea = miAsignacion?.Servidor_Area?.Aerea?.Nombre || "Servicio";

  return (
    <div className="p-3 bg-white">
      <div className="d-flex justify-content-between align-items-center">
        {/* IZQUIERDA: Info del Servicio */}
        <div className="flex-grow-1">
          <h6 className="mb-1 text-capitalize fw-bold text-dark">
            {fechaServicio}
          </h6>
          <div className="d-flex align-items-center gap-2">
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              {servicio.Jornada}
            </small>
            <span className="text-muted opacity-25">|</span>
            <small className="text-muted">{servicio.Tipo}</small>
          </div>
        </div>

        {/* DERECHA: Rol/Área */}
        <div className="text-end">
          <span
            className={`badge rounded-pill ${
              esApoyo 
                ? "bg-info-subtle text-info border border-info-subtle" 
                : "bg-primary-subtle text-primary border border-primary-subtle"
            }`}
            style={{ fontSize: "11px", letterSpacing: "0.5px" }}
          >
            {esApoyo ? (
              <>
                <i className="bi bi-person-plus-fill me-1"></i> APOYO
              </>
            ) : (
              nombreArea.toUpperCase()
            )}
          </span>
        </div>
      </div>
      
      {/* Indicador de "Servidor Disponible" si aplica */}
      {servicio.Cronograma?.length > 1 && !esApoyo && (
        <div className="mt-2 pt-2 border-top border-light">
          <small className="text-muted" style={{ fontSize: "10px" }}>
            <i className="bi bi-people-fill me-1"></i> 
            Hay personal de apoyo asignado para este día.
          </small>
        </div>
      )}
    </div>
  );
}