import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

const VistaDetalleCronograma = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { servicio } = location.state || {};

  const [equipo, setEquipo] = useState([]);
  const [todosLosServidores, setTodosLosServidores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");

  useEffect(() => {
    if (!servicio) navigate("/Homeadmin");
    else cargarEquipo();
  }, [servicio]);

  // 1. Cargar el equipo usando el RPC actualizado
  const cargarEquipo = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase.rpc("obtener_equipo_servicio", {
        p_servicio_id: servicio.Id,
      });
      if (error) throw error;
      setEquipo(data || []);
    } catch (error) {
      console.error("Error al cargar equipo:", error.message);
    } finally {
      setCargando(false);
    }
  };

  // 2. Abrir modal y cargar servidores
  const abrirModal = async (puesto) => {
    // Verificamos que el area_id venga del RPC
    if (!puesto.area_id) {
      Swal.fire('Error', 'No se recibió el ID del área. Verifica el RPC.', 'error');
      return;
    }

    setPuestoSeleccionado(puesto);
    setMostrarModal(true);
    setBuscando(true);
    setFiltroNombre("");

    try {
      const { data, error } = await supabase
        .from("Servidores")
        .select(`
          Id, Nombre, Foto, Rol,
          Servidor_Area ( Id, IdAerea, Aerea ( Nombre ) )
        `)
        .order("Nombre", { ascending: true });

      if (error) throw error;
      setTodosLosServidores(data || []);
    } catch (error) {
      console.error("Error al cargar servidores:", error.message);
    } finally {
      setBuscando(false);
    }
  };

  // 3. Lógica de inyección manual al cronograma
  const ejecutarAsignacion = async (servidor) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar asignación?',
      text: `¿Asignar a ${servidor.Nombre} para cubrir el área de ${puestoSeleccionado.area_nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    try {
      setCargando(true);
      const idAreaNecesaria = puestoSeleccionado.area_id;

      // A. Buscar si el servidor ya tiene esta área vinculada
      let relacion = servidor.Servidor_Area?.find(sa => sa.IdAerea === idAreaNecesaria);
      let idServidorArea = relacion?.Id;

      // B. Si no existe, crear la relación Servidor-Área al vuelo
      if (!idServidorArea) {
        const { data: nuevaRel, error: errRel } = await supabase
          .from("Servidor_Area")
          .insert([{ 
            IdServidor: servidor.Id, 
            IdAerea: idAreaNecesaria 
          }])
          .select().single();
        
        if (errRel) throw errRel;
        idServidorArea = nuevaRel.Id;
      }

      // C. Inyección al Cronograma
      const { error: errCron } = await supabase
        .from("Cronograma")
        .insert([{ 
          IdServicio: servicio.Id, 
          IdServidorAerea: idServidorArea 
        }]);

      if (errCron) throw errCron;

      // D. Éxito: Cerrar modal y refrescar
      setMostrarModal(false);
      await cargarEquipo(); 
      
      Swal.fire({
        icon: 'success',
        title: '¡Asignado!',
        text: 'El puesto ha sido cubierto correctamente.',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Fallo:", error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setCargando(false);
    }
  };

  const servidoresFiltrados = todosLosServidores.filter(s => 
    s.Nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  return (
    <div className="min-vh-100 bg-light pb-5">
      {/* Header Fijo */}
      <div className="bg-white border-bottom p-3 d-flex align-items-center sticky-top shadow-sm">
        <button className="btn btn-light rounded-circle me-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h6 className="fw-bold mb-0 text-uppercase">{servicio?.Tipo}</h6>
          <small className="text-muted">{servicio?.Fecha}</small>
        </div>
      </div>

      <div className="container py-4">
        {cargando && !mostrarModal ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="row g-3">
            {equipo.map((puesto) => (
              <div key={puesto.servicio_area_id} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body d-flex align-items-center p-3">
                    <img 
                      src={puesto.servidor_foto || `https://ui-avatars.com/api/?name=${puesto.area_nombre}&background=random`} 
                      className="rounded-circle border me-3" width="50" height="50" style={{objectFit: 'cover'}} 
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '9px'}}>{puesto.area_nombre}</small>
                      <h6 className="mb-0 fw-bold text-truncate">{puesto.esta_asignado ? puesto.servidor_nombre : "Puesto Vacante"}</h6>
                    </div>
                    <button 
                      className={`btn btn-sm rounded-pill px-3 fw-bold ${puesto.esta_asignado ? "btn-light border text-muted" : "btn-primary"}`} 
                      onClick={() => abrirModal(puesto)}
                    >
                      {puesto.esta_asignado ? "Cambiar" : "Asignar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Directorio */}
      {mostrarModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered mx-3">
            <div className="modal-content rounded-5 border-0 shadow-lg">
              <div className="modal-header border-0 p-4 pb-0">
                <h6 className="fw-bold mb-0">Directorio de Servidores</h6>
                <button className="btn-close shadow-none" onClick={() => setMostrarModal(false)}></button>
              </div>
              <div className="modal-body p-4 pt-3">
                <div className="input-group input-group-sm mb-3 bg-light rounded-pill px-3 py-2 border">
                  <span className="input-group-text bg-transparent border-0"><i className="bi bi-search"></i></span>
                  <input 
                    type="text" className="form-control bg-transparent border-0 shadow-none" 
                    placeholder="Buscar por nombre..." 
                    value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)}
                  />
                </div>

                <div className="list-group list-group-flush" style={{maxHeight: '350px', overflowY: 'auto'}}>
                  {buscando ? (
                    <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                  ) : servidoresFiltrados.length > 0 ? (
                    servidoresFiltrados.map(s => (
                      <button key={s.Id} className="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 rounded-4 bg-light py-3"
                              onClick={() => ejecutarAsignacion(s)}>
                        <img src={s.Foto || `https://ui-avatars.com/api/?name=${s.Nombre}`} className="rounded-circle me-3 border shadow-sm" width="40" height="40" />
                        <div className="text-start flex-grow-1">
                          <h6 className="mb-0 fw-bold small text-dark">{s.Nombre}</h6>
                          <small className="text-primary fw-medium" style={{fontSize: '10px'}}>
                            {s.Rol || "Servidor"}
                          </small>
                        </div>
                        <i className="bi bi-person-plus-fill text-primary fs-5"></i>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted">No se encontraron resultados.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaDetalleCronograma;