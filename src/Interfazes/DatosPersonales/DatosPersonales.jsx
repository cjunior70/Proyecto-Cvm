import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente.js";
import { CerrarSeccion } from "../../../Supabase/CerrarSeccion.js";
import { useNavigate } from "react-router-dom";


export default function DatosPersonales() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  //Fucnion para poder cerrar la seccion
  const handleCerrarSesion = async () => {
    const ok = await CerrarSeccion();
    if (ok) {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        return;
      }
      setUser(data.user);
    };

    getUser();
  }, []);

  if (!user) {
    return (
      <section className="text-center py-5">
        <span className="spinner-border" />
      </section>
    );
  }

  const { full_name, avatar_url } = user.user_metadata;

  return (
  <div className="min-vh-100 bg-light pb-5">
    {/* HEADER PREMIUM DARK */}
    <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg text-center position-relative">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-light rounded-circle border-0" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left fs-4"></i>
        </button>
        <span className="fw-bold tracking-tight text-uppercase small" style={{ letterSpacing: '1px' }}>
          Mi Perfil
        </span>
      </div>

      {/* FOTO DE PERFIL CON ANILLO DE GRADIENTE */}
      <div className="position-relative d-inline-block mb-2">
        <div 
          className="p-1 rounded-circle shadow-lg" 
          style={{ background: 'linear-gradient(45deg, #0d6efd, #0dCAF0)' }}
        >
          <img
            src={avatar_url}
            alt="Profile"
            className="rounded-circle bg-white p-1"
            style={{
              width: "110px",
              height: "110px",
              objectFit: "cover",
            }}
          />
        </div>
        <div className="position-absolute bottom-0 end-0 bg-success border border-3 border-dark rounded-circle" style={{ width: '20px', height: '20px' }}></div>
      </div>
      
      <h4 className="fw-bold mb-0 mt-2">{full_name}</h4>
      <p className="opacity-75 small text-uppercase tracking-widest" style={{ fontSize: '10px' }}>
        {user.app_metadata.provider} Account
      </p>
    </div>

    <div className="container" style={{ marginTop: '-35px' }}>
      {/* TARJETA DE DATOS PERSONALES */}
      <div className="card border-0 shadow-sm rounded-5 overflow-hidden mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold text-dark mb-4 d-flex align-items-center">
            <i className="bi bi-person-badge-fill me-2 text-primary fs-5"></i>
            Información Personal
          </h6>

          <div className="space-y-4">
            {/* ITEM: NOMBRE */}
            <div className="d-flex align-items-center p-3 rounded-4 bg-light mb-3">
              <div className="bg-white p-2 rounded-3 shadow-sm me-3 text-primary">
                <i className="bi bi-person fs-5"></i>
              </div>
              <div>
                <small className="text-muted d-block" style={{ fontSize: '10px', fontWeight: '700' }}>NOMBRE COMPLETO</small>
                <span className="fw-bold text-dark">{full_name}</span>
              </div>
            </div>

            {/* ITEM: CORREO */}
            <div className="d-flex align-items-center p-3 rounded-4 bg-light mb-3">
              <div className="bg-white p-2 rounded-3 shadow-sm me-3 text-primary">
                <i className="bi bi-envelope fs-5"></i>
              </div>
              <div className="overflow-hidden">
                <small className="text-muted d-block" style={{ fontSize: '10px', fontWeight: '700' }}>CORREO ELECTRÓNICO</small>
                <span className="fw-bold text-dark text-truncate d-block">{user.email}</span>
              </div>
            </div>

            {/* ITEM: FECHA REGISTRO */}
            <div className="d-flex align-items-center p-3 rounded-4 bg-light mb-3">
              <div className="bg-white p-2 rounded-3 shadow-sm me-3 text-primary">
                <i className="bi bi-calendar-event fs-5"></i>
              </div>
              <div>
                <small className="text-muted d-block" style={{ fontSize: '10px', fontWeight: '700' }}>MIEMBRO DESDE</small>
                <span className="fw-bold text-dark">
                  {new Date(user.created_at).toLocaleDateString("es-CO", { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE SEGURIDAD / ACCIONES */}
      <div className="px-2">
        <button
          className="btn btn-white w-100 rounded-pill py-3 fw-bold text-danger shadow-sm border-0 d-flex align-items-center justify-content-center gap-2 transition-all active-scale"
          onClick={handleCerrarSesion}
        >
          <i className="bi bi-door-open-fill fs-5"></i>
          Cerrar Sesión Segura
        </button>
        <p className="text-center text-muted mt-4 small" style={{ fontSize: '11px' }}>
          Versión de la App 2.1.0 • CVM Cloud
        </p>
      </div>
    </div>

    <style>{`
      .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
      .tracking-widest { letter-spacing: 2px; }
      .btn-white { background: white; transition: all 0.2s; }
      .btn-white:hover { background: #fff5f5; color: #dc3545; }
      .active-scale:active { transform: scale(0.98); }
      .rounded-5 { border-radius: 30px !important; }
    `}</style>
  </div>
);
}
