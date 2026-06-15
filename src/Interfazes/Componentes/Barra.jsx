import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import home from "../../Imagenes/Home.svg"
import Calendario from "../../Imagenes/Calendario.svg"
import Staff from "../../Imagenes/Staff.svg"
import Areas from "../../Imagenes/Areas.svg"
import Perfil from "../../Imagenes/Perfil.svg"
import Reporte from "../../Imagenes/Reporte.svg"

export default function Layout() {
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/"); // O a tu ruta de login
          return;
        }

        // 1. OBTENER ROL Y DATOS DEL SERVIDOR
        const { data: servidor, error: errServ } = await supabase
          .from("Servidores")
          .select("Rol")
          .eq("Id", user.id)
          .single();

        if (errServ || !servidor) throw new Error("No se encontró el perfil");
        setRol(servidor.Rol);

        // 2. VERIFICACIÓN DE ÁREAS (Onboarding "Genial")
        // Solo para usuarios comunes, o si quieres que los admins también tengan área
        const { data: areas } = await supabase
          .from("Servidor_Area")
          .select("IdAerea")
          .eq("IdServidor", user.id);

        const tieneAreas = areas && areas.length > 0;

        // Si no tiene áreas y no está ya en la pantalla de Áreas, lo mandamos allá
        if (!tieneAreas && location.pathname !== "/Aereas") {
          console.log("Redirigiendo a configuración de áreas...");
          navigate("/Aereas", { replace: true });
          return;
        }

        // 3. REDIRECCIÓN SEGÚN ROL AL ENTRAR
        if (location.pathname === "/" || location.pathname === "/login") {
           navigate(servidor.Rol === "Admin" ? "/Homeadmin" : "/Home");
        }

      } catch (err) {
        console.error("Error en el Layout:", err);
      } finally {
        setLoading(false);
      }
    };

    verificarAcceso();
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <section className="d-flex flex-column min-vh-100" style={{ backgroundColor: "#F4F7FE" }}>
      <section className="flex-grow-1 p-2 pb-5 mb-5">
        <Outlet />
      </section>

      {/* 🚀 BARRA DE NAVEGACIÓN PREMIUM */}
      <nav className="fixed-bottom w-100 bg-white shadow-sm border-0" 
           style={{ zIndex: 2000, borderRadius: "20px 20px 0 0" }}>
        <section className="d-flex justify-content-around text-center py-2 px-1">
          {rol === "Admin" ? (
            <>
              <MenuLink to="/Homeadmin" icon={home} label="Home" />
              <MenuLink to="/Servicios" icon={Calendario} label="Servicios" />
              <MenuLink to="/Servidores" icon={Staff} label="Staff" />
              <MenuLink to="/AereasAdmins" icon={Areas} label="Áreas" />
              <MenuLink to="/Reportes" icon={Reporte} label="Reporte" />
            </>
          ) : (
            <>
              <MenuLink to="/Home" icon={home} label="Inicio" />
              <MenuLink to="/Disponibilidad" icon={Calendario} label="Turnos" />
              <MenuLink to="/Aereas" icon={Areas} label="Mis Áreas" />
            </>
          )}
        </section>
      </nav>
    </section>
  );
}

// 🎨 COMPONENTE MENULINK REFINADO
function MenuLink({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) =>
        `nav-link d-flex flex-column align-items-center flex-fill ${
          isActive ? "opacity-100" : "opacity-50"
        }`
      }
      style={{ transition: "all 0.3s ease" }}
    >
      {({ isActive }) => (
        <>
          <div className="d-flex align-items-center justify-content-center" 
               style={{ 
                 width: "40px", 
                 height: "40px", 
                 borderRadius: "12px",
                 backgroundColor: isActive ? "#EDE9FE" : "transparent",
                 transition: "all 0.3s ease"
               }}>
            <img 
              src={icon} 
              style={{ 
                width: "100px", 
                height: "24px", 
                filter: isActive ? "none" : "grayscale(100%)",
                // Aplica un filtro de color al icono cuando está activo si la imagen lo permite
                color: isActive ? "#6E4BDB" : "#A0AEC0" 
              }} 
              alt={label} 
            />
          </div>
          <span style={{ 
            fontSize: '9px', 
            marginTop: '2px', 
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#6E4BDB" : "#718096"
          }}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}