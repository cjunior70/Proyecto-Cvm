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
      {/* HEADER PREMIUM DARK */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-outline-light rounded-circle border-0" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <span className="fw-bold tracking-tight text-uppercase small" style={{ letterSpacing: '1px' }}>
            Gestión de Equipo
          </span>
        </div>
        
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h2 className="fw-bold mb-0 text-capitalize">{servicio?.Tipo}</h2>
            <div className="d-flex align-items-center gap-2 opacity-75 small">
              <i className="bi bi-calendar3"></i>
              <span>{servicio?.Fecha}</span>
              <span className="mx-1">•</span>
              <i className="bi bi-clock"></i>
              <span>{servicio?.Jornada}</span>
            </div>
          </div>
          <div className="bg-primary p-3 rounded-4 shadow-sm">
            <i className="bi bi-people-fill fs-3 text-white"></i>
          </div>
        </div>
      </div>

      {/* SUBTÍTULO INFORMATIVO */}
      <div className="container" style={{ marginTop: '-20px' }}>
        <div className="card border-0 shadow-sm rounded-pill py-2 px-4 mb-4 bg-white text-center">
          <small className="text-muted fw-medium">
            <i className="bi bi-info-circle-fill me-2 text-primary"></i>
            Asigna servidores a cada área para completar el cronograma.
          </small>
        </div>

        {/* CONTENEDOR DE EQUIPO */}
        {cargando && !mostrarModal ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <p className="mt-3 text-muted">Cargando servidores...</p>
          </div>
        ) : (
          <div className="row g-3">
            {equipo.map((puesto) => (
              <div key={puesto.servicio_area_id} className="col-12">
                <div className={`card border-0 shadow-sm rounded-4 overflow-hidden ${!puesto.esta_asignado ? 'border-start border-warning border-4' : ''}`}>
                  <div className="card-body d-flex align-items-center p-3">
                    {/* AVATAR CON ESTADO */}
                    <div className="position-relative">
                      <img 
                        src={puesto.servidor_foto || `https://ui-avatars.com/api/?name=${puesto.area_nombre}&background=random`} 
                        className="rounded-circle border border-2 shadow-sm" 
                        width="55" height="55" style={{objectFit: 'cover'}} 
                      />
                      <span className={`position-absolute bottom-0 end-0 p-1 border border-light rounded-circle ${puesto.esta_asignado ? 'bg-success' : 'bg-warning'}`}></span>
                    </div>

                    <div className="flex-grow-1 overflow-hidden ms-3">
                      <small className="text-primary fw-bold d-block text-uppercase" style={{fontSize: '10px', letterSpacing: '0.5px'}}>
                        {puesto.area_nombre}
                      </small>
                      <h6 className={`mb-0 fw-bold text-truncate ${!puesto.esta_asignado ? 'text-muted fst-italic' : 'text-dark'}`}>
                        {puesto.esta_asignado ? puesto.servidor_nombre : "Puesto Vacante"}
                      </h6>
                    </div>

                    <button 
                      className={`btn rounded-pill px-4 fw-bold shadow-sm transition-all ${
                        puesto.esta_asignado 
                          ? "btn-light border text-muted btn-sm" 
                          : "btn-primary btn-sm"
                      }`} 
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

      {/* MODAL DIRECTORIO (DISEÑO GLASSMORPHISM) */}
      {mostrarModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="modal-dialog modal-dialog-centered mx-3">
            <div className="modal-content rounded-5 border-0 shadow-2xl overflow-hidden">
              <div className="bg-dark p-4 text-white border-0 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold mb-0">Seleccionar Servidor</h6>
                  <small className="opacity-75">Buscando para: {puestoSeleccionado?.area_nombre}</small>
                </div>
                <button className="btn-close btn-close-white shadow-none" onClick={() => setMostrarModal(false)}></button>
              </div>

              <div className="modal-body p-4 pt-4 bg-white">
                {/* BUSCADOR ESTILO MODERNO */}
                <div className="input-group bg-light rounded-4 px-3 py-1 border mb-4 focus-within-primary">
                  <span className="input-group-text bg-transparent border-0 text-muted"><i className="bi bi-search"></i></span>
                  <input 
                    type="text" className="form-control bg-transparent border-0 shadow-none py-2" 
                    placeholder="Escribe un nombre..." 
                    value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)}
                  />
                </div>

                <div className="list-group list-group-flush custom-scroll" style={{maxHeight: '380px', overflowY: 'auto'}}>
                  {buscando ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                  ) : servidoresFiltrados.length > 0 ? (
                    servidoresFiltrados.map(s => (
                      <button 
                        key={s.Id} 
                        className="list-group-item list-group-item-action d-flex align-items-center border-0 mb-2 rounded-4 bg-light py-3 animate-fade-in"
                        onClick={() => ejecutarAsignacion(s)}
                      >
                        <img src={s.Foto || `https://ui-avatars.com/api/?name=${s.Nombre}`} className="rounded-circle me-3 border shadow-sm" width="45" height="45" />
                        <div className="text-start flex-grow-1">
                          <h6 className="mb-0 fw-bold text-dark">{s.Nombre}</h6>
                          <small className="text-primary fw-medium" style={{fontSize: '11px'}}>
                            {s.Rol || "Servidor Activo"}
                          </small>
                        </div>
                        <div className="bg-white rounded-circle p-2 shadow-sm text-primary">
                          <i className="bi bi-plus-lg"></i>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-5 opacity-50">
                      <i className="bi bi-emoji-frown fs-1"></i>
                      <p className="mt-2">No encontramos a ese servidor.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS ADICIONAL */}
      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
        .animate-fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .focus-within-primary:focus-within { border-color: #0d6efd !important; box-shadow: 0 0 0 0.25rem rgba(13,110,253,.1); }
      `}</style>
    </div>
  );
}
export default VistaDetalleCronograma;