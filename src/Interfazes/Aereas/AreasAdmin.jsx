import React, { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

export default function AreasAdmin() {
  const [areas, setAreas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState(""); // Estado para el input (lo mantengo en minúscula en JS por convención)
  const [archivo, setArchivo] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    setLoading(true);
    // 🔥 AJUSTE DE LÓGICA: Usamos "Orden" (con O mayúscula) tal cual tu DB.
    // Ordenamos ascendentemente y ponemos los nulos al final.
    const { data, error } = await supabase
      .from("vista_areas_resumen") // Asumimos que la vista también expone "Orden" con mayúscula
      .select("*")
      .order("Orden", { ascending: true, nullsFirst: false }); // ✅ O Mayúscula

    if (error) {
      console.error("Error cargando áreas:", error);
    }
    setAreas(data || []);
    setLoading(false);
  };

  const subirImagen = async (file) => {
    try {
      const fileName = `area_${Date.now()}`;
      const { error } = await supabase.storage.from("Imagen").upload(fileName, file);
      if (error) throw error;
      return supabase.storage.from("Imagen").getPublicUrl(fileName).data.publicUrl;
    } catch (e) { 
      console.error("Error subiendo imagen:", e.message);
      return null; 
    }
  };

  const guardarArea = async (e) => {
    e.preventDefault();
    setCargando(true);
    let urlFinal = null;
    if (archivo) urlFinal = await subirImagen(archivo);

    // Convertimos el string del input a entero. Si está vacío, por defecto 99.
    const valorOrden = orden ? parseInt(orden, 10) : 99; 

    try {
      // Definimos el objeto de datos con las claves exactas de tu DB
      const datos = { 
        Nombre: nombre, // Clave exacta de tu DB
        Descripcion: descripcion, // Clave exacta de tu DB
        Orden: valorOrden // ✅ CLAVE EXACTA DE TU DB ("Orden" con O mayúscula)
      };
      if (urlFinal) datos.Foto = urlFinal; // Clave exacta de tu DB

      if (editandoId) {
        // Usamos la tabla física "Aerea" para inserts/updates
        await supabase.from("Aerea").update(datos).eq("Id", editandoId);
      } else {
        await supabase.from("Aerea").insert([datos]);
      }
      
      Swal.fire({ title: "¡Éxito!", text: "Guardado correctamente", icon: "success", timer: 1500, showConfirmButton: false });
      setMostrarModal(false);
      limpiarFormulario();
      cargarAreas();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setCargando(false);
    }
  };

  const eliminarArea = async (area) => {
    const res = await Swal.fire({
      title: "¿Eliminar?",
      text: "Se borrará el registro y su imagen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      confirmButtonColor: "#d33"
    });

    if (res.isConfirmed) {
      Swal.fire({ title: "Eliminando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        if (area.Foto) {
          const nombreArchivo = area.Foto.split("/").pop();
          await supabase.storage.from("Imagen").remove([nombreArchivo]);
        }
        await supabase.from("Aerea").delete().eq("Id", area.Id);
        Swal.fire({ title: "¡Eliminado!", text: "Borrado correctamente.", icon: "success", timer: 1500, showConfirmButton: false });
        cargarAreas();
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar.", "error");
      }
    }
  };

  const prepararEdicion = (a) => {
    setEditandoId(a.Id);
    setNombre(a.Nombre || "");
    setDescripcion(a.Descripcion || "");
    // 🔥 AJUSTE: Accedemos a a.Orden (con O mayúscula) que viene de la DB.
    // Convertimos null/99 predeterminado a string vacío para el input.
    setOrden(a.Orden !== null && a.Orden !== 99 ? a.Orden.toString() : ""); 
    setArchivo(null);
    setMostrarModal(true);
  };

  const limpiarFormulario = () => {
    setNombre(""); setDescripcion(""); setArchivo(null); setEditandoId(null);
    setOrden(""); 
  };

  return (
    <div className="container py-4" style={{ paddingBottom: '80px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 sticky-top py-2" style={{ backgroundColor: '#f8f9fa', zIndex: 10 }}>
        <h4 className="fw-bold m-0">Gestión de Áreas</h4>
        <button className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm" onClick={() => { limpiarFormulario(); setMostrarModal(true); }}>+ Nueva</button>
      </div>

      {loading ? (
        <div className="row row-cols-2 g-2 placeholder-glow">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="col">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-2">
                <div className="placeholder rounded-3 w-100" style={{ height: "110px" }}></div>
                <div className="placeholder col-8 mt-3 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row row-cols-2 g-2">
          {areas.map((a) => (
            <div key={a.Id} className="col">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative flex-column d-flex">
                
                {/* 🔥 Badge visual del orden (Accedemos a a.Orden) */}
                <span className="position-absolute top-0 end-0 badge rounded-pill bg-light text-dark m-1 shadow-sm border border-slate-100" style={{ fontSize: '9px', zIndex: 1 }}>
                  Pos: {a.Orden}
                </span>

                <div style={{ height: "110px", backgroundColor: "#f8f9fa" }}>
                  <img src={a.Foto || "https://images.unsplash.com/photo-1507038732158-5d2bb34d7426?q=80&w=500"} className="w-100 h-100" style={{ objectFit: "contain", padding: "8px" }} alt={a.Nombre} />
                </div>
                <div className="card-body p-2 flex-grow-1 d-flex flex-column">
                  <h6 className="fw-bold mb-1 text-truncate" style={{ fontSize: '13px', color: '#1a293a' }}>{a.Nombre}</h6>
                  <p className="text-muted mb-2 flex-grow-1" style={{ fontSize: '10px', height: '30px', overflow: 'hidden', lineHeight: '1.4' }}>{a.Descripcion || 'Sin descripción.'}</p>
                  
                  <div className="d-flex flex-column gap-1 mb-2 border-top border-slate-100 pt-1">
                    <div className="d-flex justify-content-between align-items-center"><small className="text-muted" style={{fontSize: '9px'}}>Servidores:</small><small className="fw-bold text-primary" style={{fontSize: '10px'}}>{a.TotalServidores || 0}</small></div>
                    <div className="d-flex justify-content-between align-items-center"><small className="text-muted" style={{fontSize: '9px'}}>Servicios mes:</small><small className="fw-bold text-success" style={{fontSize: '10px'}}>{a.TotalServicios || 0}</small></div>
                  </div>
                  
                  <div className="d-flex gap-1 mt-auto">
                    <button className="btn btn-outline-primary btn-sm w-100 py-1" style={{ fontSize: '10px' }} onClick={() => prepararEdicion(a)}>Editar</button>
                    <button className="btn btn-outline-danger btn-sm w-100 py-1" style={{ fontSize: '10px' }} onClick={() => eliminarArea(a)}>Borrar</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4">
              <div className="d-flex justify-content-between mb-3 align-items-center">
                <h5 className="fw-bold m-0 text-slate-800">{editandoId ? "Editar Área" : "Nueva Área"}</h5>
                <button className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>

              {/* 🔥 MENSAJE INFORMATIVO DE EXPLICACIÓN (Mismo que antes) */}
              <div className="alert alert-info py-2 px-3 mb-3 border-0 rounded-3 shadow-sm d-flex align-items-center gap-2" style={{ fontSize: '11px', color: '#1d4ed8' }}>
                <span style={{fontSize: '18px'}}>💡</span>
                <div>
                  <p className="m-0 font-medium"><b>Relevancia (Prioridad)</b></p>
                  {editandoId ? (
                    <p className="m-0 text-slate-600">Al **editar**, cambiar el número de prioridad afecta su posición horizontal en los flyers de cronograma. Un número más bajo (ej. 1) aparece primero que uno más alto (ej. 10).</p>
                  ) : (
                    <p className="m-0 text-slate-600">Al **crear**, asigna un número para definir su importancia secuencial. Si lo dejas vacío, el sistema lo pondrá al final por defecto (Posición 99).</p>
                  )}
                </div>
              </div>

              <form onSubmit={guardarArea}>
                <div className="mb-2">
                  <label className="form-label small fw-bold text-slate-600 m-0">Nombre del Área <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Sonido Consola, VJ" required style={{fontSize: '13px'}}/>
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-bold text-slate-600 m-0">Descripción (Opcional)</label>
                  <textarea className="form-control" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Breve descripción de funciones..." style={{fontSize: '13px', height: '60px'}}></textarea>
                </div>

                {/* 🔥 INPUT PARA EL ORDEN (Type number para bigint) */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-slate-600 m-0">Orden / Prioridad (Prioridad: 1=Alta, 99=Baja)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-slate-200" style={{fontSize: '13px'}}>#</span>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={orden} 
                      onChange={e => setOrden(e.target.value)} 
                      placeholder="Ej. 1, 2, 10..." 
                      min="1"
                      // bigint aguanta mucho más, pero limitamos a 999 para UX
                      max="999" 
                      style={{fontSize: '13px'}}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-slate-600 m-0">Foto o Icono del Área</label>
                  <input type="file" className="form-control" onChange={e => setArchivo(e.target.files[0])} accept="image/*" style={{fontSize: '13px'}} />
                </div>
                
                <button type="submit" className="btn btn-primary w-100 rounded-pill fw-semibold py-2" disabled={cargando} style={{fontSize: '14px'}}>
                  {cargando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Procesando...
                    </>
                  ) : (
                    <>{editandoId ? "Actualizar cambios" : "Crear nueva área 🚀"}</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}