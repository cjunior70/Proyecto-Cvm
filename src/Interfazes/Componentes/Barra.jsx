import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";

export default function Layout() {
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerRol = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login"); // Redirigir si no hay sesión
          return;
        }

        const { data, error } = await supabase
          .from("Servidores")
          .select("Rol")
          .eq("Id", user.id)
          .single();

        if (!error && data) {
          setRol(data.Rol);
        }
      } catch (err) {
        console.error("Error obteniendo rol:", err);
      } finally {
        setLoading(false);
      }
    };

    obtenerRol();
  }, [navigate]);

  // Mientras carga el rol, podemos mostrar un spinner o nada para evitar saltos visuales
  if (loading) return null; 

  return (
    <section className="d-flex flex-column min-vh-100 bg-light">
      {/* Contenido principal */}
      <section className="flex-grow-1 p-2 pb-5 mb-5">
        <Outlet />
      </section>

      {/* Barra de Navegación Fija */}
      <nav className="fixed-bottom border-top w-100 bg-white shadow-lg" style={{ zIndex: 2000 }}>
        <section className="d-flex justify-content-around text-center py-2 px-1">
          {rol === "Admin" ? (
            <>
              <MenuLink to="/Homeadmin" icon="🏠" label="Inicio" />
              <MenuLink to="/Servidores" icon="👥" label="Servidores" />
              <MenuLink to="/Servicios" icon="🕛" label="Servicios" />
              <MenuLink to="/AereasAdmins" icon="📂" label="Áreas" />
            </>
          ) : (
            <>
              <MenuLink to="/Home" icon="🏠" label="Inicio" />
              <MenuLink to="/Disponibilidad" icon="📅" label="Disponibilidad" />
              <MenuLink to="/Aereas" icon="📂" label="Áreas" />
            </>
          )}
          <MenuLink to="/DatosPersonales" icon="👤" label="Perfil" />
        </section>
      </nav>
    </section>
  );
}

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
      <span style={{ fontSize: '10px', marginTop: '1px', textTransform: 'uppercase' }}>{label}</span>
    </NavLink>
  );
}