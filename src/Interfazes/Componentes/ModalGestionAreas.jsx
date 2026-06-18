import React, { useState } from "react";
import Swal from "sweetalert2";
import { 
  obtenerTodasLasAreasGlobales, 
  eliminarAreaDeServicio, 
  insertarAreaEnServicio  
} from "./../Servicios/obtenerTodasLasAreasGlobales.js";

export default function ModalGestionAreas({ idServicio, areasActuales = [], loadingPadre, onActualizacionExitosa }) {
  const [vistaAñadir, setVistaAñadir] = useState(false);
  const [areasGlobales, setAreasGlobales] = useState([]);
  const [loadingGlobales, setLoadingGlobales] = useState(false);

  // Evitamos que explote el .map() si viene nulo o indefinido
  const listaSeguraAreas = Array.isArray(areasActuales) ? areasActuales : [];

  // ID del contenedor para amarrar las alertas de SweetAlert
  const targetModalSelector = `#modal-areas-${idServicio}`;

  // 🚀 VISTA 2: Cargar áreas disponibles globales
  const activarVistaAñadir = async () => {
    setVistaAñadir(true);
    setLoadingGlobales(true);
    const tiempoInicio = Date.now();

    const globales = await obtenerTodasLasAreasGlobales();
    
    // Filtro para no mostrar áreas que el servicio ya tiene asignadas
    const idsActuales = listaSeguraAreas.map(a => a?.IdAerea || a?.Aerea?.Id || a?.Id);
    const filtradas = globales.filter(g => g && g.Id && !idsActuales.includes(g.Id));

    const tiempoRestante = 1500 - (Date.now() - tiempoInicio);
    setTimeout(() => {
      setAreasGlobales(filtradas);
      setLoadingGlobales(false);
    }, Math.max(0, tiempoRestante));
  };

  // 📥 ACCIÓN: Añadir área con SweetAlert amarrado al foco del modal
  const gestionarAñadirArea = async (area) => {
    if (!area || !area.Id) return;

    const { value: cupos } = await Swal.fire({
      title: `Cupos para ${area.Nombre}`,
      input: "number",
      inputLabel: "Ingresa la cantidad de cupos totales para esta área",
      inputPlaceholder: "Ej: 5",
      showCancelButton: true,
      confirmButtonText: "Añadir",
      confirmButtonColor: "#6E4BDB",
      cancelButtonText: "Cancelar",
      target: document.querySelector(targetModalSelector) || "body", // 🔥 Soluciona el bloqueo de inputs
      inputValidator: (value) => {
        if (!value || parseInt(value, 10) <= 0) {
          return "¡Debes ingresar un número válido mayor a 0!";
        }
      }
    });

    if (cupos) {
      setLoadingGlobales(true);
      
      // Alerta de carga intermedia dentro del modal
      Swal.fire({
        title: "Guardando área...",
        text: "Por favor espera un momento.",
        allowOutsideClick: false,
        target: document.querySelector(targetModalSelector) || "body",
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const exito = await insertarAreaEnServicio(idServicio, area.Id, cupos);
      
      if (exito) {
        cerrarModalNativo();
        // 🔔 Alerta de éxito automatizada
        Swal.fire({
          title: "¡Área Añadida!",
          text: `Se agregó ${area.Nombre} con ${cupos} cupos con éxito.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          if (onActualizacionExitosa) onActualizacionExitosa();
          document.body.style.overflow = ""; // Limpieza de scrolls fantasmas en móvil
        });
      } else {
        Swal.fire({ 
          title: "Error", 
          text: "No se pudo añadir el área.", 
          icon: "error",
          target: document.querySelector(targetModalSelector) || "body"
        });
      }
      setLoadingGlobales(false);
    }
  };

  // 🗑️ ACCIÓN: Quitar área del servicio actual
  const gestionarQuitarArea = async (idServicioAerea, nombreArea) => {
    if (!idServicioAerea) return;

    const confirmacion = await Swal.fire({
      title: `¿Quitar ${nombreArea}?`,
      text: "Se eliminará esta área de este servicio específico.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
      target: document.querySelector(targetModalSelector) || "body" // 🔥 Soluciona el foco
    });

    if (confirmacion.isConfirmed) {
      cerrarModalNativo();
      
      Swal.fire({
        title: "Eliminando...",
        allowOutsideClick: false,
        target: document.querySelector(targetModalSelector) || "body",
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const exito = await eliminarAreaDeServicio(idServicioAerea);
      
      if (exito) {
        // 🔔 Alerta de éxito automatizada
        Swal.fire({
          title: "¡Área Eliminada!",
          text: "El área fue removida del servicio correctamente.",
          icon: "success",
          timer: 1800,
          showConfirmButton: false
        }).then(() => {
          if (onActualizacionExitosa) onActualizacionExitosa();
          document.body.style.overflow = "";
        });
      } else {
        Swal.fire({ 
          title: "Error", 
          text: "No se pudo remover el área.", 
          icon: "error",
          target: document.querySelector(targetModalSelector) || "body"
        });
      }
    }
  };

  const cerrarModalNativo = () => {
    const btnCerrar = document.querySelector(`${targetModalSelector} .btn-close`);
    if (btnCerrar) btnCerrar.click();
    regresarAListaOriginal();
  };

  const regresarAListaOriginal = () => {
    setVistaAñadir(false);
    setAreasGlobales([]);
  };

  return (
    <div 
      className="modal fade" 
      id={`modal-areas-${idServicio}`} 
      data-bs-backdrop="static" 
      data-bs-keyboard="false"
      tabIndex="-1" 
      aria-hidden="true"
    >
      <div className="modal-dialog position-fixed bottom-0 start-0 w-100 m-0" style={{ maxWidth: "100%" }}>
        <div className="modal-content border-0 shadow-lg rounded-top-4">
          
          {/* Línea gris superior del estilo Bottom Sheet móvil */}
          <div className="d-flex justify-content-center pt-2 pb-1">
            <div className="bg-secondary-subtle rounded" style={{ width: "40px", height: "5px" }}></div>
          </div>

          <div className="modal-header border-bottom-0 pt-2 pb-0">
            <h1 className="modal-title fs-5 fw-bold text-primary mb-0">
              {vistaAñadir ? "Añadir Nueva Área" : "Áreas del Servicio"}
            </h1>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={regresarAListaOriginal}></button>
          </div>

          <div className="modal-body pt-2">
            
            {/* 🔥 BOTÓN SUPERIOR DE AGREGAR (Solo visible en Vista 1) */}
            {!vistaAñadir && !loadingPadre && (
              <button 
                type="button" 
                className="btn bg-success btn-sm w-100 rounded-3 fw-semibold mb-3 py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={activarVistaAñadir}
              >
                <span className="fs-5">+</span> Vincular Nueva Área
              </button>
            )}

            <div className="overflow-y-auto px-1 mb-5" style={{ maxHeight: "50vh", minHeight: "150px" }}>
              
              {/* ---------------- VISTA 1: LISTADO ACTUAL ---------------- */}
              {!vistaAñadir ? (
                loadingPadre ? (
                  <>
                    <section className="w-100 d-flex mb-2 align-items-center placeholder-glow">
                      <button className="placeholder col-2 rounded-3 me-3" style={{ height: "35px" }}></button>
                      <h4 className="placeholder col-8 rounded fs-6 m-0" style={{ height: "20px" }}></h4>
                    </section>
                  </>
                ) : listaSeguraAreas.length === 0 ? (
                  <p className="text-center text-muted my-4 small">Este servicio no tiene áreas asignadas todavía.</p>
                ) : (
                  listaSeguraAreas.map((item) => {
                    if (!item) return null;
                    const nombreMostrar = item.Aerea?.Nombre || item.Nombre || "Área sin nombre";
                    return (
                      <div key={item.Id} className="d-flex align-items-center justify-content-between py-2 border-bottom border-light-subtle">
                        <div>
                          <span className="fw-semibold text-dark d-block">{nombreMostrar}</span>
                          <span className="text-muted small">{item.Cupos || 0} Cupos establecidos</span>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={() => gestionarQuitarArea(item.Id, nombreMostrar)}
                        >
                          Quitar
                        </button>
                      </div>
                    );
                  })
                )
              ) : (
                /* ---------------- VISTA 2: AGREGAR NUEVAS ---------------- */
                loadingGlobales ? (
                  <>
                    <section className="w-100 d-flex mb-2 align-items-center placeholder-glow">
                      <button className="placeholder col-2 rounded-3 me-3" style={{ height: "35px" }}></button>
                      <h4 className="placeholder col-6 rounded fs-6 m-0" style={{ height: "20px" }}></h4>
                    </section>
                  </>
                ) : areasGlobales.length === 0 ? (
                  <p className="text-center text-muted my-4 small">Todas las áreas globales ya están agregadas.</p>
                ) : (
                  areasGlobales.map((global) => {
                    if (!global) return null;
                    return (
                      <div 
                        key={global.Id} 
                        className="d-flex align-items-center justify-content-between p-2 my-1 border rounded-3 bg-light-subtle"
                      >
                        <span className="fw-medium text-dark small">{global.Nombre}</span>
                        <button 
                          type="button" 
                          className="btn btn-sm bg-success text-white rounded-3"
                          onClick={() => gestionarAñadirArea(global)}
                        >
                          + Agregar
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Footer Dinámico para retroceder en la navegación interna */}
          {vistaAñadir && (
            <div className="modal-footer border-top-0 pt-0 pb-3">
              <button type="button" className="btn btn-secondary w-100 rounded-3 fw-medium" onClick={regresarAListaOriginal}>
                Volver a la Lista
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}