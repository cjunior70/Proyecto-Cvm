import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";
import Swal from "sweetalert2";

export default function Areas() {
  const [aereasGenerales, setAereasGenerales] = useState([]);
  const [misAereas, setMisAereas] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  const [carga, setCarga] = useState(false);

  // ───── MODAL QUITAR/DETALLES ─────
  const [mostrarModalQuitar, setMostrarModalQuitar] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);

  const cargarDatos = async () => {
    // 1. Obtenemos el usuario (única dependencia)
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const idServidor = authData.user.id;
    setIdUsuario(idServidor);

    try {
      // 2. Ejecutamos ambas consultas al mismo tiempo
      const [resMisAreas, resTodas] = await Promise.all([
        supabase
          .from("Servidor_Area")
          .select(`Aerea ( Id, Nombre, Descripcion, Foto )`)
          .eq("IdServidor", idServidor),
        supabase
          .from("Aerea")
          .select("Id, Nombre, Descripcion, Foto") // Solo campos necesarios
      ]);

      // 3. Procesamos los resultados
      const mapeadas = resMisAreas.data?.map((i) => i.Aerea).filter(a => a !== null) || [];
      
      setMisAereas(mapeadas);
      setAereasGenerales(resTodas.data || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCarga(true);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ───── REGISTRARSE EN ÁREA ─────
  const registrarArea = async (area) => {
    const result = await Swal.fire({
      title: '¿Confirmar registro?',
      text: `¿Estás seguro de que quieres atender el área de ${area.Nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, acepto el área',
      confirmButtonColor: '#0d6efd'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("Servidor_Area").insert([
        { IdServidor: idUsuario, IdAerea: area.Id }
      ]);

      if (!error) {
        Swal.fire('¡Registrado!', 'Ahora eres responsable de esta área.', 'success');
        cargarDatos();
      }
    }
  };

  // ───── QUITAR ÁREA ─────
  const abrirModalQuitar = (area) => {
    setAreaSeleccionada(area);
    setMostrarModalQuitar(true);
  };

  const salirArea = async () => {
    const { error } = await supabase
      .from("Servidor_Area")
      .delete()
      .eq("IdServidor", idUsuario)
      .eq("IdAerea", areaSeleccionada.Id);

    if (!error) {
      setMostrarModalQuitar(false);
      setAreaSeleccionada(null);
      cargarDatos();
    }
  };

  // ───── LÓGICA DE FILTRADO ─────
  const idsMisAreas = misAereas.map((a) => a.Id);
  const areasDisponibles = aereasGenerales.filter(
    (a) => !idsMisAreas.includes(a.Id)
  );

  if (!carga) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
  <div className="min-vh-100 bg-light pb-5">
    {/* HEADER PREMIUM DARK */}
    <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-light rounded-circle border-0" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left fs-4"></i>
        </button>
        <span className="fw-bold tracking-tight text-uppercase small" style={{ letterSpacing: '1px' }}>
          Configuración de Cuenta
        </span>
      </div>
      
      <div className="d-flex justify-content-between align-items-end">
        <div>
          <h2 className="fw-bold mb-0">Mis Equipos</h2>
          <p className="opacity-75 small mb-0">Gestiona las áreas donde deseas servir.</p>
        </div>
        <div className="bg-primary rounded-4 p-2 shadow-lg animate__animated animate__pulse animate__infinite">
          <i className="bi bi-person-workspace fs-4"></i>
        </div>
      </div>
    </div>

    <div className="container" style={{ marginTop: '-25px' }}>
      
      {/* SECCIÓN 1: MIS ÁREAS (Carrusel Premium) */}
      <div className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-3 px-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-check-circle-fill text-primary me-2"></i>
            <h6 className="fw-bold m-0 text-dark text-uppercase small tracking-wider">Mis áreas asignadas</h6>
          </div>
          <span className="badge rounded-pill bg-primary-subtle text-primary px-3">
            {misAereas.length}
          </span>
        </div>

        <div className="d-flex gap-3 overflow-auto pb-3 ps-2 custom-scrollbar hide-scrollbar-on-mobile">
          {misAereas.length === 0 ? (
            <div className="card card-body border-dashed text-center py-5 rounded-5 bg-white w-100 shadow-sm">
              <i className="bi bi-plus-circle opacity-25 fs-1 mb-2"></i>
              <p className="text-muted small fw-medium">Aún no te has unido a ningún equipo.</p>
            </div>
          ) : (
            misAereas.map((area) => (
              <div
                key={area.Id}
                className="flex-shrink-0 card-touch-effect"
                style={{ width: "240px" }}
                onClick={() => abrirModalQuitar(area)}
              >
                <div className="card border-0 shadow-sm rounded-5 overflow-hidden position-relative h-100 border-2-hover-primary">
                  <AreaCard area={area} />
                  {/* Overlay sutil para indicar que es clickeable */}
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className="badge rounded-circle bg-dark bg-opacity-50 p-2">
                      <i className="bi bi-gear-fill"></i>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 2: ÁREAS DISPONIBLES */}
      <section className="animate__animated animate__fadeInUp">
        <div className="d-flex align-items-center mb-3 px-2">
          <i className="bi bi-plus-circle-dotted text-secondary me-2"></i>
          <h6 className="fw-bold m-0 text-dark text-uppercase small tracking-wider">Explorar nuevas áreas</h6>
        </div>

        <div className="d-flex gap-3 overflow-auto pb-3 ps-2 custom-scrollbar">
          {areasDisponibles.length === 0 ? (
            <div className="p-4 text-center w-100">
              <p className="text-muted small">¡Felicidades! Ya eres parte de todos los equipos disponibles.</p>
            </div>
          ) : (
            areasDisponibles.map((area) => (
              <div key={area.Id} className="flex-shrink-0 card-touch-effect" style={{ width: "240px" }}>
                <div className="card border-0 shadow-sm rounded-5 overflow-hidden h-100">
                  <AreaCard
                    area={area}
                    mostrarBoton={true}
                    onRegistrar={() => registrarArea(area)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* MODAL QUITAR ÁREA (GLASSMORPHISM) */}
      {mostrarModalQuitar && areaSeleccionada && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,.7)", backdropFilter: "blur(10px)" }}>
          <div className="modal-dialog modal-dialog-centered px-3">
            <div className="modal-content border-0 rounded-5 shadow-2xl animate__animated animate__zoomIn animate__faster overflow-hidden">
              <div className="position-relative">
                <img
                  src={areaSeleccionada.Foto || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=500'}
                  className="w-100 shadow-sm"
                  style={{ height: "220px", objectFit: "cover" }}
                />
                <div className="position-absolute bottom-0 start-0 w-100 p-4 bg-gradient-dark-transparent">
                  <h4 className="fw-bold text-white m-0">{areaSeleccionada.Nombre}</h4>
                </div>
                <button 
                  className="btn-close btn-close-white position-absolute top-0 end-0 m-3 shadow-none" 
                  onClick={() => setMostrarModalQuitar(false)} 
                />
              </div>

              <div className="modal-body p-4 bg-white">
                <p className="text-secondary small leading-relaxed mb-4">
                  {areaSeleccionada.Descripcion || "Este equipo está esperando por tu talento. Revisa tus cronogramas después de unirte."}
                </p>
                
                <div className="d-flex flex-column gap-2">
                   <button className="btn btn-danger rounded-pill py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={salirArea}>
                    <i className="bi bi-box-arrow-right"></i> Abandonar este equipo
                  </button>
                  <button className="btn btn-light rounded-pill py-3 fw-bold text-muted border-0" onClick={() => setMostrarModalQuitar(false)}>
                    Mantener asignación
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
        .border-dashed { border: 2px dashed #dee2e6; }
        .tracking-wider { letter-spacing: 1.5px; }
        .bg-gradient-dark-transparent { background: linear-gradient(transparent, rgba(0,0,0,0.8)); }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .card-touch-effect { transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .card-touch-effect:active { transform: scale(0.95); }
        .border-2-hover-primary { border: 2px solid transparent !important; transition: 0.3s; }
        .border-2-hover-primary:hover { border-color: #0d6efd !important; }
        
        @media (max-width: 768px) {
          .hide-scrollbar-on-mobile::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
    </div>
  );
}