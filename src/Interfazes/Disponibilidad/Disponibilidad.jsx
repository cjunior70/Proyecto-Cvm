import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "../../../Supabase/cliente";

export default function Disponibilidad() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [servicios, setServicios] = useState([]);
  const [serviciosDia, setServiciosDia] = useState([]);
  const [yaRegistrado, setYaRegistrado] = useState(false);
  const [carga, setcarga] = useState(null);

  //Cargar los servicios q necesiten mis aereas
  const cargarServicios = async () => {
    try {
      // 1️⃣ Usuario autenticado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const idUsuario = userData.user.id;

      // 2️⃣ Áreas del usuario
      const { data: areasUsuario, error: errorAreas } =
        await supabase
          .from("Servidor_Area")
          .select("IdAerea")
          .eq("IdServidor", idUsuario);

      if (errorAreas) throw errorAreas;

      const misAreasIds = areasUsuario.map(a => a.IdAerea);

      if (misAreasIds.length === 0) {
        setServicios([]);
        return;
      }

      // 3️⃣ Rango del mes actual
      const inicioMes = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        1
      );

      const finMes = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth() + 1,
        0
      );

      // 4️⃣ Servicios con áreas requeridas
      const { data: serviciosData, error: errorServicios } =
        await supabase
          .from("Servicio")
          .select(`
            Id,
            Fecha,
            Tipo,
            Jornada,
            Estado,
            ServicioArea (
              IdArea
            )
          `)
          .gte("Fecha", inicioMes.toISOString().split("T")[0])
          .lte("Fecha", finMes.toISOString().split("T")[0]);

      if (errorServicios) throw errorServicios;

      // 🔥 Filtrar servicios compatibles con MIS áreas
      const serviciosCompatibles = serviciosData.filter(servicio =>
        servicio.ServicioArea.some(sa =>
          misAreasIds.includes(sa.IdArea)
        )
      );

      setServicios(serviciosCompatibles);

    } catch (err) {
      console.error("❌ Error cargando servicios:", err);
    }
    setcarga(true);
  };

  // ─────────────────────────────
  // VERIFICAR SI YA ESTÁ REGISTRADO
  // ─────────────────────────────
  const verificarDisponibilidad = async (fecha) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const fechaISO = fecha.toISOString().split("T")[0];

      const { data } = await supabase
        .from("Disponbilidad")
        .select("id")
        .eq("IdServidor", userData.user.id)
        .eq("Fecha", fechaISO)
        .maybeSingle();

      setYaRegistrado(!!data);

    } catch (err) {
      console.error("❌ Error verificando disponibilidad:", err);
    }
  };

  // ─────────────────────────────
  // REGISTRARSE EN EL DÍA
  // ─────────────────────────────
  const apuntarse = async () => {
    if (yaRegistrado) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const fechaISO = fechaSeleccionada.toISOString().split("T")[0];

      const { error } = await supabase
        .from("Disponbilidad")
        .insert([
          {
            IdServidor: userData.user.id,
            Fecha: fechaISO,
          },
        ]);

      if (error) throw error;

      alert("✅ Te registraste correctamente");
      setYaRegistrado(true);

    } catch (err) {
      console.error(err);
      alert("❌ Error al registrarte");
    }
  };

  // ─────────────────────────────
  // EFECTOS
  // ─────────────────────────────
  useEffect(() => {
    cargarServicios();
  }, [fechaSeleccionada.getMonth()]);

  useEffect(() => {
    const fechaISO = fechaSeleccionada.toISOString().split("T")[0];
    setServiciosDia(servicios.filter(s => s.Fecha === fechaISO));
    verificarDisponibilidad(fechaSeleccionada);
  }, [fechaSeleccionada, servicios]);

  // ─────────────────────────────
  // MARCAR DÍAS CON SERVICIOS
  // ─────────────────────────────
  const marcarDias = ({ date, view }) => {
    if (view === "month") {
      const fechaISO = date.toISOString().split("T")[0];
      if (servicios.some(s => s.Fecha === fechaISO)) {
        return "bg-success text-white rounded-circle";
      }
    }
  };

  if (!carga) {
    return (
      <section className="text-center py-5">
        <span className="spinner-border" />
      </section>
    );
  }

  return (
    <section className="container py-4">

      <h4 className="fw-bold text-center mb-4">
        📅 Disponibilidad según mis áreas
      </h4>
      <p className="text-muted text-center ">
        Para descubrir los servicios disponibles, por favor elige un área         
      </p>

      <div className="row g-4">

        {/* ───── CALENDARIO ───── */}
        <div className="col-md-6">
          <div className="card shadow-sm rounded-4">
            <div className="card-body d-flex justify-content-center">
              <Calendar
                locale="es-ES"
                value={fechaSeleccionada}
                onChange={setFechaSeleccionada}
                tileClassName={marcarDias}
              />
            </div>
          </div>
        </div>

        {/* ───── SERVICIOS DEL DÍA ───── */}
        <div className="col-md-6">
          <div className="card shadow-sm rounded-4 h-100">
            <div className="card-body">

              <h5 className="fw-bold mb-3">
                Servicios del día
              </h5>

              {serviciosDia.length === 0 ? (
                <section>
                  <p className="text-muted">
                    No hay servicios disponibles este día
                  </p>
                </section>
              ) : (
                <>
                  <ul className="list-group list-group-flush">
                    {serviciosDia.map(servicio => (
                      <li key={servicio.Id} className="list-group-item">
                        <div className="fw-semibold">
                          {servicio.Tipo}
                        </div>
                        <small className="text-muted">
                          Jornada: {servicio.Jornada}
                        </small>
                        <div>
                          <span className="badge bg-primary mt-1">
                            {servicio.Estado}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* BOTÓN INTELIGENTE */}
                  <button
                    className={`btn w-100 mt-3 ${
                      yaRegistrado ? "btn-secondary" : "btn-success"
                    }`}
                    disabled={yaRegistrado}
                    onClick={apuntarse}
                  >
                    {yaRegistrado
                      ? "✔ Ya estás registrado para este día"
                      : "🙋 Me apunto a servir este día"}
                  </button>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
