import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";
import Swal from "sweetalert2";

export default function Areas() {
  const [aereasGenerales, setAereasGenerales] = useState([]);
  const [misAereas, setMisAereas] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  const [carga, setCarga] = useState(false);

  const [mostrarModalQuitar, setMostrarModalQuitar] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);

  const [bloqueado, setBloqueado] = useState(true);

  // ───── CARGAR DATOS ─────
  const cargarDatos = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const idServidor = authData.user.id;
    setIdUsuario(idServidor);

    try {
      const hoy = new Date().toISOString().split("T")[0];

      const [resMisAreas, resTodas, resControl] = await Promise.all([
        supabase
          .from("Servidor_Area")
          .select(`Aerea ( Id, Nombre, Descripcion, Foto )`)
          .eq("IdServidor", idServidor),

        supabase
          .from("Aerea")
          .select("Id, Nombre, Descripcion, Foto"),

        // 🔥 CONSULTA CLAVE: solo trae si está dentro del rango activo
        supabase
          .from("Control_Disponibilidad")
          .select("*")
          .lte("Fecha_apertura", hoy)
          .gte("Fecha_cierre", hoy)
          .limit(1)
      ]);

      const mis = resMisAreas.data?.map((i) => i.Aerea).filter(Boolean) || [];
      setMisAereas(mis);
      setAereasGenerales(resTodas.data || []);

      // 🔥 SI EXISTE REGISTRO ACTIVO → desbloqueado
      const activo = (resControl.data?.length || 0) > 0;
      setBloqueado(!activo);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCarga(true);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ───── REGISTRAR ÁREA ─────
  const registrarArea = async (area) => {
    if (bloqueado) {
      Swal.fire({
        icon: "warning",
        title: "Bloqueado",
        text: "No puedes registrarte en este periodo."
      });
      return;
    }

    const result = await Swal.fire({
      title: "¿Confirmar registro?",
      text: `¿Quieres atender el área de ${area.Nombre}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí"
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("Servidor_Area").insert([
        { IdServidor: idUsuario, IdAerea: area.Id }
      ]);

      if (!error) {
        Swal.fire("¡Registrado!", "", "success");
        cargarDatos();
      }
    }
  };

  // ───── SALIR ÁREA ─────
  const abrirModalQuitar = (area) => {
    setAreaSeleccionada(area);
    setMostrarModalQuitar(true);
  };

  const salirArea = async () => {
    if (bloqueado) {
      Swal.fire({
        icon: "error",
        title: "Bloqueado",
        text: "No puedes abandonar áreas en este periodo."
      });
      return;
    }

    const { error } = await supabase
      .from("Servidor_Area")
      .delete()
      .eq("IdServidor", idUsuario)
      .eq("IdAerea", areaSeleccionada.Id);

    if (!error) {
      setMostrarModalQuitar(false);
      setAreaSeleccionada(null);
      cargarDatos();
    }
  };

  const idsMisAreas = misAereas.map((a) => a.Id);
  const areasDisponibles = aereasGenerales.filter(
    (a) => !idsMisAreas.includes(a.Id)
  );

  if (!carga) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light pb-5">

      {/* HEADER (SIN CAMBIOS) */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <h2 className="fw-bold">Mis Equipos</h2>
      </div>

      <div className="container" style={{ marginTop: "-25px" }}>

        {/* MIS ÁREAS */}
        <div className="mb-5">
          <h6 className="fw-bold">Mis áreas asignadas</h6>

          <div className="d-flex gap-3 overflow-auto">
            {misAereas.map((area) => (
              <div
                key={area.Id}
                className="flex-shrink-0 card-touch-effect"
                style={{
                  width: "240px",
                  opacity: bloqueado ? 0.6 : 1
                }}
                onClick={() => {
                  if (bloqueado) {
                    Swal.fire({
                      icon: "warning",
                      title: "Bloqueado",
                      text: "No puedes modificar áreas en este periodo."
                    });
                    return;
                  }
                  abrirModalQuitar(area);
                }}
              >
                <div className="card border-0 shadow-sm rounded-5 overflow-hidden h-100">
                  <AreaCard area={area} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DISPONIBLES */}
        <div>
          <h6 className="fw-bold">Áreas disponibles</h6>

          <div className="d-flex gap-3 overflow-auto">
            {areasDisponibles.map((area) => (
              <div
                key={area.Id}
                style={{
                  width: 240,
                  opacity: bloqueado ? 0.4 : 1,
                  pointerEvents: bloqueado ? "none" : "auto"
                }}
              >
                <AreaCard
                  area={area}
                  mostrarBoton={!bloqueado}
                  onRegistrar={() => registrarArea(area)}
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL (SIN CAMBIOS) */}
      {mostrarModalQuitar && areaSeleccionada && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.7)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-3">
              <h5>{areaSeleccionada.Nombre}</h5>

              <button className="btn btn-danger" onClick={salirArea}>
                Abandonar
              </button>

              <button
                className="btn btn-secondary mt-2"
                onClick={() => setMostrarModalQuitar(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}