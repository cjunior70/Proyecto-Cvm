import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../../Supabase/cliente"; // 📡 Asegúrate de ajustar esta ruta a tu cliente de Supabase

// 🖼️ Tus Imágenes e Iconos
import IrParaAtras from "../../Imagenes/IrParaAtras.svg";
import Calendario from "../../Imagenes/Calendario.svg";
import Tiempo from "../../Imagenes/Tiempo.svg";
import Lapiz from "../../Imagenes/Lapiz.svg";
import Localizacion from "../../Imagenes/Localizacion.svg";

// 🧱 Tus Componentes Hijos
import AereasDisponibles from "../Componentes/AreasDisponibles";
import ListaDeServidoresApuntados from "../Componentes/ListaDeServidoresApuntados";
import ModalGestionAreas from "./../Componentes/ModalGestionAreas";

// ⚙️ Tus Consultas Lógicas
import { ObtenerAreasConNombres } from "../Home/ObtenerAreasConNombres";
import { ObtenerServidoresDelServicio } from "../Home/ObtenerServidoresDelServicio";
import { actualizarInformacionBase } from "../Servicios/actualizarInformacionBase";

export default function DetallesServicio() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🎣 Estado dinámico para el servicio (así cambia visualmente en tiempo real)
  const [datosServicio, setDatosServicio] = useState(
    location.state?.servicio || {},
  );
  const [DatosAereas, setDatosAereas] = useState([]);
  const [DatosPersonal, setDatosPersonal] = useState([]);
  const [loading, setLoading] = useState(true);

  const Volver = () => {
    navigate(`/Servicios`);
  };

  // 🚀 FUNCIÓN COMPARTIDA: Carga e integra la data fresca en caliente
  async function cargarData() {
    if (!datosServicio?.Id) return;

    const data = await ObtenerAreasConNombres(datosServicio.Id);
    setDatosAereas(data || []);

    const data2 = await ObtenerServidoresDelServicio(datosServicio.Id);
    setDatosPersonal(data2 || []);
  }

  useEffect(() => {
    async function inicializarPantalla() {
      setLoading(true);
      await cargarData();
      setTimeout(() => {
        setLoading(false);
      }, 1200);
    }
    inicializarPantalla();
  }, [datosServicio?.Id]);

  // 🗑️ ACCIÓN: Elimina el servicio completo usando la estética de SweetAlert2
  const gestionarEliminarServicio = async () => {
    const resultadoConfirmacion = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Vas a eliminar el servicio del día ${datosServicio?.Fecha || ""}. Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545", // Rojo peligro
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminarlo",
      cancelButtonText: "Cancelar",
    });

    // Si el usuario confirma la acción
    if (resultadoConfirmacion.isConfirmed) {
      Swal.fire({
        title: "Eliminando servicio...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        // Ejecutamos el delete en Supabase. Ajusta el nombre "Servicios" por el real de tu tabla si varía
        const { error } = await supabase
          .from("Servicio")
          .delete()
          .eq("Id", datosServicio.Id);

        if (error) throw error;

        await Swal.fire({
          title: "¡Eliminado!",
          text: "El servicio ha sido removido del cronograma con éxito.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Retornamos al panel de administración limpio
        Volver();
      } catch (error) {
        console.error("Error borrando servicio:", error);
        Swal.fire({
          title: "Error",
          text: `No se pudo eliminar el servicio: ${error.message}`,
          icon: "error",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#0d6efd",
        });
      }
    }
  };

  // ✍️ ACCIÓN: Abre el formulario SweetAlert con horario segmentado en 3 (Hora, Min, Período)
  const gestionarEditarInfoBase = async () => {
    let horaActual = "07";
    let minutoActual = "00";
    let periodoActual = "AM";

    if (datosServicio?.Jornada) {
      const coincidence = datosServicio.Jornada.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (coincidence) {
        horaActual = coincidence[1].padStart(2, "0");
        minutoActual = coincidence[2].padStart(2, "0");
        periodoActual = coincidence[3].toUpperCase();
      }
    }

    const opcionesHoras = Array.from({ length: 12 }, (_, i) =>
      String(i + 1).padStart(2, "0"),
    )
      .map(
        (h) =>
          `<option value="${h}" ${h === horaActual ? "selected" : ""}>${h}</option>`,
      )
      .join("");

    const opcionesMinutos = Array.from({ length: 60 }, (_, i) =>
      String(i).padStart(2, "0"),
    )
      .map(
        (m) =>
          `<option value="${m}" ${m === minutoActual ? "selected" : ""}>${m}</option>`,
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "Editar Información Básica",
      html: `
        <div class="text-start fs-6">
          <label class="form-label fw-semibold text-muted mb-1">Fecha del Servicio</label>
          <input id="swal-fecha" type="date" class="form-control mb-3 rounded-3" value="${datosServicio?.Fecha || ""}">
          
          <label class="form-label fw-semibold text-muted mb-1">Tipo de Servicio</label>
          <input id="swal-tipo" type="text" class="form-control mb-3 rounded-3" placeholder="Ej: General, Especial" value="${datosServicio?.Tipo || ""}">

          <!-- 🕒 SELECTORES SEGMENTADOS DE HORARIO -->
          <label class="form-label fw-semibold text-muted mb-1">Horario / Jornada</label>
          <div class="d-flex align-items-center gap-2 mb-3">
            <div style="flex: 1;">
              <select id="swal-hora" class="form-select rounded-3 text-center">
                ${opcionesHoras}
              </select>
              <small class="text-muted d-block text-center mt-1" style="font-size: 0.7rem;">Hora</small>
            </div>
            
            <div class="fw-bold fs-5 mb-3">:</div>
            
            <div style="flex: 1;">
              <select id="swal-minuto" class="form-select rounded-3 text-center">
                ${opcionesMinutos}
              </select>
              <small class="text-muted d-block text-center mt-1" style="font-size: 0.7rem;">Minutos</small>
            </div>
            
            <div style="flex: 1;" class="ms-1">
              <select id="swal-periodo" class="form-select rounded-3 text-center">
                <option value="AM" ${periodoActual === "AM" ? "selected" : ""}>AM</option>
                <option value="PM" ${periodoActual === "PM" ? "selected" : ""}>PM</option>
              </select>
              <small class="text-muted d-block text-center mt-1" style="font-size: 0.7rem;">Período</small>
            </div>
          </div>
          
          <label class="form-label fw-semibold text-muted mb-1">Observaciones / Comentario</label>
          <textarea id="swal-comentario" class="form-control rounded-3" rows="2" placeholder="Notas sobre la locación...">${datosServicio?.Comentario || ""}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar Cambios",
      confirmButtonColor: "#6E4BDB",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const fecha = document.getElementById("swal-fecha").value;
        const tipo = document.getElementById("swal-tipo").value;
        const hora = document.getElementById("swal-hora").value;
        const minuto = document.getElementById("swal-minuto").value;
        const periodo = document.getElementById("swal-periodo").value;
        const comentario = document.getElementById("swal-comentario").value;

        if (!fecha || !tipo) {
          Swal.showValidationMessage("¡Fecha y Tipo son obligatorios!");
          return false;
        }

        const jornadaUnificada = `${hora}:${minuto} ${periodo}`;

        return {
          Fecha: fecha,
          Tipo: tipo,
          Jornada: jornadaUnificada,
          Comentario: comentario,
        };
      },
    });

    if (formValues) {
      Swal.fire({
        title: "Actualizando servicio...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const exito = await actualizarInformacionBase(
        datosServicio.Id,
        formValues,
      );

      if (exito) {
        setDatosServicio((prev) => ({
          ...prev,
          ...formValues,
        }));

        Swal.fire({
          title: "¡Modificado!",
          text: "La información del servicio se actualizó correctamente.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          title: "Error",
          text: "No se pudieron guardar los cambios en la base de datos.",
          icon: "error",
          confirmButtonText: "Entendido",
        });
      }
    }
  };

  return (
    <>
      <section className="m-2">
        {/* ----------------- Capa del título ----------------- */}
        <section className="w-100 d-flex mb-2 mt-2">
          {loading ? (
            <>
              <section className="w-25 placeholder-glow">
                <button
                  className="placeholder col-12 rounded"
                  style={{ height: "35px" }}
                ></button>
              </section>
              <section className="w-75 ms-4 placeholder-glow">
                <h4
                  className="placeholder col-6 rounded"
                  style={{ height: "24px" }}
                ></h4>
              </section>
            </>
          ) : (
            <>
              <section className="w-25">
                <button
                  onClick={Volver}
                  className="border-0 rounded-4 bg-transparent p-0"
                  style={{ cursor: "pointer" }}
                >
                  <img src={IrParaAtras} className="w-25" alt="Volver" />
                </button>
              </section>
              <section className="w-75 ms-4">
                <h4 className="fw-bold text-dark m-0">Servicio del día</h4>
              </section>
            </>
          )}
        </section>

        {/* ----------------- Capa secundaria de información ----------------- */}
        <section className="w-100 mt-1">
          {loading ? (
            <>
              <section className="d-flex flex-column mt-1 w-100 border rounded-4 p-2 placeholder-glow">
                <section className="w-100">
                  <h3
                    className="placeholder col-8 rounded mb-2"
                    style={{ height: "20px" }}
                  ></h3>
                  <h3
                    className="placeholder col-5 rounded mb-2"
                    style={{ height: "20px" }}
                  ></h3>
                </section>
              </section>
              <section className="mt-2 placeholder-glow">
                <button
                  className="placeholder col-12 rounded"
                  style={{ height: "180px" }}
                ></button>
              </section>
            </>
          ) : (
            <>
              {/* Tarjeta de Datos básicos del servicio */}
              <section className="d-flex flex-column mt-1 w-100 border rounded-4 p-3 shadow-sm bg-white position-relative">
                {/* 🛠️ CONTROLES SUPERIORES: EDITAR Y ELIMINAR JUNTOS */}
                <div className="position-absolute end-0 top-0 m-2 d-flex gap-2">
                  {/* ✏️ Botón Editar */}
                  <button
                    onClick={gestionarEditarInfoBase}
                    className="border-0 bg-light rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm"
                    style={{ width: "35px", height: "35px", cursor: "pointer" }}
                    title="Editar info básica"
                  >
                    <img
                      src={Lapiz}
                      style={{ width: "16px" }}
                      alt="Editar info"
                    />
                  </button>

                  {/* 🗑️ Botón Eliminar */}
                  <button
                    onClick={gestionarEliminarServicio}
                    className="border-0 bg-danger-subtle rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm transition-all"
                    style={{ width: "35px", height: "35px", cursor: "pointer" }}
                    title="Eliminar este servicio"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      fill="#dc3545"
                      className="bi bi-trash3-fill"
                      viewBox="0 0 16 16"
                    >
                      <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.06a.5.5 0 1 0-.998.06l.5 8.5a.5.5 0 1 0 .998-.06L11.03 5l-.03-.029z" />
                    </svg>
                  </button>
                </div>

                <section className="w-100 d-flex flex-column gap-2 pe-5 me-2">
                  <section className="d-flex align-items-center">
                    <img
                      src={Calendario}
                      style={{ width: "7vw", maxHeight: "28px" }}
                      alt=""
                    />
                    <h5 className="ms-3 my-0 fs-6 fw-semibold text-dark">
                      {datosServicio?.Fecha} /{" "}
                      <span className="text-primary">
                        {datosServicio?.Tipo}
                      </span>
                    </h5>
                  </section>

                  <section className="d-flex align-items-center">
                    <img
                      src={Tiempo}
                      style={{ width: "7vw", maxHeight: "28px" }}
                      alt=""
                    />
                    <h5 className="ms-3 my-0 fs-6 text-secondary">
                      {datosServicio?.Jornada}
                    </h5>
                  </section>

                  <section className="d-flex align-items-center">
                    <img
                      src={Localizacion}
                      style={{ width: "7vw", maxHeight: "28px" }}
                      alt=""
                    />
                    <h5 className="ms-3 my-0 fs-6 text-muted font-monospace">
                      {datosServicio?.Comentario || "Sin observaciones"}
                    </h5>
                  </section>
                </section>

                <section className="w-100 d-flex justify-content-end mt-2 border-top pt-2">
                  <span className="badge text-bg-success rounded-pill px-3 py-1.5 small">
                    {datosServicio?.Estado}
                  </span>
                </section>
              </section>

              {/* 📊 Sección: Áreas Disponibles */}
              <section className="mt-4">
  <div className="d-flex justify-content-between align-items-center mb-3 px-1">
    <h6 className="m-0 fw-bold text-dark fs-5">
      Áreas Disponibles
    </h6>
    <button
      type="button"
      data-bs-toggle="modal"
      data-bs-target={`#modal-areas-${datosServicio?.Id}`}
      className="d-flex align-items-center justify-content-center border-0 shadow-sm rounded-circle"
      style={{
        cursor: "pointer",
        width: "38px",
        height: "38px",
        backgroundColor: "#EDE9FE", // Color suave corporativo
      }}
    >
      <img
        src={Lapiz}
        style={{ width: "16px" }}
        alt="Editar Áreas"
      />
    </button>
  </div>

  {/* Contenedor tipo tarjeta con esquinas redondeadas y sombra suave */}
  <section
    className="bg-white rounded-4 shadow-sm border-0 p-2 overflow-y-auto overflow-x-hidden"
    style={{ maxHeight: "350px" }}
  >
    {DatosAereas.length === 0 ? (
      <div className="text-center py-4">
        <p className="text-muted small m-0">
          No hay áreas vinculadas actualmente.
        </p>
      </div>
    ) : (
      <div className="d-flex flex-column">
        {/* 🔥 LA MAGIA DE LA LÓGICA REUTILIZADA:
          Clonamos 'DatosAereas' y lo ordenamos dinámicamente antes del render.
          Busca 'Orden' o 'orden' por seguridad; si viene null o undefined, usa 999.
        */}
        {[...DatosAereas]
          .sort((a, b) => {
            const ordenA = a.Orden !== undefined && a.Orden !== null ? a.Orden : (a.orden !== undefined && a.orden !== null ? a.orden : 999);
            const ordenB = b.Orden !== undefined && b.Orden !== null ? b.Orden : (b.orden !== undefined && b.orden !== null ? b.orden : 999);
            return ordenA - ordenB;
          })
          .map((item) => (
            <AereasDisponibles
              key={item.Id}
              DatosAreas={item}
              DatosServicio={datosServicio}
            />
          ))
        }
      </div>
    )}
  </section>
</section>

              {/* 👥 Sección: Servidores Apuntados */}
              <section className="mt-4 border-4 m-1 ">
                <h6 className="fw-bold text-dark fs-5 mb-2">
                  Servidores Apuntados ({DatosPersonal?.length || 0})
                </h6>
                <section
                  className="border border-light-subtle border-2 rounded overflow-y-auto overflow-x-hidden bg-white shadow-sm p-2"
                  style={{ maxHeight: "46vw" }}
                >
                  {DatosPersonal.length === 0 ? (
                    <p className="text-center text-muted py-4 my-0 small">
                      Ningún servidor inscrito en este servicio.
                    </p>
                  ) : (
                    DatosPersonal.map((item) => (
                      <ListaDeServidoresApuntados
                        key={item.Id}
                        DatosDelPersonal={item}
                      />
                    ))
                  )}
                </section>
              </section>
            </>
          )}
        </section>
      </section>

      {/* 🏛️ Modal de Gestión de Áreas */}
      {datosServicio?.Id && (
        <ModalGestionAreas
          idServicio={datosServicio.Id}
          areasActuales={DatosAereas}
          loadingPadre={loading}
          onActualizacionExitosa={cargarData}
          servidoresApuntados={DatosPersonal}
        />
      )}
    </>
  );
}
