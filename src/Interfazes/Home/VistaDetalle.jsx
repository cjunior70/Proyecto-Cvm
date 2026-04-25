import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

const VistaDetalleCronograma = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { servicio } = location.state || {};

  const [equipo, setEquipo] = useState([]);
  const [todosLosServidores, setTodosLosServidores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [todasLasAreas, setTodasLasAreas] = useState([]);
  const [mostrarModalAreas, setMostrarModalAreas] = useState(false);
  const [mostrarModalQuitar, setMostrarModalQuitar] = useState(false);

  // --- CONTROL DE CARGA CON SWEETALERT2 ---
  useEffect(() => {
    if (cargando) {
      Swal.fire({
        title: 'Cargando...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
    } else {
      Swal.close();
    }
  }, [cargando]);

  useEffect(() => {
    if (!servicio) navigate("/Homeadmin");
    else cargarEquipo();
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
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  // --- ABRIR MODAL ÁREAS (CON FILTRO PARA NO DUPLICAR) ---
  const abrirModalNuevaArea = async () => {
    setMostrarModalAreas(true);
    try {
      const { data } = await supabase.from("Aerea").select("*");
      
      // Obtenemos los IDs de las áreas que ya están en el equipo
      const areasActualesIds = equipo.map(p => p.area_id);
      
      // FILTRO: Solo mostramos las que NO están en el equipo
      const areasDisponibles = data.filter(a => !areasActualesIds.includes(a.Id));
      
      setTodasLasAreas(areasDisponibles || []);
    } catch (error) { console.error(error); }
  };

  const inyectarAreaServicio = async (areaId) => {
    setCargando(true);
    try {
      await supabase.from("ServicioArea").insert([{ IdServicio: servicio.Id, IdArea: areaId }]);
      setMostrarModalAreas(false);
      await cargarEquipo();
    } catch (err) { 
      setCargando(false);
      Swal.fire('Error', 'No se pudo agregar', 'error'); 
    }
  };

  // --- ASIGNAR O CAMBIAR SERVIDOR ---
  const abrirModalServidores = async (puesto) => {
    setPuestoSeleccionado(puesto);
    setMostrarModal(true);
    try {
      const { data } = await supabase.from("Servidores").select(`Id, Nombre, Foto, Rol, Servidor_Area ( Id, IdAerea )`).order("Nombre", { ascending: true });
      setTodosLosServidores(data || []);
    } catch (error) { console.error(error); }
  };

  const ejecutarAsignacion = async (servidor) => {
    setCargando(true);
    try {
      const idArea = puestoSeleccionado.area_id;
      
      // Buscamos o creamos Servidor_Area
      let { data: rel } = await supabase.from("Servidor_Area").select("Id").eq("IdServidor", servidor.Id).eq("IdAerea", idArea).maybeSingle();
      let idVinculo = rel?.Id;

      if (!idVinculo) {
        const { data: nuevaRel } = await supabase.from("Servidor_Area").insert([{ IdServidor: servidor.Id, IdAerea: idArea }]).select().single();
        idVinculo = nuevaRel.Id;
      }

      // Si ya hay un cronograma_id, actualizamos. Si no, insertamos.
      if (puestoSeleccionado.esta_asignado && puestoSeleccionado.cronograma_id) {
        await supabase.from("Cronograma").update({ "IdServidorAerea": idVinculo }).eq("Id", puestoSeleccionado.cronograma_id);
      } else {
        await supabase.from("Cronograma").insert([{ "IdServicio": servicio.Id, "IdServidorAerea": idVinculo }]);
      }

      setMostrarModal(false);
      await cargarEquipo();
    } catch (error) { 
      setCargando(false);
      Swal.fire('Error', 'Fallo la asignación', 'error'); 
    }
  };

  const ejecutarEliminacionArea = async (puesto) => {
    setCargando(true);
    try {
      await supabase.from("ServicioArea").delete().eq("Id", puesto.servicio_area_id);
      await cargarEquipo();
      setMostrarModalQuitar(false);
    } catch (error) { setCargando(false); }
  };

  return (
    <div className="min-vh-100 bg-light pb-5 position-relative">
      
      {/* HEADER DARK */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-outline-light rounded-circle border-0" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <span className="fw-bold text-uppercase small">Gestión de Equipo</span>
        </div>
        <h2 className="fw-bold mb-0">{servicio?.Tipo}</h2>
        <small className="opacity-75">{servicio?.Fecha} • {servicio?.Jornada}</small>
      </div>

      {/* LISTA EQUIPO */}
      <div className="container" style={{ marginTop: '-25px' }}>
        <div className="row g-3">
          {equipo.map((puesto) => (
            <div key={puesto.servicio_area_id} className="col-12 col-md-6">
              <div className={`card border-0 shadow-sm rounded-4 overflow-hidden ${!puesto.esta_asignado ? 'border-start border-warning border-4' : ''}`}>
                <div className="card-body d-flex align-items-center p-3">
                  <img src={puesto.servidor_foto || `https://ui-avatars.com/api/?name=${puesto.area_nombre}`} className="rounded-circle border border-2 shadow-sm" width="55" height="55" />
                  <div className="flex-grow-1 ms-3">
                    <small className="text-primary fw-bold d-block text-uppercase" style={{fontSize: '10px'}}>{puesto.area_nombre}</small>
                    <h6 className="mb-0 fw-bold">{puesto.esta_asignado ? puesto.servidor_nombre : "Puesto Vacante"}</h6>
                  </div>
                  <button className="btn btn-light border rounded-pill px-3 btn-sm fw-bold shadow-sm" onClick={() => abrirModalServidores(puesto)}>
                    {puesto.esta_asignado ? "Cambiar" : "Asignar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTONES FLOTANTES (TAL CUAL LOS PEDISTE) */}
      <div className="position-fixed bottom-0 end-0 p-4 mb-5 d-flex flex-column gap-3" style={{ zIndex: 1050 }}>
        <button className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }} onClick={abrirModalNuevaArea}>
          <i>➕</i>
        </button>
        <button className="btn btn-danger rounded-circle shadow-lg d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }} onClick={() => setMostrarModalQuitar(true)}>
          <i>➖</i>
        </button>
      </div>

      {/* MODAL ÁREAS / QUITAR */}
      {(mostrarModalAreas || mostrarModalQuitar) && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "380px" }}>
            <div className="modal-content rounded-5 border-0 shadow-lg">
              <div className="p-4 border-bottom d-flex justify-content-between align-items-center text-dark">
                <h6 className="fw-bold mb-0">{mostrarModalQuitar ? "Eliminar Puesto" : "Agregar Puesto"}</h6>
                <button className="btn-close" onClick={() => { setMostrarModalAreas(false); setMostrarModalQuitar(false); }}></button>
              </div>
              <div className="modal-body p-2 text-dark">
                <div className="overflow-auto" style={{ maxHeight: "300px" }}>
                  {mostrarModalQuitar ? equipo.map((p) => (
                    <div key={p.servicio_area_id} className="p-3 mb-1 bg-light rounded-3 d-flex justify-content-between align-items-center" onClick={() => ejecutarEliminacionArea(p)} style={{ cursor: "pointer" }}>
                      <span className="fw-bold small">{p.area_nombre}</span>
                      <small className="text-danger">Quitar ➖</small>
                    </div>
                  )) : (
                    todasLasAreas.length > 0 ? todasLasAreas.map((a) => (
                      <div key={a.Id} className="p-3 mb-1 bg-light rounded-3 d-flex justify-content-between align-items-center" onClick={() => inyectarAreaServicio(a.Id)} style={{ cursor: "pointer" }}>
                        <span className="fw-bold small">{a.Nombre}</span>
                        <small className="text-primary">Añadir ➕</small>
                      </div>
                    )) : <p className="text-center p-3 small text-muted">No hay más áreas para agregar.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR SERVIDOR */}
      {mostrarModal && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered text-dark">
            <div className="modal-content rounded-5 border-0 overflow-hidden">
              <div className="bg-dark p-4 text-white d-flex justify-content-between">
                <div>
                  <h5 className="fw-bold mb-0">ASIGNAR</h5>
                  <small className="text-primary fw-bold text-uppercase">{puestoSeleccionado?.area_nombre}</small>
                </div>
                <button className="btn-close btn-close-white" onClick={() => setMostrarModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <input type="text" className="form-control rounded-pill mb-3 bg-light border-0" placeholder="Buscar servidor..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
                <div className="list-group overflow-auto" style={{ maxHeight: "350px" }}>
                  {todosLosServidores.filter(s => s.Nombre.toLowerCase().includes(filtroNombre.toLowerCase())).map(s => (
                    <button key={s.Id} className="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 rounded-4 bg-light p-3" onClick={() => ejecutarAsignacion(s)}>
                      <img src={s.Foto || `https://ui-avatars.com/api/?name=${s.Nombre}`} className="rounded-circle me-3" width="45" height="45" />
                      <div className="text-start">
                        <h6 className="mb-0 fw-bold">{s.Nombre}</h6>
                        <small className="text-muted">{s.Rol}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
      `}</style>
    </div>
  );
};

export default VistaDetalleCronograma;