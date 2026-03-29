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

  useEffect(() => {
    cargarServidores();
  }, []);

  const cargarServidores = async () => {
    const { data } = await supabase.from("Servidores").select("*").order("Nombre");
    setServidores(data || []);
  };

  const cargarAreasPermitidas = async (idServidor) => {
    const { data, error } = await supabase
      .from("Servidor_Area")
      .select(`
        IdAerea,
        Aerea ( Id, Nombre )
      `)
      .eq("IdServidor", idServidor);
    
    if (error) return console.error(error);
    setAreasPermitidas(data.map(item => item.Aerea) || []);
  };

  const cargarAsignacionesHorarios = async (idServidor) => {
    const { data } = await supabase
      .from("Disponbilidad")
      .select(`id, Dia, Hora, Aerea ( Id, Nombre )`)
      .eq("IdServidor", idServidor);
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
    }
    setCargando(false);
  };

  const eliminarAsignacion = async (idReg) => {
    if (!window.confirm("¿Eliminar este horario fijo?")) return;
    setCargando(true);
    const { error } = await supabase.from("Disponbilidad").delete().eq("id", idReg);
    if (!error) {
      await cargarAsignacionesHorarios(servidorSeleccionado.Id);
      const { data } = await supabase.from("Disponbilidad").select("id").eq("IdServidor", servidorSeleccionado.Id);
      if (!data || data.length === 0) {
        await supabase.from("Servidores").update({ Estado: "Libre" }).eq("Id", servidorSeleccionado.Id);
        await cargarServidores();
      }
    }
    setCargando(false);
  };

  // 🔥 ACTUALIZACIÓN CLAVE: Agregamos la jornada fusionada
  const horasOpciones = dia === "Domingo" 
    ? ["7:00 AM", "9:00 AM y 11:00 AM", "6:00 PM"] 
    : dia === "Miércoles" ? ["7:00 PM"] : [];

  return (
    <div className="container py-4 bg-light min-vh-100" style={{ maxWidth: "500px" }}>
      <div className="d-flex align-items-center mb-4 px-2">
        <div className="bg-dark text-white p-2 rounded-3 me-3">
          <i className="bi bi-people-fill fs-4"></i>
        </div>
        <h5 className="fw-bold mb-0">Gestión de Servidores</h5>
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

      {/* MODAL (BOOTSTRAP) */}
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
                   <i className="bi bi-clock-history me-1"></i> Horarios Fijos Actuales
                </label>
                
                {asignaciones.length > 0 ? (
                  asignaciones.map((a) => (
                    <div key={a.id} className="d-flex justify-content-between align-items-center p-3 mb-2 rounded-4 bg-white border shadow-sm">
                      <div>
                        <span className="fw-bold d-block text-dark" style={{ fontSize: "0.85rem" }}>{a.Dia} • {a.Hora}</span>
                        <span className="badge bg-primary-subtle text-primary" style={{ fontSize: "10px" }}>{a.Aerea?.Nombre}</span>
                      </div>
                      <button className="btn btn-sm btn-outline-danger border-0 rounded-circle" onClick={() => eliminarAsignacion(a.id)}>
                         <i className="bi bi-trash3-fill"></i>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 border rounded-4 border-dashed mb-3">
                    <p className="text-muted small mb-0">No tiene asignaciones fijas.</p>
                  </div>
                )}

                <div className="p-3 bg-light rounded-4 mt-4">
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
                <button className="btn btn-link btn-sm text-decoration-none text-muted fw-bold" onClick={cerrarModal}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}