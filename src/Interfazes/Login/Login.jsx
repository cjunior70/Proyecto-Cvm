import { useEffect, useState } from "react";
import { loginWithGoogle } from "../../../Supabase/auth.js";
import { supabase } from "../../../Supabase/cliente.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
  let isMounted = true; // Control de montaje

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // Solo ejecutamos si hay sesión y el componente sigue vivo
      if (session && isMounted) {
        
        // 🔥 PASO 1: Limpiar la URL inmediatamente para romper el bucle
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
          // Si el usuario no existe en 'Servidores', redirigir a una página segura
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
    // CAMBIO: Fondo blanco puro y centrado con padding
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-white p-3">
      {/* CAMBIO: Tarjeta con sombra muy suave y bordes más redondeados */}
      <div className="card border-0 sleek-card w-100 p-2" style={{ maxWidth: "400px" }}>
        <div className="card-body p-4 text-center">
          
          <div className="mb-4">
            {/* CAMBIO: Tipografía con peso más ligero para elegancia */}
            <h1 className="h3 fw-light text-dark mb-1" style={{ letterSpacing: "-1px" }}>
              Sistema <span className="fw-semibold">CVM</span>
            </h1>
            <p className="text-muted small fw-light">
              Tu portal de gestión de servicios
            </p>
          </div>

          {/* Video/GIF de carga - Centrado perfecto y tamaño ajustado */}
          <div className="mb-5 d-flex justify-content-center align-items-center" style={{ height: "140px" }}>
            {cargando ? (
              // CAMBIO: Spinner más discreto y fino
              <div className="spinner-border text-dark spinner-border-sm" role="status"></div>
            ) : (
              <video 
                src="https://bbzhasobdrkaakqhuvpc.supabase.co/storage/v1/object/public/Video/Gif%20de%20carga.mp4"
                autoPlay 
                loop 
                muted 
                playsInline
                className="sleek-video"
              />
            )}
          </div>

          <p className="small text-secondary fw-light mb-4 px-3">
            {cargando 
              ? "Confirmando tu identidad..." 
              : "Inicia sesión con tu cuenta de Google para acceder a tu cronograma."}
          </p>

          {/* CAMBIO: Botón completamente rediseñado: elegante, minimalista */}
          <button
            onClick={loginWithGoogle}
            disabled={cargando}
            className="btn btn-sleek w-100 d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width="20"
              className="google-icon"
            />
            {cargando ? "Cargando..." : "Continuar con Google"}
          </button>

          <div className="mt-5 pt-3">
            <small className="text-muted opacity-25 fw-light" style={{ fontSize: "11px" }}>
              © {new Date().getFullYear()} Servicios CVM • All rights reserved.
            </small>
          </div>

        </div>
      </div>

      {/* ESTILOS CUSTOM: Aquí está la magia del diseño "Sleek" */}
      <style>{`
        /* Tipografía por defecto más limpia si no usas Google Fonts */
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* Tarjeta con sombra muy sutil */
        .sleek-card {
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          transition: transform 0.3s ease;
        }

        /* Video con bordes suaves y tamaño contenido */
        .sleek-video {
          width: 120px;
          height: 120px;
          object-fit: contain;
          border-radius: 60px; /* Hace el video un poco más suave */
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.05));
        }

        /* El Botón Elegante */
        .btn-sleek {
          background-color: #fcfcfc;
          border: 1px solid #eeeeee;
          color: #222222;
          font-weight: 500;
          font-size: 15px;
          border-radius: 50px; /* Pill shape */
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .btn-sleek:hover {
          background-color: #f5f5f5;
          border-color: #e0e0e0;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .btn-sleek:active {
          transform: translateY(0px);
          background-color: #eeeeee;
        }

        .btn-sleek:disabled {
          background-color: #f1f1f1;
          color: #aaaaaa;
          border-color: #eeeeee;
          cursor: not-allowed;
        }

        /* Efecto de carga del spinner si el botón está disabled */
        .btn-sleek:disabled .google-icon {
          filter: grayscale(100%) opacity(50%);
        }
      `}</style>
    </div>
  );
}