import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";

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
    <section className="d-flex flex-column min-vh-100 bg-light">
      <section className="flex-grow-1 p-2 pb-5 mb-5">
        <Outlet />
      </section>

      <nav className="fixed-bottom border-top w-100 bg-white shadow-lg" style={{ zIndex: 2000 }}>
        <section className="d-flex justify-content-around text-center py-2 px-1">
          {rol === "Admin" ? (
            <>
              <MenuLink to="/Homeadmin" icon="🏠" label="Inicio" />
              {/* CAMBIO: Ahora los servicios se ven en el Calendario de Eventos */}
              <MenuLink to="/CalendarioServicios" icon="🎯" label="Agenda" />
              <MenuLink to="/Servicios" icon="📅" label="Servicios" />
              <MenuLink to="/Servidores" icon="👥" label="Staff" />
              <MenuLink to="/AereasAdmins" icon="📂" label="Áreas" />
            </>
          ) : (
            <>
              <MenuLink to="/Home" icon="🏠" label="Inicio" />
              <MenuLink to="/Disponibilidad" icon="📅" label="Turnos" />
              <MenuLink to="/Aereas" icon="📂" label="Mis Áreas" />
            </>
          )}
          <MenuLink to="/DatosPersonales" icon="👤" label="Perfil" />
        </section>
      </nav>
    </section>
  );
}

// El componente MenuLink se mantiene igual (es muy bueno!)
function MenuLink({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) =>
        `nav-link d-flex flex-column align-items-center flex-fill transition-all ${
          isActive ? "text-primary fw-bold scale-110" : "text-secondary opacity-75"
        }`
      }
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <span style={{ fontSize: '9px', marginTop: '1px', textTransform: 'uppercase' }}>{label}</span>
    </NavLink>
  );
}