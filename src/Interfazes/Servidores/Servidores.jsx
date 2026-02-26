import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";

export default function Servidores() {
  const [servidores, setServidores] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);
  const [servidorExpandido, setServidorExpandido] = useState(null);
  const [estadosServidor, setEstadosServidor] = useState([]);
  const [dia, setDia] = useState("");
  const [hora, setHora] = useState("");

  useEffect(() => {
    cargarServidores();
  }, []);

  const cargarServidores = async () => {
    const { data, error } = await supabase
      .from("Servidores")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setServidores(data || []);
  };

  const cargarEstadosServidor = async (idServidor) => {
    const { data, error } = await supabase
      .from("Estado")
      .select("*")
      .eq("IdServidor", idServidor);

    if (error) {
      console.error(error);
      return;
    }

    setEstadosServidor(data || []);
  };

  const horasDomingo = [
    "7:00 AM",
    "9:00 AM",
    "11:00 AM",
    "6:00 PM",
  ];

  const horasMiercoles = ["7:00 PM"];

  const horasDisponibles =
    dia === "Domingo"
      ? horasDomingo
      : dia === "Miércoles"
      ? horasMiercoles
      : [];

  const abrirModal = (id) => {
    setServidorSeleccionado(id);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setDia("");
    setHora("");
  };

  const guardarEstado = async () => {
    if (!dia || !hora) {
      alert("Selecciona día y hora");
      return;
    }

    const { error } = await supabase.from("Estado").insert({
      IdServidor: servidorSeleccionado,
      Dia: dia,
      HoraServicio: hora,
    });

    if (error) {
      console.error(error);
      alert("Error al guardar");
      return;
    }

    // Recargar estados si está expandido
    if (servidorExpandido === servidorSeleccionado) {
      cargarEstadosServidor(servidorSeleccionado);
    }

    alert("Servidor asignado correctamente");
    cerrarModal();
  };

  return (
    <div className="container py-4">

      <h4 className="fw-bold text-center mb-4">
        👥 Servidores
      </h4>

      {servidores.length === 0 ? (
        <div className="text-center text-muted">
          No hay servidores registrados
        </div>
      ) : (
        servidores.map((servidor) => (
          <div
            key={servidor.Id}
            className="card mb-3 border-0 shadow-sm rounded-4"
          >
            <div className="card-body d-flex align-items-center justify-content-between">

              {/* FOTO + INFO */}
              <div className="d-flex align-items-center">

                <img
                  src={servidor.Foto}
                  alt={servidor.Nombre}
                  className="rounded-circle"
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    border: "3px solid #f1f1f1"
                  }}
                />

                <div className="ms-3">
                  <h6
                    className="fw-bold mb-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      if (servidorExpandido === servidor.Id) {
                        setServidorExpandido(null);
                      } else {
                        setServidorExpandido(servidor.Id);
                        cargarEstadosServidor(servidor.Id);
                      }
                    }}
                  >
                    {servidor.Nombre}
                  </h6>

                  <small className="text-muted">
                    {servidor.Area || "Servidor activo"}
                  </small>
                </div>

              </div>

              {/* BOTÓN FIJO */}
              <button
                className="btn btn-dark btn-sm rounded-pill px-3"
                onClick={() => abrirModal(servidor.Id)}
              >
                📌 Fijo
              </button>

            </div>

            {/* EXPANSIÓN DE SERVICIOS FIJOS */}
            {servidorExpandido === servidor.Id && (
              <div className="px-4 pb-3">

                <hr />

                {estadosServidor.length === 0 ? (
                  <div className="text-muted small">
                    Este servidor no tiene servicios fijos.
                  </div>
                ) : (
                  estadosServidor.map((estado) => (
                    <div
                      key={estado.Id}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 rounded-3"
                      style={{ backgroundColor: "#f8f9fa" }}
                    >
                      <span className="fw-semibold">
                        {estado.Dia}
                      </span>

                      <span className="badge bg-dark rounded-pill">
                        {estado.HoraServicio}
                      </span>
                    </div>
                  ))
                )}

              </div>
            )}

          </div>
        ))
      )}

      {/* ================= MODAL ================= */}

      {mostrarModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0">

              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  📌 Asignar Servicio Fijo
                </h5>
                <button
                  className="btn-close"
                  onClick={cerrarModal}
                ></button>
              </div>

              <div className="modal-body">

                <label className="fw-semibold mb-2">
                  Seleccionar Día
                </label>

                <select
                  className="form-select mb-3 rounded-3"
                  value={dia}
                  onChange={(e) => {
                    setDia(e.target.value);
                    setHora("");
                  }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Domingo">Domingo</option>
                  <option value="Miércoles">Miércoles</option>
                </select>

                {dia && (
                  <>
                    <label className="fw-semibold mb-2">
                      Seleccionar Hora
                    </label>

                    <select
                      className="form-select rounded-3"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {horasDisponibles.map((h, index) => (
                        <option key={index} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </>
                )}

              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-secondary rounded-pill"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-dark rounded-pill"
                  onClick={guardarEstado}
                >
                  Guardar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
