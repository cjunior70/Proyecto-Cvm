import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";

export default function Servidores() {
  const [servidores, setServidores] = useState([]);
  const [areasPermitidas, setAreasPermitidas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState("");
  const [areaId, setAreaId] = useState("");
  const [cargando, setCargando] = useState(false);

  // 1. Cargar servidores al inicio
  useEffect(() => {
    cargarServidores();
    
    // Limpieza de URL por si queda basura de tokens/errores
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
      .order("Fecha", { ascending: true }); // <--- Ordena por la fecha real del calendario
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
    
    const { error } = await supabase.rpc("fijar_disponibilidad_completa", {
      p_servidor_id: servidorSeleccionado.Id,
      p_dia_nombre: dia,
      p_hora: hora,
      p_aerea_id: areaId,
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
      // Recargar la lista del modal
      await cargarAsignacionesHorarios(servidorSeleccionado.Id);
      
      // Verificar si ya no quedan registros para volver a "Libre"
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

  // Cambiamos esta constante para que incluya los nuevos horarios del miércoles
  const horasOpciones = dia === "Domingo" 
    ? ["7:00 AM", "9:00 AM y 11:00 AM", "6:00 PM"] 
    : dia === "Miércoles" 
      ? ["6:00 PM", "7:30 PM"]  // <--- Actualizado aquí
      : [];

  return (
    <div className="container py-4 bg-light min-vh-100" style={{ maxWidth: "500px" }}>
      <div className="d-flex align-items-center mb-4 px-2">
        <div className="bg-dark text-white p-2 rounded-3 me-3">
          <i className="bi bi-people-fill fs-4"></i>
        </div>
        <div>
          <h5 className="fw-bold mb-0">Gestión de Servidores</h5>
          <small className="text-muted">Asigna y fija el estado de los servidores activos aquí.</small>
        </div>
      </div>

      {servidores.map((s) => (
        <div key={s.Id} className="card border-0 shadow-sm rounded-4 mb-2 overflow-hidden">
          <div className="card-body d-flex align-items-center justify-content-between p-3">
            <div className="d-flex align-items-center">
              <img 
                src={s.Foto || "https://ui-avatars.com/api/?name=" + s.Nombre} 
                className="rounded-circle border shadow-sm" 
                style={{ width: "48px", height: "48px", objectFit: "cover" }} 
              />
              <div className="ms-3">
                <h6 className="fw-bold mb-0" style={{ fontSize: "0.95rem" }}>{s.Nombre}</h6>
                <span className={`badge rounded-pill ${s.Estado === 'Fijo' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '10px' }}>
                   {s.Estado === "Fijo" ? "ASIGNADO" : "LIBRE"}
                </span>
              </div>
            </div>
            <button className="btn btn-dark btn-sm rounded-pill fw-bold px-3 shadow-sm" onClick={() => abrirGestion(s)}>
              Configurar
            </button>
          </div>
        </div>
      ))}

      {mostrarModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered mx-3">
            <div className="modal-content rounded-5 border-0 shadow-lg overflow-hidden">
              <div className="modal-header border-0 p-4 pb-0">
                <h6 className="modal-title fw-bold fs-5">Configurar Horarios</h6>
                <button className="btn-close" onClick={cerrarModal}></button>
              </div>

              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <img src={servidorSeleccionado?.Foto} className="rounded-circle mb-2 border shadow-sm" style={{width: '60px', height: '60px', objectFit: 'cover'}} />
                  <h5 className="fw-bold mb-0 text-primary">{servidorSeleccionado?.Nombre}</h5>
                </div>

                <label className="small fw-bold text-uppercase text-secondary mb-2 d-block" style={{ fontSize: "11px", letterSpacing: '1px' }}>
                   <i className="bi bi-calendar-check me-1"></i> Lista de Asignaciones (Mensual)
                </label>
                
                {/* CONTENEDOR CON SCROLL PARA EVITAR DUPLICADOS VISUALMENTE MOLESTOS */}
                <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }} className="mb-3">
                  {asignaciones.map((a) => (
                    <div key={a.id} className="d-flex justify-content-between align-items-center p-2 mb-2 rounded-4 bg-white border shadow-sm border-start border-primary border-4">
                      <div className="ms-2">
                        <span className="fw-bold d-block text-dark" style={{ fontSize: "0.85rem" }}>
                          {/* Mostramos la fecha formateada: ej. "Dom, 5 abr" */}
                          {a.Dia} {a.Fecha ? new Date(a.Fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary-subtle text-primary" style={{ fontSize: "9px" }}>{a.Hora}</span>
                          <span className="text-muted" style={{ fontSize: "10px" }}>{a.Aerea?.Nombre}</span>
                        </div>
                      </div>
                      <button className="btn btn-sm text-danger border-0" onClick={() => eliminarAsignacion(a.id)}>
                        <i className="bi bi-x-circle-fill fs-6"></i>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-light rounded-4">
                  <label className="small fw-bold text-uppercase text-secondary mb-2 d-block" style={{ fontSize: "11px" }}>+ Nuevo Horario Fijo</label>
                  
                  <select className="form-select mb-2 rounded-3 shadow-sm border-0" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                    <option value="">Seleccionar Área...</option>
                    {areasPermitidas.map(a => <option key={a.Id} value={a.Id}>{a.Nombre}</option>)}
                  </select>

                  <div className="row g-2">
                    <div className="col-6">
                      <select className="form-select rounded-3 shadow-sm border-0" value={dia} onChange={(e) => { setDia(e.target.value); setHora(""); }}>
                        <option value="">Día</option>
                        <option value="Domingo">Domingo</option>
                        <option value="Miércoles">Miércoles</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <select className="form-select rounded-3 shadow-sm border-0" value={hora} onChange={(e) => setHora(e.target.value)} disabled={!dia}>
                        <option value="">Hora</option>
                        {horasOpciones.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary w-100 rounded-pill mt-3 fw-bold py-2 shadow" 
                    onClick={guardarNuevaAsignacion} 
                    disabled={cargando || !hora || !areaId}
                    style={{ background: 'linear-gradient(45deg, #0d6efd, #00d4ff)', border: 'none' }}
                  >
                    {cargando ? "Guardando..." : "Asignar Horario"}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white text-center border-0 pb-4">
                <button className="btn btn-link btn-sm text-decoration-none text-muted fw-bold" onClick={cerrarModal}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}