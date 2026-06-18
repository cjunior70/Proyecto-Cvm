import React, { useState, useEffect } from "react";
import { supabase } from "../../../Supabase/cliente"; // 📡 Ajusta la ruta a tu cliente de Supabase
import Swal from "sweetalert2";

export default function ModalCrearServicio({ isOpen, onClose, onExito }) {
  const [paso, setPaso] = useState(1); // Controla la fase activa: 1, 2 o 3

  // --- 📡 Estados de la Base de Datos (Áreas) ---
  const [areasDB, setAreasDB] = useState([]); // Almacena las áreas reales de Supabase
  const [cargandoAreas, setCargandoAreas] = useState(true);

  // --- 🎣 Estados del Formulario ---
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("");
  const [hora, setHora] = useState("07");
  const [minuto, setMinuto] = useState("00");
  const [periodo, setPeriodo] = useState("AM");
  const [comentario, setComentario] = useState("");
  
  // 🔢 Estado clave: Diccionario de cupos { [idArea]: numeroDeCupos }
  const [cuposPorArea, setCuposPorArea] = useState({}); 
  const [guardando, setGuardando] = useState(false);

  // 🔌 EFECTO: Consulta las áreas de la BD cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      const consultarAreas = async () => {
        try {
          setCargandoAreas(true);
          const { data, error } = await supabase
            .from("Aerea") 
            .select("*"); 

          if (error) throw error;
          
          setAreasDB(data || []);
          
          // Inicializamos todos los cupos en 0
          const estructuraInicial = {};
          data.forEach(area => {
            estructuraInicial[area.Id] = 0;
          });
          setCuposPorArea(estructuraInicial);

        } catch (error) {
          console.error("Error al traer las áreas de la BD:", error);
        } finally {
          setCargandoAreas(false);
        }
      };

      consultarAreas();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ➕ / ─ Incrementar o decrementar cupos dinámicamente
  const cambiarCupos = (idArea, delta) => {
    setCuposPorArea((prev) => {
      const actual = prev[idArea] || 0;
      const nuevoValor = Math.max(0, actual + delta); // Evita números negativos
      return { ...prev, [idArea]: nuevoValor };
    });
  };

  // 🔘 Botón Maestro: Poner a todas un valor por defecto (ej: 5 cupos) o resetear a 0
  const gestionarSeleccionarTodas = () => {
    const todasTienenCupos = areasDB.every(area => cuposPorArea[area.Id] > 0);
    
    const nuevaEstructura = {};
    areasDB.forEach(area => {
      // Si todas ya tenían cupos, las reseteamos a 0. Si no, les asignamos 5 por defecto.
      nuevaEstructura[area.Id] = todasTienenCupos ? 0 : 5;
    });
    setCuposPorArea(nuevaEstructura);
  };

  // Obtener array de áreas que tienen al menos 1 cupo asignado
  const obtenerAreasActivas = () => {
    return areasDB.filter(area => cuposPorArea[area.Id] > 0);
  };

  // ⏭️ Validar campos obligatorios y avanzar de fase
  const siguientePaso = () => {
    if (paso === 1 && (!fecha || !tipo)) {
      Swal.fire({
        title: "¡Campos vacíos!",
        text: "La Fecha y el Tipo de servicio son obligatorios.",
        icon: "warning",
        confirmButtonColor:"#6E4BDB"
      });
      return;
    }
    
    if (paso === 2 && obtenerAreasActivas().length === 0) {
      Swal.fire({
        title: "¡Ninguna área activa!",
        text: "Debes asignarle cupos al menos a un área para el servicio, mi rey.",
        icon: "warning",
        confirmButtonColor: "#0d6efd"
      });
      return;
    }

    setPaso((prev) => prev + 1);
  };

  const anteriorPaso = () => setPaso((prev) => prev - 1);

  // 📡 PROCESO DE GUARDADO COMPLETO (Servicio + Inyección con Cupos Reales)
  const manejarGuardarTodo = async () => {
    setGuardando(true);
    const jornadaUnificada = `${hora}:${minuto} ${periodo}`;
    const areasActivas = obtenerAreasActivas();

    try {
      // Paso 1: Insertar el servicio base en la tabla "Servicio"
      const { data: servicioCreado, error: errorServicio } = await supabase
        .from("Servicio")
        .insert([
          {
            Fecha: fecha,
            Tipo: tipo,
            Jornada: jornadaUnificada,
            Comentario: comentario || "Sin observaciones",
            Estado: "Pendiente"
          }
        ])
        .select();

      if (errorServicio) throw errorServicio;

      const nuevoServicioId = servicioCreado[0]?.Id;

      // Paso 2: 💉 Inyección relacional en la tabla intermedia "ServicioArea" con sus cupos
      if (areasActivas.length > 0 && nuevoServicioId) {
        const filasServicioArea = areasActivas.map((area) => ({
          IdServicio: nuevoServicioId,
          IdArea: area.Id,
          Cupos: cuposPorArea[area.Id], // 👈 Inyectamos el número real de cupos del estado
          Inscritos: 0
        }));

        const { error: errorIntermedia } = await supabase
          .from("ServicioArea")
          .insert(filasServicioArea);

        if (errorIntermedia) throw errorIntermedia;
      }

      // 🎉 Éxito en la transacción completa
      await Swal.fire({
        title: "¡Creado con éxito!",
        text: "El servicio y el aforo de sus áreas se guardaron correctamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      // Resetear estados del formulario
      setFecha("");
      setTipo("");
      setComentario("");
      setCuposPorArea({});
      setPaso(1);

      onExito(); 
      onClose(); 

    } catch (error) {
      console.error("Error en la transacción de guardado:", error);
      Swal.fire({
        title: "Error de Guardado",
        text: `Hubo un problema: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#dc3545"
      });
    } finally {
      setGuardando(false);
    }
  };

  const porcentajeProgreso = paso === 1 ? 33 : paso === 2 ? 66 : 100;

  return (
    <div className="modal d-block show" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "460px" }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          {/* 📶 ENCABEZADO Y BARRA DE PROGRESO */}
          <div className="p-4 bg-white pb-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{background:"#6E4BDB",  fontSize: "0.72rem" }}>
                Paso {paso} de 3
              </span>
              <button type="button" className="btn-close" onClick={onClose} disabled={guardando}></button>
            </div>
            
            <h5 className="fw-bold text-dark m-0 mb-3" style={{ fontSize: "1.2rem" }}>
              {paso === 1 && "1. Datos del Servicio"}
              {paso === 2 && "2. Configurar Cupos por Área"}
              {paso === 3 && "3. Confirmar Registro"}
            </h5>

            <div className="progress rounded-pill" style={{ height: "6px" }}>
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated" 
                style={{ width: `${porcentajeProgreso}%`, transition: "width 0.3s ease-in-out", background:"#60e899" }}
              ></div>
            </div>
          </div>

          {/* 🎢 CONTENEDOR DESLIZABLE */}
          <div className="position-relative overflow-hidden" style={{ height: "350px" }}>
            <div 
              className="d-flex w-100 h-100" 
              style={{ 
                transform: `translateX(-${(paso - 1) * 100}%)`, 
                transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)" 
              }}
            >
              
              {/* 🟩 PASO 1: DATOS BÁSICOS */}
              <div className="flex-shrink-0 w-100 h-100 px-4 overflow-y-auto">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Fecha del Servicio</label>
                  <input type="date" className="form-control rounded-3" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Tipo de Servicio</label>
                  <input type="text" className="form-control rounded-3" placeholder="Ej: General, Especial, Domingo" value={tipo} onChange={(e) => setTipo(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Horario / Jornada</label>
                  <div className="d-flex align-items-center gap-2">
                    <select className="form-select text-center rounded-3" value={hora} onChange={(e) => setHora(e.target.value)}>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="fw-bold text-muted">:</span>
                    <select className="form-select text-center rounded-3" value={minuto} onChange={(e) => setMinuto(e.target.value)}>
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="form-select text-center rounded-3" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 🟦 PASO 2: CONTROLES DE CUPOS DINÁMICOS */}
              <div className="flex-shrink-0 w-100 h-100 px-4 overflow-y-auto">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <p className="text-muted small m-0">Asigna cuántas personas necesitas por área:</p>
                  
                  {!cargandoAreas && areasDB.length > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-sm btn-link text-decoration-none fw-bold p-0" 
                      style={{ fontSize: "0.8rem" }}
                      onClick={gestionarSeleccionarTodas}
                    >
                      {areasDB.every(a => cuposPorArea[a.Id] > 0) ? "Resetear todas" : "Activar todas (5)"}
                    </button>
                  )}
                </div>

                {cargandoAreas ? (
                  <div className="d-flex justify-content-center align-items-center h-75">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span className="ms-2 small text-muted">Cargando áreas...</span>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2 pb-3">
                    {areasDB.map((area) => {
                      const cupos = cuposPorArea[area.Id] || 0;
                      const activa = cupos > 0;
                      
                      return (
                        <div 
                          key={area.Id}
                          className={`d-flex align-items-center justify-content-between p-2 px-3 rounded-3 border transition-all ${activa ? 'border-primary bg-primary-subtle text-primary fw-medium' : 'border-light-subtle bg-light text-secondary'}`}
                        >
                          <span style={{ fontSize: "0.9rem" }}>{area.Nombre}</span>
                          
                          {/* 🔢 Selector Numérico de Cupos */}
                          <div className="d-flex align-items-center gap-2">
                            <button 
                              type="button" 
                              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center"
                              style={{ width: "28px", height: "28px", fontWeight: "bold" }}
                              onClick={() => cambiarCupos(area.Id, -1)}
                            >
                              -
                            </button>
                            
                            <span className="text-center fw-bold" style={{ width: "25px", fontSize: "0.95rem" }}>
                              {cupos}
                            </span>
                            
                            <button 
                              type="button" 
                              className="btn btn-sm btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center"
                              style={{ width: "28px", height: "28px", fontWeight: "bold" }}
                              onClick={() => cambiarCupos(area.Id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 🟨 PASO 3: RESUMEN DE CONFIRMACIÓN CON DETALLE DE CUPOS */}
              <div className="flex-shrink-0 w-100 h-100 px-4 overflow-y-auto">
                <p className="text-muted small mb-2">Verifica la distribución antes de publicar:</p>
                
                <div className="bg-light rounded-3 p-3 border border-light-subtle mb-3" style={{ fontSize: "0.9rem" }}>
                  <div className="mb-1.5"><span className="text-muted">📅 Fecha:</span> <strong className="text-dark">{fecha}</strong></div>
                  <div className="mb-1.5"><span className="text-muted">⚡ Tipo:</span> <strong className="text-dark">{tipo}</strong></div>
                  <div className="mb-1.5"><span className="text-muted">🕒 Jornada:</span> <strong className="text-dark">{hora}:{minuto} {periodo}</strong></div>
                  <div className="mt-2 border-top pt-2">
                    <span className="text-muted d-block mb-1 font-monospace small">Aforos por Área:</span>
                    <div className="d-flex flex-wrap gap-1.5">
                      {obtenerAreasActivas().map(area => (
                        <span key={area.Id} className="badge bg-secondary rounded-pill font-medium" style={{ fontSize: "0.75rem" }}>
                          {area.Nombre}: {cuposPorArea[area.Id]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-semibold text-muted mb-1">Observaciones / Comentarios</label>
                  <textarea 
                    className="form-control rounded-3" 
                    rows="2" 
                    placeholder="Notas o avisos importantes..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  ></textarea>
                </div>
              </div>

            </div>
          </div>

          {/* 🕹️ CONTROL DE BOTONES INFERIORES */}
          <div className="modal-footer border-0 p-4 pt-2 gap-2 justify-content-between bg-white">
            {paso > 1 ? (
              <button type="button" className="btn btn-light border rounded-3 px-4 fw-semibold" onClick={anteriorPaso} disabled={guardando}>
                Atrás
              </button>
            ) : (
              <button type="button" className="btn btn-light border rounded-3 px-4 text-secondary" onClick={onClose}>
                Cancelar
              </button>
            )}

            {paso < 3 ? (
              <button type="button" className="btn rounded-3 px-4 fw-semibold text-white" style={{background:"#6E4BDB"}} onClick={siguientePaso} disabled={cargandoAreas}>
                Continuar
              </button>
            ) : (
              <button type="button" className="btn btn-success rounded-3 px-4 fw-semibold" onClick={manejarGuardarTodo} disabled={guardando}>
                {guardando ? "Publicando..." : "Confirmar y Guardar"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}