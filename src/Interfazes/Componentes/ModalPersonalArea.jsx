import React, { useState } from "react";
import Swal from "sweetalert2"; // Librería de alertas premium
import { obtenerTodosLosServidoresPorArea } from "../Aereas/obtenerTodosLosServidoresPorArea"; // Tu consulta
import { actualizarServidorEnCronograma } from "../Servicios/actualizarServidorEnCronograma"; // Tu función de UPDATE
import { insertarServidorEnCronograma } from "../Servicios/insertarServidorEnCronograma"; // Conectada a tu BD real
import { eliminarServidorDeCronograma } from "../Servicios/eliminarServidorDeCronograma"; // 🌟 Nueva función de DELETE
import Cambiar from "../../Imagenes/Cambiar.svg";

export default function ModalPersonalArea({ 
  idArea, 
  idServicio, // ID del servicio padre donde se va a inyectar en Cronograma
  nombreArea, 
  personalArea = [], 
  cuposMaximos, // Límite de cupos
  loadingModal, 
  onActualizacionExitosa 
}) {

  // 🔄 Estados locales para la lógica de intercambio y adición
  const [vistaCambio, setVistaCambio] = useState(false);
  const [modoAdicion, setModoAdicion] = useState(false); 
  const [servidoresDisponibles, setServidoresDisponibles] = useState([]);
  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [servidorAIntercambiar, setServidorAIntercambiar] = useState(null);

  const targetModalSelector = `#backdrop-${idArea}`;
  const listaSeguraPersonal = Array.isArray(personalArea) ? personalArea : [];

  // 🚀 FUNCIÓN 1: Carga los reemplazos para INTERCAMBIAR a alguien existente
  const activarIntercambio = async (servidorActual) => {
    setServidorAIntercambiar(servidorActual);
    setModoAdicion(false);
    setVistaCambio(true);
    setLoadingDisponibles(true);
    
    const tiempoInicio = Date.now();
    const disponibles = await obtenerTodosLosServidoresPorArea(idArea);
    
    const idsApuntados = listaSeguraPersonal.map(p => p.IdServidorArea);
    
    const filtrados = disponibles.filter(s => 
      s.IdServidorArea !== servidorActual.IdServidorArea && 
      !idsApuntados.includes(s.IdServidorArea)
    );
    
    const tiempoRestante = 1000 - (Date.now() - tiempoInicio);
    setTimeout(() => {
      setServidoresDisponibles(filtrados);
      setLoadingDisponibles(false);
    }, Math.max(0, tiempoRestante));
  };

  // 🆕 FUNCIÓN 2: Carga los servidores aptos para INYECTAR uno nuevo desde cero
  const activarAdicionServidor = async () => {
    if (listaSeguraPersonal.length >= cuposMaximos) {
      Swal.fire({
        title: "¡Cupos Agotados!",
        text: `Esta área ya alcanzó el límite máximo de ${cuposMaximos} servidores asignados.`,
        icon: "error",
        target: document.querySelector(targetModalSelector) || "body"
      });
      return;
    }

    setServidorAIntercambiar(null);
    setModoAdicion(true);
    setVistaCambio(true);
    setLoadingDisponibles(true);

    const tiempoInicio = Date.now();
    const disponibles = await obtenerTodosLosServidoresPorArea(idArea);
    
    const idsApuntados = listaSeguraPersonal.map(p => p.IdServidorArea);
    const filtrados = disponibles.filter(s => !idsApuntados.includes(s.IdServidorArea));

    const tiempoRestante = 1000 - (Date.now() - tiempoInicio);
    setTimeout(() => {
      setServidoresDisponibles(filtrados);
      setLoadingDisponibles(false);
    }, Math.max(0, tiempoRestante));
  };

  // 🚀 FUNCIÓN COMPARTIDA: Ejecuta el cambio (UPDATE) o la inyección (INSERT)
  const procesarAccionServidor = async (idServidorAreaNuevo, nombreNuevo) => {
    setLoadingDisponibles(true);
    
    Swal.fire({
      title: modoAdicion ? "Asignando servidor..." : "Procesando intercambio...",
      allowOutsideClick: false,
      target: document.querySelector(targetModalSelector) || "body",
      didOpen: () => Swal.showLoading()
    });

    let exito = false;

    if (modoAdicion) {
      exito = await insertarServidorEnCronograma(idServicio, idServidorAreaNuevo);
    } else {
      exito = await actualizarServidorEnCronograma(servidorAIntercambiar.Id, idServidorAreaNuevo);
    }
    
    if (exito) {
      cerrarModalYRefrescar(
        modoAdicion ? "¡Servidor Asignado!" : "¡Sistema Actualizado!",
        modoAdicion ? `${nombreNuevo} fue añadido con éxito.` : "El servidor ha sido reemplazado correctamente."
      );
    } else {
      mostrarErrorBD();
    }
  };

  // 🗑️ FUNCIÓN 3: Elimina un servidor apuntado con Alerta de Confirmación Premium
  const confirmarEliminar = async (servidor) => {
    Swal.fire({
      title: "¿Quitar Servidor?",
      text: `¿Estás seguro de que deseas desvincular a ${servidor.Nombre} de esta área?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545", // Color rojo peligro
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
      target: document.querySelector(targetModalSelector) || "body"
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Mostramos loader mientras borra
        Swal.fire({
          title: "Eliminando...",
          allowOutsideClick: false,
          target: document.querySelector(targetModalSelector) || "body",
          didOpen: () => Swal.showLoading()
        });

        const exito = await eliminarServidorDeCronograma(servidor.Id);

        if (exito) {
          cerrarModalYRefrescar("¡Removido!", `${servidor.Nombre} ha sido quitado del área.`);
        } else {
          mostrarErrorBD();
        }
      }
    });
  };

  // 🧼 Helpers de Limpieza de Modales y Alertas
  const cerrarModalYRefrescar = (titulo, texto) => {
    const btnCerrar = document.querySelector(`${targetModalSelector} .btn-close`);
    if (btnCerrar) {
      btnCerrar.blur();
      btnCerrar.click();
    }

    Swal.fire({
      title: titulo,
      text: texto,
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      allowOutsideClick: false
    }).then(async () => {
      setLoadingDisponibles(false);
      regresarAListaOriginal();
      
      if (onActualizacionExitosa) {
        await onActualizacionExitosa(); 
      }
      document.body.style.overflow = ""; 
      
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) backdrop.remove();
    });
  };

  const mostrarErrorBD = () => {
    Swal.fire({
      title: "Error",
      text: "No se pudo procesar la operación en la base de datos.",
      icon: "error",
      confirmButtonText: "Entendido",
      target: document.querySelector(targetModalSelector) || "body"
    });
    setLoadingDisponibles(false);
  };

  const regresarAListaOriginal = () => {
    setVistaCambio(false);
    setModoAdicion(false);
    setServidorAIntercambiar(null);
  };

  return (
    <div 
      className="modal fade" 
      id={`backdrop-${idArea}`} 
      data-bs-backdrop="static" 
      data-bs-keyboard="false" 
      tabIndex="-1" 
      aria-labelledby={`label-${idArea}`} 
      aria-hidden="true"
    >
      <div className="modal-dialog position-fixed bottom-0 start-0 w-100 m-0" style={{ maxWidth: "100%" }}>
        <div className="modal-content border-0 shadow-lg rounded-top-4">
          
          {/* Barrita superior estilo móvil */}
          <div className="d-flex justify-content-center pt-2 pb-1">
            <div className="bg-secondary-subtle rounded" style={{ width: "40px", height: "5px" }}></div>
          </div>

          <div className="modal-header border-bottom-0 pt-2 pb-0">
            <h1 className="modal-title fs-5 fw-bold text-primary mb-0" id={`label-${idArea}`}>
              {vistaCambio 
                ? (modoAdicion ? "Vincular Nuevo Servidor" : `Cambiar a: ${servidorAIntercambiar?.Nombre}`) 
                : nombreArea}
            </h1>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={regresarAListaOriginal}></button>
          </div>

          <div className="modal-body pt-3 pb-0">
            
            {!vistaCambio && !loadingModal && (
              <button 
                type="button" 
                className="btn btn-success btn-sm w-100 rounded-3 fw-semibold mb-3 py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={activarAdicionServidor}
              >
                <span className="fs-5">+</span> Agregar Servidor a esta Área
              </button>
            )}

            <h6 className="text-muted mb-3 fw-semibold small text-uppercase tracking-wider">
              {vistaCambio ? "Selecciona el Servidor Apto" : `Servidores Apuntados (${listaSeguraPersonal.length} / ${cuposMaximos})`}
            </h6>

            <div 
              className="overflow-y-auto px-1" 
              style={{ 
                maxHeight: "55vh", 
                minHeight: "120px",
                paddingBottom: "80px" 
              }}
            >
              
              {/* ---------------- VISTA 1: SERVIDORES APUNTADOS (CON BORRAR Y CAMBIAR) ---------------- */}
              {!vistaCambio ? (
                loadingModal ? (
                  <section className="w-100 d-flex mb-2 mt-2 align-items-center placeholder-glow">
                    <button className="placeholder col-2 rounded-circle me-3" style={{ height: "40px", width: "40px" }}></button>
                    <h4 className="placeholder col-8 rounded fs-6 m-0" style={{ height: "20px" }}></h4>
                  </section>
                ) : listaSeguraPersonal.length === 0 ? (
                  <p className="text-center text-muted my-4 small">No hay servidores apuntados en esta sección.</p>
                ) : (
                  listaSeguraPersonal.map((servidor) => (
                    <div key={servidor.Id} className="d-flex align-items-center justify-content-between py-2 border-bottom border-light-subtle">
                      <div className="d-flex align-items-center">
                        {servidor.Foto && servidor.Foto !== "" ? (
                          <img src={servidor.Foto} className="rounded-circle border me-3" alt="" style={{ width: "40px", height: "40px", objectFit: "cover" }} />
                        ) : (
                          <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center me-3 fw-bold small" style={{ width: "40px", height: "40px" }}>
                            {servidor.Nombre?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="fw-medium text-dark small">{servidor.Nombre}</span>
                      </div>

                      {/* 🛠️ CONTENEDOR DE ACCIONES (CAMBIAR Y ELIMINAR) */}
                      <div className="d-flex align-items-center gap-1">
                        {/* Botón Cambiar */}
                        <button 
                          type="button" 
                          className="btn btn-link p-1 text-decoration-none d-flex align-items-center justify-content-center"
                          onClick={() => activarIntercambio(servidor)}
                        >
                          <img src={Cambiar} style={{ width: "22px", height: "22px" }} alt="Cambiar" />
                        </button>

                        {/* Botón Eliminar Físico Real */}
                        <button 
                          type="button" 
                          className="btn btn-link p-1 text-decoration-none d-flex align-items-center justify-content-center text-danger"
                          onClick={() => confirmarEliminar(servidor)}
                        >
                          {/* Icono de papelera nativo SVG limpio */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.937 16h6.126a2 2 0 0 0 1.997-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92H4.937a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 0-.5.5v6.5a.5.5 0 0 0 1 0v-6.5a.5.5 0 0 0-.5-.5m3 0a.5.5 0 0 0-.5.5v6.5a.5.5 0 0 0 1 0v-6.5a.5.5 0 0 0-.5-.5m3 0a.5.5 0 0 0-.5.5v6.5a.5.5 0 0 0 1 0v-6.5a.5.5 0 0 0-.5-.5"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* ---------------- VISTA 2: LISTA DE DISPONIBLES ---------------- */
                loadingDisponibles ? (
                  <section className="w-100 d-flex mb-2 mt-2 align-items-center placeholder-glow">
                    <button className="placeholder col-2 rounded-3 me-3" style={{ height: "35px", width: "35px" }}></button>
                    <h4 className="placeholder col-6 rounded fs-6 m-0" style={{ height: "20px" }}></h4>
                  </section>
                ) : servidoresDisponibles.length === 0 ? (
                  <p className="text-center text-muted my-4 small">No hay otros servidores registrados u homologados en esta área.</p>
                ) : (
                  servidoresDisponibles.map((disponible) => {
                    const idServidorArea = disponible.IdServidorArea || disponible.Id;
                    
                    return (
                      <div 
                        key={idServidorArea} 
                        className="d-flex align-items-center justify-content-between p-2 my-1 border rounded-3 bg-light-subtle"
                        style={{ cursor: "pointer" }}
                        onClick={() => procesarAccionServidor(idServidorArea, disponible.Nombre)}
                      >
                        <div className="d-flex align-items-center">
                          {disponible.Foto && disponible.Foto !== "" ? (
                            <img src={disponible.Foto} className="rounded-circle border me-3" alt="" style={{ width: "35px", height: "35px", objectFit: "cover" }} />
                          ) : (
                            <div className="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center me-3 fw-bold small" style={{ width: "35px", height: "35px" }}>
                              {disponible.Nombre?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="fw-medium text-dark small">{disponible.Nombre}</span>
                        </div>
                        
                        <span className={`badge ${modoAdicion ? "text-bg-success" : "text-bg-primary"} rounded-pill px-2.5 py-1 small`}>
                          {modoAdicion ? "+ Asignar" : "Reemplazar"}
                        </span>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          <div className="modal-footer border-top-0 pt-0 pb-3">
            {vistaCambio && (
              <button type="button" className="btn btn-secondary w-100 rounded-3 fw-medium" onClick={regresarAListaOriginal}>
                Volver a Apuntados
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}