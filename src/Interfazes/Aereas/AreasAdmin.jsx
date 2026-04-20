import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

export default function AreasAdmin() {
  const [areas, setAreas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    const { data } = await supabase.from("Aerea").select("*").order("Nombre");
    setAreas(data || []);
  };

  const toast = (title, icon = "success") => {
    Swal.fire({
      title,
      icon,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const subirImagen = async (file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `area_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("Imagen")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("Imagen").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Error Storage:", error);
      return null;
    }
  };

  const guardarArea = async (e) => {
    e.preventDefault();
    setCargando(true);

    let urlFinal = null;
    if (archivo) {
      urlFinal = await subirImagen(archivo);
    }

    const datos = { Nombre: nombre, Descripcion: descripcion };
    if (urlFinal) datos.Foto = urlFinal;

    try {
      if (editandoId) {
        await supabase.from("Aerea").update(datos).eq("Id", editandoId);
        toast("Área actualizada");
      } else {
        await supabase.from("Aerea").insert([datos]);
        toast("Área creada correctamente");
      }

      setMostrarModal(false);
      limpiarFormulario();
      cargarAreas();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setCargando(false);
    }
  };

  const prepararEdicion = (a) => {
    setEditandoId(a.Id);
    setNombre(a.Nombre || "");
    setDescripcion(a.Descripcion || "");
    setMostrarModal(true);
  };

  const eliminarArea = async (id) => {
    const res = await Swal.fire({
      title: "¿Eliminar área?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
      borderRadius: "15px",
    });

    if (res.isConfirmed) {
      await supabase.from("Aerea").delete().eq("Id", id);
      toast("Área eliminada", "info");
      cargarAreas();
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setArchivo(null);
    setEditandoId(null);
  };

  return (
    <div className="min-vh-100 bg-light pb-5">
      {/* HEADER PREMIUM DARK */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-outline-light rounded-circle border-0" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <span className="fw-bold tracking-tight text-uppercase small" style={{ letterSpacing: '1px' }}>
            Configuración del Sistema
          </span>
        </div>
        
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="fw-bold mb-0">Gestión de Áreas</h2>
            <p className="opacity-75 small mb-0">Administra los espacios y departamentos de servicio.</p>
          </div>
          <button 
            className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-lg border-0 d-flex align-items-center justify-content-center gap-2"
            style={{ background: 'linear-gradient(45deg, #0d6efd, #0dCAF0)' }}
            onClick={() => { limpiarFormulario(); setMostrarModal(true); }}
          >
            <i className="bi bi-plus-lg fs-5"></i> Nueva Área
          </button>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-25px' }}>
        {/* INDICADOR DE TOTALES */}
        <div className="card border-0 shadow-sm rounded-pill py-2 px-4 mb-4 bg-white d-inline-block">
          <small className="fw-bold text-primary">
            <i className="bi bi-grid-fill me-2"></i>
            {areas.length} Áreas configuradas
          </small>
        </div>

        {/* GRILLA DE ÁREAS */}
        {areas.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-5 py-5 text-center bg-white">
            <div className="py-4">
              <i className="bi bi-layers text-muted opacity-25" style={{ fontSize: '5rem' }}></i>
              <h5 className="mt-3 fw-bold text-dark">No hay áreas registradas</h5>
              <p className="text-muted">Comienza creando una nueva área para tus servicios.</p>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {areas.map((a) => (
              <div key={a.Id} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-5 overflow-hidden h-100 card-hover-premium">
                  {/* IMAGEN CON OVERLAY */}
                  <div className="position-relative overflow-hidden" style={{ height: "180px" }}>
                    <img 
                      src={a.Foto || "https://images.unsplash.com/photo-1507038732158-5d2bb34d7426?q=80&w=500&auto=format&fit=crop"} 
                      className="card-img-top w-100 h-100" 
                      style={{ objectFit: "cover" }} 
                    />
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-card"></div>
                    
                    <div className="position-absolute top-0 end-0 m-3">
                      <button className="btn btn-glass-dark rounded-circle shadow-sm" onClick={() => prepararEdicion(a)}>
                        <i className="bi bi-pencil-square text-white"></i>
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-4 d-flex flex-column">
                    <h5 className="fw-bold text-dark mb-2">{a.Nombre}</h5>
                    <p className="text-muted small mb-4 flex-grow-1 line-clamp-2">
                      {a.Descripcion || "Sin descripción disponible para este espacio."}
                    </p>
                    
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <button 
                        className="btn btn-link text-danger p-0 text-decoration-none small fw-bold d-flex align-items-center gap-1"
                        onClick={() => eliminarArea(a.Id)}
                      >
                        <i className="bi bi-trash3"></i> Eliminar
                      </button>
                      <button className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold" onClick={() => prepararEdicion(a)}>
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CON GLASSMORPHISM PREMIUM */}
      {mostrarModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-5 border-0 shadow-2xl overflow-hidden animate__animated animate__fadeInUp">
              
              <div className="bg-dark p-4 text-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold m-0">
                  {editandoId ? "🔧 Configurar Área" : "✨ Crear Nueva Área"}
                </h5>
                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setMostrarModal(false)}></button>
              </div>

              <form onSubmit={guardarArea}>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-4 text-center bg-light p-3 rounded-5 border-dashed">
                    <i className="bi bi-image-fill text-primary fs-1 opacity-25"></i>
                    <p className="small text-muted mb-0">Sube una foto representativa</p>
                    <input type="file" className="form-control form-control-sm mt-2 rounded-pill" accept="image/*" onChange={e => setArchivo(e.target.files[0])} />
                  </div>

                  <div className="mb-3">
                    <label className="small fw-bold text-primary text-uppercase mb-2 d-block" style={{fontSize: '10px'}}>Nombre del Área</label>
                    <input type="text" className="form-control rounded-4 bg-light border-0 py-2 shadow-sm" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Sonido, Alabanza..." required />
                  </div>

                  <div className="mb-0">
                    <label className="small fw-bold text-secondary text-uppercase mb-2 d-block" style={{fontSize: '10px'}}>Descripción Breve</label>
                    <textarea className="form-control rounded-4 bg-light border-0 shadow-sm" rows="3" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="¿De qué se encarga esta área?"></textarea>
                  </div>
                </div>

                <div className="modal-footer border-0 p-4 pt-0 bg-white">
                  <button type="button" className="btn btn-light rounded-pill px-4 fw-bold text-muted border-0 me-auto" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-lg border-0" style={{ background: 'linear-gradient(45deg, #0d6efd, #0dCAF0)' }} disabled={cargando}>
                    {cargando ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Guardando...</>
                    ) : "Confirmar Área"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 45px; border-bottom-right-radius: 45px; }
        .bg-gradient-card { background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%); }
        .btn-glass-dark { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); }
        .card-hover-premium { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover-premium:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .border-dashed { border: 2px dashed #dee2e6; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); }
      `}</style>
    </div>
  );
}