import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import { generarServiciosDelMes } from "../Servicios/generadorServicios.js";
import ModalGenerarDeLosServicios from "../Componentes/ModalGenerarDeLosServicios.jsx";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [aereasGenerales, setAereasGenerales] = useState([]);

  // ───── ESTADOS MODAL CREAR ─────
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("");
  const [hora, setHora] = useState("7");
  const [minutos, setMinutos] = useState("00");
  const [periodo, setPeriodo] = useState("pm");
  const [comentario, setComentario] = useState("");
  const [aereasSeleccionadas, setAereasSeleccionadas] = useState([]);

  // ───── ESTADOS MODAL INFO (DETALLE) ─────
  const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [areasDelServicio, setAreasDelServicio] = useState([]); // Áreas del servicio clickeado
  const [cargandoAreas, setCargandoAreas] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);

  // ─────────────────────────────
  // CARGA DE DATOS INICIAL
  // ─────────────────────────────
  const cargarServicios = async () => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const finMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);

    const { data: dataServicios } = await supabase
      .from("Servicio")
      .select("*")
      .gte("Fecha", inicioMes.toISOString().split('T')[0])
      .lte("Fecha", finMes.toISOString().split('T')[0])
      .order("Fecha", { ascending: true });

    const { data: areas } = await supabase.from("Aerea").select("*").order("Nombre");
    
    setAereasGenerales(areas || []);
    setServicios(dataServicios || []);
  };

  useEffect(() => { cargarServicios(); }, []);

  // ─────────────────────────────
  // ABRIR DETALLE CON SUS ÁREAS
  // ─────────────────────────────
  const abrirDetalleServicio = async (servicio) => {
    setServicioSeleccionado(servicio);
    setMostrarModalInfo(true);
    setCargandoAreas(true);
    setAreasDelServicio([]);

    // Buscamos las áreas unidas a este servicio
    const { data, error } = await supabase
      .from("ServicioArea")
      .select(`
        IdArea,
        Aerea ( Nombre )
      `)
      .eq("IdServicio", servicio.Id);

    if (!error && data) {
      // Formateamos para tener solo los nombres
      setAreasDelServicio(data.map(item => item.Aerea.Nombre));
    }
    setCargandoAreas(false);
  };

  // ─────────────────────────────
  // ACCIONES (GENERAR Y CREAR)
  // ─────────────────────────────
  const manejarGeneracion = async () => {
    const generados = await generarServiciosDelMes(); 
    if (generados) {
      for (const s of generados) {
        await supabase.rpc('generar_match_automatico', { p_servicio_id: s.Id });
      }
    }
    setMostrarModal(false);
    cargarServicios();
  };

  const crearServicio = async (e) => {
    e.preventDefault();
    const jornada = `${hora}:${minutos} ${periodo}`;
    const { data: nuevo, error } = await supabase
      .from("Servicio")
      .insert({ Fecha: fecha, Jornada: jornada, Tipo: tipo, Estado: "Pendiente", Comentario: comentario })
      .select().single();

    if (!error && aereasSeleccionadas.length > 0) {
      const rel = aereasSeleccionadas.map(id => ({ IdServicio: nuevo.Id, IdArea: id }));
      await supabase.from("ServicioArea").insert(rel);
    }
    setMostrarModalCrear(false);
    cargarServicios();
  };

  return (
    <section className="container py-4">
      <h4 className="fw-bold text-center mb-4 text-uppercase" style={{letterSpacing: '2px'}}>📅 Gestión de Servicios</h4>

      <div className="d-flex justify-content-center gap-3 mb-4">
        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => setMostrarModal(true)}>⚙ Generar Mes</button>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setMostrarModalCrear(true)}>➕ Nuevo Servicio</button>
      </div>

      {/* LISTA DE SERVICIOS */}
      <div className="row g-3">
        {servicios.map((s) => (
          <div key={s.Id} className="col-12 col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm hover-card" onClick={() => abrirDetalleServicio(s)} style={{ cursor: "pointer", borderRadius: '15px' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
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

      {/* MODAL INFO / DETALLE (CON ÁREAS) */}
      {mostrarModalInfo && servicioSeleccionado && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{borderRadius: '20px'}}>
              <div className="modal-header border-0">
                <h5 className="fw-bold m-0">{servicioSeleccionado.Tipo}</h5>
                <button className="btn-close" onClick={() => setMostrarModalInfo(false)}></button>
              </div>
              <div className="modal-body pt-0">
                <div className="mb-3 p-3 bg-light rounded-3">
                  <div className="small text-muted text-uppercase fw-bold">Información</div>
                  <div className="mt-1"><strong>Fecha:</strong> {servicioSeleccionado.Fecha}</div>
                  <div><strong>Jornada:</strong> {servicioSeleccionado.Jornada}</div>
                  <div className="mt-2 text-secondary italic small">"{servicioSeleccionado.Comentario || "Sin comentarios"}"</div>
                </div>

                <div className="fw-bold mb-2">Áreas Asignadas:</div>
                <div className="d-flex flex-wrap gap-2">
                  {cargandoAreas ? (
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  ) : areasDelServicio.length > 0 ? (
                    areasDelServicio.map((area, idx) => (
                      <span key={idx} className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted small">No hay áreas asignadas.</span>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light rounded-pill px-4" onClick={() => setMostrarModalInfo(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR (CARTAS) */}
      {mostrarModalCrear && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{borderRadius: '20px'}}>
              <form onSubmit={crearServicio}>
                <div className="modal-header border-0">
                  <h5 className="fw-bold">Crear Servicio</h5>
                  <button className="btn-close" type="button" onClick={() => setMostrarModalCrear(false)} />
                </div>
                <div className="modal-body row">
                  <div className="col-md-5">
                    <input type="date" className="form-control mb-3" value={fecha} onChange={e => setFecha(e.target.value)} required />
                    <div className="d-flex gap-2 mb-3">
                      <input type="number" className="form-control" value={hora} onChange={e => setHora(e.target.value)} />
                      <select className="form-select" value={periodo} onChange={e => setPeriodo(e.target.value)}>
                        <option value="am">am</option><option value="pm">pm</option>
                      </select>
                    </div>
                    <input className="form-control mb-3" placeholder="Tipo de Servicio" value={tipo} onChange={e => setTipo(e.target.value)} required />
                    <textarea className="form-control" placeholder="Comentario..." value={comentario} onChange={e => setComentario(e.target.value)} />
                  </div>
                  <div className="col-md-7 border-start">
                    <label className="fw-bold mb-2 d-block">Selecciona Áreas</label>
                    <div className="row g-2 overflow-auto" style={{maxHeight: '300px'}}>
                      {aereasGenerales.map(a => {
                        const sel = aereasSeleccionadas.includes(a.Id);
                        return (
                          <div key={a.Id} className="col-6">
                            <div 
                              onClick={() => sel ? setAereasSeleccionadas(aereasSeleccionadas.filter(id => id !== a.Id)) : setAereasSeleccionadas([...aereasSeleccionadas, a.Id])}
                              className={`card h-100 border-2 select-card p-2 text-center small fw-bold ${sel ? "border-primary bg-primary text-white shadow" : "border-light bg-light"}`}
                              style={{cursor: 'pointer', transition: '0.2s'}}
                            >
                              {a.Nombre}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light rounded-pill" onClick={() => setMostrarModalCrear(false)}>Cancelar</button>
                  <button className="btn btn-dark rounded-pill px-4">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ModalGenerarDeLosServicios visible={mostrarModal} onClose={() => setMostrarModal(false)} onConfirm={manejarGeneracion} />

      <style>{`
        .hover-card:hover { transform: translateY(-5px); transition: 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
        .select-card:active { transform: scale(0.95); }
      `}</style>
    </section>
  );
}