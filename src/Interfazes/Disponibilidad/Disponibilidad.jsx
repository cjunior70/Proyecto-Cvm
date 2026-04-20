import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";

export default function Disponibilidad() {
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [disponibilidadesUser, setDisponibilidadesUser] = useState([]);
  const [reglasAcceso, setReglasAcceso] = useState([]);
  const [carga, setCarga] = useState(false);
  const navigate = useNavigate();

  // 1. CARGA INICIAL CON LÓGICA DE VISIBILIDAD (DÍA 27)
  const inicializar = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const userId = userData.user.id;

      const hoy = new Date();
      const hoyStr = hoy.toISOString().split("T")[0];
      const diaDelMes = hoy.getDate();
      
      // Si es 27 o más, vemos hasta el fin del PRÓXIMO mes
      let fechaFinBusqueda;
      if (diaDelMes >= 27) {
        fechaFinBusqueda = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0).toISOString().split('T')[0];
      } else {
        fechaFinBusqueda = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
      }

      // A. Servicios (Agrupados por fecha para evitar repetidos)
      const { data: servData } = await supabase
        .from("Servicio")
        .select("Id, Fecha")
        .gte("Fecha", hoyStr)
        .lte("Fecha", fechaFinBusqueda)
        .order("Fecha", { ascending: true });

      const fechasUnicas = [];
      const mapaFechas = new Set();
      (servData || []).forEach(item => {
        if (!mapaFechas.has(item.Fecha)) {
          mapaFechas.add(item.Fecha);
          fechasUnicas.push(item);
        }
      });
      setDiasDisponibles(fechasUnicas);

      // B. Reglas de Control (Mayúsculas según tu SQL)
      const { data: reglas } = await supabase.from("Control_Disponibilidad").select("*");
      setReglasAcceso(reglas || []);

      // C. Lo que el usuario ya marcó
      const { data: miDispo } = await supabase
        .from("Disponbilidad")
        .select("Fecha")
        .eq("IdServidor", userId)
        .gte("Fecha", hoyStr);

      setDisponibilidadesUser(miDispo?.map(d => d.Fecha) || []);

    } catch (e) {
      console.error("Error al inicializar:", e);
    } finally {
      setCarga(true);
    }
  };

  // 2. LÓGICA DE VALIDACIÓN (DÍA ESPECÍFICO O MES GLOBAL)
  const verificarBloqueo = (servicio) => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const fechaServicioStr = servicio.Fecha;

    // A. ¿Hay regla para este día exacto?
    const reglaPorDia = reglasAcceso.find(r => r.Fecha_especifica === fechaServicioStr);

    if (reglaPorDia) {
      const estaAbierto = hoyStr >= reglaPorDia.Fecha_apertura && hoyStr <= reglaPorDia.Fecha_cierre;
      return !estaAbierto; 
    }

    // B. ¿Hay regla para el mes completo?
    const fechaObj = new Date(fechaServicioStr + "T00:00:00");
    const mesS = (fechaObj.getMonth() + 1).toString();
    const anioS = fechaObj.getFullYear().toString();

    const reglaGlobal = reglasAcceso.find(r => 
      String(r.Mes) === mesS && String(r.Año) === anioS && !r.Fecha_especifica
    );

    if (reglaGlobal) {
      const estaAbiertoGlobal = hoyStr >= reglaGlobal.Fecha_apertura && hoyStr <= reglaGlobal.Fecha_cierre;
      return !estaAbiertoGlobal;
    }

    return true; // Bloqueado si no hay nada configurado
  };

  // 3. ACCIÓN DEL SWITCH (SOLO SI NO ESTÁ BLOQUEADO)
  const handleToggle = async (servicio) => {
    if (verificarBloqueo(servicio)) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      const yaRegistrado = disponibilidadesUser.includes(servicio.Fecha);

      if (yaRegistrado) {
        setDisponibilidadesUser(prev => prev.filter(f => f !== servicio.Fecha));
        await supabase.from("Disponbilidad").delete().eq("IdServidor", userId).eq("Fecha", servicio.Fecha);
      } else {
        setDisponibilidadesUser(prev => [...prev, servicio.Fecha]);
        await supabase.from("Disponbilidad").insert([{ IdServidor: userId, Fecha: servicio.Fecha }]);
      }
    } catch (e) {
      console.error(e);
      inicializar();
    }
  };

  useEffect(() => { inicializar(); }, []);

  if (!carga) return <div className="text-center py-5 mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="min-vh-100 bg-light pb-5">
      {/* Header Estilizado */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg text-center">
        <div className="d-flex align-items-center gap-3 mb-4 text-start">
          <button className="btn btn-outline-light rounded-circle border-0" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <span className="fw-bold text-uppercase small" style={{ letterSpacing: '1px' }}>Servicio</span>
        </div>
        <div className="bg-primary-subtle d-inline-block p-3 rounded-circle mb-3 shadow-sm">
          <i className="bi bi-calendar-check text-primary fs-2"></i>
        </div>
        <h2 className="fw-bold mb-1">Disponibilidad</h2>
        <p className="small opacity-75">Confirma los días que puedes apoyar.</p>
      </div>

      <div className="container" style={{ marginTop: '-35px' }}>
        <div className="card border-0 shadow-lg rounded-5">
          <div className="card-body p-3">
            
            {diasDisponibles.length === 0 ? (
              <div className="text-center py-5 opacity-50">
                <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                <p>No hay servicios disponibles.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {diasDisponibles.map((servicio, index) => {
                  const yaRegistrado = disponibilidadesUser.includes(servicio.Fecha);
                  const bloqueado = verificarBloqueo(servicio);
                  const dateObj = new Date(servicio.Fecha + "T00:00:00");

                  const mostrarSeparador = index === 0 || 
                    new Date(diasDisponibles[index - 1].Fecha + "T00:00:00").getMonth() !== dateObj.getMonth();

                  return (
                    <div key={servicio.Fecha}>
                      {mostrarSeparador && (
                        <div className="text-center my-3">
                          <span className="badge bg-primary bg-opacity-10 text-primary text-uppercase px-3 py-2 rounded-pill" style={{fontSize: '10px', letterSpacing: '1px'}}>
                            {dateObj.toLocaleDateString("es-ES", { month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      )}

                      <div
                        onClick={() => handleToggle(servicio)}
                        className={`d-flex align-items-center justify-content-between p-3 rounded-4 border-2 transition-all ${
                          bloqueado 
                            ? (yaRegistrado ? 'bg-success-subtle border-success opacity-75' : 'bg-secondary-subtle border-transparent opacity-50') 
                            : (yaRegistrado ? 'bg-success-subtle border-success shadow-sm' : 'bg-light border-transparent')
                        }`}
                        style={{ cursor: bloqueado ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {/* Mini Calendario */}
                          <div className={`text-center rounded-4 d-flex flex-column align-items-center justify-content-center shadow-sm ${
                            yaRegistrado ? 'bg-success text-white' : (bloqueado ? 'bg-secondary text-white' : 'bg-white text-primary border')
                          }`} style={{ width: '55px', height: '58px' }}>
                            <span className="text-uppercase fw-bold" style={{ fontSize: '9px' }}>{dateObj.toLocaleDateString("es-ES", { month: 'short' })}</span>
                            <span className="fw-bolder fs-4 leading-none">{dateObj.getDate()}</span>
                          </div>

                          <div className="text-start">
                            <div className={`fw-bold text-capitalize ${yaRegistrado ? 'text-success' : 'text-dark'}`}>
                              {dateObj.toLocaleDateString("es-ES", { weekday: 'long' })}
                            </div>
                            <small className={`fw-bold ${yaRegistrado ? 'text-success' : (bloqueado ? 'text-danger' : 'text-muted')}`}>
                              {bloqueado ? (
                                yaRegistrado ? (
                                  <><i className="bi bi-check-circle-fill me-1"></i>Inscrito (Plazo Cerrado)</>
                                ) : (
                                  <><i className="bi bi-x-circle-fill me-1"></i>No inscrito (Plazo Cerrado)</>
                                )
                              ) : (
                                yaRegistrado ? <><i className="bi bi-check-circle-fill me-1"></i>Confirmado</> : "Abierto para anotarse"
                              )}
                            </small>
                          </div>
                        </div>

                        {/* Switch o Candado */}
                        <div className="ms-3">
                          {bloqueado ? (
                            <i className={`bi bi-lock-fill fs-4 ${yaRegistrado ? 'text-success' : 'text-secondary'}`}></i>
                          ) : (
                            <div className={`switch-custom ${yaRegistrado ? 'active' : ''}`}
                              style={{ width: '50px', height: '26px', borderRadius: '50px', position: 'relative', transition: '0.3s', backgroundColor: yaRegistrado ? '#198754' : '#dee2e6', padding: '3px' }}>
                              <div className="switch-dot shadow-sm"
                                style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', transition: '0.3s', left: yaRegistrado ? '26px' : '4px' }}>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}