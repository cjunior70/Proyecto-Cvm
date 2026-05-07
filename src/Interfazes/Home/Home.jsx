import React, { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import CartaCronograma from "../Componentes/CartaCronograma"; 
import Swal from "sweetalert2";

export default function Home() {
  const [proximoServicio, setProximoServicio] = useState([]);
  const [futurosServicios, setFuturosServicios] = useState([]);
  const [totalPendientes, setTotalPendientes] = useState(0);
  const [cargando, setCargando] = useState(true);
  
  const hoyFecha = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  });

  const cargarMiAgenda = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const miId = user.id;
      const hoyISO = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("Cronograma")
        .select(`
          IdServidorExtra,
          Servicio!inner ( *, Fecha ),
          Servidor_Area!inner (
            IdServidor,
            Aerea ( Nombre )
          )
        `)
        .gte("Servicio.Fecha", hoyISO);

      if (error) throw error;

      // Filtrado con validación de existencia
      const misAsignaciones = (data || []).filter(asig => 
        asig?.IdServidorExtra === miId || asig?.Servidor_Area?.IdServidor === miId
      );

      const mapeo = {};
      misAsignaciones.forEach(asig => {
        const s = asig?.Servicio;
        if (s && s.Id) {
          if (!mapeo[s.Id]) {
            mapeo[s.Id] = { ...s, Cronograma: [asig] };
          } else {
            mapeo[s.Id].Cronograma.push(asig);
          }
        }
      });

      const listaOrdenada = Object.values(mapeo).sort((a, b) => 
        new Date(a.Fecha) - new Date(b.Fecha)
      );

      if (listaOrdenada.length > 0) {
        setProximoServicio([listaOrdenada[0]]);
        setFuturosServicios(listaOrdenada.slice(1));
        setTotalPendientes(listaOrdenada.length);
      } else {
        setProximoServicio([]);
        setFuturosServicios([]);
        setTotalPendientes(0);
      }

    } catch (error) {
      console.error("Error cargando agenda:", error);
      Swal.fire("Error", "No se pudo cargar la agenda", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { 
    cargarMiAgenda(); 
  }, []);

  // Si está cargando, mostramos un spinner para que no se vea blanco
  if (cargando) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light pb-5">
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="bg-primary-subtle p-2 rounded-3" onClick={cargarMiAgenda} style={{cursor: 'pointer'}}>
            <i className="bi bi-arrow-clockwise text-primary fs-5"></i>
          </div>
          <span className="badge rounded-pill bg-glass py-2 px-3 fw-bold" style={{ fontSize: '11px' }}>
            {totalPendientes} PENDIENTES
          </span>
        </div>
        
        <div className="text-center">
          <h6 className="text-uppercase opacity-50 fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '2px' }}>
            {hoyFecha}
          </h6>
          <h2 className="fw-bold mb-0">Mi Agenda</h2>
          <p className="small opacity-75">Tus próximos pasos en el servicio</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-30px' }}>
        {totalPendientes === 0 ? (
          <div className="card border-0 shadow-sm rounded-5 py-5 px-4 text-center bg-white">
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
            <div className="col-12 mt-2 mb-1">
                <span className="badge bg-primary text-uppercase px-3 py-2 rounded-pill shadow-sm" style={{fontSize: '10px', letterSpacing: '1px'}}>
                   Servicio más próximo
                </span>
            </div>
            
            {proximoServicio.map((item) => (
              <div key={item.Id} className="col-12 animate__animated animate__fadeInUp">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden border-start border-primary border-4">
                  <CartaCronograma servicio={item} />
                </div>
              </div>
            ))}

            {futurosServicios.length > 0 && (
                <>
                    <div className="col-12 mt-4 mb-1 d-flex align-items-center">
                        <hr className="flex-grow-1 opacity-10" />
                        <span className="mx-3 text-muted text-uppercase fw-bold" style={{fontSize: '10px', letterSpacing: '1px'}}>
                            Siguientes servicios
                        </span>
                        <hr className="flex-grow-1 opacity-10" />
                    </div>
                    {futurosServicios.map((item) => (
                      <div key={item.Id} className="col-12 animate__animated animate__fadeInUp">
                          <div className="card border-0 shadow-sm rounded-4 overflow-hidden opacity-75">
                            <CartaCronograma servicio={item} />
                          </div>
                      </div>
                    ))}
                </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
        .bg-glass { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}