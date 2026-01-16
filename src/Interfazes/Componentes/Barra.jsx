import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <section className="d-flex flex-column vh-100">

      {/* CONTENIDO */}
      <section className="h-100 overflow-auto p-3">
        <Outlet />
      </section>

      {/* BARRA INFERIOR */}
      <nav className="border-top w-100 bg-white">
        <section className="d-flex justify-content-around text-center py-2">

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
