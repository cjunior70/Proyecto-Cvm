import { useEffect, useState } from "react";
import {loginWithGoogle} from "../../../Supabase/auth.js"
import { supabase } from "../../../Supabase/cliente.js";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/Home");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
  };
  
  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card border-0 shadow-sm w-100" style={{ maxWidth: "400px" }} >
        <div className="card-body p-4">

          <div className="text-center mb-4">
            <h2 className="fw-semibold mb-1">Sistema de Servicios CVM</h2>
            <p className="text-muted small">
              Accede a tu cronograma mensual
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={loginWithGoogle}
            className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width="18"
            />
            Continuar con Google
          </button>

          <div className="text-center text-muted small mb-3">
            o inicia sesión con tu correo
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email">Correo electrónico</label>
            </div>

            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password">Contraseña</label>
            </div>

            <button className="btn btn-dark w-100 py-2">
              Ingresar
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              © {new Date().getFullYear()} Servicios
            </small>
          </div>

        </div>
      </div>
    </div>
  );
}
