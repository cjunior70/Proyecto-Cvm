import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";

const VistaDetalleCronograma = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { servicio } = location.state || {};
  
  const [equipo, setEquipo] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscandoCandidatos, setBuscandoCandidatos] = useState(false);
  
  // Estados para el Modal
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);

  useEffect(() => {
    if (!servicio) {
      navigate("/Homeadmin");
    } else {
      cargarEquipo();
    }
  }, [servicio]);

  const cargarEquipo = async () => {
    setCargando(true);
    try {
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

  // 1. BUSCAR PERSONAS DISPONIBLES (EL MATCH)
  const abrirSeleccionCandidatos = async (puesto) => {
    setPuestoSeleccionado(puesto);
    setBuscandoCandidatos(true);
    setMostrarModalAsignar(true);
    
    try {
      // Llamamos al RPC que creamos anteriormente
      const { data, error } = await supabase.rpc("obtener_candidatos_disponibles", {
        p_dia: servicio.Dia,
        p_hora: servicio.Jornada,
        p_area_id: puesto.area_id
      });

      if (error) throw error;
      setCandidatos(data || []);
    } catch (error) {
      console.error("Error al buscar candidatos:", error.message);
    } finally {
      setBuscandoCandidatos(false);
    }
  };

  // 2. GUARDAR LA ASIGNACIÓN EN LA BASE DE DATOS
  const ejecutarAsignacion = async (servidorId) => {
    try {
      setCargando(true);
      
      // Upsert: Si ya existe el registro en Cronograma lo actualiza, si no lo crea
      const { error } = await supabase
        .from("Cronograma")
        .upsert({
          IdServicio: servicio.Id,
          IdArea: puestoSeleccionado.area_id,
          IdServidor: servidorId
        }, { onConflict: 'IdServicio, IdArea' }); // Evita duplicados en la misma área/servicio

      if (error) throw error;

      setMostrarModalAsignar(false);
      await cargarEquipo(); // Recargamos la vista para ver los cambios
    } catch (error) {
      alert("Error al asignar: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light pb-5">
      {/* --- HEADER --- */}
      <div className="sticky-top bg-white border-bottom p-3 d-flex align-items-center shadow-sm">
        <button className="btn btn-light rounded-circle me-3 border-0" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h6 className="fw-bold mb-0 text-uppercase">{servicio?.Tipo || "Detalle"}</h6>
          <small className="text-muted">{servicio?.Fecha} • {servicio?.Jornada}</small>
        </div>
      </div>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Personal Requerido</h5>
          <span className="badge bg-dark rounded-pill px-3">{equipo.length} Puestos</span>
        </div>

        {cargando && !mostrarModalAsignar ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <div className="row g-3">
            {equipo.map((puesto) => {
              const asignado = puesto.esta_asignado;
              return (
                <div key={puesto.servicio_area_id} className="col-12">
                  <div className={`card border-0 rounded-4 shadow-sm ${asignado ? "bg-white" : "border-start border-warning border-5 bg-white"}`}>
                    <div className="card-body d-flex align-items-center p-3">
                      <div className="me-3">
                        {asignado ? (
                          <img src={puesto.servidor_foto} className="rounded-circle border" width="55" height="55" style={{ objectFit: "cover" }} />
                        ) : (
                          <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                            <i className="bi bi-person-plus-fill fs-4"></i>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow-1 overflow-hidden">
                        <div className="text-muted fw-bold mb-1" style={{ fontSize: "10px", textTransform: "uppercase" }}>{puesto.area_nombre}</div>
                        <h6 className={`fw-bold mb-0 text-truncate ${asignado ? "text-dark" : "text-muted italic"}`}>
                          {asignado ? puesto.servidor_nombre : "Sin asignar"}
                        </h6>
                      </div>

                      <button 
                        className={`btn btn-sm rounded-pill px-4 fw-bold ${asignado ? "btn-light border" : "btn-primary"}`}
                        onClick={() => abrirSeleccionCandidatos(puesto)}
                      >
                        {asignado ? "Cambiar" : "Asignar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL DE SELECCIÓN DE CANDIDATOS --- */}
      {mostrarModalAsignar && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
          <div className="modal-dialog modal-dialog-centered mx-3">
            <div className="modal-content rounded-5 border-0 shadow-lg overflow-hidden">
              <div className="modal-header border-0 p-4 pb-2">
                <h6 className="fw-bold mb-0">Seleccionar Personal</h6>
                <button className="btn-close" onClick={() => setMostrarModalAsignar(false)}></button>
              </div>
              
              <div className="modal-body p-4 pt-0">
                <p className="text-muted small mb-4">Disponibles para <b>{puestoSeleccionado?.area_nombre}</b></p>
                
                {buscandoCandidatos ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                ) : (
                  <div className="list-group list-group-flush" style={{maxHeight: '350px', overflowY: 'auto'}}>
                    {candidatos.length > 0 ? (
                      candidatos.map(c => (
                        <button 
                          key={c.servidor_id}
                          className="list-group-item list-group-item-action d-flex align-items-center border-0 py-3 rounded-4 mb-2 bg-light"
                          onClick={() => ejecutarAsignacion(c.servidor_id)}
                        >
                          <img src={c.foto || `https://ui-avatars.com/api/?name=${c.nombre}`} className="rounded-circle me-3 shadow-sm" width="45" height="45" style={{objectFit: 'cover'}} />
                          <div className="flex-grow-1 text-start">
                            <h6 className="mb-0 fw-bold" style={{fontSize: '0.9rem'}}>{c.nombre}</h6>
                            <span className="text-success small" style={{fontSize: '11px'}}>
                              <i className="bi bi-check-circle-fill me-1"></i>Confirmado
                            </span>
                          </div>
                          <i className="bi bi-plus-circle-fill text-primary fs-5"></i>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-5">
                        <i className="bi bi-person-x fs-1 text-muted"></i>
                        <p className="text-muted mt-2 small">Nadie disponible para este horario.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 text-center border-top">
                <button className="btn btn-link btn-sm text-decoration-none text-muted fw-bold" onClick={() => setMostrarModalAsignar(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaDetalleCronograma;