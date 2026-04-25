import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import ModalGenerarDeLosServicios from "../Componentes/ModalGenerarDeLosServicios.jsx";
import Swal from "sweetalert2";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [aereasGenerales, setAereasGenerales] = useState([]);

  // ───── ESTADOS MODALES ─────
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  // ───── ESTADOS FORMULARIO CREAR ─────
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("");
  const [hora, setHora] = useState("7");
  const [minutos, setMinutos] = useState("00");
  const [periodo, setPeriodo] = useState("pm");
  const [comentario, setComentario] = useState("");
  const [aereasSeleccionadas, setAereasSeleccionadas] = useState([]);

  // ───── ESTADOS DETALLE ─────
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [areasDelServicio, setAreasDelServicio] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(false);

  // ─────────────────────────────
  // CARGA DE DATOS
  // ─────────────────────────────
  const cargarServicios = async () => {
    const hoy = new Date();
    const diaDelMes = hoy.getDate();
    
    // 1. Definir el rango base (Desde el día 1 del mes actual)
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    let fechaFinBusqueda;

    // 2. Lógica condicional: Si es 28 o más, extendemos el rango hasta el fin del PRÓXIMO mes
    if (diaDelMes >= 22) {
      // Fin del próximo mes
      fechaFinBusqueda = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0);
    } else {
      // Fin del mes actual
      fechaFinBusqueda = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }

    // 3. Consultar a Supabase con el rango dinámico
    const { data: dataServicios } = await supabase
      .from("Servicio")
      .select("*")
      .gte("Fecha", inicioMesActual.toISOString().split('T')[0])
      .lte("Fecha", fechaFinBusqueda.toISOString().split('T')[0])
      .order("Fecha", { ascending: true });

    const { data: areas } = await supabase.from("Aerea").select("*").order("Nombre");
    
    setAereasGenerales(areas || []);
    setServicios(dataServicios || []);
  };

  useEffect(() => { cargarServicios(); }, []);

  // ─────────────────────────────
  // ACCIÓN: GENERAR MES (Lógica JS)
  // ─────────────────────────────
  const manejarGeneracion = async () => {
    // Cerramos el modal de confirmación primero
    setMostrarModal(false);

    Swal.fire({
      title: 'Generando Mes...',
      text: 'Estamos procesando el cronograma completo.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      // Llamamos a tu archivo generadorServicios.js
      const { data, error } = await supabase.rpc('generar_servicios_proximo_mes');
      
      if (data && Array.isArray(data)) {
        for (const s of data) {
          // Ejecutamos el match automático para cada ID
          await supabase.rpc('generar_match_automatico', { p_servicio_id: s.Id });
        }
      }

      // IMPORTANTE: Refrescar la interfaz
      await cargarServicios();

      Swal.fire({
        icon: 'success',
        title: '¡Mes Generado!',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo completar la generación.', 'error');
    }
  };

  // ─────────────────────────────
  // ACCIÓN: CREAR SERVICIO MANUAL
  // ─────────────────────────────
  const crearServicio = async (e) => {
    e.preventDefault();
    
    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const jornada = `${hora}:${minutos} ${periodo}`;
    
    try {
      const { data: nuevo, error } = await supabase
        .from("Servicio")
        .insert({ 
          Fecha: fecha, 
          Jornada: jornada, 
          Tipo: tipo, 
          Estado: "Pendiente", 
          Comentario: comentario 
        })
        .select().single();

      if (error) throw error;

      if (nuevo && aereasSeleccionadas.length > 0) {
        const rel = aereasSeleccionadas.map(id => ({ IdServicio: nuevo.Id, IdArea: id }));
        await supabase.from("ServicioArea").insert(rel);
      }

      // Cerramos modal y limpiamos campos
      setMostrarModalCrear(false);
      setFecha(""); setTipo(""); setComentario(""); setAereasSeleccionadas([]);
      
      // Refrescamos la lista
      await cargarServicios();

      Swal.fire({
        icon: 'success',
        title: 'Servicio Creado',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (err) {
      Swal.fire('Error', 'Hubo un fallo al guardar.', 'error');
    }
  };

  // ─────────────────────────────
  // DETALLE
  // ─────────────────────────────
  const abrirDetalleServicio = async (servicio) => {
    setServicioSeleccionado(servicio);
    setMostrarModalInfo(true);
    setCargandoAreas(true);
    setAreasDelServicio([]);

    const { data, error } = await supabase
      .from("ServicioArea")
      .select(`IdArea, Aerea ( Nombre )`)
      .eq("IdServicio", servicio.Id);

    if (!error && data) {
      setAreasDelServicio(data.map(item => item.Aerea.Nombre));
    }
    setCargandoAreas(false);
  };
return (
  <section className="container py-4">
    {/* CABECERA Y ACCIONES */}
    <div className="text-center mb-4">
      <h4 className="fw-bold text-uppercase" style={{ letterSpacing: '2px' }}>📅 Gestión de Servicios</h4>
      <div className="alert alert-light border-0 shadow-sm py-2 mt-3" style={{ borderRadius: '10px' }}>
        <small className="text-secondary">
          <i className="bi bi-info-circle-fill me-2 text-primary"></i>
          Desde aquí puedes <strong>crear y organizar</strong> los servicios del mes.
        </small>
      </div>
      <div className="d-flex justify-content-center gap-3 mt-3">
        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => setMostrarModal(true)}>⚙ Generar</button>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setMostrarModalCrear(true)}>➕ Nuevo</button>
      </div>
    </div>

    {/* LISTADO DE TARJETAS */}
    <div className="row g-3">
      {servicios.map((s) => (
        <div key={s.Id} className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm hover-card h-100" onClick={() => abrirDetalleServicio(s)} style={{ cursor: "pointer", borderRadius: '15px' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0">{s.Tipo}</h6>
                <span className={`badge rounded-pill ${s.Estado === "Completado" ? "bg-success" : "bg-warning text-dark"}`}>{s.Estado}</span>
              </div>
              <div className="small text-muted">
                <div><i className="bi bi-calendar3 me-2"></i>{s.Fecha}</div>
                <div><i className="bi bi-clock me-2"></i>{s.Jornada}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* MODAL DETALLE (Simplificado) */}
    {mostrarModalInfo && servicioSeleccionado && (
      <div className="modal fade show d-block shadow-blur">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow-lg">
            <div className="modal-header border-0">
              <h5 className="fw-bold m-0">{servicioSeleccionado.Tipo}</h5>
              <button className="btn-close" onClick={() => setMostrarModalInfo(false)}></button>
            </div>
            <div className="modal-body pt-0">
              <div className="mb-3 p-3 bg-light rounded-3">
                <div className="small text-muted text-uppercase fw-bold mb-2">Información</div>
                <div><strong>Fecha:</strong> {servicioSeleccionado.Fecha}</div>
                <div><strong>Jornada:</strong> {servicioSeleccionado.Jornada}</div>
                <div className="mt-2 text-secondary fst-italic small">"{servicioSeleccionado.Comentario || "Sin comentarios"}"</div>
              </div>
              <div className="fw-bold mb-2 small">Áreas Asignadas:</div>
              <div className="d-flex flex-wrap gap-2">
                {cargandoAreas ? <div className="spinner-border spinner-border-sm text-primary"></div> : 
                  areasDelServicio.length > 0 ? areasDelServicio.map((area, idx) => (
                    <span key={idx} className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">{area}</span>
                  )) : <span className="text-muted small">No hay áreas.</span>}
              </div>
            </div>
            <div className="modal-footer border-0">
              <button className="btn btn-light rounded-pill w-100" onClick={() => setMostrarModalInfo(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* MODAL CREAR (Optimizado) */}
    {mostrarModalCrear && (
      <div className="modal fade show d-block dark-blur" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable modal-margin-fix"> 
          <div className="modal-content border-0 shadow-lg dark-modal-box">
            <form onSubmit={crearServicio} className="d-flex flex-column h-100">
              <div className="modal-header border-0 p-3">
                <div>
                  <h6 className="fw-bold m-0">Configurar Servicio</h6>
                  <small className="text-secondary opacity-75" style={{fontSize: '0.65rem'}}>Completa los campos y selecciona áreas</small>
                </div>
                <button className="btn-close btn-close-white shadow-none" type="button" onClick={() => setMostrarModalCrear(false)} />
              </div>

              <div className="modal-body p-3 custom-scroll">
                <div className="row g-3">
                  {/* FORMULARIO */}
                  <div className="col-12 col-md-5">
                    <div className="p-3 rounded-4 dark-section">
                      <label className="small text-secondary mb-1">Fecha y Nombre</label>
                      <input type="date" className="form-control dark-input-sm mb-2" value={fecha} onChange={e => setFecha(e.target.value)} required />
                      <input className="form-control dark-input-sm mb-3" placeholder="Tipo" value={tipo} onChange={e => setTipo(e.target.value)} required />
                      
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="small text-secondary mb-1">Hora</label>
                          <input type="number" className="form-control dark-input-sm" placeholder="00" value={hora} onChange={e => setHora(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="small text-secondary mb-1">Periodo</label>
                          <select className="form-select dark-input-sm" value={periodo} onChange={e => setPeriodo(e.target.value)}>
                            <option value="am">am</option><option value="pm">pm</option>
                          </select>
                        </div>
                      </div>

                      <label className="small text-secondary mb-1">Notas</label>
                      <textarea className="form-control dark-input-sm no-resize" rows="3" placeholder="Escribe..." value={comentario} onChange={e => setComentario(e.target.value)} />
                    </div>
                  </div>

                  {/* SELECCIÓN DE ÁREAS */}
                  <div className="col-12 col-md-7">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="small fw-bold">Puestos</span>
                        <button type="button" className="btn btn-sm btn-link p-0 text-decoration-none small text-info" onClick={() => aereasSeleccionadas.length === aereasGenerales.length ? setAereasSeleccionadas([]) : setAereasSeleccionadas(aereasGenerales.map(a => a.Id))}>
                          {aereasSeleccionadas.length === aereasGenerales.length ? "(Limpiar)" : "(Todos)"}
                        </button>
                      </div>
                      <span className="badge rounded-pill bg-primary" style={{fontSize: '0.6rem'}}>{aereasSeleccionadas.length}</span>
                    </div>
                    
                    <div className="row g-2 overflow-auto custom-scroll" style={{ maxHeight: '300px' }}>
                      {aereasGenerales.map(a => {
                        const sel = aereasSeleccionadas.includes(a.Id);
                        return (
                          <div key={a.Id} className="col-4">
                            <div onClick={() => sel ? setAereasSeleccionadas(aereasSeleccionadas.filter(id => id !== a.Id)) : setAereasSeleccionadas([...aereasSeleccionadas, a.Id])}
                                 className={`p-2 text-center rounded-3 border area-chip ${sel ? "active" : "inactive"}`}>
                              {a.Nombre}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 p-3 bg-dark">
                <div className="d-flex w-100 gap-2">
                  <button type="button" className="btn btn-link text-secondary text-decoration-none flex-grow-1" onClick={() => setMostrarModalCrear(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-pill flex-grow-1 fw-bold">GUARDAR</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    <ModalGenerarDeLosServicios visible={mostrarModal} onClose={() => setMostrarModal(false)} onConfirm={manejarGeneracion} />

    <style>{`
      .shadow-blur { background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }
      .dark-blur { background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); }
      .dark-modal-box { border-radius: 25px; background: #121212; border: 1px solid rgba(255,255,255,0.1); color: #fff; height: 70vh; }
      .dark-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
      .dark-input-sm { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-size: 0.85rem !important; }
      .no-resize { resize: none; }
      .area-chip { cursor: pointer; fontSize: 0.65rem; min-height: 45px; display: flex; align-items: center; justify-content: center; line-height: 1.1; transition: 0.3s; }
      .area-chip.active { background: #0d6efd; border-color: #0d6efd; color: white; box-shadow: 0 4px 10px rgba(13,110,253,0.3); }
      .area-chip.inactive { background: rgba(255,255,255,0.05); color: #6c757d; border-color: rgba(255,255,255,0.1); }
      .hover-card:hover { transform: translateY(-5px); transition: 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
      .custom-scroll::-webkit-scrollbar { width: 4px; }
      .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      @media (max-width: 768px) { .modal-margin-fix { margin-bottom: 100px !important; } }
    `}</style>
  </section>
);
}