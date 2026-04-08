import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import { obtenerProximoDiaConServicios } from "./serviciosProximos";
import { generarCronogramaAutomatico } from "./generarCronogramaAutomatico";

export default function Homeadmin() {
  const [servicios, setServicios] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    setCargandoLista(true);
    try {
      const data = await obtenerProximoDiaConServicios();
      setServicios(data || []);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    } finally {
      setCargandoLista(false);
    }
  };

  const manejarGeneracion = async () => {
    if (servicios.length === 0) return;
    setGenerando(true);
    await generarCronogramaAutomatico(servicios, () => {
      cargarServicios();
    });
    setGenerando(false);
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* --- NAVBAR ESTILO APP --- */}
      <nav className="navbar navbar-dark bg-dark shadow-sm mb-4 py-3 sticky-top">
        <div className="container-fluid px-3">
          <span className="navbar-brand mb-0 h1 fw-bold">
            <i className="bi bi-grid-fill me-2 text-primary"></i>
            Admin Panel
          </span>
          <div className="d-flex">
            <button className="btn btn-outline-light btn-sm rounded-pill px-3" onClick={cargarServicios}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '650px' }}>
        
        {/* --- TÍTULO DE SECCIÓN --- */}
        <div className="px-2 mb-3">
          <h5 className="fw-bold text-dark mb-1">Próxima Agenda</h5>
          <p className="text-muted small">Toca un servicio para gestionar el equipo.</p>
        </div>

        {/* --- CONTENEDOR DE CARDS --- */}
        <div className="row g-3 px-2">
          {cargandoLista ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            servicios.map((s) => (
              <div key={s.Id} className="col-12">
                <div 
                  className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative h-100"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => navigate('/VistaDetalleCronograma', { state: { servicio: s } })}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* Borde lateral según tipo */}
                  <div 
                    className={`position-absolute h-100 ${s.Tipo === 'Domingo' ? 'bg-primary' : 'bg-info'}`} 
                    style={{ width: '5px', left: 0, top: 0 }}
                  ></div>

                  <div className="card-body p-3 ps-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="badge bg-dark-subtle text-dark rounded-pill mb-2 px-3 py-2 fw-bold" style={{ fontSize: '0.75rem' }}>
                          {s.Jornada}
                        </div>
                        <h6 className="fw-bold mb-1 text-dark fs-5">{s.Tipo}</h6>
                        <div className="text-muted small">
                          <i className="bi bi-calendar-event me-2"></i>
                          {new Date(s.Fecha + "T00:00:00").toLocaleDateString('es-ES', { 
                            weekday: 'long', day: 'numeric', month: 'short' 
                          })}
                        </div>
                      </div>
                      <div className="bg-light p-3 rounded-circle text-primary shadow-sm">
                        <i className="bi bi-chevron-right fs-5"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* --- EMPTY STATE --- */}
          {!cargandoLista && servicios.length === 0 && (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                <i className="bi bi-calendar2-x fs-1 text-muted mb-3"></i>
                <h6 className="fw-bold">No hay servicios próximos</h6>
                <p className="text-muted small">Todo está al día por ahora.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- BOTÓN FLOTANTE (Bootstrap FAB) --- */}
      <div className="fixed-bottom d-flex justify-content-center mb-5 pb-5" style={{ pointerEvents: 'none' }}>
        <button 
          className={`btn btn-primary shadow-lg rounded-pill px-4 py-3 fw-bold border-0 d-flex align-items-center gap-2 ${generando ? 'disabled' : ''}`}
          style={{ 
            pointerEvents: 'auto', 
            zIndex: 1050,
            background: 'linear-gradient(45deg, #0d6efd, #0dCAF0)',
            boxShadow: '0 8px 20px rgba(13, 110, 253, 0.4)'
          }}
          onClick={manejarGeneracion}
          disabled={generando || servicios.length === 0}
        >
          {generando ? (
            <span className="spinner-border spinner-border-sm" role="status"></span>
          ) : (
            <i className="bi bi-magic fs-5"></i>
          )}
          <span>{generando ? 'Procesando...' : 'Autocompletar Fijos'}</span>
        </button>
      </div>

      {/* --- ESTILOS EXTRA --- */}
      <style>{`
        .navbar-brand { font-size: 1.2rem; letter-spacing: -0.5px; }
        .card { transition: all 0.3s ease; }
        .card:active { transform: scale(0.98) !important; }
        .btn-primary:active { transform: translateY(2px); }
      `}</style>
    </div>
  );
}