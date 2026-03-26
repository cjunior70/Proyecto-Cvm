import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";

export default function Layout() {
  const [rol, setRol] = useState(null);

  useEffect(() => {
    const obtenerRol = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;
      
      const { data, error } = await supabase
        .from("Servidores") 
        .select("Rol")
        .eq("Id", authData.user.id)
        .single();

      if (!error && data) {
        setRol(data.Rol);
      }
    };
    obtenerRol();
  }, []);

  return (
    // min-vh-100 asegura que ocupe toda la pantalla
    <section className="d-flex flex-column min-vh-100">

      {/* CONTENIDO: Agregamos pb-5 para que el menú no tape el final del contenido */}
      <section className="flex-grow-1 p-3 mb-5 pb-4">
        <Outlet />
      </section>

      {/* BARRA INFERIOR: Usamos fixed-bottom para que no se mueva */}
      <nav className="fixed-bottom border-top w-100 bg-white shadow-sm">
        <section className="d-flex justify-content-around text-center py-2">

          {rol === "Admin" ? (
            <>
              <NavLink to="/Homeadmin" className={({ isActive }) =>
                `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
              }>
                🏠 <section style={{ fontSize: '12px' }}>Inicio</section>
              </NavLink>

              <NavLink to="/Servidores" className={({ isActive }) =>
                `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
              }>
                👥 <section style={{ fontSize: '12px' }}>Servidores</section>
              </NavLink>

              <NavLink to="/Servicios" className={({ isActive }) =>
                `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
              }>
                🕛 <section style={{ fontSize: '12px' }}>Servicios</section>
              </NavLink>

              <NavLink to="/AereasAdmins" className={({ isActive }) =>
                `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
              }>
                📂 <section style={{ fontSize: '12px' }}>Áreas</section>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/Home" className={({ isActive }) =>
                `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
              }>
                🏠 <section style={{ fontSize: '12px' }}>Inicio</section>
              </NavLink>

              <NavLink to="/Disponibilidad" className={({ isActive }) =>
                `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
              }>
                📅 <section style={{ fontSize: '12px' }}>Disponibilidad</section>
              </NavLink>

              <NavLink to="/Aereas" className={({ isActive }) =>
                `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
              }>
                📂 <section style={{ fontSize: '12px' }}>Áreas</section>
              </NavLink>
            </>
          )}

          <NavLink to="/DatosPersonales" className={({ isActive }) =>
            `nav-link d-flex flex-column align-items-center ${isActive ? "text-primary fw-semibold" : "text-secondary"}`
          }>
            👤 <section style={{ fontSize: '12px' }}>Perfil</section>
          </NavLink>

        </section>
      </nav>
    </section>
  );
}