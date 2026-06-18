import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente.js";
import { CerrarSeccion } from "../../../Supabase/CerrarSeccion.js";
import { useNavigate } from "react-router-dom";

export default function DatosPersonales() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
        <div className="spinner-border" style={{ color: "#6E4BDB" }}></div>
      </div>
    );
  }

  const { full_name, avatar_url } = user.user_metadata;

  return (
    <div className="min-vh-100 pb-5 animate__animated animate__fadeIn" style={{ backgroundColor: "#F8FAFC" }}>
      
      {/* 🔮 STICKY TOP HEADER SLIM */}
      <div className="text-white px-3 py-3 rounded-bottom-4 shadow-sm sticky-top" 
           style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", zIndex: 1020 }}>
        <div className="container p-0 d-flex align-items-center gap-2.5">
          <button className="btn btn-sm btn-light rounded-3 bg-white bg-opacity-10 text-white border-0 p-2" 
                  onClick={() => navigate(-1)} style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justify:"Content center" }}>
            <i className="bi bi-arrow-left fs-5"></i>
          </button>
          <div>
            <h2 className="fw-bold m-0" style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Mi Perfil</h2>
            <p className="text-white-50 m-0" style={{ fontSize: '10px' }}>Configuración de cuenta</p>
          </div>
        </div>
      </div>

      {/* 👤 SECCIÓN PRINCIPAL DE USUARIO */}
      <div className="container px-3 text-center mt-4">
        <div className="position-relative d-inline-block mb-3">
          {/* Anillo de perfil estilizado con la paleta de la marca */}
          <div className="p-1 rounded-circle shadow-sm" style={{ background: 'linear-gradient(135deg, #6E4BDB 0%, #4F46E5 100%)' }}>
            <img
              src={avatar_url}
              alt="Profile"
              className="rounded-circle bg-white p-0.5"
              style={{ width: "96px", height: "96px", objectFit: "cover" }}
            />
          </div>
          {/* Indicador de estado activo */}
          <div className="position-absolute bottom-0 end-0 bg-success border border-3 border-white rounded-circle" 
               style={{ width: '18px', height: '18px', transform: 'translate(-3px, -3px)' }}></div>
        </div>
        
        <h5 className="fw-bold text-dark mb-0">{full_name}</h5>
        <p className="text-muted text-uppercase fw-semibold m-0" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
          Cuenta {user.app_metadata.provider}
        </p>
      </div>

      <div className="container px-3 mt-4">
        {/* 📋 CONTENEDOR ÚNICO DE DATOS (Estilo Ajustes Premium) */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4" style={{ border: '1px solid #E2E8F0 !important' }}>
          <div className="card-body p-0">
            
            {/* Encabezado interno discreto */}
            <div className="px-3 py-2.5 bg-light bg-opacity-50 border-bottom d-flex align-items-center gap-2">
              <i className="bi bi-person-badge text-muted fs-5"></i>
              <span className="fw-bold text-secondary" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
                INFORMACIÓN RELEVANTE
              </span>
            </div>

            <div className="d-flex flex-column">
              {/* ITEM: NOMBRE */}
              <div className="d-flex align-items-center px-3 py-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <div className="bg-light p-2 rounded-3 text-dark me-3" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-person fs-5 text-muted"></i>
                </div>
                <div>
                  <small className="text-muted d-block fw-semibold" style={{ fontSize: '9.5px', letterSpacing: '0.3px' }}>NOMBRE COMPLETO</small>
                  <span className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>{full_name}</span>
                </div>
              </div>

              {/* ITEM: CORREO */}
              <div className="d-flex align-items-center px-3 py-3 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <div className="bg-light p-2 rounded-3 text-dark me-3" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-envelope fs-5 text-muted"></i>
                </div>
                <div className="overflow-hidden">
                  <small className="text-muted d-block fw-semibold" style={{ fontSize: '9.5px', letterSpacing: '0.3px' }}>CORREO ELECTRÓNICO</small>
                  <span className="fw-bold text-dark text-truncate d-block" style={{ fontSize: '13.5px' }}>{user.email}</span>
                </div>
              </div>

              {/* ITEM: FECHA REGISTRO */}
              <div className="d-flex align-items-center px-3 py-3">
                <div className="bg-light p-2 rounded-3 text-dark me-3" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-calendar-check fs-5 text-muted"></i>
                </div>
                <div>
                  <small className="text-muted d-block fw-semibold" style={{ fontSize: '9.5px', letterSpacing: '0.3px' }}>MIEMBRO DESDE</small>
                  <span className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>
                    {new Date(user.created_at).toLocaleDateString("es-CO", { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 🚨 BOTÓN DE ACCIÓN FINAL */}
        <div className="px-1">
          <button
            className="btn w-100 rounded-3 py-2.5 fw-bold text-danger bg-white shadow-sm d-flex align-items-center justify-content-center gap-2 border transition-all active-scale"
            onClick={handleCerrarSesion}
            style={{ fontSize: '14px', borderColor: '#F1F5F9' }}
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
            Cerrar Sesión
          </button>
          
          <p className="text-center text-muted mt-4" style={{ fontSize: '11px', fontWeight: '500' }}>
            Versión de la App 2.1.0 • CVM Cloud
          </p>
        </div>
      </div>

      <style>{`
        .rounded-bottom-4 { border-bottom-left-radius: 18px !important; border-bottom-right-radius: 18px !important; }
        .active-scale:active { transform: scale(0.98); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}