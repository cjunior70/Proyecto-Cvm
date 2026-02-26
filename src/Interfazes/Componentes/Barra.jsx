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
    <section className="d-flex flex-column vh-100">

      {/* CONTENIDO */}
      <section className="h-100 overflow-auto p-3">
        <Outlet />
      </section>

      {/* BARRA INFERIOR */}
      <nav className="border-top w-100 bg-white">
        <section className="d-flex justify-content-around text-center py-2">

            {rol === "Admin" ? (
              
             <>

                <NavLink to="/Homeadmin" className={({ isActive }) =>
                    `nav-link d-flex flex-column align-items-center ${
                      isActive ? "text-primary fw-semibold" : "text-secondary"
                    }`
                  }>
                  🏠 <section>Inicio</section>
                </NavLink>

                <NavLink to="/Servidores" className={({ isActive }) =>
                    `nav-link d-flex flex-column align-items-center ${
                      isActive ? "text-primary fw-semibold" : "text-secondary"
                    }`
                  }>
                  👥 <section>Servidores</section>
                </NavLink>

                <NavLink to="/Servicios" className={({ isActive }) =>
                    `nav-link d-flex flex-column align-items-center ${
                      isActive ? "text-primary fw-semibold" : "text-secondary"
                    }`
                  }>
                  🕛 <section>Servicios</section>
                </NavLink>

                <NavLink to="/AereasAdmins" className={({ isActive }) =>
                    `nav-link d-flex flex-column align-items-center ${
                      isActive ? "text-primary fw-semibold" : "text-secondary"
                    }`
                  }>
                  📂 <section>Áreas</section>
                </NavLink>
                
             </>

            ) : (

              <>

                <NavLink to="/Home" className={({ isActive }) =>
                    `nav-link d-flex flex-column align-items-center ${
                      isActive ? "text-primary fw-semibold" : "text-secondary"
                    }`
                  }>
                  🏠 <section>Inicio</section>
                </NavLink>

                <NavLink to="/Disponibilidad" className={({ isActive }) =>
                    `nav-link d-flex flex-column align-items-center ${
                      isActive ? "text-primary fw-semibold" : "text-secondary"
                    }`
                  }>
                  📅 <section>Disponibilidad</section>
                </NavLink>

                <NavLink to="/Aereas" className={({ isActive }) =>
                    `nav-link d-flex flex-column align-items-center ${
                      isActive ? "text-primary fw-semibold" : "text-secondary"
                    }`
                  }>
                  📂 <section>Áreas</section>
                </NavLink>

              </>

            )}

          

          <NavLink to="/DatosPersonales" className={({ isActive }) =>
              `nav-link d-flex flex-column align-items-center ${
                isActive ? "text-primary fw-semibold" : "text-secondary"
              }`
            }>
            👤 <section>Perfil</section>
          </NavLink>

        </section>
      </nav>

    </section>
  );
}
