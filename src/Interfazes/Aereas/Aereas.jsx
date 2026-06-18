import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";
import Swal from "sweetalert2";

export default function Areas() {
  const [aereasGenerales, setAereasGenerales] = useState([]);
  const [misAereas, setMisAereas] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  const [carga, setCarga] = useState(false);
  const [bloqueado, setBloqueado] = useState(true);

  // ───── CARGAR DATOS ─────
  const cargarDatos = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const idServidor = authData.user.id;
    setIdUsuario(idServidor);

    try {
      const hoy = new Date().toISOString().split("T")[0];

      const [resMisAreas, resTodas, resControl] = await Promise.all([
        supabase
          .from("Servidor_Area")
          .select(`Aerea ( Id, Nombre, Descripcion, Foto )`)
          .eq("IdServidor", idServidor),

        supabase
          .from("Aerea")
          .select("Id, Nombre, Descripcion, Foto"),

        supabase
          .from("Control_Disponibilidad")
          .select("*")
          .lte("Fecha_apertura", hoy)
          .gte("Fecha_cierre", hoy)
          .limit(1)
      ]);

      const mis = resMisAreas.data?.map((i) => i.Aerea).filter(Boolean) || [];
      setMisAereas(mis);
      setAereasGenerales(resTodas.data || []);

      const activo = (resControl.data?.length || 0) > 0;
      setBloqueado(!activo);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCarga(true);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ───── REGISTRAR ÁREA ─────
  const registrarArea = async (area) => {
    if (bloqueado) {
      Swal.fire({
        icon: "warning",
        title: "Periodo Cerrado",
        text: "Actualmente no se permiten modificaciones en las áreas asignadas.",
        confirmButtonColor: "#6E4BDB"
      });
      return;
    }

    const result = await Swal.fire({
      title: "Confirmar Equipo",
      text: `¿Deseas registrarte en el área de ${area.Nombre}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, unirme",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#6E4BDB",
      cancelButtonColor: "#718096",
      borderRadius: "20px"
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("Servidor_Area").insert([
        { IdServidor: idUsuario, IdAerea: area.Id }
      ]);

      if (!error) {
        Swal.fire({
          title: "¡Bienvenido al Equipo!",
          text: `Te has registrado con éxito en ${area.Nombre}`,
          icon: "success",
          confirmButtonColor: "#6E4BDB"
        });
        cargarDatos();
      }
    }
  };

  // ───── ABANDONAR ÁREA (¡Ahora directo y moderno con SweetAlert2!) ─────
  const confirmarSalirArea = async (area) => {
    if (bloqueado) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "El periodo de edición está cerrado. No puedes abandonar áreas en este momento.",
        confirmButtonColor: "#6E4BDB"
      });
      return;
    }

    const result = await Swal.fire({
      title: `¿Abandonar equipo?`,
      text: `Ya no aparecerás programado en el área de ${area.Nombre}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Permanecer",
      confirmButtonColor: "#e53e3e",
      cancelButtonColor: "#718096",
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from("Servidor_Area")
        .delete()
        .eq("IdServidor", idUsuario)
        .eq("IdAerea", area.Id);

      if (!error) {
        Swal.fire({
          title: "Removido",
          text: `Has salido del equipo de ${area.Nombre}`,
          icon: "success",
          confirmButtonColor: "#6E4BDB"
        });
        cargarDatos();
      }
    }
  };

  const idsMisAreas = misAereas.map((a) => a.Id);
  const areasDisponibles = aereasGenerales.filter(
    (a) => !idsMisAreas.includes(a.Id)
  );

  if (!carga) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
        <div className="spinner-border text-primary" style={{ color: "#6E4BDB" }} />
      </div>
    );
  }

  return (
    <div className="min-vh-100 pb-5 animate__animated animate__fadeIn" style={{ backgroundColor: "#F8FAFC" }}>
      
      {/* 🔮 HEADER PREMIUM CON GRADIENTE DE LA MARCA */}
      <div className="text-white p-4 pb-5 rounded-bottom-5 shadow-sm" 
           style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" }}>
        <div className="container pt-2">
          <span className="badge bg-white bg-opacity-10 text-white rounded-pill px-3 py-1.5 mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
            <i className="bi bi-briefcase me-1"></i> GESTIÓN DE EQUIPOS
          </span>
          <h1 className="fw-extrabold tracking-tight">Mis Áreas</h1>
          <p className="text-white-50 small mb-0" style={{ maxWidth: '400px' }}>
            Selecciona y gestiona las áreas de servicio en las que deseas servir activamente en la comunidad.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: "-20px" }}>
        
        {/* 🚨 BANNER DE INFORMACIÓN DE ESTADO (Crucial para la UX) */}
        <div className={`card border-0 shadow-sm rounded-4 mb-4 p-3 ${bloqueado ? "bg-warning-subtle border-start border-warning border-3" : "bg-success-subtle border-start border-success border-3"}`}>
          <div className="d-flex align-items-center gap-3">
            <span className="fs-3">
              {bloqueado ? "🔒" : "🔓"}
            </span>
            <div>
              <h6 className="fw-bold mb-0 text-dark">
                {bloqueado ? "Periodo de edición cerrado" : "¡Postulaciones abiertas!"}
              </h6>
              <span className="text-muted" style={{ fontSize: '11px' }}>
                {bloqueado 
                  ? "Las áreas están fijadas para el próximo servicio. No se admiten cambios." 
                  : "Puedes unirte o remover áreas libremente para los próximos cronogramas, esto no significa que el admin puede asignarte aereas nuevas."}
              </span>
            </div>
          </div>
        </div>

        {/* 🌟 SECCIÓN 1: MIS ÁREAS ASIGNADAS */}
        <div className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold text-slate-800 mb-0 d-flex align-items-center gap-2">
              📂 Mis áreas asignadas 
              <span className="badge bg-secondary-subtle text-secondary rounded-pill" style={{ fontSize: '11px' }}>
                {misAereas.length}
              </span>
            </h5>
          </div>

          {misAereas.length === 0 ? (
            /* Estado vacío bonito */
            <div className="text-center p-4 bg-white rounded-4 shadow-sm border border-dashed border-2">
              <span className="fs-1 d-block mb-2">👋</span>
              <h6 className="fw-bold text-secondary mb-1">Aún no perteneces a ningún área</h6>
              <p className="text-muted small mb-0">Revisa las opciones disponibles abajo para unirte a un equipo.</p>
            </div>
          ) : (
            /* Lista interactiva moderna */
            <div className="row g-3">
              {misAereas.map((area) => (
                <div key={area.Id} className="col-12 col-md-6">
                  <div className="card border-0 shadow-sm rounded-4 p-3 h-100 d-flex flex-row align-items-center justify-content-between bg-white overflow-hidden position-relative">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-3 overflow-hidden shadow-sm" style={{ width: "50px", height: "50px" }}>
                        <img 
                          src={area.Foto || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=100"} 
                          className="w-100 h-100 object-fit-cover" 
                          alt={area.Nombre} 
                        />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">{area.Nombre}</h6>
                        <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '180px' }}>
                          {area.Descripcion || "Sin descripción disponible."}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-sm rounded-3 px-3 fw-bold transition-all"
                      disabled={bloqueado}
                      style={{
                        backgroundColor: bloqueado ? "#EDF2F7" : "#FEE2E2",
                        color: bloqueado ? "#A0AEC0" : "#EF4444",
                        border: "none"
                      }}
                      onClick={() => confirmarSalirArea(area)}
                    >
                      {bloqueado ? "Fijo" : "Salir"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🚀 SECCIÓN 2: ÁREAS DISPONIBLES PARA UNIRSE */}
        <div>
          <h5 className="fw-bold text-slate-800 mb-3">
            ✨ Áreas disponibles para servir
          </h5>

          {areasDisponibles.length === 0 ? (
            <div className="text-center p-4 bg-white rounded-4 shadow-sm">
              <p className="text-muted small mb-0">🎉 ¡Ya estás registrado en todas las áreas disponibles!</p>
            </div>
          ) : (
            /* Grid vertical scaneable en móviles, no carrusel molesto */
            <div className="row g-3">
              {areasDisponibles.map((area) => (
                <div 
                  key={area.Id} 
                  className="col-6 col-md-4 col-lg-3"
                  style={{
                    opacity: bloqueado ? 0.5 : 1,
                    pointerEvents: bloqueado ? "none" : "auto",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white card-touch-effect position-relative">
                    <AreaCard
                      area={area}
                      mostrarBoton={!bloqueado}
                      onRegistrar={() => registrarArea(area)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}