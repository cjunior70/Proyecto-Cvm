import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  obtenerStaffMesActual,
  actualizarNombreServidor,
} from "./obtenerStaffMesActual";
import DatosServidores from "./DatosServidores"; // 💡 Conexión con el componente hijo

export default function Servidores() {
  const [staff, setStaff] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  // 💡 ESTADO CLAVE: Controla cuál servidor abre la ficha flotante
  const [servidorSeleccionado, setServidorSeleccionado] = useState(null);

  // Cargar datos desde el servicio
  const cargarServidores = async () => {
    setLoading(true);
    const data = await obtenerStaffMesActual();
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarServidores();
  }, []);

  // Filtrar en tiempo real por búsqueda
  const servidoresFiltrados = staff.filter(
    (s) =>
      (s.Nombre?.toLowerCase() || "").includes(busqueda.toLowerCase()) ||
      (s.Correo?.toLowerCase() || "").includes(busqueda.toLowerCase()),
  );

  // Editar Nombre rápido con SweetAlert
  const manejarEditarNombre = (e, id, nombreActual) => {
    e.stopPropagation(); // 💥 Evita que se abra la ficha al hacer clic en el lápiz
    Swal.fire({
      title: "Editar Nombre",
      input: "text",
      inputValue: nombreActual,
      showCancelButton: true,
      confirmButtonColor: "#6E4BDB",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Guardar",
      inputValidator: (value) => {
        if (!value) return "¡El nombre no puede quedar vacío";
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.showLoading();
        const res = await actualizarNombreServidor(id, result.value);
        if (res.success) {
          setStaff((prev) =>
            prev.map((s) => (s.Id === id ? { ...s, Nombre: result.value } : s)),
          );
          Swal.fire({
            title: "¡Guardado!",
            text: "Nombre actualizado con éxito.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire("Error", "No se pudo actualizar.", "error");
        }
      }
    });
  };

  return (
    <div
      className="w-100 min-vh-100 position-relative rounded-4"
      style={{
        backgroundColor: "#f4f6f9",
        paddingTop: "20px",
        paddingBottom: "100px",
      }}
    >
      <div className="container px-3" style={{ maxWidth: "600px" }}>
        {/* 📋 ENCABEZADO */}
        <header className="mb-3">
          <h4 className="fw-bold m-0" style={{ color: "#2D3748" }}>
            Staff de Servidores
          </h4>
          <p className="text-muted small m-0">
            Control de asistencia y disponibilidad del mes
          </p>
        </header>

        {/* 🔍 BARRA DE BÚSQUEDA */}
        <div className="mb-3">
          <div className="input-group bg-white shadow-sm rounded-3 overflow-hidden border-0">
            <span className="input-group-text bg-white border-0 text-muted fs-5">
              🔍
            </span>
            <input
              type="text"
              className="form-control border-0 ps-1"
              placeholder="Buscar servidor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ fontSize: "0.95rem", height: "46px", boxShadow: "none" }}
            />
          </div>
          <div
            className="text-muted font-monospace text-end mt-1 px-1"
            style={{ fontSize: "0.68rem" }}
          >
            Total:{" "}
            <strong style={{ color: "#6E4BDB" }}>
              {servidoresFiltrados.length}
            </strong>{" "}
            de {staff.length}
          </div>
        </div>

        {/* 🔲 CONTENIDO */}
        {loading ? (
          <div className="d-flex flex-column gap-3 placeholder-glow">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="card border-0 shadow-sm rounded-4 p-3 bg-white"
                style={{ borderLeft: "5px solid #6E4BDB" }}
              >
                <div
                  className="placeholder rounded-circle"
                  style={{ width: "48px", height: "48px" }}
                ></div>
              </div>
            ))}
          </div>
        ) : servidoresFiltrados.length === 0 ? (
          <div className="text-center my-5 py-5 bg-white rounded-4 shadow-sm border">
            <p className="text-muted m-0 small fw-medium">
              No se encontraron servidores.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {servidoresFiltrados.map((servidor) => {
              const esCargaAlta = servidor.TotalServiciosMes >= 6;
              return (
                <div
                  key={servidor.Id}
                  className="card border-0 shadow-sm rounded-4 p-3 bg-white card-clicable"
                  style={{ borderLeft: `5px solid #6E4BDB`, cursor: "pointer" }}
                  onClick={() => setServidorSeleccionado(servidor)}
                >
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={
                          servidor.Foto ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${servidor.Nombre}`
                        }
                        alt={servidor.Nombre}
                        className="rounded-circle border border-2 shadow-sm object-fit-cover"
                        style={{
                          width: "48px",
                          height: "48px",
                          borderColor: "#f1f3f6",
                        }}
                      />
                      <div>
                        <div className="d-flex align-items-center">
                          <h6
                            className="fw-bold m-0 text-dark text-truncate"
                            style={{ fontSize: "0.95rem", maxWidth: "160px" }}
                          >
                            {servidor.Nombre}
                          </h6>
                          <button
                            className="btn btn-light border-0 p-0 ms-2 rounded-circle"
                            style={{
                              width: "24px",
                              height: "24px",
                              fontSize: "0.7rem",
                            }}
                            onClick={(e) =>
                              manejarEditarNombre(
                                e,
                                servidor.Id,
                                servidor.Nombre,
                              )
                            }
                          >
                            ✏️
                          </button>
                        </div>
                        <span
                          className="text-muted font-monospace d-block"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {servidor.Correo || "Sin correo"}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex flex-column align-items-end gap-1">
                      <span
                        className="badge rounded-3 px-2 py-1.5 fw-bold shadow-sm"
                        style={{
                          fontSize: "0.72rem",
                          backgroundColor: esCargaAlta ? "#dc3545" : "#6E4BDB",
                        }}
                      >
                        📅 {servidor.TotalServiciosMes} Serv.
                      </span>
                      <span
                        className="badge rounded-pill border"
                        style={{
                          fontSize: "0.58rem",
                          padding: "2px 8px",
                          color: "#6E4BDB",
                          backgroundColor: "#EDE9FE",
                          borderColor: "#DDD6FE",
                        }}
                      >
                        {servidor.Estado?.toUpperCase() || "LIBRE"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="p-2 px-3 rounded-3"
                    style={{ backgroundColor: "#F5F3FF" }}
                  >
                    <span
                      className="d-block fw-bold mb-1"
                      style={{
                        fontSize: "0.62rem",
                        color: "#6E4BDB",
                        letterSpacing: "0.3px",
                      }}
                    >
                      📐 ÁREAS AUTORIZADAS
                    </span>
                    <div className="d-flex flex-wrap gap-1">
                      {servidor.Areas?.map((area, idx) => (
                        <span
                          key={idx}
                          className="badge rounded-pill fw-semibold border shadow-xs"
                          style={{
                            fontSize: "0.68rem",
                            padding: "4px 8px",
                            backgroundColor: "#fff",
                            color: "#6E4BDB",
                            borderColor: "#DDD6FE",
                          }}
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {servidorSeleccionado && (
        <DatosServidores
          servidor={servidorSeleccionado}
          onClose={() => {
            setServidorSeleccionado(null);
            cargarServidores();
          }}
        />
      )}

      <style>{`
        .card-clicable { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-clicable:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
