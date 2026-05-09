import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

export default function DisponibilidadCompacta() {
  const [serviciosAgrupados, setServiciosAgrupados] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [reglasAcceso, setReglasAcceso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();

  const inicializar = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hoy = new Date();
      const diaActual = hoy.getDate();
      
      let fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      if (diaActual >= 27) fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
      
      const fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0);
      const inicioStr = fechaInicio.toISOString().split('T')[0];
      const finStr = fechaFin.toISOString().split('T')[0];

      const [servResp, reglResp, userResp] = await Promise.all([
        supabase.from("Servicio").select("Fecha, Jornada, Tipo, Comentario").gte("Fecha", inicioStr).lte("Fecha", finStr).order("Fecha"),
        supabase.from("Control_Disponibilidad").select("*"),
        supabase.from("Disponbilidad").select("Fecha, Jornada").eq("IdServidor", user.id).gte("Fecha", inicioStr)
      ]);

      const grupos = {};
      (servResp.data || []).forEach(s => {
        const bloqueGeneral = s.Jornada?.toUpperCase().includes('A') ? 'AM' : 'PM';
        const key = `${s.Fecha}|${bloqueGeneral}`;
        if (!grupos[key]) grupos[key] = { fecha: s.Fecha, bloque: bloqueGeneral, items: [] };
        grupos[key].items.push({ jornadaReal: s.Jornada, tipo: s.Tipo, comentario: s.Comentario });
      });

      setServiciosAgrupados(Object.values(grupos));
      setReglasAcceso(reglResp.data || []);
      setSeleccionados(new Set(userResp.data?.map(d => `${d.Fecha}|${d.Jornada}`)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmarGuardado = () => {
    Swal.fire({
      title: 'Guardar cambios?',
      text: `Registrarás ${seleccionados.size} turnos, una vez guardes no podras salirte, listo para la aventura ¿?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#000000',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cerrar'
    }).then((result) => {
      if (result.isConfirmed) ejecutarGuardado();
    });
  };

  const ejecutarGuardado = async () => {
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth() + (hoy.getDate() >= 27 ? 1 : 0), 1).toISOString().split('T')[0];
      await supabase.from("Disponbilidad").delete().eq("IdServidor", user.id).gte("Fecha", inicioMes);
      const payload = Array.from(seleccionados).map(item => {
        const [fecha, jornada] = item.split('|');
        return {
          IdServidor: user.id,
          Fecha: fecha,
          Jornada: jornada,
          Dia: new Date(fecha + "T00:00:00").toLocaleDateString('es', { weekday: 'long' })
        };
      });
      if (payload.length > 0) {
        const { error } = await supabase.from("Disponbilidad").insert(payload);
        if (error) throw error;
      }
      Swal.fire({ icon: 'success', title: '¡Guardado!', showConfirmButton: false, timer: 1500 });
      setTimeout(() => navigate(-1), 1500);
    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const toggleSeleccion = (key) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(key)) nuevo.delete(key);
      else nuevo.add(key);
      return nuevo;
    });
  };

  useEffect(() => { inicializar(); }, [inicializar]);

  if (loading) return <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white"><div className="spinner-border text-dark"></div></div>;

  return (
    <div className="min-vh-100 bg-light">
      {/* HEADER COMPACTO - SIN ESPACIOS EXTRAS ARRIBA */}
      {/* HEADER ACTUALIZADO Y COMPACTO */}
<div className="bg-white border-bottom shadow-sm p-3 pb-4 rounded-bottom-5">
  <div className="d-flex justify-content-between align-items-center mb-3">
    {/* Botón de Recargar/Regresar */}
    <div 
      className="bg-light p-2 rounded-3 shadow-sm" 
      onClick={() => window.location.reload()} 
      style={{ cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <i className="bi bi-arrow-clockwise text-dark fs-5"></i>
    </div>

    {/* Badge de Conteo */}
    <span className="badge rounded-pill bg-dark py-2 px-3 fw-bold shadow-sm" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
      {seleccionados.size} MARCADO(S)
    </span>
  </div>
  
  <div className="text-center">
    {/* Título Negro Sólido y Compacto */}
    <h2 className="fw-black text-black mb-0" style={{ fontSize: '1.8rem', letterSpacing: '-1.5px' }}>
      Mi Disponibilidad
    </h2>
    <p className="small text-muted fw-bold mb-0 opacity-75">Tus próximos pasos en el servicio</p>
  </div>
</div>

      {/* CONTENEDOR CON MARGEN SUPERIOR MÍNIMO */}
      <div className="container px-3 mt-3">
        <div className="row g-2">
          {serviciosAgrupados.map((grupo) => {
            const key = `${grupo.fecha}|${grupo.bloque}`;
            const isSelected = seleccionados.has(key);
            const dateObj = new Date(grupo.fecha + "T00:00:00");

            return (
              <div className="col-12 col-md-6" key={key}>
                <div 
                  onClick={() => toggleSeleccion(key)}
                  className={`card border-0 rounded-3 transition-all ${isSelected ? 'bg-success text-white shadow' : 'bg-white text-dark shadow-sm'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body py-2 px-3 d-flex gap-3">
                    <div className="text-center border-end pe-3 d-flex flex-column justify-content-center" style={{ minWidth: '55px' }}>
                      <div className="fw-black text-black fs-4" style={{lineHeight: 1}}>{dateObj.getDate()}</div>
                      <div className="small text-capitalize fw-bold" style={{fontSize: '0.7rem'}}>{dateObj.toLocaleDateString('es', { weekday: 'short' })}</div>
                      <span className={`badge ${grupo.bloque === 'AM' ? 'bg-warning text-dark' : 'bg-info text-white'}`} style={{fontSize: '0.6rem'}}>
                           {grupo.bloque}
                        </span>
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex flex-column gap-1">
                        {grupo.items.map((item, i) => (
                          <div key={i} className="small">
                            <span className="fw-black text-dark opacity-50 me-1" style={{ fontSize: '0.65rem' }}>{item.jornadaReal}:</span>
                            <span className="fw-bold">{item.tipo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTÓN FLOTANTE NEGRO */}
      <div className="fixed-bottom p-3 d-flex justify-content-center" style={{ bottom: '75px' }}>
        <button 
          onClick={confirmarGuardado}
          disabled={guardando}
          className="btn btn-dark w-100 rounded-pill fw-black py-3 shadow-lg"
          style={{ maxWidth: '400px', backgroundColor: '#000', border: 'none' }}
        >
          {guardando ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
          GUARDAR DISPONIBILIDAD
        </button>
      </div>

      <style>{`
        .bg-light { background-color: #f8f9fa !important; }
        .fw-black { font-weight: 900 !important; }
        .text-black { color: #000 !important; }
        .container { padding-bottom: 160px; }
        .transition-all { transition: transform 0.1s ease-in-out; }
        .transition-all:active { transform: scale(0.97); }
        .animate-pop { animation: pop 0.2s ease-out; }
        @keyframes pop { from { scale: 0.5; } to { scale: 1; } }
        .rounded-bottom-5 { 
          border-bottom-left-radius: 30px !important; 
          border-bottom-right-radius: 30px !important; 
        }
        .fw-black { font-weight: 900 !important; }
        .text-black { color: #000 !important; }
      `}</style>

    </div>
  );
}