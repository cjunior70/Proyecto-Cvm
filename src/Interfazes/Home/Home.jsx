import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import CartaCronograma from "../Componentes/CartaCronograma";
import { Alert } from "bootstrap";

export default function Home() {
  const [cronogramas, setCronogramas] = useState([]);
  const [fechaServicio, setFechaServicio] = useState(null);
  const [carga, setcarga] = useState(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  const hoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cargarProximoServicio = async (idServidorActual) => {
   try{
         if (!idServidorActual) return;

      const { data, error } = await supabase
        .from("Cronograma")
        .select(`
          Id,
          Servicio (
            Fecha,
            Jornada
          ),
          Servidor_Area (
            IdServidor,
            Aerea (
              Nombre
            )
          )
        `)
        .order("Servicio(Fecha)", { ascending: true });

      if (error) {
        console.error("❌ Error cargando cronograma:", error);
        return;
      }

      if (!data || data.length === 0) return;

      // 🔥 Filtrar SOLO servicios del servidor logueado
      const delServidor = data.filter(
        (item) => item.Servidor_Area?.IdServidor === idServidorActual
      );

      if (delServidor.length === 0) return;

      // 🔥 Fecha del servicio más próximo
      const fecha = delServidor[0].Servicio.Fecha;
      setFechaServicio(fecha);

      // 🔥 Servicios SOLO de ese día
      const serviciosDelDia = delServidor.filter(
        (item) => item.Servicio.Fecha === fecha
      );

      setCronogramas(serviciosDelDia);
      setcarga(true);
   }catch(error){
      console.log("Ocurrio un Error inesperado",error);
      Alert("Ocurrio un Error inesperado, Intentelo mas tarde o hable con el progrador");
   }
  };

  useEffect(() => {
  const init = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("❌ Error obteniendo usuario:", error);
      return;
    }

    const userId = data.user.id;

    // ✅ Usar el ID DIRECTAMENTE
    await cargarProximoServicio(userId);
  };

  init();
}, []);

  if (!carga) {
    return (
      <section className="text-center py-5">
        <span className="spinner-border" />
      </section>
    );
  }

  return (
    <div className="container py-3">

      {/* FECHA ACTUAL */}
      <h5 className="fw-bold text-center text-capitalize">
        {hoy}
      </h5>

      <h4 className="fw-bold text-center mb-1">
        🔔 Mis Próximos Servicios 
      </h4>

      <hr />

      {/* SERVICIOS */}
      {cronogramas.length === 0 && (
        <p className="text-center text-muted">
          No tienes servicios asignados
        </p>
      )}

      {cronogramas.map((item) => (
        <CartaCronograma
          key={item.Id}
          servicio={item}
          onClick={() => setServicioSeleccionado(item)}
        />
      ))}

      {/* MODAL */}
      {servicioSeleccionado && (
        <ModalServicio
          servicio={servicioSeleccionado}
          onClose={() => setServicioSeleccionado(null)}
        />
      )}
    </div>
  );
}
