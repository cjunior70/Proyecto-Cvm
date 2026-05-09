import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

export default function DisponibilidadLibreControlada() {
  const [serviciosPorDia, setServiciosPorDia] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [infoApertura, setInfoApertura] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();

  // Validación de acceso global
  const verificarAccesoGlobal = useCallback((control) => {
    if (!control) return false;
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    const dentroDelRango = hoyStr >= control.Fecha_apertura && hoyStr <= control.Fecha_cierre;
    const esDiaEspecial = control.Fecha_especifica && hoyStr === control.Fecha_especifica;

    return dentroDelRango || esDiaEspecial;
  }, []);

  const inicializar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: control } = await supabase
        .from("Control_Disponibilidad")
        .select("*")
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const tieneAcceso = verificarAccesoGlobal(control);
      setInfoApertura(control);
      setEstaAbierto(tieneAcceso);

      const hoy = new Date();
      let fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      if (hoy.getDate() >= 27) fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
      const inicioStr = fechaInicio.toISOString().split('T')[0];
      const finMesStr = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0).toISOString().split('T')[0];

      const [servResp, userResp] = await Promise.all([
        supabase.from("Servicio").select("*").gte("Fecha", inicioStr).lte("Fecha", finMesStr).order("Fecha"),
        supabase.from("Disponbilidad").select("Fecha, Jornada").eq("IdServidor", user.id).gte("Fecha", inicioStr)
      ]);

      const mapDias = {};
      (servResp.data || []).forEach(s => {
        if (!mapDias[s.Fecha]) mapDias[s.Fecha] = { fecha: s.Fecha, servicios: [] };
        mapDias[s.Fecha].servicios.push(s);
      });

      setServiciosPorDia(Object.values(mapDias));
      setSeleccionados(new Set(userResp.data?.map(d => `${d.Fecha}|${d.Jornada}`)));
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  }, [verificarAccesoGlobal]);

  useEffect(() => { inicializar(); }, [inicializar]);

  // Lógica de bloqueo por Fecha_especifica
  const toggleServicio = (fecha, jornada) => {
    if (!estaAbierto) return;

    // Si hay una fecha específica, BLOQUEAMOS cualquier otra que no sea esa
    if (infoApertura?.Fecha_especifica && fecha !== infoApertura.Fecha_especifica) {
      return Swal.fire({
        title: 'Día no habilitado',
        text: `Actualmente solo se permite edición para el día ${infoApertura.Fecha_especifica}.`,
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });
    }

    const key = `${fecha}|${jornada}`;
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(key)) nuevo.delete(key);
      else nuevo.add(key);
      return nuevo;
    });
  };

  const confirmarGuardado = () => {
    if (seleccionados.size === 0) return Swal.fire('Atención', 'Selecciona al menos un servicio.', 'warning');

    Swal.fire({
      title: '¿Confirmar selección?',
      text: `Te apuntarás en ${seleccionados.size} servicio(s).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#000',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) ejecutarGuardado();
    });
  };

  const ejecutarGuardado = async () => {
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hoy = new Date();
      const inicioPeriodo = new Date(hoy.getFullYear(), hoy.getMonth() + (hoy.getDate() >= 27 ? 1 : 0), 1).toISOString().split('T')[0];

      // Borramos lo anterior para que el servidor se vuelva libre
      await supabase.from("Disponbilidad").delete().eq("IdServidor", user.id).gte("Fecha", inicioPeriodo);

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

  if (loading) return <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white"><div className="spinner-border text-dark"></div></div>;

  return (
    <div className="min-vh-100 bg-light">
      <div className={`border-bottom shadow-sm p-3 pb-4 rounded-bottom-5 sticky-top ${estaAbierto ? 'bg-white text-dark' : 'bg-secondary text-white'}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="bg-light p-2 rounded-3 shadow-sm" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
            <i className="bi bi-arrow-left text-dark fs-5"></i>
          </div>
          <span className={`badge rounded-pill py-2 px-3 fw-bold shadow-sm ${estaAbierto ? 'bg-dark text-white' : 'bg-warning text-dark'}`}>
            {estaAbierto ? `${seleccionados.size} SELECCIONADOS` : 'MODO CONSULTA'}
          </span>
        </div>
        <div className="text-center">
          <h2 className="fw-black mb-0" style={{ fontSize: '1.8rem', letterSpacing: '-1.5px' }}>
            {estaAbierto ? (infoApertura?.Fecha_especifica ? 'Apertura Especial' : 'Elegir Servicios') : `Agenda - ${infoApertura?.Mes}`}
          </h2>
          {infoApertura?.Fecha_especifica && estaAbierto && (
            <p className="small text-danger fw-bold mb-0">Solo habilitado para el día: {infoApertura.Fecha_especifica}</p>
          )}
        </div>
      </div>

      <div className="container px-3 mt-3 pb-5">
        <div className="row g-3">
          {serviciosPorDia.map((dia) => {
            const dateObj = new Date(dia.fecha + "T00:00:00");
            // Determinamos si este día en particular está bloqueado por la Fecha_especifica
            const esDiaBloqueado = infoApertura?.Fecha_especifica && dia.fecha !== infoApertura.Fecha_especifica;
            
            return (
              <div className="col-12" key={dia.fecha}>
                <div className={`card border-0 shadow-sm rounded-4 overflow-hidden ${(esDiaBloqueado || !estaAbierto) ? 'opacity-50' : ''}`}>
                  <div className={`${(esDiaBloqueado || !estaAbierto) ? 'bg-secondary' : 'bg-dark'} text-white p-3 d-flex align-items-center gap-3`}>
                    <span className="fs-2 fw-black">{dateObj.getDate()}</span>
                    <div className="lh-1">
                      <div className="small fw-bold text-uppercase opacity-50">{dateObj.toLocaleDateString('es', { month: 'short' })}</div>
                      <div className="small fw-bold text-capitalize">{dateObj.toLocaleDateString('es', { weekday: 'long' })}</div>
                    </div>
                    {esDiaBloqueado && estaAbierto && (
                      <div className="ms-auto badge bg-light text-dark opacity-75">BLOQUEADO</div>
                    )}
                  </div>
                  
                  <div className="list-group list-group-flush">
                    {dia.servicios.map((serv, idx) => {
                      const isSelected = seleccionados.has(`${serv.Fecha}|${serv.Jornada}`);
                      const interactuable = estaAbierto && !esDiaBloqueado;

                      return (
                        <div 
                          key={idx}
                          onClick={() => toggleServicio(serv.Fecha, serv.Jornada)}
                          className={`list-group-item d-flex align-items-center justify-content-between p-3 border-0 ${isSelected ? 'bg-success bg-opacity-10' : ''}`}
                          style={{ 
                            cursor: interactuable ? 'pointer' : 'default',
                            borderLeft: isSelected ? '6px solid #198754' : '6px solid transparent' 
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${isSelected ? 'bg-success text-white' : 'bg-light border'}`} style={{ width: '36px', height: '36px' }}>
                              <i className={`bi ${isSelected ? 'bi-check-lg' : 'bi-dash-lg'} fs-5`}></i>
                            </div>
                            <div>
                              <div className="fw-black text-black" style={{ fontSize: '0.95rem' }}>{serv.Tipo}</div>
                              <div className="small text-muted fw-bold"><i className="bi bi-clock me-1"></i> {serv.Jornada}</div>
                            </div>
                          </div>
                          <div className="text-end">
                            <span 
                              className={`fw-black px-3 py-1 rounded-3 shadow-sm ${isSelected ? 'bg-success text-white' : (serv.Jornada.toUpperCase().includes('A') ? 'bg-warning text-dark' : 'bg-info text-white')}`} 
                              style={{ fontSize: '1.5rem', letterSpacing: '-1.5px', opacity: isSelected ? 1 : 0.4 }}
                            >
                              {serv.Jornada.toUpperCase().includes('A') ? 'AM' : 'PM'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {estaAbierto && (
        <div className="fixed-bottom p-3 d-flex justify-content-center bg-white bg-opacity-75 border-top" style={{ bottom: '75px', backdropFilter: 'blur(8px)' }}>
          <button 
            onClick={confirmarGuardado}
            disabled={guardando}
            className="btn btn-dark w-100 rounded-pill fw-black py-3 shadow-lg"
            style={{ maxWidth: '450px', backgroundColor: '#000' }}
          >
            {guardando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-upload-fill me-2"></i>}
            GUARDAR DISPONIBILIDAD
          </button>
        </div>
      )}

      <style>{`
        .fw-black { font-weight: 900 !important; }
        .rounded-bottom-5 { border-bottom-left-radius: 35px !important; border-bottom-right-radius: 35px !important; }
        .container { padding-bottom: ${estaAbierto ? '180px' : '100px'}; }
      `}</style>
    </div>
  );
}