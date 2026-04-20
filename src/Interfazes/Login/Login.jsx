import { useEffect, useState } from "react";
import { loginWithGoogle } from "../../../Supabase/auth.js";
import { supabase } from "../../../Supabase/cliente.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && isMounted) {
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          setCargando(true);

          try {
            const { data, error } = await supabase
              .from("Servidores")
              .select("Rol")
              .eq("Id", session.user.id)
              .single();

            if (error) throw error;

            if (data?.Rol === "Admin") {
              navigate("/Homeadmin", { replace: true });
            } else {
              navigate("/Home", { replace: true });
            }
          } catch (err) {
            console.error("Error en redirección:", err.message);
            navigate("/Home", { replace: true });
          } finally {
            if (isMounted) setCargando(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
  <div className="login-wrapper position-relative overflow-hidden">
    {/* CÍRCULOS DE FONDO (Efecto Blur) */}
    <div className="blob-1"></div>
    <div className="blob-2"></div>

    <div className="card-container z-1">
      <div className="main-card animate__animated animate__fadeIn">
        {/* Cabecera con Branding */}
        <div className="text-center mb-5">
          <div className="logo-outer">
            <div className="logo-inner shadow-lg">
              <video 
                src="https://bbzhasobdrkaakqhuvpc.supabase.co/storage/v1/object/public/Video/Gif%20de%20carga.mp4"
                autoPlay 
                loop 
                muted 
                playsInline
                className="video-logo"
              />
            </div>
          </div>
          <h1 className="brand-title mt-3">CVM<span className="fw-light">Portal</span></h1>
          <div className="d-flex align-items-center justify-content-center gap-2">
            <span className="badge bg-dark-subtle text-dark-emphasis rounded-pill px-3" style={{ fontSize: '10px', letterSpacing: '1px' }}>
              OFICIAL v2.5
            </span>
          </div>
        </div>

        {/* Sección Informativa */}
        <div className="info-box-premium mb-4">
          <p className="mb-0">
            <i className="bi bi-shield-check text-primary me-2"></i>
            Acceso seguro para la gestión de cronogramas y servicios en tiempo real.
          </p>
        </div>

        {/* Acción Principal */}
        <div className="action-area">
          <button
            onClick={loginWithGoogle}
            disabled={cargando}
            className="google-btn-premium w-100"
          >
            {cargando ? (
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            ) : (
              <>
                <div className="google-icon-wrapper">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                </div>
                <span>Continuar con Google</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Legal */}
      <footer className="legal-footer animate__animated animate__fadeIn animate__delay-1s">
        <div className="legal-links mb-2">
          <a href="/privacidad.html">Privacidad</a>
          <span className="dot">•</span>
          <a href="/terminos.html">Términos</a>
        </div>
        <p className="copyright text-uppercase tracking-widest" style={{ fontSize: '9px', letterSpacing: '1px' }}>
          © {new Date().getFullYear()} Comunidad CVM • Valledupar, Colombia
        </p>
      </footer>
    </div>

    <style>{`
      .login-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f4f7f9;
        padding: 24px;
      }

      /* BLOBS DE FONDO */
      .blob-1 {
        position: absolute; top: -10%; left: -10%; width: 300px; height: 300px;
        background: rgba(13, 110, 253, 0.1); filter: blur(80px); border-radius: 50%;
      }
      .blob-2 {
        position: absolute; bottom: -10%; right: -10%; width: 400px; height: 400px;
        background: rgba(13, 202, 240, 0.1); filter: blur(80px); border-radius: 50%;
      }

      .card-container { width: 100%; max-width: 420px; }

      .main-card {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        padding: 50px 35px;
        border-radius: 40px;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.08);
        border: 1px solid rgba(255,255,255,0.7);
      }

      /* LOGO ANIMADO */
      .logo-outer {
        display: flex; justify-content: center; align-items: center;
      }
      .logo-inner {
        width: 100px; height: 100px; border-radius: 32px; overflow: hidden;
        background: white; border: 4px solid white;
      }
      .video-logo { width: 100%; height: 100%; object-fit: cover; transform: scale(1.1); }

      .brand-title { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }

      .info-box-premium {
        background: #f8fafc; padding: 18px; border-radius: 20px;
        border: 1px solid #edf2f7; text-align: center;
      }
      .info-box-premium p { font-size: 13px; color: #64748b; line-height: 1.6; }

      /* BOTÓN GOOGLE PREMIUM */
      .google-btn-premium {
        background: #1e293b; color: white; border: none; padding: 16px;
        border-radius: 20px; font-weight: 700; font-size: 15px;
        display: flex; align-items: center; justify-content: center; gap: 15px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .google-btn-premium:hover {
        background: #0f172a; transform: translateY(-3px);
        box-shadow: 0 12px 20px -5px rgba(0,0,0,0.2);
      }
      .google-btn-premium:active { transform: scale(0.97); }
      .google-icon-wrapper {
        background: white; padding: 5px; border-radius: 10px; display: flex;
      }
      .google-icon-wrapper img { width: 18px; height: 18px; }

      .legal-links a { color: #94a3b8; text-decoration: none; font-size: 12px; font-weight: 600; }
      .legal-links a:hover { color: #1e293b; }
      .dot { margin: 0 10px; color: #cbd5e1; }
      .copyright { color: #94a3b8; }
      
      .z-1 { z-index: 1; }
    `}</style>
  </div>
);
}