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
    const hoyStr = hoy.toISOString().split("T")[0];

    const dentroDelRango =
      hoyStr >= control.Fecha_apertura && hoyStr <= control.Fecha_cierre;
    const esDiaEspecial =
      control.Fecha_especifica && hoyStr === control.Fecha_especifica;

    return dentroDelRango || esDiaEspecial;
  }, []);

  const inicializar = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: control } = await supabase
        .from("Control_Disponibilidad")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const tieneAcceso = verificarAccesoGlobal(control);
      setInfoApertura(control);
      setEstaAbierto(tieneAcceso);

      const hoy = new Date();
      let fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      if (hoy.getDate() >= 27)
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
      const inicioStr = fechaInicio.toISOString().split("T")[0];
      const finMesStr = new Date(
        fechaInicio.getFullYear(),
        fechaInicio.getMonth() + 1,
        0,
      )
        .toISOString()
        .split("T")[0];

      const [servResp, userResp] = await Promise.all([
        supabase
          .from("Servicio")
          .select("*")
          .gte("Fecha", inicioStr)
          .lte("Fecha", finMesStr)
          .order("Fecha"),
        supabase
          .from("Disponbilidad")
          .select("Fecha, Jornada")
          .eq("IdServidor", user.id)
          .gte("Fecha", inicioStr),
      ]);

      const mapDias = {};
      (servResp.data || []).forEach((s) => {
        if (!mapDias[s.Fecha])
          mapDias[s.Fecha] = { fecha: s.Fecha, servicios: [] };
        mapDias[s.Fecha].servicios.push(s);
      });

      setServiciosPorDia(Object.values(mapDias));
      setSeleccionados(
        new Set(userResp.data?.map((d) => `${d.Fecha}|${d.Jornada}`)),
      );
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  }, [verificarAccesoGlobal]);

  useEffect(() => {
    inicializar();
  }, [inicializar]);

  const toggleServicio = (fecha, jornada) => {
    if (!estaAbierto) return;

    if (
      infoApertura?.Fecha_especifica &&
      fecha !== infoApertura.Fecha_especifica
    ) {
      return Swal.fire({
        title: "Día no habilitado",
        text: `Actualmente solo se permite edición para el día ${infoApertura.Fecha_especifica}.`,
        icon: "info",
        confirmButtonColor: "#6E4BDB",
      });
    }

    const key = `${fecha}|${jornada}`;
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(key)) nuevo.delete(key);
      else nuevo.add(key);
      return nuevo;
    });
  };

  const confirmarGuardado = () => {
    if (seleccionados.size === 0) {
      return Swal.fire({
        title: "Atención",
        text: "Selecciona al menos un turno para guardar.",
        icon: "warning",
        confirmButtonColor: "#6E4BDB",
      });
    }

    Swal.fire({
      title: "¿Confirmar Selección?",
      text: `Te postularás para servir en ${seleccionados.size} jornada(s).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6E4BDB",
      cancelButtonColor: "#718096",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Revisar",
    }).then((result) => {
      if (result.isConfirmed) ejecutarGuardado();
    });
  };

  const ejecutarGuardado = async () => {
    setGuardando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const hoy = new Date();
      const inicioPeriodo = new Date(
        hoy.getFullYear(),
        hoy.getMonth() + (hoy.getDate() >= 27 ? 1 : 0),
        1,
      )
        .toISOString()
        .split("T")[0];

      await supabase
        .from("Disponbilidad")
        .delete()
        .eq("IdServidor", user.id)
        .gte("Fecha", inicioPeriodo);

      const payload = Array.from(seleccionados).map((item) => {
        const [fecha, jornada] = item.split("|");
        return {
          IdServidor: user.id,
          Fecha: fecha,
          Jornada: jornada,
          Dia: new Date(fecha + "T00:00:00").toLocaleDateString("es", {
            weekday: "long",
          }),
        };
      });

      if (payload.length > 0) {
        const { error } = await supabase.from("Disponbilidad").insert(payload);
        if (error) throw error;
      }

      Swal.fire({
        icon: "success",
        title: "¡Registrado con éxito!",
        text: "Tu disponibilidad ha sido actualizada.",
        showConfirmButton: false,
        timer: 1500,
      });
      setTimeout(() => navigate(-1), 1500);
    } catch (e) {
      Swal.fire("Error al guardar", e.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  if (loading)
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
        <div className="spinner-border" style={{ color: "#6E4BDB" }}></div>
      </div>
    );

  return (
    <div
      className="min-vh-100 pb-5 animate__animated animate__fadeIn"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      {/* 🔮 COMPACT STICKY HEADER */}
      <div
        className="text-white px-3 py-3 rounded-bottom-4 shadow-sm sticky-top"
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          zIndex: 1020,
        }}
      >
        <div className="container p-0">
          <div className="d-flex align-items-center justify-content-between">
            {/* Izquierda: Botón Volver e Info compacta */}
            <div className="d-flex align-items-center gap-2.5">
              <button
                className="btn btn-sm btn-light rounded-3 bg-white bg-opacity-10 text-white border-0 p-2"
                onClick={() => navigate(-1)}
                style={{
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="bi bi-arrow-left fs-5"></i>
              </button>
              <div>
                <h2
                  className="fw-bold m-0"
                  style={{ fontSize: "1.2rem", letterSpacing: "-0.5px" }}
                >
                  {infoApertura?.Fecha_especifica && estaAbierto
                    ? "Convocatoria Esp."
                    : "Mis Turnos"}
                </h2>
                <p className="text-white-50 m-0" style={{ fontSize: "10px" }}>
                  {infoApertura?.Mes || "Servicio"}
                </p>
              </div>
            </div>

            {/* Derecha: Badge de Estado */}
            <span
              className={`badge rounded-pill py-1.5 px-2.5 fw-bold ${estaAbierto ? "bg-success text-white" : "bg-warning text-dark"}`}
              style={{ fontSize: "9px", letterSpacing: "0.3px" }}
            >
              <i
                className={`bi ${estaAbierto ? "bi-unlock-fill" : "bi-lock-fill"} me-1`}
              ></i>
              {estaAbierto ? `${seleccionados.size} REGS` : "CONSULTA"}
            </span>
          </div>
        </div>
      </div>

      <div className="container px-3 mt-3">
        {/* 🚨 BANNER INFORMATIVO REFINADO Y DISCRETO */}
        <div
          className={`card border-0 shadow-sm rounded-3 mb-3 p-2.5 ${estaAbierto ? "border-start border-primary-subtle" : "border-start border-secondary"} border-3`}
          style={{ backgroundColor: estaAbierto ? "#F5F3FF" : "#F1F5F9" }}
        >
          <div className="d-flex align-items-start gap-2">
            <span style={{ fontSize: "14px", marginTop: "2px" }}>
              {estaAbierto ? "📅" : "💡"}
            </span>
            <div className="lh-sm">
              <p className="text-muted m-0" style={{ fontSize: "11.5px" }}>
                {estaAbierto
                  ? infoApertura?.Fecha_especifica
                    ? `Solo habilitado para el día especial ${infoApertura.Fecha_especifica}.`
                    : "Toca los horarios que tengas disponibles para marcar asistencia."
                  : "Modo lectura. La postulación de este mes se encuentra cerrada."}
              </p>
            </div>
          </div>
        </div>

        {/* 🗓️ LISTADO DE DÍAS EN TARJETAS INDEPENDIENTES */}
<div className="row g-3">
  {serviciosPorDia.map((dia) => {
    const dateObj = new Date(dia.fecha + "T00:00:00");
    const esDiaBloqueado = infoApertura?.Fecha_especifica && dia.fecha !== infoApertura.Fecha_especifica;
    const deshabilitado = esDiaBloqueado || !estaAbierto;

    return (
      <div className="col-12" key={dia.fecha}>
        {/* Cada día es una tarjeta única con sombra y bordes finos */}
        <div 
          className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mx-auto"
          style={{ 
            maxWidth: '480px',
            border: '1px solid #E2E8F0 !important',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          
          {/* Encabezado de la Tarjeta del Día */}
          <div className="px-3 py-2.5 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
            <div className="d-flex align-items-center gap-2">
              {/* Número del día destacado */}
              <span className="fw-black text-dark" style={{ fontSize: '1.25rem', color: '#1E293B' }}>
                {dateObj.getDate()}
              </span>
              {/* Texto de día y mes */}
              <div className="d-flex flex-column lh-1">
                <span className="fw-bold text-capitalize text-dark" style={{ fontSize: '13px' }}>
                  {dateObj.toLocaleDateString('es', { weekday: 'long' })}
                </span>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                  {dateObj.toLocaleDateString('es', { month: 'short' })}
                </span>
              </div>
            </div>

            {/* Badge de bloqueo si aplica */}
            {esDiaBloqueado && estaAbierto && (
              <span className="badge bg-danger-subtle text-danger rounded-pill fw-bold" style={{ fontSize: '9px', letterSpacing: '0.3px' }}>
                NO DISPONIBLE
              </span>
            )}
          </div>
          
          {/* Contenedor de los servicios de este día */}
          <div className="d-flex flex-column">
            {dia.servicios.map((serv, idx) => {
              const isSelected = seleccionados.has(`${serv.Fecha}|${serv.Jornada}`);
              const interactuable = estaAbierto && !esDiaBloqueado;
              const esUltimo = idx === dia.servicios.length - 1;

              return (
                <div 
                  key={idx}
                  onClick={() => toggleServicio(serv.Fecha, serv.Jornada)}
                  className={`d-flex align-items-center justify-content-between px-3 py-3 position-relative transition-all ${!esUltimo ? 'border-bottom' : ''}`}
                  style={{ 
                    cursor: interactuable ? 'pointer' : 'default',
                    backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                    opacity: deshabilitado && !isSelected ? 0.5 : 1,
                    borderColor: '#F1F5F9',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Línea morada lateral premium al seleccionar */}
                  <div className="position-absolute start-0 top-0 bottom-0" 
                       style={{ 
                         width: '4px', 
                         backgroundColor: isSelected ? '#6E4BDB' : 'transparent',
                         transition: 'background-color 0.2s ease' 
                       }} />

                  <div className="d-flex align-items-center gap-2.5 ps-1">
                    {/* Checkbox circular interactivo */}
                    <div className="rounded-circle d-flex align-items-center justify-content-center border" 
                         style={{ 
                           width: '22px', 
                           height: '22px',
                           backgroundColor: isSelected ? '#6E4BDB' : '#FFFFFF',
                           borderColor: isSelected ? '#6E4BDB' : '#CBD5E1',
                           transition: 'all 0.2s ease'
                         }}>
                      {isSelected && <i className="bi bi-check text-white" style={{ fontSize: '14px' }}></i>}
                    </div>
                    
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '13.5px', marginBottom: '-1px' }}>{serv.Tipo}</div>
                      <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                        <i className="bi bi-clock"></i> {serv.Jornada}
                      </span>
                    </div>
                  </div>

                  {/* Badge AM/PM compacto */}
                  <div className="text-end">
                    <span className="badge rounded-2 px-2 py-1.5 fw-bold shadow-sm"
                          style={{
                            backgroundColor: isSelected ? '#6E4BDB' : (serv.Jornada.toUpperCase().includes('A') ? '#FEF3C7' : '#E0F2FE'),
                            color: isSelected ? '#FFFFFF' : (serv.Jornada.toUpperCase().includes('A') ? '#D97706' : '#0369A1'),
                            fontSize: '10px'
                          }}>
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

      {/* 🚀 BOTÓN FLOTANTE ESTILIZADO */}
      {estaAbierto && (
        <div
          className="fixed-bottom p-2.5 bg-white bg-opacity-90 border-top shadow-lg d-flex justify-content-center align-items-center"
          style={{ bottom: "80px", backdropFilter: "blur(10px)", zIndex: 1030 }}
        >
          <button
            onClick={confirmarGuardado}
            disabled={guardando}
            className="btn w-100 rounded-3 fw-bold py-2.5 text-white transition-all border-0 shadow-sm se-2"
            style={{
              maxWidth: "480px",
              backgroundColor: "#6E4BDB",
              fontSize: "14px",
            }}
          >
            {guardando ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : (
              <i className="bi bi-check2-circle me-1.5"></i>
            )}
            Guardar Agenda ({seleccionados.size})
          </button>
        </div>
      )}

      <style>{`
        .fw-black { font-weight: 900 !important; }
        .rounded-bottom-4 { border-bottom-left-radius: 18px !important; border-bottom-right-radius: 18px !important; }
        .container { padding-bottom: ${estaAbierto ? "130px" : "70px"}; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
