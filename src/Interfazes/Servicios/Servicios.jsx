import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import { generarServiciosDelMes } from "../Servicios/generadorServicios.js";
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
      const generados = await generarServiciosDelMes(); 
      
      if (generados && Array.isArray(generados)) {
        for (const s of generados) {
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
      <h4 className="fw-bold text-center mb-4 text-uppercase" style={{letterSpacing: '2px'}}>📅 Gestión de Servicios</h4>

      <div className="d-flex justify-content-center gap-3 mb-4">
        <button className="btn btn-dark rounded-pill px-4 shadow-sm" onClick={() => setMostrarModal(true)}>⚙ Generar Mes</button>
        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => setMostrarModalCrear(true)}>➕ Nuevo Servicio</button>
      </div>

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

      {/* MODAL DETALLE */}
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
                    <div className="spinner-border spinner-border-sm text-primary mx-auto"></div>
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
                <button className="btn btn-light rounded-pill px-4 w-100" onClick={() => setMostrarModalInfo(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR */}
      {mostrarModalCrear && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{borderRadius: '20px'}}>
              <form onSubmit={crearServicio}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="fw-bold">Crear Servicio</h5>
                  <button className="btn-close" type="button" onClick={() => setMostrarModalCrear(false)} />
                </div>
                <div className="modal-body row p-4">
                  <div className="col-md-5">
                    <input type="date" className="form-control mb-3" value={fecha} onChange={e => setFecha(e.target.value)} required />
                    <div className="d-flex gap-2 mb-3">
                      <input type="number" className="form-control" value={hora} onChange={e => setHora(e.target.value)} />
                      <select className="form-select" value={periodo} onChange={e => setPeriodo(e.target.value)}>
                        <option value="am">am</option><option value="pm">pm</option>
                      </select>
                    </div>
                    <input className="form-control mb-3" placeholder="Tipo (Ej: Domingo)" value={tipo} onChange={e => setTipo(e.target.value)} required />
                    <textarea className="form-control" rows="3" placeholder="Comentario..." value={comentario} onChange={e => setComentario(e.target.value)} />
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
                              style={{cursor: 'pointer', transition: '0.2s', borderRadius: '12px'}}
                            >
                              {a.Nombre}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setMostrarModalCrear(false)}>Cancelar</button>
                  <button className="btn btn-dark rounded-pill px-4 shadow">Guardar</button>
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