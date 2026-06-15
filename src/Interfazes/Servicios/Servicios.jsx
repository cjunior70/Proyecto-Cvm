import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerServiciosAgrupados } from "../Servicios/obtenerServiciosAgrupados";
import CardServicios from "../Componentes/CardServicios";
import ModalCrearServicio from "../Componentes/ModalCrearServicio";
import GeneradorInforme from "../Componentes/GeneradorInforme"; // 📸 Importación del generador
import Swal from "sweetalert2";
import Calendario from "../../Imagenes/Calendario.svg";
import Localizacion from "../../Imagenes/Localizacion.svg";
import DescargarCronograma from "../../Imagenes/DescargarCronograma.svg"; // 🖼️ Tu imagen importada
import { supabase } from "../../../Supabase/cliente";

export default function Servicios() {
  const [cronogramas, setCronogramas] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [automatizando, setAutomatizando] = useState(false);

  // 📸 Estados para el control del Flyer seleccionado al lado del día
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [ejecutarRenderFlyer, setEjecutarRenderFlyer] = useState(false);

  const navigate = useNavigate();

  // 🚀 FUNCIÓN DE CARGA
  const cargarData = async () => {
    setLoading(true);
    try {
      const dataAgrupada = await obtenerServiciosAgrupados();
      const hoy = new Date();
      const hoyStr = hoy.toLocaleDateString("sv-SE");

      const cronogramaFiltrado = Object.keys(dataAgrupada)
        .filter((fechaKey) => fechaKey >= hoyStr || fechaKey === "Sin Fecha")
        .reduce((obj, key) => {
          obj[key] = dataAgrupada[key];
          return obj;
        }, {});

      setCronogramas(cronogramaFiltrado);
    } catch (error) {
      console.error("Error al cargar los servicios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarData();
  }, []);

  // 🤖 FUNCIÓN MAESTRA: Control de Disponibilidad + Automatización mensual
  const manejarAutomatizacionMensual = async () => {
    const hoy = new Date();
    const proximoMesDate = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const nombreMes = meses[proximoMesDate.getMonth()];
    const ano = proximoMesDate.getFullYear().toString();

    const hoyStr = hoy.toISOString().split("T")[0];

    const { value: formValues, isConfirmed } = await Swal.fire({
      title: "Control de Disponibilidad",
      html: `
        <p class="text-muted small mb-3">Antes de generar los servicios, define cuándo los servidores podrán registrar su asistencia para <b>${nombreMes} ${ano}</b>.</p>
        
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold" style="color: #6E4BDB;">Fecha de Apertura</label>
          <input id="swal-apertura" type="date" class="form-control" value="${hoyStr}">
        </div>
        
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold" style="color: #6E4BDB;">Fecha de Cierre</label>
          <input id="swal-cierre" type="date" class="form-control">
        </div>
        
        <div class="mb-1 text-start">
          <label class="form-label small fw-bold" style="color: #6E4BDB;">Descripción (Opcional)</label>
          <input id="swal-desc" type="text" class="form-control" placeholder="Ej. Disponibilidad de ${nombreMes}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Siguiente 🚀",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6E4BDB",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const apertura = document.getElementById("swal-apertura").value;
        const cierre = document.getElementById("swal-cierre").value;
        const desc = document.getElementById("swal-desc").value;

        if (!apertura || !cierre) {
          Swal.showValidationMessage(
            "Debes seleccionar las fechas de apertura y cierre",
          );
          return false;
        }
        if (cierre < apertura) {
          Swal.showValidationMessage(
            "La fecha de cierre no puede ser antes que la apertura",
          );
          return false;
        }
        return { apertura, cierre, desc };
      },
    });

    if (isConfirmed && formValues) {
      setAutomatizando(true);
      try {
        Swal.fire({
          title: "Procesando...",
          text: "Creando apertura de disponibilidad y cronograma...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const { error: errorControl } = await supabase
          .from("Control_Disponibilidad")
          .insert([
            {
              Mes: nombreMes,
              Año: ano,
              Fecha_apertura: formValues.apertura,
              Fecha_cierre: formValues.cierre,
              Descripcion:
                formValues.desc ||
                `Disponibilidad general para ${nombreMes} ${ano}`,
            },
          ]);

        if (errorControl)
          throw new Error("Error al guardar el control de disponibilidad.");

        const { data, error: errorRPC } = await supabase.rpc(
          "generar_servicios_proximo_mes",
        );

        if (errorRPC) throw errorRPC;

        await Swal.fire({
          title: "¡Proceso Completado!",
          text: "Se ha abierto el registro de disponibilidad y los servicios del próximo mes están listos.",
          icon: "success",
          confirmButtonColor: "#6E4BDB",
          background: "#ffffff",
        });

        cargarData();
      } catch (error) {
        console.error("Error en flujo de automatización:", error);
        Swal.fire({
          title: "Error en el proceso",
          text:
            error.message ||
            "Hubo un problemita. Revisa la consola para más detalles.",
          icon: "error",
          confirmButtonColor: "#DC2626",
        });
      } finally {
        setAutomatizando(false);
      }
    }
  };

  // 📸 FUNCIÓN ACTUALIZADA: Captura la fecha pura
  const confirmarGeneracionFlyer = async (fecha, fechaFormateada) => {
    const confirmacion = await Swal.fire({
      title: "¿Generar Flyer?",
      text: `¿Deseas preparar el informe de asistencia para el día ${fechaFormateada}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, preparar 📸",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6E4BDB",
      cancelButtonColor: "#6c757d",
    });

    if (confirmacion.isConfirmed) {
      setFechaSeleccionada(fecha); // Guarda la fecha (Ej: "2026-06-07")
      setEjecutarRenderFlyer(true);
    }
  };

  const formatearFechaConDia = (fechaStr) => {
    if (!fechaStr || fechaStr.includes("Sin Fecha")) return fechaStr;
    const parts = fechaStr.split("-");
    if (parts.length !== 3) return fechaStr;
    const fechaObjeto = new Date(parts[0], parts[1] - 1, parts[2]);
    const opciones = { weekday: "long", day: "numeric", month: "long" };
    let fechaFormateada = fechaObjeto.toLocaleDateString("es-ES", opciones);
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  };

  const fechasDisponibles = Object.keys(cronogramas);

  return (
    <>
      <div
        className="container mt-3 px-3 position-relative"
        style={{ maxWidth: "600px", paddingBottom: "100px" }}
      >
        {/* 📋 ENCABEZADO */}
        {loading ? (
          <header className="mb-4 placeholder-glow">
            <div className="mb-3">
              <h4
                className="placeholder col-6 rounded mb-2"
                style={{ height: "24px" }}
              ></h4>
              <p className="placeholder col-9 d-block rounded small m-0"></p>
            </div>
            <div className="d-flex gap-2">
              <div
                className="placeholder rounded-3 flex-grow-1"
                style={{ height: "40px" }}
              ></div>
              <div
                className="placeholder rounded-3"
                style={{ width: "40px", height: "40px" }}
              ></div>
            </div>
          </header>
        ) : (
          <header className="mb-4">
            <div className="mb-3">
              <h4 className="fw-bold m-0" style={{ color: "#2D3748" }}>
                Mis Servicios
              </h4>
              <p className="text-muted small m-0">
                Cronograma activo desde hoy en adelante
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                onClick={manejarAutomatizacionMensual}
                className="btn d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm flex-grow-1 fw-semibold text-white"
                style={{
                  height: "40px",
                  fontSize: "0.9rem",
                  backgroundColor: "#6E4BDB",
                  border: "none",
                  transition: "all 0.3s",
                }}
                disabled={automatizando}
              >
                {automatizando ? (
                  <>
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Automatizar Próximo Mes</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setModalAbierto(true)}
                className="btn d-flex align-items-center justify-content-center p-0 rounded-3 shadow-sm text-white"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#6E4BDB",
                  border: "none",
                  transition: "all 0.3s",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
                  />
                </svg>
              </button>
            </div>
          </header>
        )}

        {/* 🔲 CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="placeholder-glow d-flex flex-column gap-4">
            <div
              className="card placeholder col-12 rounded-3 border-0 shadow-sm"
              style={{ height: "85px" }}
            ></div>
            <div
              className="card placeholder col-12 rounded-3 border-0 shadow-sm"
              style={{ height: "85px" }}
            ></div>
          </div>
        ) : fechasDisponibles.length === 0 ? (
          <div
            className="text-center my-5 py-5 rounded-4 shadow-sm"
            style={{
              backgroundColor: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          >
            <p className="text-muted m-0 fw-medium">
              No hay servicios pendientes.
            </p>
          </div>
        ) : (
          fechasDisponibles.map((fecha) => {
            const fechaFormateada = formatearFechaConDia(fecha);
            return (
              <section key={fecha} className="mb-4">
                {/* ✨ Cabecera del Día */}
                <section
                  className="d-flex align-items-center justify-content-between gap-2 mb-3 sticky-top py-2"
                  style={{
                    zIndex: 100,
                    top: 0,
                    backgroundColor: "rgba(244, 247, 254, 0.8)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 flex-grow-1">
                    <span
                      className="badge rounded-pill px-3 py-2 fw-bold shadow-sm text-white"
                      style={{
                        fontSize: "0.85rem",
                        backgroundColor: "#6E4BDB",
                      }}
                    >
                      {fechaFormateada}
                    </span>
                    <div
                      className="flex-grow-1 border-bottom border-2 opacity-50"
                      style={{ borderColor: "#6E4BDB" }}
                    ></div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      onClick={() =>
                        confirmarGeneracionFlyer(fecha, fechaFormateada)
                      }
                      className="btn d-flex align-items-center justify-content-center p-0 rounded-circle shadow-sm border-0 text-white"
                      title="Generar flyer de este día"
                      style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: "#6E4BDB",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.1)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <img
                        src={DescargarCronograma}
                        alt=""
                        style={{
                          width: "20px",
                          height: "20px",
                          objectFit: "contain",
                        }}
                      />
                    </button>

                    <span
                      className="small fw-bold px-2 py-1 rounded border shadow-sm"
                      style={{
                        color: "#6E4BDB",
                        borderColor: "#6E4BDB",
                        backgroundColor: "rgba(255,255,255,0.9)",
                      }}
                    >
                      {cronogramas[fecha].length}
                    </span>
                  </div>
                </section>

                {/* Bloque de tarjetas */}
                <section className="d-flex flex-column gap-2">
                  {cronogramas[fecha].map((servicio) => (
                    <div
                      key={servicio.Id}
                      className="border-start border-4 rounded-end-3"
                      style={{ borderColor: "#6E4BDB" }}
                    >
                      <CardServicios
                        idServicio={servicio.Id}
                        servicio={servicio}
                        img_evento={Calendario}
                        img_ubicacion={Localizacion}
                      />
                    </div>
                  ))}
                </section>
              </section>
            );
          })
        )}
      </div>

      <ModalCrearServicio
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onExito={cargarData}
      />

      {/* 📸 DISPARADOR DINÁMICO OCULTO CON LA FECHA PURA PASADA POR PROPS */}
      {ejecutarRenderFlyer && fechaSeleccionada && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <GeneradorInforme
            fechaSeleccionada={fechaSeleccionada}
            autoDisparar={true}
            alTerminar={() => {
              setEjecutarRenderFlyer(false);
              setFechaSeleccionada(null);
            }}
          />
        </div>
      )}
    </>
  );
}
