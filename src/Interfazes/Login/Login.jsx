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
    <div className="login-wrapper">
      <div className="card-container">
        <div className="main-card">
          {/* Cabecera con Branding */}
          <div className="text-center mb-4">
            <div className="logo-circle">
               <video 
                src="https://bbzhasobdrkaakqhuvpc.supabase.co/storage/v1/object/public/Video/Gif%20de%20carga.mp4"
                autoPlay 
                loop 
                muted 
                playsInline
                className="video-logo"
              />
            </div>
            <h1 className="brand-title">CVM<span>Portal</span></h1>
            <p className="brand-subtitle text-muted">Gestión de Servidores</p>
          </div>

          {/* Sección Informativa (Para cumplir con Google) */}
          <div className="info-box">
            <p>Accede para gestionar tus cronogramas, turnos y servicios de la comunidad en tiempo real.</p>
          </div>

          {/* Acción Principal */}
          <div className="action-area">
            <button
              onClick={loginWithGoogle}
              disabled={cargando}
              className="google-btn"
            >
              {cargando ? (
                <div className="spinner-border spinner-border-sm" role="status"></div>
              ) : (
                <>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                  <span>Continuar con Google</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Legal (Abajo de todo) */}
        <footer className="legal-footer">
          <div className="legal-links">
            <a href="/privacidad.html" target="_blank" rel="noopener noreferrer">Privacidad</a>
            <span className="dot">•</span>
            <a href="/terminos.html" target="_blank" rel="noopener noreferrer">Términos</a>
          </div>
          <p className="copyright">© {new Date().getFullYear()} Comunidad CVM • Valledupar</p>
        </footer>
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fdfdfd;
          font-family: 'Inter', -apple-system, sans-serif;
          padding: 20px;
        }
        .card-container {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .main-card {
          background: white;
          padding: 40px 30px;
          border-radius: 28px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          border: 1px solid #f0f0f0;
        }
        .logo-circle {
          width: 90px;
          height: 90px;
          margin: 0 auto 20px;
          background: #fff;
          border-radius: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .video-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .brand-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 5px;
        }
        .brand-title span {
          color: #666;
          font-weight: 300;
        }
        .brand-subtitle {
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        .info-box {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 15px;
          margin-bottom: 25px;
          text-align: center;
        }
        .info-box p {
          font-size: 13px;
          color: #666;
          margin: 0;
          line-height: 1.5;
        }
        .google-btn {
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #e0e0e0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.2s ease;
          color: #333;
        }
        .google-btn:hover:not(:disabled) {
          background: #f9f9f9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .google-btn img {
          width: 20px;
        }
        .legal-footer {
          text-align: center;
        }
        .legal-links {
          margin-bottom: 8px;
        }
        .legal-links a {
          color: #999;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .legal-links a:hover {
          color: #333;
        }
        .dot {
          margin: 0 10px;
          color: #ddd;
        }
        .copyright {
          font-size: 11px;
          color: #bbb;
          margin: 0;
        }
      `}</style>
    </div>
  );
}