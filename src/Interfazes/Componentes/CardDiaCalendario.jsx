import React from "react";
import { useNavigate } from "react-router-dom";

export default function CardDiaCalendario({ fecha, servicios }) {
  const navigate = useNavigate();
  const fechaObj = new Date(fecha + "T00:00:00");
  const diaNum = fechaObj.getDate();
  const diaNombre = fechaObj.toLocaleDateString("es-ES", { weekday: "long" });
  const mesAnio = fechaObj.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();

  const esDomingo = servicios.some(s => s.Tipo === "Domingo");

  return (
    <div 
      className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden position-relative h-100"
      onClick={() => navigate("/CalendarioServicios", { state: { fecha } })}
      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div className="d-flex h-100">
        {/* LADO IZQUIERDO: FECHA */}
        <div className={`p-3 d-flex flex-column align-items-center justify-content-center ${esDomingo ? 'bg-primary text-white' : 'bg-light text-dark'}`} style={{ minWidth: '85px' }}>
          <span className="fw-bold text-uppercase" style={{fontSize: '0.7rem'}}>{diaNombre.substring(0,3)}</span>
          <span className="fs-2 fw-black my-1" style={{fontWeight: 900}}>{diaNum}</span>
          <span className="opacity-75" style={{fontSize: '0.6rem'}}>{mesAnio}</span>
        </div>

        {/* LADO DERECHO: CONTENIDO */}
        <div className="p-3 flex-grow-1 bg-white">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="fw-bold mb-0 text-capitalize">{diaNombre}</h6>
            <span className={`badge ${servicios.length > 1 ? 'bg-warning-subtle text-warning-emphasis' : 'bg-light text-muted'} rounded-pill`} style={{fontSize: '0.65rem'}}>
              {servicios.length} EVENTOS
            </span>
          </div>
          
          <div className="ps-2 border-start border-2 border-light">
            {servicios.slice(0, 2).map((s, idx) => (
              <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                <div className="bg-primary rounded-circle" style={{width: '6px', height: '6px'}}></div>
                <span className="text-muted text-truncate" style={{fontSize: '0.8rem'}}>{s.Jornada} - {s.Tipo}</span>
              </div>
            ))}
            {servicios.length > 2 && <small className="text-primary" style={{fontSize: '0.7rem'}}>+{servicios.length - 2} más...</small>}
          </div>
        </div>
      </div>
    </div>
  );
}