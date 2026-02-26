import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";

export default function Areas() {
  const [aereasGenerales, setAereasGenerales] = useState([]);
  const [misAereas, setMisAereas] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  const [carga, setcarga] = useState(null);

  // ───── MODAL QUITAR ─────
  const [mostrarModalQuitar, setMostrarModalQuitar] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);

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
    setcarga(true);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ─────────────────────────────
  // REGISTRARSE EN ÁREA
  // ─────────────────────────────
  const registrarArea = async (area) => {
    if (!confirm("¿Seguro que puedes con esta área? Es clave y no hay margen de error.")) return;

    await supabase.from("Servidor_Area").insert([
      {
        IdServidor: idUsuario,
        IdAerea: area.Id,
      },
    ]);
     setcarga(false);
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
  // FILTRAR ÁREAS DISPONIBLES
  // ─────────────────────────────
  const idsMisAreas = misAereas.map((a) => a.Id);
  const areasDisponibles = aereasGenerales.filter(
    (a) => !idsMisAreas.includes(a.Id)
  );

   if (!carga) {
    return (
      <section className="text-center py-5">
        <span className="spinner-border" />
      </section>
    );
  }

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
