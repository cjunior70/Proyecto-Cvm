import React from "react";
import { useNavigate } from "react-router-dom";

// 1. Cambiamos 'key' por 'idServicio' para que React no genere conflicto
export default function CardServicios({
  idServicio,
  servicio,
  img_evento,
  img_ubicacion,
}) {

  const navigate = useNavigate();

  const VerDetallesDelServicio = () => {
    navigate(`/DetallesServicio`, { state: { servicio: servicio } });
  }

  // 🛡️ Control de seguridad por si las moscas
  if (!servicio) return null;

 return (
    <>
      <section 
        className="card mb-3 shadow-sm border-0 p-3 position-relative rounded-4" 
        id={idServicio} 
        onClick={VerDetallesDelServicio} 
        style={{ 
          cursor: "pointer", 
          borderLeft: "5px solid #6E4BDB",
          transition: "transform 0.2s ease" 
        }}
      >
        <section className="d-flex align-items-start gap-3">
          
          {/* 📅 Icono del Evento con fondo suave */}
          <div className="flex-shrink-0">
            <div className="d-flex align-items-center justify-content-center rounded-3" 
                 style={{ width: "44px", height: "44px", backgroundColor: "#EDE9FE" }}>
              <img
                src={img_evento || "https://placehold.co/50"}
                alt="Evento"
                style={{ width: "24px", height: "24px", objectFit: "contain" }}
              />
            </div>
          </div>

          {/* 📝 Contenedor de la Información */}
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0" style={{ color: "#2D3748" }}>{servicio.Fecha}</h6>
              <span className="badge rounded-pill" style={{ backgroundColor: "#EDE9FE", color: "#6E4BDB", fontSize: "0.7rem" }}>
                {servicio.Jornada}
              </span>
            </div>
            
            {/* 📍 Fila de Ubicación y Título */}
            <div className="d-flex align-items-center gap-2 mt-2">
              <img
                src={img_ubicacion || "https://placehold.co/20"}
                alt="Ubicación"
                style={{ width: "16px", height: "16px", opacity: 0.6 }}
              />
              <p className="mb-0 fw-bold text-dark small">
                {servicio.Titulo || "Servicio Agendado"}
              </p>
            </div>

            {/* 💬 Comentario con estilo más sutil */}
            <p className="text-muted small mb-0 mt-2 p-2 rounded-3" 
               style={{ backgroundColor: "#F8F9FA", fontSize: "0.85rem", fontStyle: "italic" }}>
              {servicio.Comentario || "Sin comentarios adicionales."}
            </p>
          </div>

        </section>
      </section>
    </>
  );
}