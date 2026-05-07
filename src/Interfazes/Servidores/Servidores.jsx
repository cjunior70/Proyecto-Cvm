import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import DatosServidores from "./DatosServidores"; // Asegúrate de que el nombre del archivo coincida

export default function Servidores() {
  const [servidores, setServidores] = useState([]);
  const [areasPermitidas, setAreasPermitidas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);
  
  // NUEVO ESTADO: Para controlar la interfaz de áreas/detalles
  const [servidorParaAreas, setServidorParaAreas] = useState(null);

  const [asignaciones, setAsignaciones] = useState([]);
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState("");
  const [areaId, setAreaId] = useState("");
  const [cargando, setCargando] = useState(false);

  // 1. Cargar servidores al inicio
  useEffect(() => {
    cargarServidores();
    if (window.location.hash.includes("access_token") || window.location.hash.includes("error")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const cargarServidores = async () => {
    const { data } = await supabase.from("Servidores").select("*").order("Nombre");
    setServidores(data || []);
  };

  const cargarAreasPermitidas = async (idServidor) => {
    const { data, error } = await supabase
      .from("Servidor_Area")
      .select(`IdAerea, Aerea ( Id, Nombre )`)
      .eq("IdServidor", idServidor);
    
    if (error) return console.error(error);
    setAreasPermitidas(data.map(item => item.Aerea) || []);
  };

  const cargarAsignacionesHorarios = async (idServidor) => {
    const { data } = await supabase
      .from("Disponbilidad")
      .select(`id, Dia, Hora, Fecha, Aerea ( Id, Nombre )`)
      .eq("IdServidor", idServidor)
      .order("Fecha", { ascending: true });
    setAsignaciones(data || []);
  };

  const abrirGestion = async (servidor) => {
    setServidorSeleccionado(servidor);
    setCargando(true);
    await cargarAreasPermitidas(servidor.Id);
    await cargarAsignacionesHorarios(servidor.Id);
    setMostrarModal(true);
    setCargando(false);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setDia(""); setHora(""); setAreaId("");
  };

  const guardarNuevaAsignacion = async () => {
    if (!dia || !hora || !areaId) return;
    setCargando(true);
    const { error } = await supabase.rpc("proyectar_disponibilidad_mensual", {
      p_servidor_id: servidorSeleccionado.Id,
      p_dia_nombre: dia,
      p_hora: hora,
      p_aerea: areaId,
      p_estado: "Fijo",
    });

    if (!error) {
      await cargarAsignacionesHorarios(servidorSeleccionado.Id);
      await cargarServidores();
      setDia(""); setHora(""); setAreaId("");
    } else {
      alert("Error al asignar: " + error.message);
    }
    setCargando(false);
  };

  const eliminarAsignacion = async (idReg) => {
    if (!window.confirm("¿Eliminar este registro específico del mes?")) return;
    setCargando(true);
    const { error } = await supabase.from("Disponbilidad").delete().eq("id", idReg);
    if (!error) {
      await cargarAsignacionesHorarios(servidorSeleccionado.Id);
      const { data } = await supabase
        .from("Disponbilidad")
        .select("id")
        .eq("IdServidor", servidorSeleccionado.Id);
      if (!data || data.length === 0) {
        await supabase.from("Servidores").update({ Estado: "Libre" }).eq("Id", servidorSeleccionado.Id);
        await cargarServidores();
      }
    }
    setCargando(false);
  };

  const horasOpciones = dia === "Domingo" 
    ? ["7:00 AM", "9:00 AM y 11:00 AM", "6:00 PM"] 
    : dia === "Miércoles" ? ["6:00 PM", "7:30 PM"] : [];

  return (
    <div className="min-vh-100 bg-light pb-5">
      {/* HEADER PREMIUM DARK */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-0">Servidores</h2>
            <p className="opacity-75 small mb-0">Gestiona estados y horarios fijos.</p>
          </div>
          <div className="bg-primary p-3 rounded-4 shadow-sm">
            <i className="bi bi-person-gear fs-3 text-white"></i>
          </div>
        </div>
      </div>

      {/* LISTA DE SERVIDORES */}
      <div className="container" style={{ marginTop: '-25px' }}>
        <div className="row g-3">
          {servidores.map((s) => (
            <div key={s.Id} className="col-12 col-md-6">
              {/* CARTA CLICKEABLE PARA DETALLES/ÁREAS */}
              <div 
                className="card border-0 shadow-sm rounded-4 overflow-hidden" 
                style={{ cursor: 'pointer' }}
                onClick={() => setServidorParaAreas(s)}
              >
                <div className="card-body d-flex align-items-center p-3">
                  <div className="position-relative">
                    <img 
                      src={s.Foto || `https://ui-avatars.com/api/?name=${s.Nombre}&background=random`} 
                      className="rounded-circle border border-2 shadow-sm" 
                      style={{ width: "52px", height: "52px", objectFit: "cover" }} 
                    />
                    <span className={`position-absolute bottom-0 end-0 p-1 border border-light rounded-circle ${s.Estado === 'Fijo' ? 'bg-success' : 'bg-secondary'}`}></span>
                  </div>
                  
                  <div className="ms-3 flex-grow-1">
                    <h6 className="fw-bold mb-1 text-dark">{s.Nombre}</h6>
                    <span className={`badge rounded-pill ${s.Estado === 'Fijo' ? 'bg-success-subtle text-success' : 'bg-light text-muted'}`} style={{ fontSize: '9px', letterSpacing: '0.5px' }}>
                       {s.Estado === "Fijo" ? "ESTADO: ASIGNADO" : "ESTADO: LIBRE"}
                    </span>
                  </div>

                  {/* BOTÓN CONFIGURAR HORARIOS (Detiene propagación para no abrir el otro modal) */}
                  <button 
                    className="btn btn-dark btn-sm rounded-pill fw-bold px-3 py-2 shadow-sm border-0" 
                    onClick={(e) => {
                        e.stopPropagation(); // IMPORTANTE: evita el click de la carta
                        abrirGestion(s);
                    }}
                  >
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL ORIGINAL: CONFIGURACIÓN DE HORARIOS */}
      {mostrarModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="modal-dialog modal-dialog-centered mx-3">
            <div className="modal-content rounded-5 border-0 shadow-2xl overflow-hidden">
              <div className="bg-dark p-4 text-white border-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                   <img src={servidorSeleccionado?.Foto || `https://ui-avatars.com/api/?name=${servidorSeleccionado?.Nombre}`} className="rounded-circle border border-2 border-primary me-3" style={{width: '45px', height: '45px', objectFit: 'cover'}} />
                   <div>
                     <h6 className="fw-bold mb-0">{servidorSeleccionado?.Nombre}</h6>
                     <small className="opacity-75">Configuración de Horarios</small>
                   </div>
                </div>
                <button className="btn-close btn-close-white shadow-none" onClick={cerrarModal}></button>
              </div>

              <div className="modal-body p-4 pt-4 bg-white">
                <label className="small fw-bold text-uppercase text-primary mb-3 d-block" style={{ fontSize: "11px", letterSpacing: '1px' }}>
                   <i className="bi bi-calendar-check-fill me-2"></i>Asignaciones Mensuales
                </label>
                
                <div className="custom-scroll mb-4" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                  {asignaciones.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-4 opacity-50">
                      <small>No tiene horarios fijos asignados.</small>
                    </div>
                  ) : (
                    asignaciones.map((a) => (
                      <div key={a.id} className="d-flex justify-content-between align-items-center p-3 mb-2 rounded-4 bg-white border border-light shadow-sm border-start border-primary border-4 animate-fade-in">
                        <div>
                          <span className="fw-bold d-block text-dark text-capitalize" style={{ fontSize: "0.85rem" }}>
                            {a.Dia} {a.Fecha ? new Date(a.Fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: "9px" }}>{a.Hora}</span>
                            <span className="text-muted fw-medium" style={{ fontSize: "10px" }}>{a.Aerea?.Nombre}</span>
                          </div>
                        </div>
                        <button className="btn btn-light btn-sm rounded-circle text-danger shadow-sm" onClick={() => eliminarAsignacion(a.id)}>
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-light rounded-5 border border-white">
                  <div className="mb-2 position-relative">
                    <select className="form-select rounded-4 shadow-sm border-0 py-2 ps-4" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                      <option value="">Seleccionar Área...</option>
                      {areasPermitidas.map(a => <option key={a.Id} value={a.Id}>{a.Nombre}</option>)}
                    </select>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <select className="form-select rounded-4 shadow-sm border-0 py-2" value={dia} onChange={(e) => { setDia(e.target.value); setHora(""); }}>
                        <option value="">Día</option>
                        <option value="Domingo">Domingo</option>
                        <option value="Miércoles">Miércoles</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <select className="form-select rounded-4 shadow-sm border-0 py-2" value={hora} onChange={(e) => setHora(e.target.value)} disabled={!dia}>
                        <option value="">Hora</option>
                        {horasOpciones.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <button className="btn btn-primary w-100 rounded-pill mt-4 fw-bold py-3 shadow-lg border-0 transition-all" onClick={guardarNuevaAsignacion} disabled={cargando || !hora || !areaId}>
                    {cargando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-plus-circle-fill me-2"></i>}
                    Asignar Horario
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white text-center border-0 pb-4">
                <button className="btn btn-link btn-sm text-decoration-none text-muted fw-bold" onClick={cerrarModal}>CERRAR PANEL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO MODAL: GESTIÓN DE ÁREAS (La interfaz DatosServidores que hicimos) */}
      {servidorParaAreas && (
        <DatosServidores 
          servidor={servidorParaAreas} 
          onClose={() => {
            setServidorParaAreas(null);
            cargarServidores(); // Refresca por si cambió el estado
          }} 
        />
      )}

      {/* ESTILOS REUTILIZADOS */}
      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #0d6efd; border-radius: 10px; }
        .transition-all { transition: all 0.2s ease-in-out; }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}