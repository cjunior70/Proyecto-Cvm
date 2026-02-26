import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import { obtenerProximoDiaConServicios } from "./serviciosProximos";
import { generarCronogramaAutomatico } from "./generarCronogramaAutomatico";

export default function Homeadmin() {
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [cronogramaDetalle, setCronogramaDetalle] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    const data = await obtenerProximoDiaConServicios();
    setServicios(data || []);
  };

  const abrirDetalle = async (servicio) => {
    setServicioSeleccionado(servicio);
    setMostrarModal(true);
    setCargandoDetalle(true);

    try {
      // Triple Join: Cronograma -> Servidor_Area -> {Aerea, Servidores}
      const { data, error } = await supabase
        .from("Cronograma")
        .select(`
          Id,
          Servidor_Area (
            Aerea ( Nombre ),
            Servidores ( Nombre, Foto, Rol )
          )
        `)
        .eq("IdServicio", servicio.Id);

      if (error) throw error;
      setCronogramaDetalle(data || []);
    } catch (error) {
      console.error("Error al obtener cronograma:", error.message);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const [year, month, day] = fecha.split("-");
    const fechaLocal = new Date(year, month - 1, day);
    return fechaLocal.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <header className="text-center mb-5">
        <h4 className="fw-bold mb-1">📅 Panel de Administración</h4>
        <p className="text-muted small">Gestión de próximos servicios y equipo</p>
      </header>

      {servicios.length === 0 ? (
        <div className="text-center p-5 bg-light rounded-5 border border-dashed">
          <p className="text-muted mb-0">No hay servicios programados para hoy o mañana.</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill text-uppercase fw-bold" style={{ fontSize: '12px', letterSpacing: '1px' }}>
              {formatearFecha(servicios[0].Fecha)}
            </span>
          </div>

          <div className="row g-3">
            {servicios.map((servicio) => (
              <div key={servicio.Id} className="col-12">
                <div
                  className="card border-0 shadow-sm rounded-4 hover-card"
                  style={{ cursor: "pointer", transition: "0.3s" }}
                  onClick={() => abrirDetalle(servicio)}
                >
                  <div className="card-body d-flex justify-content-between align-items-center p-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-dark text-white rounded-3 p-3 me-3 text-center" style={{ minWidth: '70px' }}>
                        <div className="small opacity-75 text-uppercase" style={{ fontSize: '9px' }}>Hora</div>
                        <div className="fw-bold" style={{ fontSize: '13px' }}>{servicio.Jornada}</div>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0">{servicio.Tipo}</h6>
                        <small className="text-muted">{servicio.Comentario || "Servicio programado"}</small>
                      </div>
                    </div>
                    <div className="text-end">
                      <i className="bi bi-chevron-right text-muted"></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="d-grid mt-5">
        <button
          className="btn btn-dark rounded-pill py-3 fw-bold shadow-lg"
          onClick={() => generarCronogramaAutomatico(servicios, cargarServicios)}
        >
          ⚙️ Generar Cronograma Automático
        </button>
      </div>

      {/* MODAL DE DETALLE DEL EQUIPO */}
      {mostrarModal && servicioSeleccionado && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '28px' }}>
              
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div>
                  <h5 className="fw-bold mb-0">{servicioSeleccionado.Tipo}</h5>
                  <p className="text-muted small mb-0">{servicioSeleccionado.Fecha} • {servicioSeleccionado.Jornada}</p>
                </div>
                <button className="btn-close shadow-none" onClick={() => setMostrarModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <label className="text-primary fw-bold small text-uppercase mb-3 d-block" style={{ letterSpacing: '1px' }}>
                  Equipo de Servicio
                </label>

                {cargandoDetalle ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : cronogramaDetalle.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {cronogramaDetalle.map((item) => (
                      <div key={item.Id} className="d-flex align-items-center p-3 bg-light rounded-4 border border-white shadow-sm">
                        <div className="me-3">
                          {item.Servidor_Area?.Servidores?.Foto ? (
                            <img 
                              src={item.Servidor_Area.Servidores.Foto} 
                              alt="Avatar" 
                              className="rounded-circle border border-2 border-white shadow-sm"
                              style={{ width: '48px', height: '48px', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold" style={{ width: '48px', height: '48px' }}>
                              {item.Servidor_Area?.Servidores?.Nombre?.charAt(0) || "S"}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted fw-bold" style={{ fontSize: '3vw', textTransform: 'uppercase' }}>
                            {item.Servidor_Area?.Aerea?.Nombre}
                          </div>
                          <div className="fw-bold text-dark">{item.Servidor_Area?.Servidores?.Nombre}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 rounded-4 border border-dashed bg-light bg-opacity-50">
                    <div className="display-6 mb-2">🤔</div>
                    <p className="text-muted small">Aún no se han asignado personas para este servicio.</p>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-outline-dark rounded-pill w-100 py-2 fw-bold" onClick={() => setMostrarModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-card:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
        }
        .hover-card:active {
          transform: scale(0.98);
        }
        body {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
}