import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);

  // MODAL CREAR
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [fecha, setFecha] = useState("");
  const [jornada, setJornada] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("Pendiente");
  const [comentario, setComentario] = useState("");

  // MODAL INFO
  const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  // ─────────────────────────────
  // CARGAR SERVICIOS DEL MES
  // ─────────────────────────────
  const cargarServicios = async () => {
    const inicioMes = new Date();
    inicioMes.setDate(1);

    const finMes = new Date(
      inicioMes.getFullYear(),
      inicioMes.getMonth() + 1,
      0
    );

    const { data, error } = await supabase
      .from("Servicio")
      .select("*")
      .gte("Fecha", inicioMes.toISOString())
      .lte("Fecha", finMes.toISOString())
      .order("Fecha", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setServicios(data);
  };

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      if (!activo) return;
      await cargarServicios();
    };

    cargar();

    return () => {
      activo = false;
    };
  }, []);
    


  // ─────────────────────────────
  // CREAR SERVICIO
  // ─────────────────────────────
  const crearServicio = async (e) => {
    e.preventDefault();

    if (!fecha || !jornada || !tipo) {
      alert("Completa los campos obligatorios");
      return;
    }

    const { error } = await supabase.from("Servicio").insert([
      {
        Fecha: fecha,
        Jornada: jornada,
        Tipo: tipo,
        Estado: estado,
        Comentario: comentario,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error al crear servicio");
      return;
    }

    setMostrarModalCrear(false);
    setFecha("");
    setJornada("");
    setTipo("");
    setComentario("");
    setEstado("Pendiente");

    cargarServicios();
  };

  return (
    <section className="container py-4">

      {/* ───── TÍTULO ───── */}
      <h4 className="fw-bold text-center mb-4">
        📅 Gestión de Servicios
      </h4>

      {/* ───── BOTÓN CREAR ───── */}
      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-dark rounded-pill px-4"
          onClick={() => setMostrarModalCrear(true)}
        >
          ➕ Agregar servicio
        </button>
      </div>

      {/* ───── LISTA DE SERVICIOS ───── */}
      <ul className="list-group shadow-sm">
        {servicios.length === 0 ? (
          <li className="list-group-item text-center text-muted">
            No hay servicios este mes
          </li>
        ) : (
          servicios.map((s) => (
            <li
              key={s.Id}
              className="list-group-item d-flex justify-content-between align-items-center"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setServicioSeleccionado(s);
                setMostrarModalInfo(true);
              }}
            >
              <div>
                <strong>{s.Tipo}</strong>
                <div className="small text-muted">
                  {new Date(s.Fecha).toLocaleDateString()} · {s.Jornada}
                </div>
              </div>

              <span
                className={`badge rounded-pill
                  ${s.Estado === "Completado"
                    ? "bg-success"
                    : s.Estado === "Cancelado"
                    ? "bg-danger"
                    : "bg-warning text-dark"
                  }`}
              >
                {s.Estado}
              </span>
            </li>
          ))
        )}
      </ul>

      {/* ───── MODAL CREAR SERVICIO ───── */}
      {mostrarModalCrear && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4">

              <form onSubmit={crearServicio}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    ➕ Nuevo servicio
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => setMostrarModalCrear(false)}
                    type="button"
                  />
                </div>

                <div className="modal-body">
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />

                  <input
                    className="form-control mb-2"
                    placeholder="Jornada"
                    value={jornada}
                    onChange={(e) => setJornada(e.target.value)}
                  />

                  <input
                    className="form-control mb-2"
                    placeholder="Tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  />

                  <textarea
                    className="form-control"
                    placeholder="Comentario (opcional)"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setMostrarModalCrear(false)}
                  >
                    Cancelar
                  </button>

                  <button className="btn btn-success">
                    Guardar
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ───── MODAL INFO SERVICIO ───── */}
      {mostrarModalInfo && servicioSeleccionado && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4">

              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  📄 Detalle del servicio
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setMostrarModalInfo(false)}
                />
              </div>

              <div className="modal-body">
                <p><strong>Tipo:</strong> {servicioSeleccionado.Tipo}</p>
                <p><strong>Fecha:</strong> {new Date(servicioSeleccionado.Fecha).toLocaleDateString()}</p>
                <p><strong>Jornada:</strong> {servicioSeleccionado.Jornada}</p>
                <p><strong>Estado:</strong> {servicioSeleccionado.Estado}</p>

                {servicioSeleccionado.Comentario && (
                  <p><strong>Comentario:</strong> {servicioSeleccionado.Comentario}</p>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-danger me-auto"
                  onClick={async () => {
                    const confirmar = confirm("¿Eliminar este servicio?");
                    if (!confirmar) return;

                    await supabase
                      .from("Servicio")
                      .delete()
                      .eq("Id", servicioSeleccionado.Id);

                    setMostrarModalInfo(false);
                    cargarServicios();
                  }}
                >
                  🗑 Eliminar
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setMostrarModalInfo(false)}
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}
