import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";

export default function Areas() {
  const [aereasGenerales, setAereasGenerales] = useState([]);
  const [misAereas, setMisAereas] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);

  // ───── MODAL QUITAR ─────
  const [mostrarModalQuitar, setMostrarModalQuitar] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);

  // ───── MODAL CREAR ─────
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nombreArea, setNombreArea] = useState("");
  const [descripcionArea, setDescripcionArea] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  // ─────────────────────────────
  // CARGAR DATOS
  // ─────────────────────────────
  const cargarDatos = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const idServidor = data.user.id;
    setIdUsuario(idServidor);

    const { data: misAreasData } = await supabase
      .from("Servidor_Area")
      .select(`Aerea ( Id, Nombre, Descripcion, Foto )`)
      .eq("IdServidor", idServidor);

    setMisAereas(misAreasData?.map((i) => i.Aerea) || []);

    const { data: todas } = await supabase
      .from("Aerea")
      .select("*");

    setAereasGenerales(todas || []);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ─────────────────────────────
  // REGISTRARSE EN ÁREA
  // ─────────────────────────────
  const registrarArea = async (area) => {
    if (!confirm("¿Seguro que estás capacitado para apoyar en esta área?")) return;

    await supabase.from("Servidor_Area").insert([
      {
        IdServidor: idUsuario,
        IdAerea: area.Id,
      },
    ]);

    cargarDatos();
  };

  // ─────────────────────────────
  // QUITAR ÁREA
  // ─────────────────────────────
  const abrirModalQuitar = (area) => {
    setAreaSeleccionada(area);
    setMostrarModalQuitar(true);
  };

  const salirArea = async () => {
    await supabase
      .from("Servidor_Area")
      .delete()
      .eq("IdServidor", idUsuario)
      .eq("IdAerea", areaSeleccionada.Id);

    setMostrarModalQuitar(false);
    setAreaSeleccionada(null);
    cargarDatos();
  };

  // ─────────────────────────────
  // CREAR ÁREA
  // ─────────────────────────────
  const manejarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const crearArea = async (e) => {
    e.preventDefault();

    if (!nombreArea || !descripcionArea || !fotoFile) {
      alert("Completa todos los campos");
      return;
    }

    // ⚠️ Por ahora guardamos la preview (ideal luego usar Storage)
    await supabase.from("Aerea").insert([
      {
        Nombre: nombreArea,
        Descripcion: descripcionArea,
        Foto: fotoPreview,
      },
    ]);

    setMostrarModalCrear(false);
    setNombreArea("");
    setDescripcionArea("");
    setFotoFile(null);
    setFotoPreview(null);

    cargarDatos();
  };

  // ─────────────────────────────
  // FILTRAR ÁREAS DISPONIBLES
  // ─────────────────────────────
  const idsMisAreas = misAereas.map((a) => a.Id);
  const areasDisponibles = aereasGenerales.filter(
    (a) => !idsMisAreas.includes(a.Id)
  );

  return (
    <section className="container py-3">

      {/* ───── MIS ÁREAS ───── */}
      <section className="mb-4">
        <h5 className="fw-bold mb-3">Mis áreas</h5>

        <div className="d-flex gap-3 overflow-auto flex-nowrap pb-2">
          {misAereas.length === 0 ? (
            <p className="text-muted">No estás registrado en áreas</p>
          ) : (
            misAereas.map((area) => (
              <div
                key={area.Id}
                style={{ cursor: "pointer" }}
                onClick={() => abrirModalQuitar(area)}
              >
                <AreaCard area={area} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ───── ÁREAS DISPONIBLES ───── */}
      <section>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold m-0">Áreas disponibles</h5>

          <button
            className="btn btn-dark rounded-pill px-4"
            onClick={() => setMostrarModalCrear(true)}
          >
            ➕ Agregar área
          </button>
        </div>

        <div className="d-flex gap-3 overflow-auto flex-nowrap pb-2">
          {areasDisponibles.map((area) => (
            <AreaCard
              key={area.Id}
              area={area}
              mostrarBoton
              onRegistrar={registrarArea}
            />
          ))}
        </div>
      </section>

      {/* ───── MODAL CREAR ÁREA ───── */}
      {mostrarModalCrear && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4">

              <form onSubmit={crearArea}>
                <div className="modal-header">
                  <h5 className="fw-bold">Crear nueva área</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMostrarModalCrear(false)}
                  />
                </div>

                <div className="modal-body">
                  <input
                    className="form-control mb-2"
                    placeholder="Nombre del área"
                    value={nombreArea}
                    onChange={(e) => setNombreArea(e.target.value)}
                  />

                  <textarea
                    className="form-control mb-2"
                    placeholder="Descripción"
                    value={descripcionArea}
                    onChange={(e) => setDescripcionArea(e.target.value)}
                  />

                  <input
                    type="file"
                    className="form-control mb-3"
                    accept="image/*"
                    onChange={manejarFoto}
                  />

                  {fotoPreview && (
                    <img
                      src={fotoPreview}
                      alt="preview"
                      className="img-fluid rounded"
                    />
                  )}
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
                    Guardar área
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ───── MODAL QUITAR ÁREA ───── */}
      {mostrarModalQuitar && areaSeleccionada && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4">

              <div className="modal-header">
                <h5 className="fw-bold">{areaSeleccionada.Nombre}</h5>
                <button
                  className="btn-close"
                  onClick={() => setMostrarModalQuitar(false)}
                />
              </div>

              <div className="modal-body">
                <p>{areaSeleccionada.Descripcion}</p>
                <img
                  src={areaSeleccionada.Foto}
                  className="img-fluid rounded"
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setMostrarModalQuitar(false)}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-danger"
                  onClick={salirArea}
                >
                  Salir del área
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}
