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
    weekday: 'long', day: 'numeric', month: 'short' 
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
        const fechaProxima = listaOrdenada[0].Fecha;
        const serviciosDeEseDia = listaOrdenada.filter(s => s.Fecha === fechaProxima);
        const serviciosRestantes = listaOrdenada.filter(s => s.Fecha !== fechaProxima);

        setProximoServicio(serviciosDeEseDia);
        setFuturosServicios(serviciosRestantes);
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

  if (cargando) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
        <div className="spinner-border" style={{ color: "#6E4BDB" }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 pb-5 animate__animated animate__fadeIn" style={{ backgroundColor: "#F8FAFC" }}>
      
      {/* 🔮 COMPACT STICKY HEADER */}
      <div className="text-white px-3 py-3 rounded-bottom-4 shadow-sm sticky-top" 
           style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", zIndex: 1020 }}>
        <div className="container p-0">
          <div className="d-flex align-items-center justify-content-between">
            
            {/* Izquierda: Info de la Agenda */}
            <div>
              <h2 className="fw-bold m-0 text-capitalize" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
                Mi Agenda
              </h2>
              <p className="text-white-50 m-0 text-capitalize" style={{ fontSize: '10.5px', fontWeight: '500' }}>
                {hoyFecha}
              </p>
            </div>

            {/* Derecha: Botón Recargar + Badge compacto */}
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-sm text-white border-0 p-1.5 rounded-3 bg-white bg-opacity-10 d-flex align-items-center justify-content-center"
                      onClick={cargarMiAgenda} style={{ width: "32px", height: "32px" }}>
                <i className="bi bi-arrow-clockwise fs-5"></i>
              </button>
              <span className="badge rounded-pill py-1.5 px-2.5 fw-bold bg-white bg-opacity-15 text-white" 
                    style={{ fontSize: '9.5px', letterSpacing: '0.3px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {totalPendientes} PENDIENTES
              </span>
            </div>

          </div>
        </div>
      </div>

      <div className="container px-3 mt-3">
        {totalPendientes === 0 ? (
          /* STATE: COMPACTO CUANDO NO HAY SERVICIOS */
          <div className="card border-0 shadow-sm rounded-4 py-5 px-4 text-center bg-white mx-auto mt-4" style={{ maxWidth: '450px' }}>
            <div className="py-2">
              <div className="mb-2 fs-2">📭</div>
              <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>Todo al día, mi rey</h6>
              <p className="text-muted small m-0 mx-auto" style={{ maxWidth: '240px', fontSize: '11.5px' }}>
                No tienes servicios asignados en el cronograma por ahora.
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-2.5 justify-content-center">
            
            {/* 📌 SECCIÓN: PRÓXIMO SERVICIO */}
            <div className="col-12 mt-1 mb-1" style={{ maxWidth: '480px' }}>
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.8px' }}>
                ⚡ Siguiente Turno
              </span>
            </div>
            
            {proximoServicio.map((item) => (
              <div key={item.Id} className="col-12 animate__animated animate__fadeInUp" style={{ maxWidth: '480px' }}>
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative bg-white"
                     style={{ borderLeft: '4px solid #6E4BDB !important' }}>
                  <CartaCronograma servicio={item} />
                </div>
              </div>
            ))}

            {/* 📅 SECCIÓN: FUTUROS SERVICIOS */}
            {futurosServicios.length > 0 && (
              <>
                <div className="col-12 mt-3.5 mb-1 d-flex align-items-center" style={{ maxWidth: '480px' }}>
                  <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.8px' }}>
                    🗓️ Próximas Fechas
                  </span>
                  <hr className="flex-grow-1 opacity-10 ms-2 my-0" style={{ color: '#94A3B8' }} />
                </div>
                
                {futurosServicios.map((item) => (
                  <div key={item.Id} className="col-12 animate__animated animate__fadeInUp" style={{ maxWidth: '480px' }}>
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" 
                         style={{ opacity: 0.9, border: '1px solid #F1F5F9' }}>
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
        .rounded-bottom-4 { border-bottom-left-radius: 18px !important; border-bottom-right-radius: 18px !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}