import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../../../Supabase/cliente';

const GestionEquipo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { servicio } = location.state || {};

  // --- ESTADOS ---
  const [equipo, setEquipo] = useState([]);
  const [todosLosServidores, setTodosLosServidores] = useState([]);
  const [todasLasAreas, setTodasLasAreas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Modales de Flujo (Agregar / Eliminar)
  const [mostrarModalDecision, setMostrarModalDecision] = useState(false);
  const [mostrarDecisionQuitar, setMostrarDecisionQuitar] = useState(false);
  const [mostrarModalAreas, setMostrarModalAreas] = useState(false);
  const [mostrarModalServidores, setMostrarModalServidores] = useState(false);

  const [modalQuitar, setModalQuitar] = useState({
    abierto: false,
    tipo: null, // 'area' o 'apoyo'
    datos: null
  });

  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [esApoyo, setEsApoyo] = useState(false);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (!servicio) navigate("/Homeadmin");
    else cargarDatosIniciales();
  }, [servicio]);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    await Promise.all([cargarEquipo(), cargarCatalogoServidores()]);
    setCargando(false);
  };

  const cargarEquipo = async () => {
    const { data, error } = await supabase.rpc("obtener_equipo_serviciosos", {
      p_servicio_id: servicio.Id,
    });
    if (!error) setEquipo(data || []);
  };

  const cargarCatalogoServidores = async () => {
    // Consulta mejorada: Trae servidores y sus áreas vinculadas
    const { data, error } = await supabase
      .from("Servidores")
      .select(`
        *,
        Servidor_Area (
          IdAerea
        )
      `)
      .order("Nombre");

    if (!error) setTodosLosServidores(data || []);
  };

  // --- LÓGICA DE AGREGAR / ASIGNAR ---
  const abrirSeleccionArea = async (tipo) => {
    setEsApoyo(tipo === 'apoyo');
    setMostrarModalDecision(false);
    
    if (tipo === 'nueva') {
      const { data } = await supabase.from("Aerea").select("*");
      const actuales = equipo.map(p => p.area_id);
      setTodasLasAreas(data.filter(a => !actuales.includes(a.Id)));
    }
    setMostrarModalAreas(true);
  };

  const manejarClickArea = (item) => {
    if (esApoyo) {
      setPuestoSeleccionado(item);
      setMostrarModalAreas(false);
      setMostrarModalServidores(true);
    } else {
      inyectarNuevaArea(item.Id);
    }
  };

  const inyectarNuevaArea = async (areaId) => {
    setMostrarModalAreas(false);
    const { error } = await supabase.from("ServicioArea").insert([{ IdServicio: servicio.Id, IdArea: areaId }]);
    if (error) Swal.fire('Error', 'No se pudo crear el área', 'error');
    await cargarEquipo();
  };

  const ejecutarAsignacion = async (servidor) => {
    setMostrarModalServidores(false);
    setCargando(true);
    try {
      if (esApoyo) {
        await supabase.from("Cronograma").update({ "IdServidorExtra": servidor.Id }).eq("Id", puestoSeleccionado.cronograma_id);
      } else {
        // Buscamos relación Servidor_Area
        let { data: rel } = await supabase.from("Servidor_Area").select("Id").eq("IdServidor", servidor.Id).eq("IdAerea", puestoSeleccionado.area_id).maybeSingle();
        let idVinculo = rel?.Id;

        if (!idVinculo) {
          const { data: n } = await supabase.from("Servidor_Area").insert([{ IdServidor: servidor.Id, IdAerea: puestoSeleccionado.area_id }]).select().single();
          idVinculo = n.Id;
        }

        if (puestoSeleccionado.cronograma_id) {
          await supabase.from("Cronograma").update({ "IdServidorAerea": idVinculo }).eq("Id", puestoSeleccionado.cronograma_id);
        } else {
          await supabase.from("Cronograma").insert([{ "IdServicio": servicio.Id, "IdServidorAerea": idVinculo }]);
        }
      }
      await cargarEquipo();
      Swal.fire('Éxito', 'Asignación completada.', 'success');
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  // --- LÓGICA DE ELIMINACIÓN ---
  const ejecutarOperacionBorrado = async () => {
    const { tipo, datos } = modalQuitar;
    setModalQuitar({ abierto: false, tipo: null, datos: null });
    setCargando(true);

    try {
      if (tipo === 'area') {
        await supabase.from("ServicioArea").delete().eq("Id", datos.servicio_area_id);
      } else if (tipo === 'apoyo') {
        // Dejar servidor libre
        await supabase.from("Cronograma").update({ "IdServidorExtra": null }).eq("Id", datos.cronograma_id);
      }
      await cargarEquipo();
      Swal.fire('Completado', 'Se ha actualizado la base de datos.', 'success');
    } catch (e) { Swal.fire('Error', 'No se pudo procesar.', 'error'); }
    setCargando(false);
  };

  return (
    <div className="min-vh-100 bg-light pb-5 position-relative">
      
      {/* HEADER */}
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
            <div key={`${puesto.servicio_area_id}-${puesto.cronograma_id || 'v'}`} className="col-12 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body d-flex align-items-center p-3 text-dark">
                  <div className="position-relative">
                    <img src={puesto.servidor_foto || `https://ui-avatars.com/api/?name=${puesto.area_nombre}`} className="rounded-circle border border-2 shadow-sm" width="55" height="55" />
                    {puesto.extra_nombre && <div className="position-absolute bottom-0 end-0 bg-info rounded-circle border border-white d-flex align-items-center justify-content-center shadow-sm" style={{width: '20px', height: '20px', fontSize: '10px', color: 'white'}}><i className="bi bi-people-fill"></i></div>}
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <small className="text-primary fw-bold text-uppercase" style={{fontSize: '10px'}}>{puesto.area_nombre}</small>
                    <h6 className="mb-0 fw-bold">{puesto.servidor_nombre || "Vacante"}</h6>
                    {puesto.extra_nombre && <small className="text-muted d-block">Apoyo: {puesto.extra_nombre}</small>}
                  </div>
                  <button className="btn btn-light border rounded-pill px-3 btn-sm fw-bold shadow-sm" onClick={() => { setEsApoyo(false); setPuestoSeleccionado(puesto); setMostrarModalServidores(true); }}>
                    Asignar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTONES FLOTANTES */}
      <div className="position-fixed bottom-0 end-0 p-4 mb-5 d-flex flex-column gap-3" style={{ zIndex: 1050 }}>
        <button className="btn btn-primary rounded-circle shadow-lg" style={{ width: "55px", height: "55px" }} onClick={() => setMostrarModalDecision(true)}>
          <i className="bi bi-plus-lg fs-4"></i>
        </button>
        <button className="btn btn-danger rounded-circle shadow-lg" style={{ width: "55px", height: "55px" }} onClick={() => setMostrarDecisionQuitar(true)}>
          <i className="bi bi-trash fs-4"></i>
        </button>
      </div>

      {/* MODAL DECISIÓN AGREGAR */}
      {mostrarModalDecision && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "350px" }}>
            <div className="modal-content rounded-5 border-0 p-4 text-dark shadow-lg">
              <h6 className="fw-bold mb-4 text-center">¿Qué deseas agregar?</h6>
              <button className="btn btn-outline-primary w-100 rounded-4 p-3 mb-2 d-flex align-items-center justify-content-between" onClick={() => abrirSeleccionArea('nueva')}>
                <span className="fw-bold">Nueva Área</span>
                <i className="bi bi-layers-plus"></i>
              </button>
              <button className="btn btn-outline-info w-100 rounded-4 p-3 mb-3 d-flex align-items-center justify-content-between" onClick={() => abrirSeleccionArea('apoyo')}>
                <span className="fw-bold">Persona de Apoyo</span>
                <i className="bi bi-person-plus"></i>
              </button>
              <button className="btn btn-sm text-muted w-100" onClick={() => setMostrarModalDecision(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DECISIÓN ELIMINAR */}
      {mostrarDecisionQuitar && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "350px" }}>
            <div className="modal-content rounded-5 border-0 p-4 text-dark shadow-lg">
              <h6 className="fw-bold mb-4 text-center">¿Qué deseas eliminar?</h6>
              <button className="btn btn-outline-danger w-100 rounded-4 p-3 mb-2 d-flex align-items-center justify-content-between" onClick={() => { setModalQuitar({ abierto: true, tipo: 'area', datos: null }); setMostrarDecisionQuitar(false); }}>
                <span className="fw-bold">Eliminar un Área</span>
                <i className="bi bi-trash3"></i>
              </button>
              <button className="btn btn-outline-warning w-100 rounded-4 p-3 mb-3 d-flex align-items-center justify-content-between" onClick={() => { setModalQuitar({ abierto: true, tipo: 'apoyo', datos: null }); setMostrarDecisionQuitar(false); }}>
                <span className="fw-bold">Quitar un Apoyo</span>
                <i className="bi bi-person-dash"></i>
              </button>
              <button className="btn btn-sm text-muted w-100" onClick={() => setMostrarDecisionQuitar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SERVIDORES (CON FILTRO DE ÁREA INTELIGENTE) */}
      {mostrarModalServidores && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.8)", zIndex: 1080 }}>
          <div className="modal-dialog modal-dialog-centered text-dark">
            <div className="modal-content rounded-5 border-0 overflow-hidden">
              <div className="bg-dark p-4 text-white d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-0">{esApoyo ? "BUSCAR APOYO" : "ASIGNAR TITULAR"}</h5>
                  <small className="text-primary fw-bold text-uppercase">{puestoSeleccionado?.area_nombre}</small>
                </div>
                <button className="btn-close btn-close-white" onClick={() => setMostrarModalServidores(false)}></button>
              </div>
              <div className="modal-body p-4">
                <input type="text" className="form-control rounded-pill mb-3 bg-light border-0" placeholder="Buscar por nombre..." onChange={(e) => setFiltroNombre(e.target.value)} />
                <div className="list-group overflow-auto" style={{ maxHeight: "350px" }}>
                  {todosLosServidores
                    .filter(s => {
                      const matchName = s.Nombre.toLowerCase().includes(filtroNombre.toLowerCase());
                      if (esApoyo) return matchName;
                      const hasArea = s.Servidor_Area?.some(rel => rel.IdAerea === puestoSeleccionado?.area_id);
                      return matchName && hasArea;
                    })
                    .map(s => (
                      <button key={s.Id} className="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 rounded-4 bg-light p-3" onClick={() => ejecutarAsignacion(s)}>
                        <img src={s.Foto || `https://ui-avatars.com/api/?name=${s.Nombre}`} className="rounded-circle me-3" width="45" height="45" />
                        <div className="text-start">
                          <h6 className="mb-0 fw-bold text-dark">{s.Nombre}</h6>
                          <small className="text-muted">{s.Rol || 'Servidor'}</small>
                        </div>
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTADO PARA QUITAR */}
      {modalQuitar.abierto && !modalQuitar.datos && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.8)", zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "380px" }}>
            <div className="modal-content rounded-5 border-0 text-dark overflow-hidden">
              <div className={`p-4 text-white ${modalQuitar.tipo === 'area' ? 'bg-danger' : 'bg-warning'}`}>
                <h6 className="fw-bold mb-0">Selecciona para {modalQuitar.tipo === 'area' ? 'Eliminar' : 'Liberar'}</h6>
              </div>
              <div className="modal-body bg-light p-2 overflow-auto" style={{ maxHeight: "400px" }}>
                {equipo.filter(p => modalQuitar.tipo === 'area' || (modalQuitar.tipo === 'apoyo' && p.extra_nombre)).map((p) => (
                  <div key={p.servicio_area_id} className="p-3 mb-2 bg-white rounded-3 d-flex justify-content-between align-items-center m-2 shadow-sm" onClick={() => setModalQuitar({ ...modalQuitar, datos: p })} style={{ cursor: "pointer" }}>
                    <div>
                      <span className="fw-bold d-block small">{p.area_nombre}</span>
                      <small className="text-muted">{modalQuitar.tipo === 'area' ? (p.servidor_nombre || "Vacante") : `Apoyo: ${p.extra_nombre}`}</small>
                    </div>
                    <i className="bi bi-chevron-right"></i>
                  </div>
                ))}
              </div>
              <button className="btn btn-link text-muted w-100 p-3" onClick={() => setModalQuitar({abierto: false, tipo: null, datos: null})}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {modalQuitar.abierto && modalQuitar.datos && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.6)", zIndex: 1090 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "350px" }}>
            <div className="modal-content rounded-5 border-0 p-4 text-dark shadow-lg text-center">
              <h6 className="fw-bold">¿Confirmar acción?</h6>
              <p className="small text-muted">{modalQuitar.tipo === 'area' ? `Eliminarás el área ${modalQuitar.datos.area_nombre}` : `Quitarás a ${modalQuitar.datos.extra_nombre} y quedará libre.`}</p>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-light flex-grow-1 rounded-pill" onClick={() => setModalQuitar({ ...modalQuitar, datos: null })}>Atrás</button>
                <button className={`btn flex-grow-1 rounded-pill text-white ${modalQuitar.tipo === 'area' ? 'btn-danger' : 'btn-warning'}`} onClick={ejecutarOperacionBorrado}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÁREAS (AGREGAR) */}
      {mostrarModalAreas && (
        <div className="modal fade show d-block p-3" style={{ background: "rgba(0,0,0,0.8)", zIndex: 1065 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "380px" }}>
            <div className="modal-content rounded-5 border-0 text-dark overflow-hidden">
              <div className="p-4 bg-primary text-white">
                <h6 className="fw-bold mb-0">Selecciona el Área</h6>
              </div>
              <div className="modal-body bg-light p-2 overflow-auto" style={{ maxHeight: "400px" }}>
                {(esApoyo ? equipo : todasLasAreas).map((item) => (
                  <div key={esApoyo ? item.servicio_area_id : item.Id} className="p-3 mb-2 bg-white rounded-3 d-flex justify-content-between m-2 shadow-sm" onClick={() => manejarClickArea(item)} style={{ cursor: "pointer" }}>
                    <span className="fw-bold small">{esApoyo ? item.area_nombre : item.Nombre}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-link text-muted w-100 p-3" onClick={() => setMostrarModalAreas(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }`}</style>
    </div>
  );
};

export default GestionEquipo;