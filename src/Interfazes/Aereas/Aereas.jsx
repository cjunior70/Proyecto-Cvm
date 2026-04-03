import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";
import Swal from "sweetalert2";

export default function Areas() {
  const [aereasGenerales, setAereasGenerales] = useState([]);
  const [misAereas, setMisAereas] = useState([]);
  const [idUsuario, setIdUsuario] = useState(null);
  const [carga, setCarga] = useState(false);

  // ───── MODAL QUITAR/DETALLES ─────
  const [mostrarModalQuitar, setMostrarModalQuitar] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);

  const cargarDatos = async () => {
    // 1. Obtenemos el usuario (única dependencia)
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const idServidor = authData.user.id;
    setIdUsuario(idServidor);

    try {
      // 2. Ejecutamos ambas consultas al mismo tiempo
      const [resMisAreas, resTodas] = await Promise.all([
        supabase
          .from("Servidor_Area")
          .select(`Aerea ( Id, Nombre, Descripcion, Foto )`)
          .eq("IdServidor", idServidor),
        supabase
          .from("Aerea")
          .select("Id, Nombre, Descripcion, Foto") // Solo campos necesarios
      ]);

      // 3. Procesamos los resultados
      const mapeadas = resMisAreas.data?.map((i) => i.Aerea).filter(a => a !== null) || [];
      
      setMisAereas(mapeadas);
      setAereasGenerales(resTodas.data || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCarga(true);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ───── REGISTRARSE EN ÁREA ─────
  const registrarArea = async (area) => {
    const result = await Swal.fire({
      title: '¿Confirmar registro?',
      text: `¿Estás seguro de que quieres atender el área de ${area.Nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, acepto el área',
      confirmButtonColor: '#0d6efd'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("Servidor_Area").insert([
        { IdServidor: idUsuario, IdAerea: area.Id }
      ]);

      if (!error) {
        Swal.fire('¡Registrado!', 'Ahora eres responsable de esta área.', 'success');
        cargarDatos();
      }
    }
  };

  // ───── QUITAR ÁREA ─────
  const abrirModalQuitar = (area) => {
    setAreaSeleccionada(area);
    setMostrarModalQuitar(true);
  };

  const salirArea = async () => {
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

  // ───── LÓGICA DE FILTRADO ─────
  const idsMisAreas = misAereas.map((a) => a.Id);
  const areasDisponibles = aereasGenerales.filter(
    (a) => !idsMisAreas.includes(a.Id)
  );

  if (!carga) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <section className="container py-4">
      
      {/* SECCIÓN 1: MIS ÁREAS (Carrusel horizontal) */}
      <div className="mb-5">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary rounded-circle p-2 me-2" style={{width: '10px', height: '10px'}}></div>
          <h5 className="fw-bold m-0">Mis áreas asignadas</h5>
        </div>

        <div className="d-flex gap-3 overflow-auto pb-3 custom-scrollbar">
          {misAereas.length === 0 ? (
            <div className="card card-body border-dashed text-center py-4 rounded-4 bg-light w-100">
              <p className="text-muted mb-0">Aún no tienes áreas bajo tu cargo.</p>
            </div>
          ) : (
            misAereas.map((area) => (
              <div
                key={area.Id}
                className="flex-shrink-0"
                style={{ cursor: "pointer", transition: "transform 0.2s" }}
                onClick={() => abrirModalQuitar(area)}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <AreaCard area={area} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 2: ÁREAS DISPONIBLES */}
      <section>
        <div className="d-flex align-items-center mb-3">
          <div className="bg-secondary rounded-circle p-2 me-2" style={{width: '10px', height: '10px'}}></div>
          <h5 className="fw-bold m-0">Áreas disponibles para unirse</h5>
        </div>

        <div className="d-flex gap-3 overflow-auto pb-3 custom-scrollbar">
          {areasDisponibles.length === 0 ? (
            <p className="text-muted">No hay más áreas disponibles por ahora.</p>
          ) : (
            areasDisponibles.map((area) => (
              <div key={area.Id} className="flex-shrink-0">
                <AreaCard
                  area={area}
                  mostrarBoton={true}
                  onRegistrar={() => registrarArea(area)}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ───── MODAL QUITAR ÁREA ───── */}
      {mostrarModalQuitar && areaSeleccionada && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold m-0 text-primary">{areaSeleccionada.Nombre}</h5>
                <button className="btn-close" onClick={() => setMostrarModalQuitar(false)} />
              </div>

              <div className="modal-body text-center p-4">
                <img
                  src={areaSeleccionada.Foto || 'https://via.placeholder.com/400'}
                  className="img-fluid rounded-4 mb-3 shadow-sm"
                  style={{ maxHeight: "200px", width: "100%", objectFit: "cover" }}
                />
                <p className="text-secondary">{areaSeleccionada.Descripcion || "Sin descripción disponible."}</p>
              </div>

              <div className="modal-footer border-0 pt-0 d-flex gap-2">
                <button className="btn btn-light rounded-pill flex-grow-1 fw-bold" onClick={() => setMostrarModalQuitar(false)}>
                  Volver
                </button>
                <button className="btn btn-danger rounded-pill flex-grow-1 fw-bold" onClick={salirArea}>
                  Abandonar área
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        .border-dashed { border: 2px dashed #dee2e6; }
      `}</style>
    </section>
  );
}