import React, { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import { QuienEstaConectado } from "../../../Supabase/QuienEstaConectado.js";
import { obtenerMesActual } from "./ObtenerHoraYFechas.js";
import Swal from "sweetalert2";

// 🚨 Importamos tu función automática desde la ruta donde tengas guardado el archivo
// Ajusta la ruta ("../../funciones/generarCronograma") si es necesario
import { generarCronogramaAutomatico } from "./generarCronogramaAutomatico"; 

import ResumenDelMes from "../Componentes/ResumenDelMes";
import Calendario from "../../Imagenes/Calendario.svg";
import Localizacion from "../../Imagenes/Localizacion.svg";
import Staff from "../../Imagenes/Staff.svg";
import Fuego1 from "../../Imagenes/Fuego1.svg";
import SillaDeEspera from "../../Imagenes/SillaDeEspera.svg";
import LogoPerfil from "../../Imagenes/LogoPerfil.svg";
import CardServicios from "../Componentes/CardServicios.jsx";

export default function Homeadmin() {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [ProximoServicios, setProximoServicios] = useState([]);
  const [mostrarModalSalir, setMostrarModalSalir] = useState(false);
  const [automatizando, setAutomatizando] = useState(false);

  const brandColor = "#6E4BDB";

  const cargarDatosIniciales = async () => {
    try {
      const [user, respuestaMetricas, ListaProximoServicios] = await Promise.all([
        QuienEstaConectado(),
        supabase.from("vista_resumen_del_mes_actual").select("*").single(),
        supabase.from("vista_proximos_servicios").select("*"),
      ]);

      if (user) setUsuario(user);
      if (!respuestaMetricas.error) setMetricas(respuestaMetricas.data);
      if (!ListaProximoServicios.error) setProximoServicios(ListaProximoServicios.data);
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // 🤖 FUNCIÓN MAESTRA: Lanza el menú Sí/No y ejecuta tu archivo de automatización
  const manejarAutomatizacionMensual = async () => {
    // 🚨 1. Menú interactivo de confirmación simple para el jefe
    const confirmacion = await Swal.fire({
      title: "¿Generar Cronograma?",
      text: "¿Estás seguro de que deseas generar el cronograma del servicio del mes que viene?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, generar 🚀",
      cancelButtonText: "No, cancelar",
      confirmButtonColor: brandColor,
      cancelButtonColor: "#6c757d",
    });

    // Si el jefe dice que No, detenemos el flujo aquí mismo
    if (!confirmacion.isConfirmed) return;

    // Si dice que Sí, bloqueamos el botón y mostramos el cargando
    setAutomatizando(true);

    Swal.fire({
      title: "Procesando Motores...",
      text: "Asignando servidores de fecha fija y distribuyendo comodines disponibles. No cierres la aplicación.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // 🚨 2. Llamamos a tu archivo externo pasándole el refresco del dashboard como callback
    await generarCronogramaAutomatico(cargarDatosIniciales);

    // Apagamos el estado de carga al finalizar todo el proceso
    setAutomatizando(false);
  };

  return (
    <div className="rounded-4" style={{ backgroundColor: "#F4F7FE", minHeight: "100vh", paddingBottom: "20px" }}>
      {/* HEADER: Fijo y redondeado */}
      <section 
        className="p-3 mb-3 bg-white shadow-sm position-fixed z-1" 
        style={{ width: "90%", maxWidth: "600px", left: "50%", transform: "translateX(-50%)", borderRadius: "0 0 25px 25px" }}
      >
        {loading ? (
          <section className="d-flex align-items-center justify-content-between placeholder-glow">
            <section className="w-75"><h4 className="placeholder col-8 rounded"></h4></section>
            <section className="w-25"><div className="placeholder rounded-circle" style={{ width: "45px", height: "45px" }}></div></section>
          </section>
        ) : (
          <section className="d-flex align-items-center justify-content-between">
            <section>
              <h5 className="fw-bold mb-0">¡Hola, {usuario?.user_metadata?.name || "Admin"}! 👋</h5>
              <small className="text-muted">Bienvenido de nuevo</small>
            </section>
            <button className="btn p-0 border-0" onClick={() => setMostrarModalSalir(true)}>
              <img src={usuario?.user_metadata?.avatar_url || LogoPerfil} className="rounded-circle border" alt="Perfil" style={{ width: "80px", height: "80px", objectFit: "cover" }} />
            </button>
          </section>
        )}
      </section>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="container-lg" style={{ maxWidth: "600px", paddingTop: "120px" }}>
        
       {/* 🎨 ESTILOS DE ANIMACIÓN Y CÍRCULOS CON FONDO ELEGANTE */}
        <style>
          {`
            @keyframes popCascada {
              from { opacity: 0; transform: translateY(20px) scale(0.8); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .circulo-elegante {
              width: 15vw; height: 15vw;
              max-width: 70px; max-height: 70px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
            }

            /* ✨ Fondo de cristal elegante para la tarjeta */
            .tarjeta-cristal {
              background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
              border: 1px solid rgba(255, 255, 255, 0.5);
            }
          `}
        </style>

        {/* RESUMEN DEL MES */}
        <section className="mb-4 mt-3">
          <p className="fw-bold mb-3 ms-2" style={{ color: brandColor }}>
            {loading ? <span className="placeholder-1 col-4"></span> : `Resumen de ${obtenerMesActual()}`}
          </p>
          <div className="row row-cols-2 g-3 px-2 text-center">
            {[
              { img: Calendario, val: metricas?.servicios_hoy, txt: "Servicios hoy", bg: "#E3F2FD", shadow: "rgba(33, 150, 243, 0.2)" },
              { img: SillaDeEspera, val: metricas?.servicios_pendientes, txt: "Pendientes", bg: "#FFF3E0", shadow: "rgba(255, 152, 0, 0.2)" },
              { img: Staff, val: metricas?.horas_asignadas, txt: "Horas", bg: "#F3E5F5", shadow: "rgba(156, 39, 176, 0.2)" },
              { img: Fuego1, val: metricas?.servidores_activos, txt: "Activos", bg: "#E8F5E9", shadow: "rgba(76, 175, 80, 0.2)" }
            ].map((item, i) => (
              <div key={i} className="col">
                <div 
                  className="card border-0 p-3 rounded-4 tarjeta-cristal tarjeta-resumen" 
                  style={{ 
                    animation: `popCascada 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.12}s forwards`,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
                  }}
                >
                  {loading ? (
                    <div className="placeholder-glow d-flex flex-column align-items-center">
                       <div className="placeholder rounded-circle mb-2" style={{ width: "15vw", height: "15vw" }}></div>
                       <span className="placeholder col-4 mb-1"></span>
                    </div>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <div 
                        className="circulo-elegante mb-2" 
                        style={{ 
                          backgroundColor: item.bg, 
                          boxShadow: `0 8px 16px ${item.shadow}` 
                        }}
                      >
                        <img src={item.img} style={{ width: "50%", height: "50%", objectFit: "contain" }} alt={item.txt} />
                      </div>
                      
                      <h4 className="fw-bold m-0 text-dark" style={{ fontSize: "5vw" }}>{item.val || 0}</h4>
                      <p className="m-0 text-muted" style={{ fontSize: "3vw", opacity: 0.8 }}>{item.txt}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRÓXIMOS SERVICIOS */}
        <section className="px-2">
          <p className="fw-bold mb-3" style={{ color: brandColor }}>Próximos Servicios</p>
          {loading ? (
            [1, 2].map((f) => <div key={f} className="card p-3 mb-3 border-0 shadow-sm rounded-4 placeholder-glow" style={{ height: "100px" }} />)
          ) : ProximoServicios.length === 0 ? (
            <div className="text-center p-4 rounded-4 shadow-sm" style={{ backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)" }}>
              <p className="text-muted m-0">No hay servicios programados próximamente.</p>
            </div>
          ) : (
            ProximoServicios.slice(0, 3).map((item) => (
              <CardServicios key={item.Id} idServicio={item.Id} servicio={item} img_evento={Calendario} img_ubicacion={Localizacion} />
            ))
          )}
        </section>

        {/* 🚀 CALL TO ACTION: AUTOMATIZAR CRONOGRAMA */}
        <section className="px-2 mb-4 mt-3">
          <button 
            onClick={manejarAutomatizacionMensual}
            disabled={automatizando || loading}
            className="btn w-100 d-flex align-items-center justify-content-center gap-2 rounded-4 shadow-sm text-white p-3 fw-bold"
            style={{ backgroundColor: brandColor, border: "none", transition: "all 0.3s" }}
          >
            {automatizando ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status"></div>
                <span>Ejecutando motores...</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: "1.2rem" }}>✨</span>
                <span>Generar Cronograma del Próximo Mes</span>
              </>
            )}
          </button>
        </section>

      </main>

      {/* MODAL SALIR */}
      {mostrarModalSalir && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered p-3">
            <div className="modal-content rounded-4 border-0 p-4">
              <h5 className="fw-bold">¿Cerrar sesión?</h5>
              <p className="text-muted">¿Seguro que deseas salir de la aplicación?</p>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-light w-50 rounded-pill fw-bold" onClick={() => setMostrarModalSalir(false)}>Cancelar</button>
                <button className="btn text-white w-50 rounded-pill fw-bold" style={{ backgroundColor: brandColor }} onClick={cerrarSesion}>Salir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}