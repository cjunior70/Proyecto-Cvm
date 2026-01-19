import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";

export default function Areas() {

  const [aereasGenerales, setAereasGenerales] = useState([]);
  const [misAereas, setMisAereas] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);

  /* ===============================
     🔹 CARGAR DATOS
  =============================== */
  const cargarDatos = async () => {
    try {
      // 1️⃣ Usuario autenticado
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error("❌ No hay usuario autenticado");
        return;
      }

      const idServidor = userData.user.id;
      setIdUsuario(idServidor);

      // 2️⃣ Mis áreas (JOIN)
      const { data: misAreasData, error: errorMisAreas } =
        await supabase
          .from("Servidor_Area")
          .select(`
            Id,
            Aerea (
              Id,
              Nombre,
              Descripcion,
              Foto
            )
          `)
          .eq("IdServidor", idServidor);

      if (errorMisAreas) {
        console.error("❌ Error cargando mis áreas:", errorMisAreas);
        return;
      }

      const areasLimpias = misAreasData.map((item) => item.Aerea);
      setMisAereas(areasLimpias);

      // 3️⃣ Todas las áreas
      const { data: todasAreas, error } = await supabase
        .from("Aerea")
        .select("*");

      if (error) {
        console.error("❌ Error cargando áreas:", error);
        return;
      }

      // 4️⃣ Excluir mis áreas de las disponibles
      const idsMisAreas = areasLimpias.map((a) => a.Id);
      const disponibles = todasAreas.filter(
        (a) => !idsMisAreas.includes(a.Id)
      );

      setAereasGenerales(disponibles);

    } catch (err) {
      console.error("❌ Error general:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  /* ===============================
     🔹 REGISTRARSE EN ÁREA
  =============================== */
  const registrarArea = async (area) => {
    const confirmar = window.confirm(
      "¿Seguro que estás capacitado para apoyar en esta área?"
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("Servidor_Area")
        .insert([
          {
            IdServidor: idUsuario,
            IdAerea: area.Id,
          },
        ]);

      if (error) {
        console.error(error);
        alert("❌ No se pudo registrar en el área");
        return;
      }

      alert("✅ Te registraste correctamente");
      cargarDatos();

    } catch (err) {
      console.error("❌ Error inesperado:", err);
    }
  };

  /* ===============================
     🔹 SALIR DEL ÁREA
  =============================== */
  const salirDelArea = async () => {
    if (!areaSeleccionada || !idUsuario) return;

    const confirmar = window.confirm(
      `¿Seguro que deseas salir del área "${areaSeleccionada.Nombre}"?`
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("Servidor_Area")
        .delete()
        .eq("IdServidor", idUsuario)
        .eq("IdAerea", areaSeleccionada.Id);

      if (error) {
        console.error(error);
        alert("❌ No se pudo salir del área");
        return;
      }

      alert("✅ Saliste del área");
      setAreaSeleccionada(null);
      cargarDatos();

    } catch (err) {
      console.error("❌ Error inesperado:", err);
    }
  };

  /* ===============================
     🔹 UI
  =============================== */
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
                onClick={() => setAreaSeleccionada(area)}
              >
                <AreaCard area={area} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ───── ÁREAS DISPONIBLES ───── */}
      <section>
        <h5 className="fw-bold mb-3">Áreas disponibles</h5>

        <div className="d-flex gap-3 overflow-auto flex-nowrap pb-2">
          {aereasGenerales.length === 0 ? (
            <p className="text-muted">No hay áreas disponibles</p>
          ) : (
            aereasGenerales.map((area) => (
              <AreaCard
                key={area.Id}
                area={area}
                mostrarBoton
                onRegistrar={registrarArea}
              />
            ))
          )}
        </div>
      </section>

      {/* ───── MODAL MIS ÁREAS ───── */}
      {areaSeleccionada && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 shadow">

              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {areaSeleccionada.Nombre}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setAreaSeleccionada(null)}
                />
              </div>

              <div className="modal-body text-center">
                <img
                  src={areaSeleccionada.Foto}
                  alt={areaSeleccionada.Nombre}
                  className="img-fluid rounded mb-3"
                  style={{ maxHeight: "180px", objectFit: "cover" }}
                />
                <p className="text-muted">
                  {areaSeleccionada.Descripcion}
                </p>
              </div>

              <div className="modal-footer d-flex justify-content-between">
                <button
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={() => setAreaSeleccionada(null)}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-danger rounded-pill px-4"
                  onClick={salirDelArea}
                >
                  🚪 Salir del área
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}
