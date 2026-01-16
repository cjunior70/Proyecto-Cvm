import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Disponibilidad.css"; // 👈 CSS propio

export default function Disponibilidad() {
    //new data es para poder odtener la fecha actual del sistema 
  const [fecha, setFecha] = useState(new Date());

  // 🔹 SIMULACIÓN DE DATOS (luego viene de Supabase)
  const servicios = [
    { Fecha: "2026-01-10", Tipo: "Luces" },
    { Fecha: "2026-01-14", Tipo: "Sonido" },
    { Fecha: "2026-01-14", Tipo: "Luces" },
    { Fecha: "2026-01-15", Tipo: "Pantallas" },
    { Fecha: "2026-01-18", Tipo: "Cámaras" },
    { Fecha: "2026-01-28", Tipo: "Cámaras" },
  ];

  //Fecha actual del sistema y el .split es para filtar la fecha y los segundos
  const hoy = new Date().toISOString().split("T")[0];
  const fechaSeleccionadaISO = fecha.toISOString().split("T")[0];

  //Validar que un sercio este 
  const serviciosDelDia = servicios.filter(
    (s) => s.Fecha === fechaSeleccionadaISO
  );

  return (
    <>
      {/* PARTE SUPERIOR */}
      <section
        className="container py-3 text-center"
        style={{ height: "70%" }}
      >
        {/* FECHA ACTUAL */}
        <section className="mb-3">
          <h6 className="text-muted mb-1">
            {/* Muestra el dia actual */}
            {fecha.toLocaleDateString("es-ES", { weekday: "long" })}
          </h6>

          <h5 className="fw-bold">
            {/* Parte la fecha */}
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
            //tileClassName es una función especial que trae react-calendar.
            tileClassName={({ date }) => {
              //Fecha actual del sistema y el .split es para filtar la fecha y los segundos
              const iso = date.toISOString().split("T")[0];

              //.find() devuelve: el primer servicio que encuentre
              const tieneServicio = servicios.find(
                (s) => s.Fecha === iso
              );

              //null significa: “Calendario, deja ese día normal, no le pongas color”
              if (!tieneServicio) return null;

              //DECIDIR EL COLOR SEGÚN EL TIEMPO ( css )
              return iso < hoy
                ? "servicio-pasado"
                : "servicio-pendiente";
            }}
          />
        </section>
      </section>

      {/* PARTE INFERIOR */}
      <section style={{ height: "30%" }}>
        <section className="text-center m-2">
          <h6 className="text-muted mb-2">
            Servicios del día seleccionado
          </h6>
        </section>

        <section className="px-3">
          {serviciosDelDia.length === 0 ? (
            <p className="text-center text-muted">
              No hay servicios para este día
            </p>
          ) : (
            serviciosDelDia.map((s, i) => (
              <div
                key={i}
                className="border rounded p-2 mb-2 text-center"
              >
                <strong>{s.Tipo}</strong>
              </div>
            ))
          )}
        </section>
      </section>
    </>
  );
}
