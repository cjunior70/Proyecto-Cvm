import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import CartaCronograma from "../Componentes/CartaCronograma";

export default function Home() {
  const [cronogramas, setCronogramas] = useState([]);
  const [carga, setcarga] = useState(false); // Iniciamos en false
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  // Fecha de hoy formateada
  const hoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cargarProximoServicio = async (idServidorActual) => {
    try {
      if (!idServidorActual) {
        setcarga(true);
        return;
      }

      // Traemos el cronograma con relaciones
      const { data, error } = await supabase
        .from("Cronograma")
        .select(`
          Id,
          Servicio ( Fecha, Jornada ),
          Servidor_Area (
            IdServidor,
            Aerea ( Nombre )
          )
        `)
        .order("Id", { ascending: true }); // Orden simple

      if (error) throw error;

      // 1. Filtrar solo los servicios del usuario actual
      const misAsignaciones = data?.filter(
        (item) => item.Servidor_Area?.IdServidor === idServidorActual
      ) || [];

      if (misAsignaciones.length > 0) {
        // 2. Obtener la fecha del primer servicio disponible (el más próximo)
        // Nota: Si quieres el más próximo real, podrías ordenar por fecha en JS
        const fechaProxima = misAsignaciones[0].Servicio.Fecha;

        // 3. Filtrar todos los servicios que caigan en esa misma fecha próxima
        const serviciosDelDia = misAsignaciones.filter(
          (item) => item.Servicio.Fecha === fechaProxima
        );

        setCronogramas(serviciosDelDia);
      } else {
        setCronogramas([]); // No tiene servicios
      }

    } catch (error) {
      console.error("❌ Error inesperado:", error);
      alert("Ocurrió un error al cargar tus servicios.");
    } finally {
      // ESTO ES CLAVE: Se ejecuta siempre, haya datos o no.
      setcarga(true);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setcarga(true);
        return;
      }
      await cargarProximoServicio(user.id);
    };
    init();
  }, []);

  // Pantalla de carga (Spinner)
  if (!carga) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary mb-2" />
        <p className="text-muted fw-bold">Buscando tus servicios...</p>
      </div>
    );
  }

  return (
    <div className="container py-3">
      {/* FECHA ACTUAL */}
      <h5 className="fw-bold text-center text-capitalize mb-1">
        {hoy}
      </h5>

      <h4 className="fw-bold text-center mb-3">
        🔔 Mis Próximos Servicios 
      </h4>

      <hr />

      {/* MENSAJE SI NO HAY SERVICIOS */}
      {cronogramas.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3" style={{ fontSize: "3rem" }}>📭</div>
          <h5 className="text-muted">No tienes servicios asignados</h5>
          <p className="small text-secondary">
            Cuando seas asignado a un cronograma, aparecerá aquí.
          </p>
        </div>
      ) : (
        /* LISTADO DE SERVICIOS */
        <div className="row g-3">
          {cronogramas.map((item) => (
            <div key={item.Id} className="col-12">
              <CartaCronograma
                servicio={item}
                onClick={() => setServicioSeleccionado(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}