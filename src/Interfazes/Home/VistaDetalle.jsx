import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";

const VistaDetalleCronograma = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtenemos el servicio pasado por el state de navegación
  const { servicio } = location.state || {};
  
  const [equipo, setEquipo] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Si entran directo a la URL sin pasar por la lista, los devolvemos
    if (!servicio) {
      navigate("/Homeadmin");
    } else {
      cargarEquipo();
    }
  }, [servicio]);

  const cargarEquipo = async () => {
    setCargando(true);
    try {
      // Llamada a la función RPC que acabamos de actualizar en Postgres
      const { data, error } = await supabase.rpc("obtener_equipo_servicio", {
        p_servicio_id: servicio.Id,
      });

      if (error) throw error;
      setEquipo(data || []);
    } catch (error) {
      console.error("Error al cargar equipo:", error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light pb-5">
      {/* --- HEADER --- */}
      <div className="sticky-top bg-white border-bottom p-3 d-flex align-items-center shadow-sm">
        <button 
          className="btn btn-light rounded-circle me-3 border-0" 
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h6 className="fw-bold mb-0 text-uppercase">
            {servicio?.Tipo || "Detalle del Servicio"}
          </h6>
          <small className="text-muted">
            {servicio?.Fecha} • {servicio?.Jornada}
          </small>
        </div>
      </div>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0 text-dark">Personal Requerido</h5>
          <span className="badge bg-dark rounded-pill px-3">
            {equipo.length} Áreas
          </span>
        </div>

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted small">Sincronizando equipo...</p>
          </div>
        ) : (
          <div className="row g-3">
            {equipo.map((puesto) => {
              const asignado = puesto.esta_asignado;

              return (
                <div key={puesto.cronograma_id || puesto.servicio_area_id} className="col-12">
                  <div 
                    className={`card border-0 rounded-4 shadow-sm transition-all ${
                      asignado ? "bg-white" : "border-start border-warning border-5 bg-white"
                    }`}
                  >
                    <div className="card-body d-flex align-items-center p-3">
                      
                      {/* --- SECCIÓN FOTO / ICONO --- */}
                      <div className="me-3 position-relative">
                        {asignado && puesto.servidor_foto ? (
                          <img 
                            src={puesto.servidor_foto} 
                            className="rounded-circle shadow-sm border" 
                            width="55" 
                            height="55" 
                            style={{ objectFit: "cover" }} 
                            onError={(e) => { 
                               e.target.src = `https://ui-avatars.com/api/?name=${puesto.servidor_nombre || puesto.area_nombre}&background=0D6EFD&color=fff`; 
                            }}
                            alt="Avatar"
                          />
                        ) : (
                          <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${
                              asignado ? "bg-primary text-white" : "bg-warning-subtle text-warning"
                            }`} 
                            style={{ width: "55px", height: "55px" }}
                          >
                            <i className={`bi ${asignado ? "bi-person-fill" : "bi-geo-alt-fill"} fs-4`}></i>
                          </div>
                        )}
                        {/* Indicador de estado */}
                        <span className={`position-absolute bottom-0 end-0 p-1 border border-light rounded-circle ${asignado ? 'bg-success' : 'bg-warning'}`}></span>
                      </div>

                      {/* --- INFO DEL PUESTO --- */}
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="text-muted fw-bold mb-1" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
                          {puesto.area_nombre}
                        </div>
                        
                        <h6 className={`fw-bold mb-0 text-truncate ${asignado ? "text-dark" : "text-muted italic"}`}>
                          {asignado ? puesto.servidor_nombre : "Puesto Disponible"}
                        </h6>
                        
                        {!asignado && (
                          <span className="text-warning small" style={{fontSize: '11px'}}>
                            <i className="bi bi-info-circle me-1"></i>Requiere atención
                          </span>
                        )}
                      </div>

                      {/* --- ACCIONES --- */}
                      <div className="ms-2">
                        <button 
                          className={`btn btn-sm rounded-pill px-4 fw-bold shadow-sm ${
                            asignado ? "btn-light border text-secondary" : "btn-primary"
                          }`}
                          onClick={() => {
                            // Aquí iría la lógica para abrir el modal de selección
                            console.log("Gestionar puesto:", puesto.servicio_area_id);
                          }}
                        >
                          {asignado ? "Cambiar" : "Asignar"}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- EMPTY STATE --- */}
        {!cargando && equipo.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-clipboard-x text-muted" style={{fontSize: '3rem'}}></i>
            <h6 className="text-muted mt-3">No hay áreas configuradas para este servicio.</h6>
            <button className="btn btn-outline-primary btn-sm mt-2 rounded-pill">
              Configurar Áreas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaDetalleCronograma;