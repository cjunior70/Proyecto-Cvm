import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente.js";

export default function DatosPersonales() {
  const [user, setUser] = useState(null);

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
      <div className="text-center py-5">
        <span className="spinner-border" />
      </div>
    );
  }

  const {
    full_name,
    avatar_url,
  } = user.user_metadata;

  return (
    <div className="container py-4">

      <h4 className="fw-bold text-center mb-4">
        Mis datos personales
      </h4>

      {/* FOTO */}
      <div className="d-flex justify-content-center mb-3">
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
      </div>

      {/* DATOS */}
      <div className="card shadow-sm border-0">
        <div className="card-body">

          <div className="mb-3">
            <small className="text-muted">Nombre</small>
            <div className="fw-semibold">
              {full_name}
            </div>
          </div>

          <div className="mb-3">
            <small className="text-muted">Correo</small>
            <div className="fw-semibold">
              {user.email}
            </div>
          </div>

          <div className="mb-3">
            <small className="text-muted">Proveedor</small>
            <div className="fw-semibold text-capitalize">
              {user.app_metadata.provider}
            </div>
          </div>

          <div>
            <small className="text-muted">Registrado el</small>
            <div className="fw-semibold">
              {new Date(user.created_at).toLocaleDateString("es-CO")}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
