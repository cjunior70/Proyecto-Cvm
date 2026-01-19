import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Disponibilidad.css";

import { supabase } from "../../../Supabase/cliente";

export default function Disponibilidad() {
  // Fecha seleccionada
  const [fecha, setFecha] = useState(new Date());

  // Servicios del mes
  const [servicios, setServicios] = useState([]);

  // Fecha actual (YYYY-MM-DD)
  const hoy = new Date().toISOString().split("T")[0];

  // Fecha seleccionada en ISO
  const fechaSeleccionadaISO = fecha.toISOString().split("T")[0];
  
  //Funcion para poder enviar la disponibilidad del usuario
  const enviarDisponibilidad = async () => {
    try {
      console.log("Enviando información de disponibilidad");

        const { data, error } = await supabase
        .from("Disponbilidad")
        .insert([
          {
            IdServidor: "3ac87b43-5e97-4fb9-81fc-06a69feb7869",
            Fecha: fechaSeleccionadaISO,
          },
        ]);

      if (error) throw error;

      console.log("Disponibilidad registrada:", data);
      alert("✅ Te has apuntado correctamente");
    } catch (error) {
      console.error("Hubo un error al enviar la disponibilidad", error);
      alert("Una disculpa, parece que algo falló");
    }
  };


  // EFECTO: cargar servicios del mes actual
  useEffect(() => {
    const cargarServiciosMes = async () => {
      const inicioMes = new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        1
      ).toISOString().split("T")[0];

      const finMes = new Date(
        fecha.getFullYear(),
        fecha.getMonth() + 1,
      ).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("Servicio")
        .select("*")
        .gte("Fecha", inicioMes)
        .lte("Fecha", finMes)
        .order("Fecha", { ascending: true });

      if (error) {
        console.error("❌ Error cargando servicios:", error);
        return;
      }

      setServicios(data);
    };

    cargarServiciosMes();

  }, [fecha]); // 👈 se recarga si cambia el mes

  // 🔍 Servicios del día seleccionado
  const serviciosDelDia = servicios.filter(
    (s) => s.Fecha === fechaSeleccionadaISO
  );

  return (
    <>
      {/* ───────── PARTE SUPERIOR ───────── */}
      <section className="container py-3 text-center " style={{ height: "55%" }}>
        {/* FECHA ACTUAL */}
        <section className="mb-3">
          <h6 className="text-muted mb-1">
            {fecha.toLocaleDateString("es-ES", { weekday: "long" })}
          </h6>

          <h5 className="fw-bold">
            {fecha.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h5>
        </section>

        {/* CALENDARIO */}
        <section style={{ margin: "0 auto", maxWidth: "350px" }}>
          <Calendar
            value={fecha}
            onChange={setFecha}
            tileClassName={({ date }) => {
              const iso = date.toISOString().split("T")[0];

              const tieneServicio = servicios.find(
                (s) => s.Fecha === iso
              );

              if (!tieneServicio) return null;

              return iso < hoy
                ? "servicio-pasado"
                : "servicio-pendiente";
            }}
          />
        </section>
      </section>

      {/* ───────── PARTE INFERIOR ───────── */}
      <section style={{ height: "45%"}}>
        <section className="text-center m-2">
          <h6 className="text-muted mb-2">
            Servicios del día seleccionado
          </h6>
        </section>

        <section className="px-3 pb-3">
          {/* LISTA DE SERVICIOS */}
          {serviciosDelDia.length === 0 ? (
            <p className="text-center text-muted">
              No hay servicios para este día
            </p>
          ) : (
            serviciosDelDia.map((s) => (
              <div
                key={s.Id}
                className="border rounded-4 p-3 mb-2 text-center shadow-sm"
              >
                <strong className="fs-6">{s.Tipo}</strong>
                <div className="text-muted small mt-1">
                  {s.Jornada}
                </div>
              </div>
            ))
          )}

          {serviciosDelDia.length !== 0 && (
            <div className="mt-3">
              <button
                className="btn btn-dark w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2"
                style={{ fontSize: "1rem" }}
                onClick={enviarDisponibilidad}
              >
                🙋‍♂️ Me apunto a servir
              </button>
            </div>
          )}


          
        </section>
      </section>
    </>
  );
}
