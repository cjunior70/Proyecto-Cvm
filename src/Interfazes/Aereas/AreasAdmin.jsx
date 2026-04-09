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
    <div className="container py-5 animate__animated animate__fadeIn">
      {/* HEADER TIPO DASHBOARD */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 bg-white p-4 rounded-4 shadow-sm border">
        <div>
          <h2 className="fw-bold m-0 text-dark">Gestión de Áreas</h2>
          <p className="text-muted m-0">Administra los aereas de nuestro servicios</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex align-items-center gap-3">
          <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
            {areas.length} Áreas totales
          </span>
          <button 
            className="btn btn-primary rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
            onClick={() => { limpiarFormulario(); setMostrarModal(true); }}
          >
            <i className="bi bi-plus-circle-fill"></i> Nueva Área
          </button>
        </div>
      </div>

      {/* GRILLA DE CARDS */}
      {areas.length === 0 ? (
        <div className="text-center py-5 border rounded-4 bg-light">
          <i className="bi bi-layers text-muted fs-1"></i>
          <p className="mt-3 text-muted">No hay áreas registradas. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className="row g-4">
          {areas.map((a) => (
            <div key={a.Id} className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 card-hover-effect">
                <div className="position-relative">
                  <img 
                    src={a.Foto || "https://placehold.jp/24/3d5afe/ffffff/400x200.png?text=Sin+Imagen"} 
                    className="card-img-top" 
                    style={{ height: "200px", objectFit: "cover" }} 
                  />
                  <div className="position-absolute top-0 end-0 m-2">
                    <button className="btn btn-white btn-sm rounded-circle shadow-sm" onClick={() => prepararEdicion(a)}>
                      <i className="bi bi-pencil-fill text-primary"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body p-4">
                  <h5 className="fw-bold text-dark mb-2">{a.Nombre}</h5>
                  <p className="text-muted small mb-4 line-clamp-2" style={{ minHeight: '3em' }}>
                    {a.Descripcion || "Sin descripción disponible para este espacio."}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <button 
                      className="btn btn-link text-danger p-0 text-decoration-none small fw-bold"
                      onClick={() => eliminarArea(a.Id)}
                    >
                      <i className="bi bi-trash3 me-1"></i> Eliminar
                    </button>
                    <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => prepararEdicion(a)}>
                      Gestionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CON GLASSMORPISM */}
      {mostrarModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg animate__animated animate__zoomIn animate__faster">
              <div className="modal-header border-0 p-4">
                <h5 className="fw-bold m-0">{editandoId ? "🔧 Editar Área" : "✨ Nueva Área"}</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              <form onSubmit={guardarArea}>
                <div className="modal-body px-4 py-0">
                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Nombre del Área</label>
                    <input type="text" className="form-control rounded-3 bg-light border-0 py-2" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Sala de Juntas" required />
                  </div>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Imagen Representativa</label>
                    <input type="file" className="form-control rounded-3 bg-light border-0" accept="image/*" onChange={e => setArchivo(e.target.files[0])} />
                  </div>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Descripción</label>
                    <textarea className="form-control rounded-3 bg-light border-0" rows="3" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Breve detalle del área..."></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow" disabled={cargando}>
                    {cargando ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span> Guardando...</>
                    ) : "Confirmar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .card-hover-effect { transition: all 0.3s ease; border: 1px solid transparent !important; }
        .card-hover-effect:hover { transform: translateY(-10px); shadow: 0 1rem 3rem rgba(0,0,0,.175) !important; border-color: #3d5afe !important; }
        .btn-white { background: white; border: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .bg-light { background-color: #f8f9fa !important; }
      `}</style>
    </div>
  );
}