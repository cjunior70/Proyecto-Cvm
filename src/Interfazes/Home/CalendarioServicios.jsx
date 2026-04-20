import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { obtenerProximoDiaConServicios } from "./serviciosProximos";

export default function CalendarioServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Extraemos la fecha si viene del Home, si no, la lógica buscará el próximo día
  const { fecha } = location.state || {};

  useEffect(() => {
    cargarServicios();
  }, [fecha]);

  const cargarServicios = async () => {
    setCargandoLista(true);
    try {
      // Usamos tu lógica: si hay una fecha seleccionada, podrías filtrar por esa, 
      // si no, tu función trae el próximo día con servicios automáticamente.
      const data = await obtenerProximoDiaConServicios(fecha);
      setServicios(data || []);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    } finally {
      setCargandoLista(false);
    }
  };

  // Tomamos la fecha del primer servicio para el título
  const fechaTexto = servicios.length > 0 
    ? new Date(servicios[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : "Próxima Agenda";

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* HEADER PREMIUM (Igual al Home para consistencia) */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-circle border-0">
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <span className="fw-bold tracking-tight text-uppercase small" style={{ letterSpacing: '1px' }}>
            Detalle de Agenda
          </span>
        </div>
        <h2 className="fw-bold text-capitalize">{fechaTexto}</h2>
        <p className="opacity-75 small mb-0">Gestiona los servicios y equipos para este día.</p>
      </div>

      <div className="container" style={{ maxWidth: '600px', marginTop: '-25px', padding:"8vw" }}>
        
        {/* LISTA DE SERVICIOS */}
        <div className="row g-3">
          {cargandoLista ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            servicios.map((s) => (
              <div key={s.Id} className="col-12">
                <div 
                  className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/VistaDetalleCronograma', { state: { servicio: s } })}
                >
                  {/* Borde lateral dinámico */}
                  <div 
                    className={`position-absolute h-100 ${s.Tipo === 'Domingo' ? 'bg-primary' : 'bg-info'}`} 
                    style={{ width: '6px', left: 0, top: 0 }}
                  ></div>

                  <div className="card-body p-3 ps-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <div className="badge bg-dark-subtle text-dark rounded-pill mb-2 px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
                          {s.Jornada}
                        </div>
                        <h5 className="fw-bold mb-1 text-dark">{s.Tipo}</h5>
                        <div className="d-flex align-items-center text-muted small">
                          <i className="bi bi-clock me-2"></i>
                          <span>Toca para ver equipo asignado</span>
                        </div>
                      </div>
                      <div className="ms-3 bg-light p-3 rounded-circle text-primary shadow-sm">
                        <i className="bi bi-chevron-right fs-5"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* EMPTY STATE */}
          {!cargandoLista && servicios.length === 0 && (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                <i className="bi bi-calendar2-x fs-1 text-muted mb-3"></i>
                <h6 className="fw-bold">No hay servicios programados</h6>
                <p className="text-muted small">Selecciona otra fecha en el calendario.</p>
              </div>
            </div>
          )}
        </div>
      </div>


      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:active { transform: scale(0.97); }
        .tracking-tight { letter-spacing: -0.5px; }
      `}</style>
    </div>
  );
}