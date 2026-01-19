import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente.js";
import { CerrarSeccion } from "../../../Supabase/CerrarSeccion.js";
import { useNavigate } from "react-router-dom";


export default function DatosPersonales() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  //Fucnion para poder cerrar la seccion
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
      <section className="text-center py-5">
        <span className="spinner-border" />
      </section>
    );
  }

  const { full_name, avatar_url } = user.user_metadata;

  return (
    <section className="h-100 container py-4 d-flex flex-column justify-content-around">

     <section>
         <h4 className="fw-bold text-center mb-4">
          Mis datos personales
        </h4>

        {/* FOTO */}
        <section className="d-flex justify-content-center mb-3">
          <img
            src={avatar_url}
            alt="Perfil"
            className="rounded-circle shadow"
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
            }}
          />
        </section>

        {/* DATOS */}
        <section className="card shadow-sm border-0 mb-4">
          <section className="card-body">

            <section className="mb-3">
              <small className="text-muted">Nombre</small>
              <section className="fw-semibold">{full_name}</section>
            </section>

            <section className="mb-3">
              <small className="text-muted">Correo</small>
              <section className="fw-semibold">{user.email}</section>
            </section>

            <section className="mb-3">
              <small className="text-muted">Proveedor</small>
              <section className="fw-semibold text-capitalize">
                {user.app_metadata.provider}
              </section>
            </section>

            <section>
              <small className="text-muted">Registrado el</small>
              <section className="fw-semibold">
                {new Date(user.created_at).toLocaleDateString("es-CO")}
              </section>
            </section>

          </section>
        </section>
     </section>

      {/* BOTÓN CERRAR SESIÓN */}
      <section className="mt-auto pt-4">
        <section className="d-grid">
          <button
            className="btn btn-outline-danger rounded-pill py-2 fw-semibold shadow-sm"
            onClick={handleCerrarSesion}
          >
            🔒 Cerrar sesión
          </button>
        </section>
      </section>

    </section>
  );
}
