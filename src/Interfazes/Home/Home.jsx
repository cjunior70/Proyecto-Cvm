import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import CartaCronograma from "../Componentes/CartaCronograma";

export default function Home() {
  const [proximoServicio, setProximoServicio] = useState([]); // El grupo más cercano
  const [futurosServicios, setFuturosServicios] = useState([]); // El resto del mes
  const [totalPendientes, setTotalPendientes] = useState(0);
  const [carga, setcarga] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

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
        .order("Id", { ascending: true }); 

      if (error) throw error;

      const misAsignaciones = data?.filter(
        (item) => item.Servidor_Area?.IdServidor === idServidorActual
      ) || [];

      setTotalPendientes(misAsignaciones.length);

      if (misAsignaciones.length > 0) {
        // Ordenamos por fecha para asegurar que el primero sea el más cercano
        const ordenados = [...misAsignaciones].sort((a, b) => 
            new Date(a.Servicio.Fecha) - new Date(b.Servicio.Fecha)
        );

        const fechaMasCercana = ordenados[0].Servicio.Fecha;

        // Separamos: Los que son de la fecha más próxima vs los demás
        const masProximos = ordenados.filter(item => item.Servicio.Fecha === fechaMasCercana);
        const restantes = ordenados.filter(item => item.Servicio.Fecha !== fechaMasCercana);

        setProximoServicio(masProximos);
        setFuturosServicios(restantes);
      } else {
        setProximoServicio([]);
        setFuturosServicios([]);
      }

    } catch (error) {
      console.error("❌ Error inesperado:", error);
    } finally {
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

  if (!carga) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary mb-2" />
        <p className="text-muted fw-bold">Buscando tus servicios...</p>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light pb-5">
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="bg-primary-subtle p-2 rounded-3">
            <i className="bi bi-bell-fill text-primary fs-5"></i>
          </div>
          <span className="badge rounded-pill bg-glass py-2 px-3 fw-bold" style={{ fontSize: '11px' }}>
            {totalPendientes} PENDIENTES
          </span>
        </div>
        
        <div className="text-center">
          <h6 className="text-uppercase opacity-50 fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '2px' }}>
            {hoy}
          </h6>
          <h2 className="fw-bold mb-0">Mi Agenda</h2>
          <p className="small opacity-75">Tus próximos pasos en el servicio</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-30px' }}>
        {totalPendientes === 0 ? (
          <div className="card border-0 shadow-sm rounded-5 py-5 px-4 text-center bg-white animate__animated animate__fadeIn">
            <div className="py-4">
              <div className="mb-3 display-4 opacity-25">📭</div>
              <h5 className="fw-bold text-dark">Todo al día</h5>
              <p className="text-muted small mx-auto" style={{ maxWidth: '250px' }}>
                No tienes servicios asignados por ahora.
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            
            {/* SECCIÓN: SERVICIO MÁS PRÓXIMO */}
            <div className="col-12 mt-2 mb-1">
                <span className="badge bg-primary text-uppercase px-3 py-2 rounded-pill shadow-sm" style={{fontSize: '10px', letterSpacing: '1px'}}>
                   Servicio más próximo
                </span>
            </div>
            {proximoServicio.map((item, index) => (
              <div key={item.Id} className="col-12 animate__animated animate__fadeInUp">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden border-start border-primary border-4">
                  <CartaCronograma servicio={item} onClick={() => setServicioSeleccionado(item)} />
                </div>
              </div>
            ))}

            {/* SECCIÓN: RESTO DEL MES (Si existen) */}
            {futurosServicios.length > 0 && (
                <>
                    <div className="col-12 mt-4 mb-1 d-flex align-items-center">
                        <hr className="flex-grow-1 opacity-10" />
                        <span className="mx-3 text-muted text-uppercase fw-bold" style={{fontSize: '10px', letterSpacing: '1px'}}>
                            Siguientes servicios
                        </span>
                        <hr className="flex-grow-1 opacity-10" />
                    </div>
                    {futurosServicios.map((item, index) => (
                    <div key={item.Id} className="col-12 animate__animated animate__fadeInUp">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden opacity-75">
                        <CartaCronograma servicio={item} onClick={() => setServicioSeleccionado(item)} />
                        </div>
                    </div>
                    ))}
                </>
            )}
          </div>
        )}

        <div className="text-center mt-5">
          <div className="p-3 rounded-4 bg-primary-subtle d-inline-block">
              <small className="text-primary fw-bold">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Llega 30 minutos antes de tu servicio
              </small>
          </div>
        </div>
      </div>

      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
        .bg-glass { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        
        /* SOLUCIÓN AL NOMBRE LARGO: Agrega esto para que el área no empuje el diseño */
        .text-truncate-area {
            display: inline-block;
            max-width: 150px; /* Ajusta según tu necesidad */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
        }
      `}</style>
    </div>
  );
}